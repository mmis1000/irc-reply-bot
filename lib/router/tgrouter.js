(function() {
  var Senter, Telegram, TelegramRouter, TextRouter, UTF8LengthSplit,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  TextRouter = require('./textrouter');

  Telegram = require('../tgapi');

  Senter = require('../senter.js');

  UTF8LengthSplit = require('../util.js').UTF8LengthSplit;

  TelegramRouter = (function(_super) {
    __extends(TelegramRouter, _super);

    function TelegramRouter(token, channelPostFix, userPostFix) {
      this.token = token;
      this.channelPostFix = channelPostFix != null ? channelPostFix : 'tg';
      this.userPostFix = userPostFix != null ? userPostFix : 'tg';
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
          _this.api.on('message', function(message) {
            var channelId, clonedRouter, key, message_, message_id, text, userName, value;
            console.log(message);
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
            text = message.text;
            if (!text) {
              return;
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
            return _this.input(text, userName, channelId, [], clonedRouter);
          });
          return _this.on('output', function(m, target, replyId) {
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
      return "telegram.com";
    };

    TelegramRouter.prototype.parseArgs = function(cmd) {
      var temp;
      temp = cmd.replace(/^\//, '').split(/\s/g);
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

    TelegramRouter.prototype.output = function(message, to, message_id, originalChannel, nobuffer) {
      var message_id_temp, person, _i, _len, _results;
      message_id_temp = message_id;
      if (originalChannel && to !== originalChannel) {
        message_id_temp = void 0;
      }
      if ((!nobuffer) && this.bufferTimeout > 0) {
        this.messageBuffer[to + '_' + message_id] = this.messageBuffer[to + '_' + message_id] || [];
        this.messageBuffer[to + '_' + message_id].push(message);
        if (!this.bufferTimeoutId) {
          this.bufferTimeoutId = setTimeout(this.flushOutput.bind(this), this.bufferTimeout);
        }
      }
      if (Array.isArray(message)) {
        message = message.join("\n");
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
      var channel, id, key, value, _ref;
      this.bufferTimeoutId = null;
      _ref = this.messageBuffer;
      for (key in _ref) {
        value = _ref[key];
        channel = (key.split('_'))[0];
        id = (key.split('_'))[1];
        channel = parseInt(channel, 10);
        id = parseInt(id, 10);
        if (isNaN(id)) {
          id = null;
        }
        value = value.join("\r\n");
        this.output(value, channel, id, null, true);
      }
      return this.messageBuffer = {};
    };

    return TelegramRouter;

  })(TextRouter);

  module.exports = TelegramRouter;

}).call(this);
