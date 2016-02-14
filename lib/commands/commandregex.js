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
      this.maxLoop = 50;
      this.enabled = {};
      if (this.storage) {
        this.enabled = this.storage.get('regexReplace', {});
        if ('object' !== typeof this.enabled) {
          this.enabled = {};
        }
      }
    }

    CommandRegex.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var success;
      if (args.length !== 2 || 0 > ['on', 'off'].indexOf(args[1])) {
        return false;
      }
      if (args[1] === 'on') {
        this.enabled[sender.target] = true;
        if (this.storage) {
          this.storage.set('regexReplace', this.enabled);
        }
        commandManager.send(sender, textRouter, "regex module has been enabled for " + sender.target);
      } else {
        this.enabled[sender.target] = false;
        if (this.storage) {
          this.storage.set('regexReplace', this.enabled);
        }
        commandManager.send(sender, textRouter, "regex module has been disabled for " + sender.target);
      }
      success = true;
      return success;
    };

    CommandRegex.prototype.help = function(commandPrefix) {
      return ["Use regex to replace words. ", "The regex and replacedBy are actully passed into js's replace method directly.", "Please see http://www.w3schools.com/jsref/jsref_replace.asp for more detail.", "only \\ and / in replacedBy need to be escaped", "Usage:", "" + commandPrefix + " [on|off] #toggle this module", "s/regex/replacedBy[/modifiers] #replace words in the sentence you said", "{nick} , s/regex/replacedBy/modifiers #replace words in the sentence others said, Use : after nick is also accepted, the space next to , or : is also optional", "Example:", "s/[a-zA-Z]// #remove first english alphabet found in yours words", "jame: s/[a-zA-Z]/*/g #replace all english alphabet in jame's words with *"];
    };

    CommandRegex.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return commandManager.isOp(sender.sender);
    };

    CommandRegex.prototype.handleRaw = function(sender, type, content, textRouter, commandManager) {
      var changesMessage, index, maybeACommand, message, referredBy, result, sayer, tags, _i, _len, _ref;
      if (!sender || !this.enabled[sender.target]) {
        return true;
      }
      if (type !== "text") {
        return true;
      }
      if (0 !== sender.target.search('#')) {
        sender.target.search('#');
        return;
      }
      tags = /^([a-zA-Z0-9_@]+)(?:\s?[,:]\s?|\s)(.+)$/.exec(content);
      maybeACommand = false;
      if (!tags) {
        result = this._parseCommand(content);
        maybeACommand = !!content.match(/^s\//);
        sayer = sender.sender;
      } else {
        result = this._parseCommand(tags[2]);
        sayer = tags[1];
        maybeACommand = !!tags[2].match(/^s\//);
        referredBy = sender.sender;
      }
      if (!result || !this.lastMessages[sayer] || commandManager.isBanned(sender)) {
        if (!maybeACommand) {
          this.lastMessages[sender.sender] = this.lastMessages[sender.sender] || [];
          this.lastMessages[sender.sender].unshift(content);
          this.lastMessages[sender.sender] = this.lastMessages[sender.sender].slice(0, +(this.record - 1) + 1 || 9e9);
        }
        return true;
      }
      _ref = this.lastMessages[sayer];
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        message = _ref[index];
        if (false !== this._replaceText(message, result)) {
          changesMessage = this._replaceText(message, result);
          this.lastMessages[sayer][index] = changesMessage;
          if (!referredBy) {
            textRouter.output("" + sayer + " " + this.locale.preMean + "\u0002" + this.locale.mean + "\u000f" + this.locale.postMean + " \u001d" + changesMessage, sender.target);
          } else {
            textRouter.output("" + referredBy + " " + this.locale.think + " " + sayer + " " + this.locale.preMean + "\u0002" + this.locale.mean + "\u000f" + this.locale.postMean + " \u001d" + changesMessage, sender.target);
          }
          break;
        }
      }
      return true;
    };

    CommandRegex.prototype._parseCommand = function(text) {
      var e, index, item, line, modifiers, regex, regexPairs, replace, _i, _len;
      line = text.match(/(\\u....|\\x..|\\.|.)/g);
      if (line[0] !== 's' || line[1] !== '/') {
        return false;
      }
      line = this._splitArray(line.slice(2), '/');
      if (line.length % 2 === 0) {
        line.push([]);
      }
      if (line.length < 3) {
        return false;
      }
      line = line.map(function(i) {
        return i.join('');
      });
      modifiers = line.slice(-1)[0];
      line = line.slice(0, -1);
      regexPairs = [];
      regexPairs.flags = modifiers;
      for (index = _i = 0, _len = line.length; _i < _len; index = ++_i) {
        item = line[index];
        if (index % 2 !== 0) {
          continue;
        }
        try {
          regex = new RegExp(line[index], modifiers);
          replace = line[index + 1].replace(/\\(\/|\\)/g, '$1');
          regexPairs.push({
            regex: regex,
            replace: replace
          });
        } catch (_error) {
          e = _error;
          console.log(e);
        }
      }
      if (regexPairs.length === 0) {
        return false;
      }
      return regexPairs;
    };

    CommandRegex.prototype._replaceText = function(text, regexPairs) {
      var index, looped, maxLoop, modified, originalText, pair, useLoop, _i, _len;
      useLoop = 0 <= regexPairs.flags.search('g');
      useLoop = useLoop && (regexPairs.length > 1);
      maxLoop = useLoop ? this.maxLoop : 1;
      originalText = '';
      looped = 0;
      while (maxLoop > looped++) {
        originalText = text;
        for (index = _i = 0, _len = regexPairs.length; _i < _len; index = ++_i) {
          pair = regexPairs[index];
          text = text.replace(pair.regex, pair.replace);
        }
        if (originalText !== text) {
          modified = true;
        }
        if (originalText === text) {
          break;
        }
      }
      if (modified) {
        return text;
      }
      return false;
    };

    CommandRegex.prototype._splitArray = function(arr, seperator) {
      var i, newI, temp;
      temp = [];
      i = 0;
      while (true) {
        newI = arr.indexOf(seperator, i);
        if (newI === -1) {
          temp.push(arr.slice(i, +(arr.length - 1) + 1 || 9e9));
          break;
        }
        if (newI - 1 >= 0) {
          temp.push(arr.slice(i, +(newI - 1) + 1 || 9e9));
        } else {
          temp.push([]);
        }
        i = newI + 1;
      }
      return temp;
    };

    return CommandRegex;

  })(Icommand);

  module.exports = CommandRegex;

}).call(this);
