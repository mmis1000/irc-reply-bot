(function() {
  var Memory, formatMemory, os, style;

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

  formatMemory = function(num, type, showType) {
    var output;
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

  Memory = (function() {
    function Memory() {
      this.symbols = ['memory'];
    }

    Memory.prototype.handle = function(sender, content, args, manager, router) {
      var freemem, status, totalmem, usedmem;
      if (args.length === 0) {
        args.push('all');
      }
      if (args.length === 1) {
        args.push('auto');
      }
      if (args.length === 2) {
        args.push('show');
      }
      totalmem = os.totalmem();
      freemem = os.freemem();
      usedmem = totalmem - freemem;
      if (args[0] === 'all') {
        if (usedmem / totalmem < 0.4) {
          status = style.dark_green;
        } else if (usedmem / totalmem < 0.7) {
          status = style.orange;
        } else {
          status = style.red;
        }
        return "" + status + (formatMemory(usedmem, args[1], args[2])) + style.reset + " / " + (formatMemory(totalmem, args[1], args[2]));
      }
      if (args[0] === 'used') {
        return formatMemory(usedmem, args[1], args[2]);
      }
      if (args[0] === 'free') {
        return formatMemory(freemem, args[1], args[2]);
      }
      if (args[0] === 'total') {
        return formatMemory(totalmem, args[1], args[2]);
      }
    };

    return Memory;

  })();

  module.exports = new Memory;

}).call(this);
