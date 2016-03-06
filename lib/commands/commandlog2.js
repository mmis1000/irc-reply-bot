(function() {
  var CommandLogs, Icommand, escapeRegex, moment, mongoose, mubsub,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('../icommand.js');

  mongoose = require('mongoose');

  moment = require('moment');

  mubsub = require('mubsub');

  escapeRegex = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  };

  CommandLogs = (function(_super) {
    __extends(CommandLogs, _super);

    function CommandLogs(dbpath, timezone, locale, collectionName) {
      var db;
      this.dbpath = dbpath;
      this.timezone = timezone != null ? timezone : '+00:00';
      this.locale = locale != null ? locale : 'en';
      this.collectionName = collectionName != null ? collectionName : 'Messages';
      this._onDbConnect = __bind(this._onDbConnect, this);
      this.defaultPageShow = 10;
      this.pageShowMax = 15;
      this.Message = null;
      this.MessageChannel = null;
      mongoose.connect(this.dbpath);
      db = mongoose.connection;
      db.on('error', this._onDbConnect.bind(this));
      db.once('open', this._onDbConnect.bind(this, null));
      console.log(this.dbpath, "" + this.collectionName + "Trigger");
      this.MessageChannel = (mubsub(this.dbpath)).channel("" + this.collectionName + "Trigger");
    }

    CommandLogs.prototype._onDbConnect = function(err, cb) {
      var FileSchema, MediaSchema, MessageSchema, fileSchemaFactory, mediaSchemaFactory, messageSchemaFactory;
      if (err) {
        console.error('db error : ');
        console.error(err);
        return;
      }

      /*
      MessageSchema = mongoose.Schema {
        from : String
        to : String
        message : String
        isOnChannel : Boolean
        time : { type : Date, index : true }
      }, { collection : @collectionName }
      
      self = @
      MessageSchema.methods.toString = ()->
        timeStamp = moment @time
        .utcOffset self.timezone
        .locale self.locale
        .format 'YYYY-MM-DD hh:mm:ss a'
        
        "#{timeStamp} #{@from} => #{@to}: #{@message}"
       */
      fileSchemaFactory = require('./log_modules/file_schema_factory');
      FileSchema = fileSchemaFactory(mongoose);
      this.File = mongoose.model('File', FileSchema);
      mediaSchemaFactory = require('./log_modules/media_schema_factory');
      MediaSchema = mediaSchemaFactory(mongoose, 'Files');
      this.Media = mongoose.model('Media', MediaSchema);
      messageSchemaFactory = require('./log_modules/message_schema_factory');
      MessageSchema = messageSchemaFactory(mongoose, this.timezone, this.locale, 'Medias');
      return this.Message = mongoose.model('Message', MessageSchema);
    };

    CommandLogs.prototype.triggerDbUpdate = function(obj) {
      var clonedObj;
      clonedObj = {};
      clonedObj.from = obj.from;
      clonedObj.to = obj.to;
      clonedObj.time = obj.time;
      clonedObj.isOnChannel = obj.isOnChannel;
      clonedObj.message = obj.message;
      clonedObj._id = obj._id;
      return this.MessageChannel.publish('update', {
        'data': clonedObj
      });
    };

    CommandLogs.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      if (args.length < 2) {
        return false;
      }
      if (args[1] === "find") {
        return this._findlog(sender, text, args, storage, textRouter, commandManager);
      } else {
        return false;
      }
    };


    /*
    flagSet
      {
        '-s' : 1
        '-t' : 1
        '-m' : 1
        '-r' : 2
      }
     */

    CommandLogs.prototype._extractFlags = function(args, flagSet) {
      var find, flagResult, flags, result, temp;
      args = args.slice(0);
      flags = Object.keys(flagSet);
      find = function(arr, list) {
        var index, item, _i, _len;
        for (_i = 0, _len = list.length; _i < _len; _i++) {
          item = list[_i];
          index = arr.indexOf(item);
          if (index !== -1) {
            return {
              index: index,
              item: item
            };
          }
        }
        return null;
      };
      flagResult = {};
      while (result = find(args, flags)) {
        temp = args.splice(result.index, flagSet[result.item] + 1);
        flagResult[result.item] = temp.slice(1);
      }
      return {
        args: args,
        flags: flagResult
      };
    };

    CommandLogs.prototype._findlog = function(sender, text, args, storage, textRouter, commandManager) {
      var currentYear, flags, pageNumber, pageSize, query, regex, regexSet, startDay, timeFrom, timeTo, _ref, _ref1;
      _ref = this._extractFlags(args, {
        '-s': 1,
        '-t': 1,
        '-m': 1,
        '-r': 2,
        '-b': 0
      }), args = _ref.args, flags = _ref.flags;
      if (args.length < 2 || args.length > 4) {
        return false;
      }
      if (args[1] !== 'find') {
        return false;
      }
      if (args[2] != null) {
        args[2] = parseInt(args[2], 10);
      }
      if (args[3] != null) {
        args[3] = parseInt(args[3], 10);
      }
      if (args[2] && isNaN(args[2])) {
        return false;
      }
      if (args[3] && isNaN(args[3])) {
        return false;
      }
      pageNumber = args[2] || 1;
      pageSize = args[3] || this.defaultPageShow;
      if (pageSize > this.pageShowMax) {
        pageSize = this.pageShowMax;
      }
      query = {};
      startDay = (moment()).subtract(1, 'M').toDate();
      query.time = {
        $gte: startDay
      };
      if (flags['-b'] != null) {
        query.isOnChannel = false;
      }
      if (flags['-t'] != null) {
        regexSet = /^\/(.+)\/([gimy]*)/.exec(flags['-t'][0]);
        if (regexSet) {
          query.to = {
            $regex: regexSet[1],
            $options: regexSet[2]
          };
        } else {
          query.to = {
            $regex: escapeRegex(flags['-t'][0])
          };
        }
      }
      if (flags['-s'] != null) {
        regexSet = /^\/(.+)\/([gimy]*)/.exec(flags['-s'][0]);
        if (regexSet) {
          query.from = {
            $regex: regexSet[1],
            $options: regexSet[2]
          };
        } else {
          query.from = {
            $regex: escapeRegex(flags['-s'][0])
          };
        }
      }
      if (flags['-m'] != null) {
        regexSet = /^\/(.+)\/([gimy]*)/.exec(flags['-m'][0]);
        if (regexSet) {
          query.message = {
            $regex: regexSet[1],
            $options: regexSet[2]
          };
        } else {
          query.message = {
            $regex: escapeRegex(flags['-m'][0])
          };
        }
      }
      if (flags['-r'] != null) {
        regex = /^(\d+)\/(\d+)(?:\/(\d+))?$/;
        timeFrom = regex.exec(flags['-r'][0]);
        timeTo = regex.exec(flags['-r'][1]);
        if (timeFrom && timeTo) {
          currentYear = (moment()).utcOffset(this.timezone).year();
          timeFrom[3] = timeFrom[3] || currentYear;
          timeTo[3] = timeTo[3] || currentYear;
          timeFrom = (moment("" + timeFrom[3] + "/" + timeFrom[1] + "/" + timeFrom[2] + " " + this.timezone, "YYYY/MM/DD Z")).toDate();
          timeTo = (moment("" + timeTo[3] + "/" + timeTo[1] + "/" + timeTo[2] + " " + this.timezone, "YYYY/MM/DD Z")).add(1, 'd').toDate();
          if ((moment(timeTo)).isBefore(timeFrom)) {
            _ref1 = [timeTo, timeFrom], timeFrom = _ref1[0], timeTo = _ref1[1];
          }
          query.time = {
            $gte: timeFrom,
            $lt: timeTo
          };
        } else {
          return false;
        }
      }

      /*
      if flags['-t']?
        if flags['']
       */
      query = this.Message.find(query);
      return query.count((function(_this) {
        return function(err, count) {
          var maxPage, total;
          if (err != null) {
            console.log(err);
          }
          if (err != null) {
            return;
          }
          total = count;
          maxPage = Math.ceil(total / pageSize);
          query.skip((pageNumber - 1) * pageSize);
          if (maxPage === pageNumber) {
            pageSize = total % pageSize;
          }
          query.limit(pageSize).sort({
            'time': -1
          });
          return query.find(function(err, messages) {
            var message, _i, _len;
            if (err != null) {
              console.log(err);
            }
            if (err != null) {
              return;
            }
            messages.reverse();
            for (_i = 0, _len = messages.length; _i < _len; _i++) {
              message = messages[_i];
              commandManager.sendPv(sender, textRouter, message.toString());
            }
            return commandManager.sendPv(sender, textRouter, "Page " + pageNumber + " of total " + maxPage + " Pages. Time Zone is " + _this.timezone);
          });
        };
      })(this));
    };


    /*
    _showlog: (sender ,text, args, storage, textRouter, commandManager, list)->
      if args.length > 4
        return false
      
      pageNumber = if args[2] then (parseInt args[2]) else 1
      recordsPerPage = if args[3] then (parseInt args[3]) else @defaultPageShow
      
      if isNaN pageNumber
        return false
      if isNaN recordsPerPage
        return false
      
      if not commandManager.isOp sender.sender
        if recordsPerPage > @userPageShowMax
          recordsPerPage = @userPageShowMax
      
      result = @_pagelog list, recordsPerPage, pageNumber
      
      replys = []
      
      for record in result.list
        date = new Date record.time
        replys.push "#{date.getFullYear()}/\
           *{date.getMonth() + 1}/\
           *{date.getDate()}-\
           *{date.getHours()}:\
           *{date.getMinutes()}:\
           *{date.getSeconds()}
           *{record.from} =>
           *{record.to} :
           *{record.message}"
      
      replys.push "page #{result.pageNumber} of #{result.allPage}"
      textRouter.output replys, sender.sender
      return true
      
    _findlog: (sender ,text, args, storage, textRouter, commandManager, list)->
      
      
      if args.length > 6 || args.length < 4
        return false
      if 0 > ["sender", "text", "target"].indexOf args[2]
        return false
      
      pageNumber = if args[4] then (parseInt args[4]) else 1
      recordsPerPage = if args[5] then (parseInt args[5]) else @defaultPageShow
      
      if isNaN pageNumber
        return false
      if isNaN recordsPerPage
        return false
      
      
      try 
        regex = new RegExp args[3]
      catch
        textRouter.output "\u000304invalid regex", sender.sender
        return true
      
      switch args[2]
        when "sender"
          list = list.filter (obj)->
            0 <= obj.from.search regex
        when "text"
          list = list.filter (obj)->
            0 <= obj.message.search regex
        when "target"
          list = list.filter (obj)->
            0 <= obj.to.search regex
      
      return @_showlog sender ,text, [args[0], "show", args[4], args[5]], storage, textRouter, commandManager, list
      
    _pagelog: (list, itemPerPage, pageNumber)->
      totalPage = Math.ceil (list.length / itemPerPage)
      
      indexStart = list.length - pageNumber * itemPerPage
      indexEnd = indexStart + itemPerPage
      
      indexStart = if (indexStart >= 0) then indexStart else 0
      indexEnd = if (indexEnd >= 0) then indexEnd else 0
      indexStart = if (indexStart <= list.length) then indexStart else list.length
      indexEnd = if (indexEnd <= list.length) then indexEnd else list.length
      
      newList = []
      
      i = indexStart
      while i < indexEnd
        newList.push list[i]
        i++
      
      filteredList = 
        list : newList
        pageNumber : pageNumber
        allPage :totalPage
      
      return filteredList
     */

    CommandLogs.prototype.help = function(commandPrefix) {
      return ["view recent talks, this command will force send to you instead of channel ", "Usage:", "" + commandPrefix + " find [-flags] [page, default to 1 if omit] [records per page, default to " + this.defaultPageShow + " if omit]", "flags :", "    -b : show message to the bot only", "    -s [senderRegex]: show message from sender only", "    -t [targetRegex]: show message to target only", "    -m [messageRegex] : show message matches specific regex only", "    -r [startTime] [endTime] : shoe message in range only", "example: " + commandPrefix + " find -t channelName 1 10", "notes : if the regex field is not regex, it will be used as a string to do full match"];
    };

    CommandLogs.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return true;
    };

    CommandLogs.prototype.handleRaw = function(sender, type, content, textRouter, commandManager) {
      var args, date, message, onChannel;
      if (!(type === "message" || type === "output")) {
        return false;
      }
      if (type === "message") {
        if (content.asText) {
          args = commandManager.parseArgs(content.text);
          if (args[0] === "log") {
            return false;
          }
          onChannel = 0 === sender.target.search(/#/);
          date = content.meta.time || new Date;
          message = new this.Message({
            from: sender.sender,
            to: sender.target,
            message: content.text,
            isOnChannel: onChannel,
            time: date,
            medias: []
          });
        }
      }
      if (type === "output") {
        onChannel = 0 === content.target.search(/#/);
        message = new this.Message({
          from: textRouter.getSelfName(),
          to: content.target,
          message: content.message,
          isOnChannel: onChannel,
          time: new Date
        });
      }
      message.save((function(_this) {
        return function(err, remoteMessage) {
          if (err != null) {
            console.error("error during save message: " + (err.toString()));
          }
          _this.triggerDbUpdate(message);
          return null;
        };
      })(this));
      return true;
    };

    return CommandLogs;

  })(Icommand);

  module.exports = CommandLogs;

}).call(this);
