(function() {
  var Process, formatMemory, padding, style,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

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

  Process = (function() {
    function Process() {
      this.symbols = ['process'];
      this.displayed = ['pid', 'memoryUsage', 'uptime'];
    }

    Process.prototype.handle = function(sender, content, args, manager, router) {
      var output, type, _i, _len, _ref, _ref1;
      if (args.length === 0) {
        args.push('all');
      }
      output = [];
      if (args[0] === 'all') {
        _ref = this.displayed;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          type = _ref[_i];
          output.push("" + style.bold + type + style.reset + " : " + (this._getValue(type)));
        }
      } else if (_ref1 = args[0], __indexOf.call(this.displayed, _ref1) >= 0) {
        output.push(this._getValue(type));
      } else {
        output.push("unknown type " + args[0]);
      }
      return output.join(', ');
    };

    Process.prototype._getValue = function(type) {
      var result;
      if ('function' === typeof process[type]) {
        result = process[type]();
      } else {
        result = process[type];
      }
      result = this._mapper(result, type);
      return result;
    };

    Process.prototype._mapper = function(val, type) {
      var day, hour, minute, name, res, second, value;
      if (type === 'uptime') {
        val = Math.floor(val / 1);
        second = val % 60;
        minute = (Math.floor(val / 60)) % 60;
        hour = (Math.floor(val / (60 * 60))) % 24;
        day = Math.floor(val / (60 * 60 * 24));
        return "" + (day > 1 ? day + ' days, ' : day > 0 ? '1 day, ' : '') + "" + (padding(hour, "0", 2)) + ":" + (padding(minute, "0", 2)) + ":" + (padding(second, "0", 2));
      }
      if (type === 'memoryUsage') {
        res = [];
        for (name in val) {
          value = val[name];
          res.push("" + name + " : " + (formatMemory(value)));
        }
        return res.join(', ');
      }
      return val.toString();
    };

    return Process;

  })();

  module.exports = new Process;

}).call(this);
