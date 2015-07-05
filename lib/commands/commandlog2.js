(function() {
  var CommandLogs, Icommand, moment, mongoose,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('../icommand.js');

  mongoose = require('mongoose');

  moment = require('moment');

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
      mongoose.connect(this.dbpath);
      db = mongoose.connection;
      db.on('error', this._onDbConnect.bind(this));
      db.once('open', this._onDbConnect.bind(this, null));
    }

    CommandLogs.prototype._onDbConnect = function(err, cb) {
      var MessageSchema, self;
      if (err) {
        console.error('db error : ');
        console.error(err);
        return;
      }
      MessageSchema = mongoose.Schema({
        from: String,
        to: String,
        message: String,
        isOnChannel: Boolean,
        time: {
          type: Date,
          index: true
        }
      }, {
        collection: this.collectionName
      });
      self = this;
      MessageSchema.methods.toString = function() {
        var timeStamp;
        timeStamp = moment(this.time).utcOffset(self.timezone).locale(self.locale).format('YYYY-MM-DD hh:mm:ss a');
        return "" + timeStamp + " " + this.from + " => " + this.to + ": " + this.message;
      };
      return this.Message = mongoose.model('Message', MessageSchema);
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
      var flags, pageNumber, pageSize, query, _ref;
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
      if (flags['-b'] != null) {
        query.isOnChannel = false;
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
      var args, message, onChannel;
      if (type !== "text") {
        return false;
      }
      args = commandManager.parseArgs(content);
      if (args[0] === "log") {
        return false;
      }
      onChannel = 0 === sender.target.search(/#/);
      message = new this.Message({
        from: sender.sender,
        to: sender.target,
        message: content,
        isOnChannel: onChannel,
        time: new Date
      });
      message.save(function(err) {
        if (err != null) {
          console.error("error during save message: " + (err.toString()));
        }
        return null;
      });
      return true;
    };

    return CommandLogs;

  })(Icommand);

  module.exports = CommandLogs;

}).call(this);
