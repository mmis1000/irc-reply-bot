(function() {
  var CommandRegex, Icommand,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('../icommand.js');

  CommandRegex = (function(_super) {
    __extends(CommandRegex, _super);

    function CommandRegex(storage) {
      this.storage = storage;
      this.record = 10;
      this.lastMessages = {};
      this.locale = {
        preMean: '的',
        mean: '意思',
        postMean: '是：',
        think: '認為'
      };
    }

    CommandRegex.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var message, success;
      if (args.length !== 2 || 0 > ['on', 'off'].indexOf(args[1])) {
        return false;
      }
      message = args.slice(1).join(" ");
      message = message.replace(/\\n/g, "\n");
      textRouter.output(message, sender.channel);
      success = true;
      return success;
    };

    CommandRegex.prototype.help = function(commandPrefix) {
      console.log("add method to override this!");
      return ["toggle this model, Usage", "" + commandPrefix + " [on|off]"];
    };

    CommandRegex.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return commandManager.isOp(sender.sender);
    };

    CommandRegex.prototype.handleRaw = function(sender, type, content, textRouter, commandManager) {
      var changesMessage, index, message, referredBy, result, sayer, tags, _i, _len, _ref;
      if (type !== "text") {
        return false;
      }
      console.log(content);
      if (0 !== sender.target.search('#')) {
        sender.target.search('#');
        return;
      }
      tags = /^([a-zA-Z0-9]+)\s?[,:]\s?(.+)$/.exec(content);
      if (!tags) {
        result = this._parseCommand(content);
        sayer = sender.sender;
      } else {
        result = this._parseCommand(tags[2]);
        if (result) {
          sayer = tags[1];
          referredBy = sender.sender;
        }
      }
      if (!result || !this.lastMessages[sayer]) {
        this.lastMessages[sender.sender] = this.lastMessages[sender.sender] || [];
        this.lastMessages[sender.sender].unshift(content);
        this.lastMessages[sender.sender] = this.lastMessages[sender.sender].slice(0, +(this.record - 1) + 1 || 9e9);
        return true;
      }
      _ref = this.lastMessages[sayer];
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        message = _ref[index];
        if (message.match(result.regex)) {
          changesMessage = message.replace(result.regex, result.replace);
          this.lastMessages[sayer][index] = changesMessage;
          if (!referredBy) {
            textRouter.output("" + sayer + " " + this.locale.preMean + "\u0002" + this.locale.mean + "\u000f" + this.locale.postMean + " \u001d" + changesMessage, sender.target);
          } else {
            textRouter.output("" + referredBy + " " + this.locale.think + " " + sayer + " " + this.locale.preMean + "\u0002" + this.locale.mean + "\u000f" + this.locale.postMean + " \u001d" + changesMessage, sender.target);
            break;
          }
        }
      }
      return true;
    };

    CommandRegex.prototype._parseCommand = function(text) {
      var e, flags, line, regex, replace, slash2, slash3, slashs;
      line = text.match(/(\\u....|\\x..|\\.|.)/g);
      if (line[0] !== 's' || line[1] !== '/') {
        return false;
      }
      slashs = (line.filter((function(i) {
        return i === "/";
      }))).length;
      if (2 === slashs) {
        line.push('/');
        slashs = 3;
      }
      if (3 !== slashs) {
        return false;
      }
      slash2 = line.indexOf('/', 2);
      regex = line.slice(2, +(slash2 - 1) + 1 || 9e9).join('');
      if (regex.length === 0) {
        return false;
      }
      slash3 = line.indexOf('/', slash2 + 1);
      replace = (line.slice(slash2 + 1, +(slash3 - 1) + 1 || 9e9).join('')).replace(/\\\//g, '/');
      flags = line.slice(slash3 + 1).join('');
      try {
        regex = new RegExp(regex, flags);
        return {
          regex: regex,
          replace: replace
        };
      } catch (_error) {
        e = _error;
        return false;
      }
    };

    return CommandRegex;

  })(Icommand);

  module.exports = CommandRegex;

}).call(this);
