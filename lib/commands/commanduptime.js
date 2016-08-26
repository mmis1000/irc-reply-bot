(function() {
  var CommandSay, Icommand, padding,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Icommand = require('../icommand.js');

  padding = function(str, fill, len) {
    str = str.toString();
    while (str.length < len) {
      str = fill + str;
    }
    return str;
  };

  CommandSay = (function(superClass) {
    extend(CommandSay, superClass);

    function CommandSay() {
      this.lastStartUp = Date.now();
    }

    CommandSay.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var current, day, hour, minute, second, space;
      if (args.length !== 1) {
        return false;
      }
      current = Date.now();
      space = Math.floor((current - this.lastStartUp) / 1000);
      second = space % 60;
      minute = (Math.floor(space / 60)) % 60;
      hour = (Math.floor(space / (60 * 60))) % 24;
      day = Math.floor(space / (60 * 60 * 24));
      commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "I have been here for " + (day > 1 ? day + ' days, ' : day > 0 ? '1 day, ' : '') + (padding(hour, "0", 2)) + ":" + (padding(minute, "0", 2)) + ":" + (padding(second, "0", 2)) + " .");
      return true;
    };

    CommandSay.prototype.help = function(commandPrefix) {
      return ["make this bot say how long did it stay here, Usage", "" + commandPrefix];
    };

    CommandSay.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return true;
    };

    return CommandSay;

  })(Icommand);

  module.exports = CommandSay;

}).call(this);
