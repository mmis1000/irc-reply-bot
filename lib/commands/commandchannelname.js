(function() {
  var CommandChannelName, Icommand, padding,
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

  CommandChannelName = (function(superClass) {
    extend(CommandChannelName, superClass);

    function CommandChannelName() {
      this.lastStartUp = Date.now();
    }

    CommandChannelName.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      if (args.length !== 1) {
        return false;
      }
      if (sender.target.match(/^#/)) {
        commandManager.send(sender, textRouter, sender.target);
      } else {
        commandManager.send(sender, textRouter, sender.sender);
      }
      return true;
    };

    CommandChannelName.prototype.help = function(commandPrefix) {
      return ["show the current channel name (or target of pm), Usage", "" + commandPrefix];
    };

    CommandChannelName.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return true;
    };

    return CommandChannelName;

  })(Icommand);

  module.exports = CommandChannelName;

}).call(this);
