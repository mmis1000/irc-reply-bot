(function() {
  var CommandOsInfo, Icommand, os, padding,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Icommand = require('../icommand.js');

  os = require('os');

  padding = function(str, fill, len) {
    str = str.toString();
    while (str.length < len) {
      str = fill + str;
    }
    return str;
  };

  CommandOsInfo = (function(superClass) {
    extend(CommandOsInfo, superClass);

    function CommandOsInfo() {
      this.displayed = ['hostname', 'type', 'platform', 'arch', 'release', 'uptime', 'loadavg'];
    }

    CommandOsInfo.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var j, len1, output, ref, ref1, type;
      if (args.length > 2) {
        return false;
      }
      if (args.length === 1) {
        args.push('all');
      }
      output = [];
      if (args[1] === 'all') {
        ref = this.displayed;
        for (j = 0, len1 = ref.length; j < len1; j++) {
          type = ref[j];
          output.push(type + " : " + (this._mapper(os[type](), type)));
        }
      } else if (ref1 = args[1], indexOf.call(this.displayed, ref1) >= 0) {
        output.push("" + (this._mapper(os[args[1]](), args[1])));
      } else {
        return false;
      }
      commandManager.send(sender, textRouter, output.join(', '));
      return true;
    };

    CommandOsInfo.prototype._mapper = function(val, type) {
      var day, hour, minute, second;
      if (type === 'uptime') {
        val = Math.floor(val / 1);
        second = val % 60;
        minute = (Math.floor(val / 60)) % 60;
        hour = (Math.floor(val / (60 * 60))) % 24;
        day = Math.floor(val / (60 * 60 * 24));
        return "" + (day > 1 ? day + ' days, ' : day > 0 ? '1 day, ' : '') + (padding(hour, "0", 2)) + ":" + (padding(minute, "0", 2)) + ":" + (padding(second, "0", 2));
      }
      if (type === 'loadavg') {
        return val.map(function(i) {
          return i.toFixed(1);
        }).join(', ');
      }
      return val.toString();
    };

    CommandOsInfo.prototype.help = function(commandPrefix) {
      return ["check os info Usage:", commandPrefix + " [all|hostname|type|platform|arch|release|uptime|loadavg]"];
    };

    CommandOsInfo.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    };

    return CommandOsInfo;

  })(Icommand);

  module.exports = CommandOsInfo;

}).call(this);
