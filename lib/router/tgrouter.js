(function() {
  var Media, Message, Senter, Telegram, TelegramFile, TelegramRouter, TextRouter, UTF8LengthSplit,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  TextRouter = require('./textrouter');

  Telegram = require('../tgapi');

  Senter = require('../senter.js');

  UTF8LengthSplit = require('../util.js').UTF8LengthSplit;

  Message = require('../models/message');

  Media = require('../models/media');

  TelegramFile = require('../models/telegram_file');

  TelegramRouter = (function(_super) {
    __extends(TelegramRouter, _super);

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
    }

    TelegramRouter.prototype._init = function() {
      console.log("initing telegram with token " + this.token);
      this.api = new Telegram(this.token);
      this.api.startPolling(40);
      this.api.getMe((function(_this) {
        return function(err, res) {
          if (err) {
            return _this.emit(err);
          }
          _this.setSelfName(res.username);

          /*
          @api.on 'message', (message)=>
            
            console.log JSON.stringify message, 0, 4
            
            channelId = "#" + message.chat.id.toString()
            
            if message.from.username
              @nameMap[message.from.username] = message.from.id
              
            if @channelPostFix
              channelId += "@" + @channelPostFix
            userName = message.from.username
            userName = userName || "undefined_#{message.from.id}"
            if @userPostFix
              userName += "@" + @channelPostFix
            text = message.text
            return if not text
            
            clonedRouter = {}
            
            for key, value of @
              clonedRouter[key] = value
              if 'function' is typeof value
                if not value.toString().match /\[native code\]/
                  clonedRouter.key = value.bind @
                  
            message_id = message.message_id
            message_ = message
            clonedRouter.output = (message, to)=>
                    
              channelName = "#" + message_.chat.id.toString()
              channelName += "@" + @channelPostFix if @channelPostFix
              @output message, to, message_id, channelName
            console.log (new Date).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ' + userName + ' => ' + channelId + ': ' + text.replace /\r?\n/g, '\r\n   | '
            @input text, userName, channelId, [], clonedRouter
           */
          _this.api.on('message', function(message) {
            var botMessage, channelId, clonedRouter, file, fileThumb, key, media, message_, message_id, userName, value;
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
              userName += "@" + _this.channelPostFix;
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
            clonedRouter.output = function(message, to) {
              var channelName;
              channelName = "#" + message_.chat.id.toString();
              if (_this.channelPostFix) {
                channelName += "@" + _this.channelPostFix;
              }
              return _this.output(message, to, message_id, channelName);
            };
            if (message.sticker) {
              file = new TelegramFile(message.sticker.file_id, _this.api, {
                MIME: 'image/webp',
                length: message.sticker.file_size,
                size: [message.sticker.width, message.sticker.height]
              });
              fileThumb = new TelegramFile(message.sticker.thumb.file_id, _this.api, {
                MIME: 'image/webp',
                length: message.sticker.thumb.file_size,
                size: [message.sticker.thumb.width, message.sticker.thumb.height],
                isThumb: true
              });
              media = new Media({
                id: "" + message.sticker.file_id + "@telegram-sticker",
                role: 'sticker',
                placeHolderText: '((sticker))',
                files: [file, fileThumb]
              });
              botMessage = new Message('((sticker))', [media], true, false);
              botMessage.meta.time = new Date(message.date * 1000);
              console.log(botMessage);
              _this.inputMessage(botMessage, userName, channelId, [], clonedRouter);

              /*
              media.getAllFiles().then (files)->
                console.log files
              .catch (err)->
                console.error err
               */
            }
            if (message.text) {
              botMessage = new Message(message.text, [], true, true);
              botMessage.meta.time = new Date(message.date * 1000);
              console.log((new Date(botMessage.meta.time)).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ' + userName + ' => ' + channelId + ': ' + message.text.replace(/\r?\n/g, '\r\n   | '));
              console.log(botMessage);
              return _this.inputMessage(botMessage, userName, channelId, [], clonedRouter);
            }
          });
          return _this.on('output', function(m, target, replyId) {
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
            if (replyId) {
              return _this.api.sendMessage(target, m, null, {
                reply_to_message_id: replyId
              });
            } else {
              return _this.api.sendMessage(target, m);
            }
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

    TelegramRouter.prototype.output = function(message, to, message_id, originalChannel, nobuffer) {
      var message_id_temp, person, _i, _len, _results;
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
        return this.emit("output", message, to, message_id_temp);
      } else {
        _results = [];
        for (_i = 0, _len = to.length; _i < _len; _i++) {
          person = to[_i];
          _results.push(this.emit("output", message, person, message_id_temp));
        }
        return _results;
      }
    };

    TelegramRouter.prototype.flushOutput = function() {
      var channel, channelTemp, id, key, value, _ref;
      this.bufferTimeoutId = null;
      _ref = this.messageBuffer;
      for (key in _ref) {
        value = _ref[key];
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
      return "@" + (str.replace(/@.*/, ''));
    };

    TelegramRouter.prototype.isCommand = function(str, sender) {
      var temp;
      if (!str.match(/^\//)) {
        return false;
      }
      temp = str.replace(/^\//, '').split(/\u0020/g);
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

    return TelegramRouter;

  })(TextRouter);

  module.exports = TelegramRouter;

}).call(this);
