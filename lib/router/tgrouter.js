(function() {
  var LRU, Media, Message, Senter, Telegram, TelegramFile, TelegramRouter, TelegramText, TextRouter, UTF8LengthSplit, User, co, createBotMessage, createMediaFromPhotoList, createSenderFromMessage, createSenderFromUser, currentTimeStampOffset, lastKnownTimeStamp,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  TextRouter = require('./textrouter');

  Telegram = require('../tgapi');

  Senter = require('../senter.js');

  UTF8LengthSplit = require('../util.js').UTF8LengthSplit;

  Message = require('../models/message');

  Media = require('../models/media');

  TelegramFile = require('../models/telegram_file');

  User = require('../models/user');

  LRU = require('lru-cache');

  co = require('co');

  TelegramRouter = (function(superClass) {
    extend(TelegramRouter, superClass);

    function TelegramRouter(token, channelPostFix, userPostFix, requireTag) {
      this.token = token;
      this.channelPostFix = channelPostFix != null ? channelPostFix : 'tg';
      this.userPostFix = userPostFix != null ? userPostFix : 'tg';
      this.requireTag = requireTag != null ? requireTag : false;
      TelegramRouter.__super__.constructor.apply(this, arguments);
      this.nameMap = {};
      this._selfName = null;
      this._init();
      this.messageBuffer = {};
      this.bufferTimeout = 1000;
      this.bufferTimeoutId = null;
      this.userAvatarCache = LRU({
        max: 400,
        maxAge: 1000 * 60 * 60 * 2
      });
      this.once('manager_register', (function(_this) {
        return function(manager) {
          _this.manager = manager;
          return _this.userInfoCache = manager.userInfoCache;
        };
      })(this));
    }

    TelegramRouter.prototype._init = function() {
      var meHandle;
      console.log("initing telegram with token " + this.token);
      this.api = new Telegram(this.token);
      this.api.getMe(meHandle = (function(_this) {
        return function(err, res) {
          if (err) {
            console.error('[telegram] fail to get self info, retry after 1 minute: ');
            console.error(err);
            setTimeout(function() {
              return _this.api.getMe(meHandle);
            }, 60 * 1000);
            return;
          }
          _this.api.startPolling(40);
          if (_this.userPostFix) {
            _this.setSelfName(res.username + '@' + _this.userPostFix);
          } else {
            _this.setSelfName(res.username);
          }
          _this._botInfo = res;
          _this.api.on('error', function(err) {
            return console.error(err.stack || err.toString());
          });
          _this.api.on('message', function(message) {
            var botMessage, channelId, clonedRouter, key, message_, message_id, userName, value;
            channelId = "#" + message.chat.id.toString();
            if (message.from.username) {
              _this.nameMap[message.from.username] = message.from.id;
            }
            if (_this.channelPostFix) {
              channelId += "@" + _this.channelPostFix;
            }
            userName = message.from.username;
            userName = userName || ("undefined_" + message.from.id);
            if (_this.userPostFix) {
              userName += "@" + _this.userPostFix;
            }
            clonedRouter = {};
            for (key in _this) {
              value = _this[key];
              clonedRouter[key] = value;
              if ('function' === typeof value) {
                if (!value.toString().match(/\[native code\]/)) {
                  clonedRouter.key = value.bind(_this);
                }
              }
            }
            message_id = message.message_id;
            message_ = message;
            clonedRouter.output = function(message, to, _message_id, originalChannel, nobuffer, textFormat) {
              var channelName;
              channelName = "#" + message_.chat.id.toString();
              if (_this.channelPostFix) {
                channelName += "@" + _this.channelPostFix;
              }
              _message_id = _message_id || message_id;
              channelName = originalChannel || channelName;
              return _this.output(message, to, _message_id, channelName, nobuffer, textFormat);
            };
            botMessage = createBotMessage(message, _this);
            if (botMessage) {
              return co(function*() {
                var sender, targetMessage;
                if (message.text) {
                  console.log((new Date(botMessage.meta.time)).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ' + userName + ' => ' + channelId + ': ' + message.text.replace(/\r?\n/g, '\r\n   | '));
                }
                if (message.reply_to_message) {
                  targetMessage = createBotMessage(message.reply_to_message, _this);
                  if (targetMessage) {
                    botMessage.replyTo = {};
                    botMessage.replyTo.message = targetMessage;
                    botMessage.replyTo.sender = (yield createSenderFromMessage(message.reply_to_message, _this));
                  }
                }
                if (message.forward_from) {
                  botMessage.forwardFrom = (yield createSenderFromUser(message.forward_from, _this));
                }
                sender = (yield createSenderFromMessage(message, _this));
                return _this.emit("message", botMessage, sender, clonedRouter);
              })["catch"](function(e) {
                return console.log(e);
              });
            }
          });
          return _this.on('output', function(m, target, replyId, textFormat) {
            var sendOptions;
            console.log((new Date).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ' + _this.getSelfName() + ' => ' + target + ': ' + m.replace(/\r?\n/g, '\r\n   | '));
            target = target.replace(/@.*$/, '');
            if (target.match(/^#/)) {
              target = target.replace(/^#/, '');
              target = parseInt(target, 10);
            } else if (_this.nameMap[target]) {
              target = _this.nameMap[target];
            } else {
              return console.error("unknown username " + target);
            }
            sendOptions = {};
            if (textFormat === 'html') {
              sendOptions.parse_mode = 'HTML';
            }
            if (replyId) {
              sendOptions.reply_to_message_id = replyId;
            }
            return _this.api.sendMessage(target, m, null, sendOptions);
          });
        };
      })(this));
      return this.on('whois', function(nick, cb) {
        return process.nextTick(function() {
          return cb({
            account: nick
          });
        });
      });
    };

    TelegramRouter.prototype.disconnect = function(msg, cb) {
      return this.client.disconnect(msg, cb);
    };

    TelegramRouter.prototype.getRouterIdentifier = function() {
      return this._routerIndetifier || "tg";
    };

    TelegramRouter.prototype.parseArgs = function(cmd) {
      var temp;
      temp = cmd.replace(/^\//, '').split(/\u0020/g);
      temp[0] = temp[0].replace(/@.*/, '');
      return temp;
    };

    TelegramRouter.prototype.getIdentifier = function() {
      return '/';
    };

    TelegramRouter.prototype.input = function(message, from, to, channal, router) {
      var sender;
      sender = new Senter(from, to, message, channal);
      return this.emit("input", message, sender, router);
    };

    TelegramRouter.prototype.inputMessage = function(message, from, to, channal, router) {
      var sender;
      sender = new Senter(from, to, message, channal);
      return this.emit("message", message, sender, router);
    };

    TelegramRouter.prototype.output = function(message, to, message_id, originalChannel, nobuffer, textFormat) {
      var j, len, message_id_temp, person, results;
      if (textFormat == null) {
        textFormat = 'raw';
      }
      message_id_temp = message_id;
      if (originalChannel && to !== originalChannel) {
        message_id_temp = void 0;
      }
      if (Array.isArray(message)) {
        message = message.join("\r\n");
      }
      if ((!nobuffer) && this.bufferTimeout > 0) {
        if (Array.isArray(to)) {
          to.forEach((function(_this) {
            return function(to) {
              _this.messageBuffer[to + '\u0000' + message_id_temp] = _this.messageBuffer[to + '\u0000' + message_id_temp] || [];
              _this.messageBuffer[to + '\u0000' + message_id_temp].push(message);
              if (!_this.bufferTimeoutId) {
                return _this.bufferTimeoutId = setTimeout(_this.flushOutput.bind(_this), _this.bufferTimeout);
              }
            };
          })(this));
        } else {
          this.messageBuffer[to + '\u0000' + message_id_temp] = this.messageBuffer[to + '\u0000' + message_id_temp] || [];
          this.messageBuffer[to + '\u0000' + message_id_temp].push(message);
          if (!this.bufferTimeoutId) {
            this.bufferTimeoutId = setTimeout(this.flushOutput.bind(this), this.bufferTimeout);
          }
        }
        return;
      }
      if (('string' === typeof to) || (to == null)) {
        return this.emit("output", message, to, message_id_temp, textFormat);
      } else {
        results = [];
        for (j = 0, len = to.length; j < len; j++) {
          person = to[j];
          results.push(this.emit("output", message, person, message_id_temp, textFormat));
        }
        return results;
      }
    };

    TelegramRouter.prototype.outputMessage = function(message, to, message_id, originalChannel) {
      var originalInfo, promise, ref, ref1, toTargetId;
      if (message.medias.length > 0) {
        if (!message.meta["_" + (this.getRouterIdentifier())]) {
          return (ref = TextRouter.prototype.outputMessage).call.apply(ref, [this].concat(slice.call(arguments)));
        } else {
          originalInfo = message.meta["_" + (this.getRouterIdentifier())];
          toTargetId = function(i) {
            return (i.slice(1)).replace(/@.+$/, '');
          };
          if (originalInfo.sticker) {
            promise = this.api.sendSticker(toTargetId(to), originalInfo.sticker.file_id);
          } else if (originalInfo.photo) {
            promise = this.api.sendPhoto(toTargetId(to), originalInfo.photo[originalInfo.photo.length - 1].file_id);
          } else if (originalInfo.audio) {
            promise = this.api.sendAudio(toTargetId(to), originalInfo.audio.file_id);
          } else if (originalInfo.video) {
            promise = this.api.sendVideo(toTargetId(to), originalInfo.video.file_id);
          }
          if (promise) {
            return promise.then((function(_this) {
              return function(res) {
                var new_message, new_target;
                new_message = createBotMessage(res, _this);
                new_target = "#" + res.chat.id;
                if (_this.channelPostFix) {
                  new_target = new_target + "@" + _this.channelPostFix;
                }
                return {
                  message: new_message,
                  target: new_target
                };
              };
            })(this));
          } else {
            return (ref1 = TextRouter.prototype.outputMessage).call.apply(ref1, [this].concat(slice.call(arguments)));
          }
        }
      }
      return this.output(message.text, to, message_id, originalChannel, message.textFormat === 'html', message.textFormat);
    };

    TelegramRouter.prototype.flushOutput = function() {
      var channel, channelTemp, id, key, ref, value;
      this.bufferTimeoutId = null;
      ref = this.messageBuffer;
      for (key in ref) {
        value = ref[key];
        channel = (key.split('\u0000'))[0];
        id = (key.split('\u0000'))[1];
        channelTemp = parseInt(channel, 10);
        channel = channelTemp || channel;
        id = parseInt(id, 10);
        if (isNaN(id)) {
          id = null;
        }
        value = value.join("\r\n");
        this.output(value, channel, id, null, true);
      }
      return this.messageBuffer = {};
    };

    TelegramRouter.prototype.toDisplayName = function(str) {
      if (str.match(/^@/)) {
        return str;
      } else {
        return "@" + (str.replace(/@.*/, ''));
      }
    };

    TelegramRouter.prototype.fromDisplayName = function(str) {
      if (!str.match(/^@/)) {
        return str;
      }
      str = str.replace(/^@/, '');
      if (this.userPostFix) {
        return str + '@' + this.userPostFix;
      } else {
        return str;
      }
    };

    TelegramRouter.prototype.isCommand = function(str, sender, manager) {
      var args, temp;
      if (!str.match(/^\//)) {
        return false;
      }
      temp = str.replace(/^\//, '').split(/\u0020/g);
      if ((temp[0].match(/@/)) && !(temp[0].match(new RegExp("@" + this._botInfo.username + "($|[\\r\\n\\s])")))) {
        return false;
      }
      args = this.parseArgs(str);
      if (!manager.hasCommand(args[0])) {
        return false;
      }
      if (this.requireTag) {
        if (sender.target.match(/#[^-]/)) {
          return true;
        }
        if (!temp[0].match(/@/)) {
          return false;
        } else {
          return true;
        }
      } else {
        return true;
      }
    };

    TelegramRouter.prototype.getSelfInfo = function() {
      return co((function(_this) {
        return function*() {
          var botUser, cachedBotUser, error, userInfo, userPhoto, userPhotoMedias;
          cachedBotUser = _this.userInfoCache.get(_this._botInfo.id);
          if (cachedBotUser) {
            return cachedBotUser;
          }
          _this._botInfo = botUser = (yield _this.api.getMe());
          userPhotoMedias = _this.userAvatarCache.get(botUser.id);
          if (!userPhotoMedias) {
            try {
              userPhoto = (yield _this.api.getUserProfilePhotos(botUser.id, null));
              if (userPhoto.total_count > 0) {
                userPhotoMedias = userPhoto.photos.map(function(list) {
                  return createMediaFromPhotoList(list, _this.api);
                }).map(function(media, index) {
                  media.role = 'avatar';
                  media.id = userPhoto.photos[index][0].file_id + "@telegram-avatar";
                  return media;
                });
              } else {
                userPhotoMedias = [];
              }
            } catch (error) {
              console.log('skiping failed avatar...');
              userPhotoMedias = [];
            }
            _this.userAvatarCache.set(botUser.id, userPhotoMedias);
          }
          userInfo = new User("undefined_" + botUser.id, {
            images: userPhotoMedias,
            aliases: botUser.username ? [botUser.username] : [],
            nicknames: botUser.username ? ['@' + botUser.username] : [],
            lastName: botUser.last_name || null,
            firstName: botUser.first_name || null,
            profileUrl: botUser.username ? "https://t.me/" + botUser.username : null,
            type: 'user'
          });
          if (_this.userPostFix) {
            userInfo.id += '@' + _this.userPostFix;
            if (userInfo.aliases[0]) {
              userInfo.aliases[0] += '@' + _this.userPostFix;
            }
          }
          _this.userInfoCache.set(userInfo.id, userInfo);
          return userInfo;
        };
      })(this));
    };

    return TelegramRouter;

  })(TextRouter);

  lastKnownTimeStamp = 0;

  currentTimeStampOffset = 0;

  createBotMessage = function(message, telegramRouter) {
    var audio, botMessage, file, fileThumb, files, media, video, videoThumb, voice;
    if (message.text) {
      botMessage = new Message(message.text, [], true, true);
      botMessage.textFormat = 'html';
      botMessage.textFormated = TelegramText.toHTML(message.text, message.entities);
    }
    if (message.sticker) {
      file = new TelegramFile(message.sticker.file_id, telegramRouter.api, {
        MIME: 'image/webp',
        length: message.sticker.file_size,
        photoSize: [message.sticker.width, message.sticker.height]
      });
      file.meta = {
        overrides: {
          MIME: 'image/webp'
        }
      };
      if (message.sticker.thumb) {
        fileThumb = new TelegramFile(message.sticker.thumb.file_id, telegramRouter.api, {
          MIME: 'image/webp',
          length: message.sticker.thumb.file_size,
          photoSize: [message.sticker.thumb.width, message.sticker.thumb.height],
          isThumb: true
        });
        fileThumb.meta = {
          overrides: {
            MIME: 'image/webp'
          }
        };
      } else {
        fileThumb = new TelegramFile(message.sticker.file_id, telegramRouter.api, {
          MIME: 'image/webp',
          length: message.sticker.file_size,
          photoSize: [message.sticker.width, message.sticker.height],
          isThumb: true
        });
        fileThumb.meta = {
          overrides: {
            MIME: 'image/webp'
          }
        };
      }
      media = new Media({
        id: message.sticker.file_id + "@telegram-sticker",
        role: 'sticker',
        placeHolderText: '((sticker))',
        files: [file, fileThumb]
      });
      botMessage = new Message(message.text || ("((tg-sticker:" + message.sticker.file_id + "))"), [media], true, false);
    }
    if (message.photo) {
      files = message.photo.map((function(_this) {
        return function(data) {
          var photo;
          photo = new TelegramFile(data.file_id, telegramRouter.api, {
            length: data.file_size,
            photoSize: [data.width, data.height]
          });
          photo.meta = {
            overrides: {
              MIME: 'image/webp'
            }
          };
          return photo;
        };
      })(this));
      files[0].isThumb = true;
      media = new Media({
        id: message.photo[0].file_id + "@telegram-photo",
        role: 'photo',
        placeHolderText: '((photo))',
        files: files
      });
      botMessage = new Message(message.caption || ("((tg-photo:" + message.photo[0].file_id + "))"), [media], true, false, !!message.caption);
    }
    if (message.video) {
      if (message.video.thumb) {
        videoThumb = new TelegramFile(message.video.thumb.file_id, telegramRouter.api, {
          length: message.video.thumb.file_size,
          photoSize: [message.video.thumb.width, message.video.thumb.height],
          isThumb: true
        });
      }
      video = new TelegramFile(message.video.file_id, telegramRouter.api, {
        length: message.video.file_size,
        photoSize: [message.video.width, message.video.height],
        duration: message.video.duration
      });
      media = new Media({
        id: message.video.file_id + "@telegram-video",
        role: 'video',
        placeHolderText: '((video))',
        files: [video]
      });
      if (videoThumb) {
        media.files.push(videoThumb);
      }
      botMessage = new Message(message.caption || ("((tg-video:" + message.video.file_id + "))"), [media], true, false, !!message.caption);
    }
    if (message.audio) {
      audio = new TelegramFile(message.audio.file_id, telegramRouter.api, {
        length: message.audio.file_size,
        duration: message.audio.duration,
        MIME: message.audio.mime_type
      });
      audio.meta = {
        overrides: {
          MIME: message.audio.mime_type
        }
      };
      media = new Media({
        id: message.audio.file_id + "@telegram-audio",
        role: 'audio',
        placeHolderText: '((audio))',
        files: [audio],
        meta: {
          performer: message.audio.performer,
          title: message.audio.title
        }
      });
      botMessage = new Message(message.text || ("((tg-audio:" + message.audio.file_id + "))"), [media], true, false);
    }
    if (message.voice) {
      voice = new TelegramFile(message.voice.file_id, telegramRouter.api, {
        length: message.voice.file_size,
        duration: message.voice.duration,
        MIME: message.voice.mime_type
      });
      voice.meta = {
        overrides: {
          MIME: message.voice.mime_type
        }
      };
      media = new Media({
        id: message.voice.file_id + "@telegram-voice",
        role: 'audio',
        placeHolderText: '((voice))',
        files: [voice]
      });
      botMessage = new Message(message.text || ("((tg-voice:" + message.voice.file_id + "))"), [media], true, false);
    }
    if (botMessage) {
      if (message.date === lastKnownTimeStamp) {
        currentTimeStampOffset++;
      } else {
        lastKnownTimeStamp = message.date;
        currentTimeStampOffset = 0;
      }
      botMessage.meta.time = new Date(message.date * 1000 + currentTimeStampOffset);
      botMessage.meta['_' + telegramRouter.getRouterIdentifier()] = message;
      if (telegramRouter.channelPostFix) {
        botMessage.meta.message_id = message.message_id + '@' + telegramRouter.channelPostFix;
      } else {
        botMessage.meta.message_id = message.message_id;
      }
    }
    return botMessage;
  };

  createSenderFromMessage = function(message, telegramRouter) {
    return co(function*() {
      var api, cachedChannel, cachedUser, channelId, channelInfo, channelPhoto, channelPhotoMedia, channelPhotoMedias, compareStr, compareStr1, e, error, error1, error2, sender, userInfo, userName, userPhoto, userPhotoMedias;
      api = telegramRouter.api;
      try {
        channelPhotoMedias = [];
        try {
          channelPhotoMedias = telegramRouter.userAvatarCache.get(message.chat.id);
          if (!channelPhotoMedias) {
            channelPhoto = ((yield telegramRouter.api.getChat(message.chat.id, null))).photo;
            if (channelPhoto) {
              channelPhotoMedia = new Media({
                id: channelPhoto.big_file_id + "@telegram-avatar",
                role: 'avatar',
                placeHolderText: '((avatar))',
                files: [
                  new TelegramFile(channelPhoto.small_file_id, api, {
                    isThumb: true,
                    length: 0,
                    photoSize: [160, 160],
                    meta: {
                      overrides: {
                        MIME: 'image/webp'
                      }
                    }
                  }), new TelegramFile(channelPhoto.big_file_id, api, {
                    isThumb: false,
                    length: 0,
                    photoSize: [640, 640],
                    meta: {
                      overrides: {
                        MIME: 'image/webp'
                      }
                    }
                  })
                ]
              });
              channelPhotoMedias = [channelPhotoMedia];
            } else {
              channelPhotoMedias = [];
            }
            telegramRouter.userAvatarCache.set(message.chat.id, channelPhotoMedias);
          }
        } catch (undefined) {}
        channelInfo = new User("#" + message.chat.id, {
          images: channelPhotoMedias,
          aliases: message.chat.username ? [message.chat.username] : [],
          nicknames: message.chat.username ? ['@' + message.chat.username] : [],
          lastName: message.chat.last_name || null,
          firstName: message.chat.first_name || message.chat.title || null,
          profileUrl: message.chat.username ? "https://t.me/" + message.chat.username : null,
          type: message.chat.id < 0 ? 'channel' : 'user'
        });
        if (telegramRouter.channelPostFix) {
          channelInfo.id += '@' + telegramRouter.channelPostFix;
          if (channelInfo.aliases[0]) {
            channelInfo.aliases[0] += '@' + telegramRouter.channelPostFix;
          }
        }
        cachedChannel = telegramRouter.userInfoCache.get(channelInfo.id);
        if (!cachedChannel) {
          telegramRouter.userInfoCache.set(channelInfo.id, channelInfo);
        } else {
          compareStr = JSON.stringify(channelInfo);
          compareStr1 = JSON.stringify(cachedChannel);
          if (compareStr !== compareStr1) {
            telegramRouter.userInfoCache.set(channelInfo.id, channelInfo);
          }
        }
      } catch (error) {
        e = error;
        console.error(e.stack);
      }
      channelId = "#" + message.chat.id.toString();
      if (telegramRouter.channelPostFix) {
        channelId += "@" + telegramRouter.channelPostFix;
      }
      try {
        userPhotoMedias = telegramRouter.userAvatarCache.get(message.from.id);
        if (!userPhotoMedias) {
          try {
            userPhoto = (yield telegramRouter.api.getUserProfilePhotos(message.from.id, null));
            if (userPhoto.total_count > 0) {
              userPhotoMedias = userPhoto.photos.map(function(list) {
                return createMediaFromPhotoList(list, telegramRouter.api);
              }).map(function(media, index) {
                media.role = 'avatar';
                media.id = userPhoto.photos[index][0].file_id + "@telegram-avatar";
                return media;
              });
            } else {
              userPhotoMedias = [];
            }
          } catch (error1) {
            console.log('skiping failed avatar...');
            userPhotoMedias = [];
          }
          telegramRouter.userAvatarCache.set(message.from.id, userPhotoMedias);
        }
        userInfo = new User("undefined_" + message.from.id, {
          images: userPhotoMedias,
          aliases: message.from.username ? [message.from.username] : [],
          nicknames: message.from.username ? ['@' + message.from.username] : [],
          lastName: message.from.last_name || null,
          firstName: message.from.first_name || null,
          profileUrl: message.from.username ? "https://t.me/" + message.from.username : null,
          type: 'user'
        });
        if (telegramRouter.userPostFix) {
          userInfo.id += '@' + telegramRouter.userPostFix;
          if (userInfo.aliases[0]) {
            userInfo.aliases[0] += '@' + telegramRouter.userPostFix;
          }
        }
        cachedUser = telegramRouter.userInfoCache.get(userInfo.id);
        if (!cachedUser) {
          telegramRouter.userInfoCache.set(userInfo.id, userInfo);
        } else {
          compareStr = JSON.stringify(userInfo);
          compareStr1 = JSON.stringify(cachedUser);
          if (compareStr !== compareStr1) {
            telegramRouter.userInfoCache.set(userInfo.id, userInfo);
          }
        }
      } catch (error2) {
        e = error2;
        console.error(e.stack);
      }
      userName = message.from.username;
      userName = userName || ("undefined_" + message.from.id);
      if (telegramRouter.userPostFix) {
        userName += "@" + telegramRouter.userPostFix;
      }
      sender = new Senter(userName, channelId, message, []);
      sender.senderInfo = userInfo;
      sender.targetInfo = channelInfo;
      return sender;
    });
  };

  createSenderFromUser = function(user, telegramRouter) {
    return co(function*() {
      var cachedUser, channelId, compareStr, compareStr1, e, error, error1, sender, userInfo, userName, userPhoto, userPhotoMedias;
      try {
        userPhotoMedias = telegramRouter.userAvatarCache.get(user.id);
        if (!userPhotoMedias) {
          try {
            userPhoto = (yield telegramRouter.api.getUserProfilePhotos(user.id, null));
            if (userPhoto.total_count > 0) {
              userPhotoMedias = userPhoto.photos.map(function(list) {
                return createMediaFromPhotoList(list, telegramRouter.api);
              }).map(function(media) {
                media.role = 'avatar';
                media.id = userPhoto.photos[0].file_id + "@telegram-avatar";
                return media;
              });
            } else {
              userPhotoMedias = [];
            }
          } catch (error) {
            console.log('skiping failed avatar...');
            userPhotoMedias = [];
          }
          telegramRouter.userAvatarCache.set(user.id, userPhotoMedias);
        }
        userInfo = new User("undefined_" + user.id, {
          images: userPhotoMedias,
          aliases: user.username ? [user.username] : [],
          nicknames: user.username ? ['@' + user.username] : [],
          lastName: user.last_name || null,
          firstName: user.first_name || null,
          profileUrl: user.username ? "https://t.me/" + user.username : null,
          type: 'user'
        });
        if (telegramRouter.userPostFix) {
          userInfo.id += '@' + telegramRouter.userPostFix;
          if (userInfo.aliases[0]) {
            userInfo.aliases[0] += '@' + telegramRouter.userPostFix;
          }
        }
        cachedUser = telegramRouter.userInfoCache.get(userInfo.id);
        if (!cachedUser) {
          telegramRouter.userInfoCache.set(userInfo.id, userInfo);
        } else {
          compareStr = JSON.stringify(userInfo);
          compareStr1 = JSON.stringify(cachedUser);
          if (compareStr !== compareStr1) {
            telegramRouter.userInfoCache.set(userInfo.id, userInfo);
          }
        }
      } catch (error1) {
        e = error1;
        console.error(e.stack);
      }
      channelId = "#__unknown__";
      if (telegramRouter.channelPostFix) {
        channelId += "@" + telegramRouter.channelPostFix;
      }
      userName = user.username;
      userName = userName || ("undefined_" + user.id);
      if (telegramRouter.channelPostFix) {
        userName += "@" + telegramRouter.channelPostFix;
      }
      sender = new Senter(userName, channelId, null, []);
      sender.senderInfo = userInfo;
      return sender;
    });
  };

  TelegramText = (function() {
    function TelegramText() {}

    TelegramText.toHTML = function(text, entities) {
      var chars, entity, i, j, k, len, name, offset, realOffset, ref, ref1, ref2, ref3, url;
      chars = text.split('');
      chars = chars.map(function(i) {
        switch (i) {
          case '&':
            return '&amp;';
          case '<':
            return '&lt;';
          case '>':
            return '&gt;';
          case '"':
            return '&quot;';
          case '\n':
            return '<br/>';
          default:
            return i;
        }
      });
      offset = 0;
      if (!entities) {
        return chars.join('');
      }
      for (j = 0, len = entities.length; j < len; j++) {
        entity = entities[j];
        switch (entity.type) {
          case 'code':
            realOffset = offset + entity.offset;
            chars.splice(realOffset, 0, '<code>');
            chars.splice(realOffset + entity.length + 1, 0, '</code>');
            offset += 2;
            break;
          case 'bold':
            realOffset = offset + entity.offset;
            chars.splice(realOffset, 0, '<b>');
            chars.splice(realOffset + entity.length + 1, 0, '</b>');
            offset += 2;
            break;
          case 'italic':
            realOffset = offset + entity.offset;
            chars.splice(realOffset, 0, '<i>');
            chars.splice(realOffset + entity.length + 1, 0, '</i>');
            offset += 2;
            break;
          case 'pre':
            realOffset = offset + entity.offset;
            for (i = k = ref = realOffset, ref1 = realOffset + entity.length - 1; ref <= ref1 ? k <= ref1 : k >= ref1; i = ref <= ref1 ? ++k : --k) {
              if (chars[i] === '<br/>') {
                chars[i] = '\n';
              }
            }
            chars.splice(realOffset, 0, '<pre>');
            chars.splice(realOffset + entity.length + 1, 0, '</pre>');
            offset += 2;
            break;
          case 'mention':
            realOffset = offset + entity.offset;
            name = chars.slice(realOffset + 1, realOffset + entity.length).join('');
            url = "https://telegram.me/" + (encodeURIComponent(name));
            chars.splice(realOffset, 0, "<a href=\"" + url + "\" data-tg-type=\"mention\" >");
            chars.splice(realOffset + entity.length + 1, 0, '</a>');
            offset += 2;
            break;
          case 'text_mention':
            realOffset = offset + entity.offset;
            name = chars.slice(realOffset, realOffset + entity.length).join('');
            if (entity.user.username) {
              url = "https://telegram.me/" + (encodeURIComponent(entity.user.username));
            } else {
              url = "#";
            }
            chars.splice(realOffset, 0, "<a href=\"" + url + "\" data-tg-type=\"text_mention\" data-tg-id=\"" + entity.user.id + "\" data-tg-first_name=\"" + (entity.user.first_name || '') + "\" data-tg-last_name=\"" + (entity.user.last_name || '') + "\" >");
            chars.splice(realOffset + entity.length + 1, 0, '</a>');
            offset += 2;
            break;
          case 'url':
          case 'email':
          case 'text_link':
          case 'hashtag':
          case 'bot_command':
            realOffset = offset + entity.offset;
            if ((ref2 = entity.type) === 'url' || ref2 === 'text_link' || ref2 === 'email') {
              url = chars.slice(realOffset, realOffset + entity.length).join('');
              if ((!(url.match(/^https?:\/\//))) && ((ref3 = entity.type) === 'url' || ref3 === 'text_link')) {
                url = 'http://' + url;
              }
            } else {
              url = '#';
            }
            if (entity.type === 'email') {
              url = 'mailto://' + url;
            }
            url = entity.url || url;
            chars.splice(realOffset, 0, "<a href=\"" + url + "\" data-tg-type=\"" + entity.type + "\" >");
            chars.splice(realOffset + entity.length + 1, 0, '</a>');
            offset += 2;
        }
      }
      return chars.join('');
    };

    return TelegramText;

  })();

  createMediaFromPhotoList = function(list, api) {
    var files, media;
    files = list.map((function(_this) {
      return function(data) {
        var photo;
        photo = new TelegramFile(data.file_id, api, {
          length: data.file_size,
          photoSize: [data.width, data.height]
        });
        photo.meta = {
          overrides: {
            MIME: 'image/webp'
          }
        };
        return photo;
      };
    })(this));
    files[0].isThumb = true;
    return media = new Media({
      id: list[0].file_id + "@telegram-photo",
      role: 'photo',
      placeHolderText: '((photo))',
      files: files
    });
  };

  module.exports = TelegramRouter;

}).call(this);
