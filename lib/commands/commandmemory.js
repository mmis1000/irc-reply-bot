(function() {
  var CommandMemory, Icommand, formatMemory, os;

  Icommand = require('../icommand.js');

  os = require('os');

  formatMemory = function(num, type, showType = 'show') {
    var output;
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

  CommandMemory = class CommandMemory extends Icommand {
    constructor() {
      super();
    }

    handle(sender, text, args, storage, textRouter, commandManager, formBinding, originalMessage) {
      var freemem, totalmem, usedmem;
      if (args.length === 1) {
        args.push('all');
      }
      if (args.length === 2) {
        args.push('auto');
      }
      if (args.length === 3) {
        args.push('show');
      }
      if (args.length > 4) {
        return false;
      }
      if (0 > ['all', 'used', 'free', 'total'].indexOf(args[1])) {
        return false;
      }
      if (0 > ['mb', 'gb', 'auto'].indexOf(args[2])) {
        return false;
      }
      if (0 > ['show', 'hide'].indexOf(args[3])) {
        return false;
      }
      totalmem = os.totalmem();
      freemem = os.freemem();
      usedmem = totalmem - freemem;
      if (args[1] === 'all') {
        commandManager.send(sender, textRouter, `${formatMemory(usedmem, args[2], args[3])} / ${formatMemory(totalmem, args[2], args[3])}`);
      }
      if (args[1] === 'used') {
        commandManager.send(sender, textRouter, formatMemory(usedmem, args[2], args[3]));
      }
      if (args[1] === 'free') {
        commandManager.send(sender, textRouter, formatMemory(freemem, args[2], args[3]));
      }
      if (args[1] === 'total') {
        commandManager.send(sender, textRouter, formatMemory(totalmem, args[2], args[3]));
      }
      return true;
    }

    help(commandPrefix) {
      //console.log "add method to override this!"
      return ["Show system memory usage, Usage", `${commandPrefix} [all|used|free|total] [mb|gb|auto] [show|hide]`, "The third parameter indicate if this command should show the units"];
    }

    hasPermission(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    }

  };

  module.exports = CommandMemory;

}).call(this);
