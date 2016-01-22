(function() {
  var Telegram, TelegramRouter, TextRouter,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  TextRouter = require('./textrouter');

  Telegram = require('../tgapi');

  TelegramRouter = (function(_super) {
    __extends(TelegramRouter, _super);

    function TelegramRouter(token, channelPostFix, userPostFix) {
      this.token = token;
      this.channelPostFix = channelPostFix != null ? channelPostFix : 'tg';
      this.userPostFix = userPostFix != null ? userPostFix : 'tg';
      TelegramRouter.__super__.constructor.apply(this, arguments);
      this.nameMap = {};
      this._init();
    }

    TelegramRouter.prototype._init = function() {
      console.log("initing telegram with token " + this.token);
      this.api = new Telegram(this.token);
      this.api.startPolling(40);
      this.api.on('message', (function(_this) {
        return function(message) {
          var channelId, text, userName;
          console.log(message);
          channelId = "#" + message.chat.id.toString();
          if (message.from.username) {
            _this.nameMap[message.from.username] = message.from.id;
          }
          if (_this.channelPostFix) {
            channelId += "@" + _this.channelPostFix;
          }
          userName = message.from.username;
          if (_this.userPostFix) {
            userName += "@" + _this.channelPostFix;
          }
          text = message.text;
          if (!text) {
            return;
          }
          return _this.input(text, userName, channelId, []);
        };
      })(this));
      this.on('output', (function(_this) {
        return function(m, target) {
          target = target.replace(/@.*$/, '');
          if (target.match(/^#/)) {
            target = target.replace(/^#/, '');
            target = parseInt(target, 10);
          } else if (_this.nameMap[target]) {
            target = _this.nameMap[target];
          } else {
            return console.error("unknown username " + target);
          }
          return _this.api.sendMessage(target, m);
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

    return TelegramRouter;

  })(TextRouter);

  module.exports = TelegramRouter;

}).call(this);
