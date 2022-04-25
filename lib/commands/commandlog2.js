(function() {
  var CommandLogs, Icommand, LRU, Q, escapeRegex, moment, mongoose, mubsub,
    boundMethodCheck = function(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new Error('Bound instance method accessed before binding'); } };

  Icommand = require('../icommand.js');

  mongoose = require('mongoose');

  moment = require('moment');

  mubsub = require('mubsub');

  Q = require('q');

  LRU = require('lru-cache');

  escapeRegex = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  };

  CommandLogs = class CommandLogs extends Icommand {
    constructor(dbpath, timezone = '+00:00', locale = 'en', collectionName = 'Messages', gridFSCollectionName = 'FileContent') {
      var db;
      super();
      this._onDbConnect = this._onDbConnect.bind(this);
      this.dbpath = dbpath;
      this.timezone = timezone;
      this.locale = locale;
      this.collectionName = collectionName;
      this.gridFSCollectionName = gridFSCollectionName;
      this.defaultPageShow = 10;
      this.pageShowMax = 15;
      this.Message = null;
      this.MessageChannel = null;
      this.userInfoCache = LRU({
        max: 400,
        maxAge: 1000 * 60 * 60 * 2
      });
      db = mongoose.connection;
      db.on('connecting', function() {
        console.log('connecting to MongoDB...');
      });
      db.on('error', function(error) {
        console.error('Error in MongoDb connection: ' + error);
        mongoose.disconnect();
      });
      db.on('connected', function() {
        console.log('MongoDB connected!');
      });
      db.on('reconnected', function() {
        console.log('MongoDB reconnected!');
      });
      db.on('disconnected', () => {
        console.log('MongoDB disconnected!');
      });
      // mongoose.connect @dbpath, server: auto_reconnect: true
      db.once('open', () => {
        console.log('MongoDB connection opened!');
        this._onDbConnect();
      });
      mongoose.connect(this.dbpath);
      
      // db.once 'open', @_onDbConnect.bind @, null
      db.setMaxListeners(2e308);
      console.log(this.dbpath, `${this.collectionName}Trigger`);
      this.MessageChannelClinet = mubsub(this.dbpath);
      this.MessageChannel = this.MessageChannelClinet.channel(`${this.collectionName}Trigger`);
      this.MessageChannelClinet.on('error', console.error);
      this.MessageChannel.on('error', console.error);
    }

    _onDbConnect(err, cb) {
      var FileSchema, MediaSchema, MessageSchema, UserSchema, fileSchemaFactory, mediaSchemaFactory, messageSchemaFactory, userSchemaFactory;
      boundMethodCheck(this, CommandLogs);
      if (err) {
        console.error('db error : ');
        console.error(err);
        return;
      }
      this.gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: this.gridFSCollectionName
      });
      fileSchemaFactory = require('./log_modules/file_schema_factory');
      FileSchema = fileSchemaFactory(mongoose);
      this.File = mongoose.model('File', FileSchema);
      mediaSchemaFactory = require('./log_modules/media_schema_factory');
      MediaSchema = mediaSchemaFactory(mongoose, 'Files');
      this.Media = mongoose.model('Media', MediaSchema);
      messageSchemaFactory = require('./log_modules/message_schema_factory');
      MessageSchema = messageSchemaFactory(mongoose, this.timezone, this.locale, 'Medias');
      this.Message = mongoose.model('Message', MessageSchema);
      userSchemaFactory = require('./log_modules/user_schema_factory');
      UserSchema = userSchemaFactory(mongoose, 'Medias');
      return this.User = mongoose.model('User', UserSchema);
    }

    triggerDbUpdate(obj) {
      var clonedObj;
      //console.log('trigger %j', obj)
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
    }

    handle(sender, text, args, storage, textRouter, commandManager) {
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
    }

    /*
    flagSet
      {
        '-s' : 1
        '-t' : 1
        '-m' : 1
        '-r' : 2
      }
    */
    _extractFlags(args, flagSet) {
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
    }

    _findlog(sender, text, args, storage, textRouter, commandManager, done) {
      var currentYear, flags, pageNumber, pageSize, query, regex, regexSet, startDay, timeFrom, timeTo;
      ({args, flags} = this._extractFlags(args, {
        '-s': 1,
        '-t': 1,
        '-m': 1,
        '-r': 2,
        '-b': 0
      }));
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
      
      //prevent lag
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
          timeFrom = (moment(`${timeFrom[3]}/${timeFrom[1]}/${timeFrom[2]} ${this.timezone}`, "YYYY/MM/DD Z")).toDate();
          timeTo = (moment(`${timeTo[3]}/${timeTo[1]}/${timeTo[2]} ${this.timezone}`, "YYYY/MM/DD Z")).add(1, 'd').toDate();
          if ((moment(timeTo)).isBefore(timeFrom)) {
            [timeFrom, timeTo] = [timeTo, timeFrom];
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
      return query.count((err, count) => {
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
        
        // fix error during request last page of log
        if (maxPage === pageNumber) {
          pageSize = total % pageSize;
        }
        query.limit(pageSize).sort({
          'time': -1
        });
        return query.find((err, messages) => {
          var j, len, message;
          if (err != null) {
            console.log(err);
          }
          if (err != null) {
            return;
          }
          
          //console.log messages
          messages.reverse();
          for (j = 0, len = messages.length; j < len; j++) {
            message = messages[j];
            commandManager.sendPv(sender, textRouter, message.toString());
          }
          commandManager.sendPv(sender, textRouter, `Page ${pageNumber} of total ${maxPage} Pages. Time Zone is ${this.timezone}`);
          return done();
        });
      });
    }

    help(commandPrefix) {
      return ["view recent talks, this command will force send to you instead of channel ", "Usage:", `${commandPrefix} find [-flags] [page, default to 1 if omit] [records per page, default to ${this.defaultPageShow} if omit]`, "flags :", "    -b : show message to the bot only", "    -s [senderRegex]: show message from sender only", "    -t [targetRegex]: show message to target only", "    -m [messageRegex] : show message matches specific regex only", "    -r [startTime] [endTime] : shoe message in range only", `example: ${commandPrefix} find -t channelName 1 10`, "notes : if the regex field is not regex, it will be used as a string to do full match"];
    }

    hasPermission(sender, text, args, storage, textRouter, commandManager) {
      return true;
    }

    handleRaw(sender, type, content, textRouter, commandManager) {
      var args, date, message, onChannel;
      if (!(type === "message" || type === "outputMessage")) {
        return false;
      }
      if (!this.Message) {
        console.warn('not able to connect to mongodb, throttle log writing');
        this.db.once('open', () => {
          return this.handleRaw(...arguments);
        });
        return;
      }
      if (type === "message") {
        if (sender.senderInfo) {
          this._saveUser(sender.senderInfo, commandManager);
        }
        if (sender.targetInfo) {
          this._saveUser(sender.targetInfo, commandManager);
        }
        if (sender.channelInfo) {
          this._saveUser(sender.channelInfo, commandManager);
        }
        onChannel = 0 === sender.target.search(/#/);
        date = content.meta.time || new Date();
        if (content.asText && content.medias.length === 0) {
          args = commandManager.parseArgs(content.text);
          if (args[0] === "log") {
            return false;
          }
          
          // message format v2
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
            mongoose.connection.setMaxListeners(2e308);
            mongoose.connection.once('open', () => {
              return this.handleRaw(sender, type, content, textRouter, commandManager);
            });
            return;
          }
          this._saveMediaMessage(sender.sender, sender.target, content);
          return;
        } else {
          return;
        }
      }
      // should never goto here, if it is, it is a bug
      if (type === "outputMessage") {
        textRouter.getSelfInfo().then((user) => {
          if (user) {
            return this._saveUser(user);
          }
        });
        onChannel = 0 === content.target.search(/#/);
        date = content.message.meta.time || new Date();
        if (content.message.asText && content.message.medias.length === 0) {
          args = commandManager.parseArgs(content.message.text);
          if (args[0] === "log") {
            return false;
          }
          
          // message format v2
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
      message.save((err, remoteMessage) => {
        if (err != null) {
          return console.error(`error during save message: ${err.toString()}`);
        }
        this.triggerDbUpdate(message);
        return null;
      });
      return true;
    }

    _saveFile(file) {
      var defered;
      defered = Q.defer();
      this.File.findOne({
        _id: file.UID
      }).then((doc) => {
        /*
        console.log {
          filename: file.UID
          content_type: file.MIME
          root: @gridFSCollectionName
        }
        */
        var bufferStream, query, stream, writestream;
        if (doc) {
          console.log(`file ${file.UID} existed. skipping...`);
          defered.resolve(doc);
          throw new Error('doc exist');
        }
        writestream = this.gfs.openUploadStream(file.UID, {
          contentType: file.MIME
        });
        stream = require('stream');
        bufferStream = new stream.PassThrough();
        bufferStream.end(new Buffer(file.content));
        bufferStream.pipe(writestream);
        writestream.on('close', function() {
          return console.log(`file: ${file.UID} was writed to db`);
        });
        query = this.File.findOneAndUpdate({
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
          upsert: true,
          new: true
        });
        return query.exec();
      }).then(function(file) {
        return defered.resolve(file);
      }).catch(function(err) {
        return defered.reject(err);
      });
      return defered.promise;
    }

    _saveMedia(media) {
      var defered;
      defered = Q.defer();
      this.Media.findOne({
        _id: media.id
      }).then((doc) => {
        var time;
        if (doc) {
          console.log(`media ${media.id} existed. skipping...`);
          defered.resolve(doc);
          throw new Error('doc exist');
        }
        time = media.meta.time;
        delete media.meta.time;
        return this.Media.findOneAndUpdate({
          _id: media.id
        }, {
          _id: media.id,
          files: media.files.map(function(i) {
            return i.UID;
          }),
          role: media.role,
          placeHolderText: media.placeHolderText,
          time: time,
          meta: media.meta
        }, {
          upsert: true,
          new: true
        }).exec();
      }).then(function(media) {
        return defered.resolve(media);
      }).catch(function(err) {
        return defered.reject(err);
      });
      return defered.promise;
    }

    _saveMediaMessage(from, to, message) {
      var date, onChannel;
      date = message.meta.time || new Date();
      onChannel = 0 === to.search(/#/);
      return (Q.all(message.medias.map((media) => {
        return media.getAllFiles();
      }))).then((files) => {
        var flattenFiles;
        flattenFiles = [].concat.apply([], files);
        return flattenFiles.map((file) => {
          return this._saveFile(file);
        });
      }).then(() => {
        console.log("all file infos was saved to db");
        return Q.all(message.medias.map((media) => {
          media.meta = media.meta || {};
          media.meta.time = media.meta.time || date;
          return this._saveMedia(media);
        }));
      }).then(() => {
        var mongoMessage;
        console.log("all media infos was saved to db");
        mongoMessage = new this.Message({
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
      }).then((message) => {
        this.triggerDbUpdate(message);
        return console.log("message was saved to db");
      }).catch(function(err) {
        return console.error(err.stack);
      });
    }

    _saveUser(userInfo, manager) {
      var mediasPromise, user;
      if (this.userInfoCache.get(userInfo.id)) {
        // console.log "userInfo for #{userInfo.id} didn't be updated because it is in cache"
        if ((this.userInfoCache.get(userInfo.id)) === manager.userInfoCache.get(userInfo.id)) {
          return;
        }
      }
      this.userInfoCache.set(userInfo.id, userInfo);
      user = new this.User({
        _id: userInfo.id,
        images: [],
        ids: [userInfo.id].concat(userInfo.aliases),
        nicknames: userInfo.nicknames,
        firstName: userInfo.firstName,
        midName: userInfo.midName,
        lastName: userInfo.lastName,
        profileUrl: userInfo.profileUrl,
        type: userInfo.type
      });
      
      // console.log user
      mediasPromise = Q.all(userInfo.images.map((media) => {
        var date;
        date = new Date();
        media.meta = media.meta || {};
        media.meta.time = media.meta.time || date;
        return media.getAllFiles().then((files) => {
          return (Q.all(files.map((file) => {
            return this._saveFile(file);
          }))).then(() => {
            return this._saveMedia(media);
          });
        });
      }));
      return mediasPromise.then((medias) => {
        user.images = medias.map(function(media) {
          // console.log media
          return media._id;
        });
        return this.User.findOneAndUpdate({
          _id: user.id
        }, user, {
          upsert: true,
          new: true
        }).exec();
      }).then((user) => {
        console.log(`userInfo for ${user._id} have been updated`);
        return this.MessageChannel.publish('user-update', {
          'data': user.toObject()
        });
      }).catch(function(err) {
        console.error(`error during update user info for ${userInfo.id}`);
        console.error(err);
        return console.error(err.stack);
      });
    }

  };

  module.exports = CommandLogs;

}).call(this);
