(function() {
  var CommandProcess, Icommand, formatMemory, padding,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Icommand = require('../icommand.js');

  formatMemory = function(num, type, showType) {
    var output;
    if (type == null) {
      type = 'auto';
    }
    if (showType == null) {
      showType = 'show';
    }
    if (type === 'auto') {
      type = 'mb';
      if (num > 1024 * 1024 * 1024 * 0.9) {
        type = 'gb';
      }
    }
    output = '';
    if (type === 'mb') {
      output += (num / 1024 / 1024).toFixed(1);
    } else {
      output += (num / 1024 / 1024 / 1024).toFixed(1);
    }
    if (showType === 'show') {
      output += type;
    }
    return output;
  };

  padding = function(str, fill, len) {
    str = str.toString();
    while (str.length < len) {
      str = fill + str;
    }
    return str;
  };

  CommandProcess = (function(superClass) {
    extend(CommandProcess, superClass);

    function CommandProcess() {
      this.displayed = ['pid', 'memoryUsage', 'uptime'];
    }

    CommandProcess.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var i, len1, output, ref, ref1, type;
      if (args.length === 1) {
        args.push('all');
      }
      if (args.length > 2) {
        return false;
      }
      if (0 > (['all'].concat(this.displayed)).indexOf(args[1])) {
        return false;
      }
      output = [];
      if (args[1] === 'all') {
        ref = this.displayed;
        for (i = 0, len1 = ref.length; i < len1; i++) {
          type = ref[i];
          output.push(type + " : " + (this._getValue(type)));
        }
      } else if (ref1 = args[1], indexOf.call(this.displayed, ref1) >= 0) {
        output.push(this._getValue(args[1]));
      } else {
        return false;
      }
      commandManager.send(sender, textRouter, output.join(', '));
      return true;
    };

    CommandProcess.prototype._getValue = function(type) {
      var result;
      if ('function' === typeof process[type]) {
        result = process[type]();
      } else {
        result = process[type];
      }
      result = this._mapper(result, type);
      return result;
    };

    CommandProcess.prototype._mapper = function(val, type) {
      var day, hour, minute, name, res, second, value;
      if (type === 'uptime') {
        val = Math.floor(val / 1);
        second = val % 60;
        minute = (Math.floor(val / 60)) % 60;
        hour = (Math.floor(val / (60 * 60))) % 24;
        day = Math.floor(val / (60 * 60 * 24));
        return "" + (day > 1 ? day + ' days, ' : day > 0 ? '1 day, ' : '') + (padding(hour, "0", 2)) + ":" + (padding(minute, "0", 2)) + ":" + (padding(second, "0", 2));
      }
      if (type === 'memoryUsage') {
        res = [];
        for (name in val) {
          value = val[name];
          res.push(name + " : " + (formatMemory(value)));
        }
        return res.join(', ');
      }
      return val.toString();
    };

    CommandProcess.prototype.help = function(commandPrefix) {
      return ["Show process info of this bot, Usage: ", commandPrefix + " [all|pid|memoryUsage|uptime]."];
    };

    CommandProcess.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    };

    return CommandProcess;

  })(Icommand);

  module.exports = CommandProcess;

}).call(this);
