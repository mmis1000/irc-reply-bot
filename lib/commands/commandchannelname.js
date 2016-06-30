(function() {
  var CommandChannelName, Icommand, padding,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('../icommand.js');

  padding = function(str, fill, len) {
    str = str.toString();
    while (str.length < len) {
      str = fill + str;
    }
    return str;
  };

  CommandChannelName = (function(_super) {
    __extends(CommandChannelName, _super);

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
