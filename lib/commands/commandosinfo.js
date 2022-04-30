var CommandOsInfo, Icommand, os, padding,
  indexOf = [].indexOf;

Icommand = require('../icommand.js');

os = require('os');

padding = function(str, fill, len) {
  str = str.toString();
  while (str.length < len) {
    str = fill + str;
  }
  return str;
};

CommandOsInfo = class CommandOsInfo extends Icommand {
  constructor() {
    super();
    this.displayed = ['hostname', 'type', 'platform', 'arch', 'release', 'uptime', 'loadavg'];
  }

  handle(sender, text, args, storage, textRouter, commandManager) {
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
        output.push(`${type} : ${this._mapper(os[type](), type)}`);
      }
    } else if (ref1 = args[1], indexOf.call(this.displayed, ref1) >= 0) {
      output.push(`${this._mapper(os[args[1]](), args[1])}`);
    } else {
      return false;
    }
    commandManager.send(sender, textRouter, output.join(', '));
    return true;
  }

  _mapper(val, type) {
    var day, hour, minute, second;
    if (type === 'uptime') {
      val = Math.floor(val / 1);
      second = val % 60;
      minute = (Math.floor(val / 60)) % 60;
      hour = (Math.floor(val / (60 * 60))) % 24;
      day = Math.floor(val / (60 * 60 * 24));
      return `${day > 1 ? day + ' days, ' : day > 0 ? '1 day, ' : ''}${padding(hour, "0", 2)}:${padding(minute, "0", 2)}:${padding(second, "0", 2)}`;
    }
    if (type === 'loadavg') {
      return val.map(function(i) {
        return i.toFixed(1);
      }).join(', ');
    }
    return val.toString();
  }

  help(commandPrefix) {
    //console.log "add method to override this!"
    return ["check os info Usage:", `${commandPrefix} [all|hostname|type|platform|arch|release|uptime|loadavg]`];
  }

  hasPermission(sender, text, args, storage, textRouter, commandManager, fromBinding) {
    return true;
  }

};

module.exports = CommandOsInfo;
