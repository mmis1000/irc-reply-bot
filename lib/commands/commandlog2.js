(function() {
  var CommandLogs, Grid, Icommand, Q, escapeRegex, moment, mongoose, mubsub,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Icommand = require('../icommand.js');

  mongoose = require('mongoose');

  moment = require('moment');

  mubsub = require('mubsub');

  Grid = require('gridfs-stream');

  Q = require('q');

  escapeRegex = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  };

  CommandLogs = (function(superClass) {
    extend(CommandLogs, superClass);

    function CommandLogs(dbpath, timezone, locale, collectionName, gridFSCollectionName) {
      var db;
      this.dbpath = dbpath;
      this.timezone = timezone != null ? timezone : '+00:00';
      this.locale = locale != null ? locale : 'en';
      this.collectionName = collectionName != null ? collectionName : 'Messages';
      this.gridFSCollectionName = gridFSCollectionName != null ? gridFSCollectionName : 'FileContent';
      this._onDbConnect = bind(this._onDbConnect, this);
      this.defaultPageShow = 10;
      this.pageShowMax = 15;
      this.Message = null;
      this.MessageChannel = null;
      mongoose.connect(this.dbpath);
      db = mongoose.connection;
      db.on('error', this._onDbConnect.bind(this));
      db.once('open', this._onDbConnect.bind(this, null));
      console.log(this.dbpath, this.collectionName + "Trigger");
      this.MessageChannel = (mubsub(this.dbpath)).channel(this.collectionName + "Trigger");
    }

    CommandLogs.prototype._onDbConnect = function(err, cb) {
      var FileSchema, MediaSchema, MessageSchema, fileSchemaFactory, mediaSchemaFactory, messageSchemaFactory;
      this.gfs = Grid(mongoose.connection.db, mongoose.mongo);
      if (err) {
        console.error('db error : ');
        console.error(err);
        return;
      }
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
      clonedObj.medias = obj.medias;
      clonedObj.meta = obj.meta;
      clonedObj._id = obj._id;
      return this.MessageChannel.publish('update', {
        'data': clonedObj
      });
    };

    CommandLogs.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var done;
      if (args.length < 2) {
        return false;
      }
      if (args[1] === "find") {
        done = textRouter.async();
        return this._findlog(sender, text, args, storage, textRouter, commandManager, done);
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
        var index, item, j, len;
        for (j = 0, len = list.length; j < len; j++) {
          item = list[j];
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

    CommandLogs.prototype._findlog = function(sender, text, args, storage, textRouter, commandManager, done) {
      var currentYear, flags, pageNumber, pageSize, query, ref, ref1, regex, regexSet, startDay, timeFrom, timeTo;
      ref = this._extractFlags(args, {
        '-s': 1,
        '-t': 1,
        '-m': 1,
        '-r': 2,
        '-b': 0
      }), args = ref.args, flags = ref.flags;
      if (args.length < 2 || args.length > 4) {
        done();
        return false;
      }
      if (args[1] !== 'find') {
        done();
        return false;
      }
      if (args[2] != null) {
        args[2] = parseInt(args[2], 10);
      }
      if (args[3] != null) {
        args[3] = parseInt(args[3], 10);
      }
      if (args[2] && isNaN(args[2])) {
        done();
        return false;
      }
      if (args[3] && isNaN(args[3])) {
        done();
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
          timeFrom = (moment(timeFrom[3] + "/" + timeFrom[1] + "/" + timeFrom[2] + " " + this.timezone, "YYYY/MM/DD Z")).toDate();
          timeTo = (moment(timeTo[3] + "/" + timeTo[1] + "/" + timeTo[2] + " " + this.timezone, "YYYY/MM/DD Z")).add(1, 'd').toDate();
          if ((moment(timeTo)).isBefore(timeFrom)) {
            ref1 = [timeTo, timeFrom], timeFrom = ref1[0], timeTo = ref1[1];
          }
          query.time = {
            $gte: timeFrom,
            $lt: timeTo
          };
        } else {
          done();
          return false;
        }
      }
      query = this.Message.find(query);
      return query.count((function(_this) {
        return function(err, count) {
          var maxPage, total;
          if (err != null) {
            console.log(err);
          }
          if (err != null) {
            done();
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
            var j, len, message;
            if (err != null) {
              console.log(err);
            }
            if (err != null) {
              return;
            }
            messages.reverse();
            for (j = 0, len = messages.length; j < len; j++) {
              message = messages[j];
              commandManager.sendPv(sender, textRouter, message.toString());
            }
            commandManager.sendPv(sender, textRouter, "Page " + pageNumber + " of total " + maxPage + " Pages. Time Zone is " + _this.timezone);
            return done();
          });
        };
      })(this));
    };

    CommandLogs.prototype.help = function(commandPrefix) {
      return ["view recent talks, this command will force send to you instead of channel ", "Usage:", commandPrefix + " find [-flags] [page, default to 1 if omit] [records per page, default to " + this.defaultPageShow + " if omit]", "flags :", "    -b : show message to the bot only", "    -s [senderRegex]: show message from sender only", "    -t [targetRegex]: show message to target only", "    -m [messageRegex] : show message matches specific regex only", "    -r [startTime] [endTime] : shoe message in range only", "example: " + commandPrefix + " find -t channelName 1 10", "notes : if the regex field is not regex, it will be used as a string to do full match"];
    };

    CommandLogs.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return true;
    };

    CommandLogs.prototype.handleRaw = function(sender, type, content, textRouter, commandManager) {
      var args, date, message, onChannel;
      if (!(type === "message" || type === "outputMessage")) {
        return false;
      }
      if (type === "message") {
        onChannel = 0 === sender.target.search(/#/);
        date = content.meta.time || new Date;
        if (content.asText && content.medias.length === 0) {
          args = commandManager.parseArgs(content.text);
          if (args[0] === "log") {
            return false;
          }
          if (content.textFormated && content.textFormat) {
            message = new this.Message({
              from: sender.sender,
              to: sender.target,
              message: content.text,
              messageFormat: content.textFormat,
              messageFormated: content.textFormated,
              isOnChannel: onChannel,
              time: date,
              medias: [],
              meta: content.meta
            });
          } else {
            message = new this.Message({
              from: sender.sender,
              to: sender.target,
              message: content.text,
              isOnChannel: onChannel,
              time: date,
              medias: [],
              meta: content.meta
            });
          }
        } else if (content.medias.length > 0) {
          if (!this.gfs) {
            mongoose.connection.setMaxListeners(Infinity);
            mongoose.connection.once('open', (function(_this) {
              return function() {
                return _this.handleRaw(sender, type, content, textRouter, commandManager);
              };
            })(this));
            return;
          }
          this._saveMediaMessage(sender.sender, sender.target, content);
          return;
        } else {
          return;
        }
      }
      if (type === "outputMessage") {
        onChannel = 0 === content.target.search(/#/);
        date = content.message.meta.time || new Date;
        if (content.message.asText && content.message.medias.length === 0) {
          args = commandManager.parseArgs(content.message.text);
          if (args[0] === "log") {
            return false;
          }
          if (content.message.textFormated && content.message.textFormat) {
            message = new this.Message({
              from: textRouter.getSelfName(),
              to: content.target,
              message: content.message.text,
              messageFormat: content.message.textFormat,
              messageFormated: content.message.textFormated,
              isOnChannel: onChannel,
              time: date,
              medias: [],
              meta: content.message.meta
            });
          } else {
            message = new this.Message({
              from: textRouter.getSelfName(),
              to: content.target,
              message: content.message.text,
              isOnChannel: onChannel,
              time: date,
              medias: [],
              meta: content.message.meta
            });
          }
        } else {
          this._saveMediaMessage(textRouter.getSelfName(), content.target, content.message);
          return;
        }
      }
      message.save((function(_this) {
        return function(err, remoteMessage) {
          if (err != null) {
            return console.error("error during save message: " + (err.toString()));
          }
          _this.triggerDbUpdate(message);
          return null;
        };
      })(this));
      return true;
    };

    CommandLogs.prototype._saveFile = function(file) {
      var defered;
      defered = Q.defer();
      this.File.findOne({
        _id: file.UID
      }).then((function(_this) {
        return function(doc) {
          var bufferStream, query, stream, writestream;
          if (doc) {
            console.log("file " + file.UID + " existed. skipping...");
            defered.resolve(doc);
            throw new Error('doc exist');
          }
          writestream = _this.gfs.createWriteStream({
            filename: file.UID,
            content_type: file.MIME,
            root: _this.gridFSCollectionName
          });

          /*
          console.log {
            filename: file.UID
            content_type: file.MIME
            root: @gridFSCollectionName
          }
           */
          stream = require('stream');
          bufferStream = new stream.PassThrough();
          bufferStream.end(new Buffer(file.content));
          bufferStream.pipe(writestream);
          writestream.on('close', function() {
            return console.log("file: " + file.UID + " was writed to db");
          });
          query = _this.File.findOneAndUpdate({
            _id: file.UID
          }, {
            _id: file.UID,
            MIME: file.MIME,
            length: file.length,
            photoSize: file.photoSize,
            isThumb: file.isThumb,
            contentSource: 'db',
            contentSrc: file.UID
          }, {
            upsert: true
          });
          return query.exec();
        };
      })(this)).then(function(file) {
        return defered.resolve(file);
      })["catch"](function(err) {
        return defered.reject(err);
      });
      return defered.promise;
    };

    CommandLogs.prototype._saveMedia = function(media) {
      var defered;
      defered = Q.defer();
      this.Media.findOne({
        _id: media.id
      }).then((function(_this) {
        return function(doc) {
          if (doc) {
            console.log("media " + media.id + " existed. skipping...");
            defered.resolve(doc);
            throw new Error('doc exist');
          }
          return _this.Media.findOneAndUpdate({
            _id: media.id
          }, {
            _id: media.id,
            files: media.files.map(function(i) {
              return i.UID;
            }),
            role: media.role,
            placeHolderText: media.placeHolderText,
            meta: media.meta
          }, {
            upsert: true
          }).exec();
        };
      })(this)).then(function(media) {
        return defered.resolve(media);
      })["catch"](function(err) {
        return defered.reject(err);
      });
      return defered.promise;
    };

    CommandLogs.prototype._saveMediaMessage = function(from, to, message) {
      var date, onChannel;
      date = message.meta.time || new Date;
      onChannel = 0 === to.search(/#/);
      return (Q.all(message.medias.map((function(_this) {
        return function(media) {
          return media.getAllFiles();
        };
      })(this)))).then((function(_this) {
        return function(files) {
          var flattenFiles;
          flattenFiles = [].concat.apply([], files);
          return flattenFiles.map(function(file) {
            return _this._saveFile(file);
          });
        };
      })(this)).then((function(_this) {
        return function() {
          console.log("all file infos was saved to db");
          return Q.all(message.medias.map(function(media) {
            return _this._saveMedia(media);
          }));
        };
      })(this)).then((function(_this) {
        return function() {
          var mongoMessage;
          console.log("all media infos was saved to db");
          mongoMessage = new _this.Message({
            from: from,
            to: to,
            message: message.text,
            isOnChannel: onChannel,
            time: date,
            medias: message.medias.map(function(i) {
              return i.id;
            }),
            meta: message.meta
          });
          return mongoMessage.save();
        };
      })(this)).then((function(_this) {
        return function(message) {
          _this.triggerDbUpdate(message);
          return console.log("message was saved to db");
        };
      })(this))["catch"](function(err) {
        return console.error(err.stack);
      });
    };

    return CommandLogs;

  })(Icommand);

  module.exports = CommandLogs;

}).call(this);
