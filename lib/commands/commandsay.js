(function() {
  var CommandSay, Icommand,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('../icommand.js');

  CommandSay = (function(_super) {
    __extends(CommandSay, _super);

    function CommandSay() {}

    CommandSay.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var message, success, target;
      if (args.length === 1 || (args.length === 2 && args[1] === "")) {
        return false;
      }
      message = args.slice(1).join(" ");
      message = message.replace(/\\n/g, "\n");
      if (sender.target.match(/^#+[a-z]+/i)) {
        commandManager.send(sender, textRouter, message);
      } else {
        if (args[1].match(/^#+[a-z]+/i)) {
          target = args[1];
          message = args.slice(2).join(" ");
          message = message.replace(/\\n/g, "\n");
          sender.target = target;
          commandManager.send(sender, textRouter, message);
        } else {
          if (!commandManager.isOp(sender.sender)) {
            commandManager.send(sender, textRouter, "Global broadcast is admin Only!");
          } else {
            commandManager.sendChannel(sender, textRouter, message);
          }
        }
      }
      success = true;
      return success;
    };

    CommandSay.prototype.help = function(commandPrefix) {
      return ["make this bot to say some message, Usage", "" + commandPrefix + " #channel_name messages..", "" + commandPrefix + " messages.."];
    };

    CommandSay.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return true;
    };

    return CommandSay;

  })(Icommand);

  module.exports = CommandSay;

}).call(this);
