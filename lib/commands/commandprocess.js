var CommandProcess, Icommand, formatMemory, padding,
  indexOf = [].indexOf;

Icommand = require('../icommand.js');

formatMemory = function(num, type = 'auto', showType = 'show') {
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

padding = function(str, fill, len) {
  str = str.toString();
  while (str.length < len) {
    str = fill + str;
  }
  return str;
};

CommandProcess = class CommandProcess extends Icommand {
  constructor() {
    super();
    this.displayed = ['pid', 'memoryUsage', 'uptime'];
  }

  handle(sender, text, args, storage, textRouter, commandManager) {
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
        output.push(`${type} : ${this._getValue(type)}`);
      }
    } else if (ref1 = args[1], indexOf.call(this.displayed, ref1) >= 0) {
      output.push(this._getValue(args[1]));
    } else {
      return false;
    }
    commandManager.send(sender, textRouter, output.join(', '));
    return true;
  }

  _getValue(type) {
    var result;
    if ('function' === typeof process[type]) {
      result = process[type]();
    } else {
      result = process[type];
    }
    result = this._mapper(result, type);
    return result;
  }

  _mapper(val, type) {
    var day, hour, minute, name, res, second, value;
    if (type === 'uptime') {
      val = Math.floor(val / 1);
      second = val % 60;
      minute = (Math.floor(val / 60)) % 60;
      hour = (Math.floor(val / (60 * 60))) % 24;
      day = Math.floor(val / (60 * 60 * 24));
      return `${day > 1 ? day + ' days, ' : day > 0 ? '1 day, ' : ''}${padding(hour, "0", 2)}:${padding(minute, "0", 2)}:${padding(second, "0", 2)}`;
    }
    if (type === 'memoryUsage') {
      res = [];
      for (name in val) {
        value = val[name];
        res.push(`${name} : ${formatMemory(value)}`);
      }
      return res.join(', ');
    }
    return val.toString();
  }

  help(commandPrefix) {
    //console.log "add method to override this!"
    return ["Show process info of this bot, Usage: ", `${commandPrefix} [all|pid|memoryUsage|uptime].`];
  }

  hasPermission(sender, text, args, storage, textRouter, commandManager, fromBinding) {
    return true;
  }

};

module.exports = CommandProcess;
