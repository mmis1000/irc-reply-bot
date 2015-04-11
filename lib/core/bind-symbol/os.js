(function() {
  var Memory, os, padding, style,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  os = require('os');

  style = {
    red: "\u000304",
    yellow: "\u000308",
    green: "\u000309",
    dark_red: "\u000305",
    dark_green: "\u000303",
    orange: "\u000307",
    bold: "\u0002",
    reset: "\u000f"
  };

  padding = function(str, fill, len) {
    str = str.toString();
    while (str.length < len) {
      str = fill + str;
    }
    return str;
  };

  Memory = (function() {
    function Memory() {
      this.symbols = ['os'];
      this.displayed = ['hostname', 'type', 'platform', 'arch', 'release', 'uptime', 'loadavg'];
    }

    Memory.prototype.handle = function(sender, content, args, manager, router) {
      var output, type, _i, _len, _ref, _ref1;
      if (args.length === 0) {
        args.push('all');
      }
      output = [];
      if (args[0] === 'all') {
        _ref = this.displayed;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          type = _ref[_i];
          output.push("" + style.bold + type + style.reset + " : " + (this._mapper(os[type](), type)));
        }
      } else if (_ref1 = args[0], __indexOf.call(this.displayed, _ref1) >= 0) {
        output.push("" + (this._mapper(os[args[0]](), args[0])));
      } else {
        output.push("unknown type " + args[0]);
      }
      return output.join(', ');
    };

    Memory.prototype._mapper = function(val, type) {
      var day, hour, minute, second;
      if (type === 'uptime') {
        val = Math.floor(val / 1);
        second = val % 60;
        minute = (Math.floor(val / 60)) % 60;
        hour = (Math.floor(val / (60 * 60))) % 24;
        day = Math.floor(val / (60 * 60 * 24));
        return "" + (day > 1 ? day + ' days, ' : day > 0 ? '1 day, ' : '') + "" + (padding(hour, "0", 2)) + ":" + (padding(minute, "0", 2)) + ":" + (padding(second, "0", 2));
      }
      if (type === 'loadavg') {
        return val.map(function(i) {
          return i.toFixed(1);
        }).join(', ');
      }
      return val.toString();
    };

    return Memory;

  })();

  module.exports = new Memory;

}).call(this);
