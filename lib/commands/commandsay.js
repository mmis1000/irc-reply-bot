(function() {
  var CommandSay, Icommand,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Icommand = require('../icommand.js');

  CommandSay = (function(_super) {
    __extends(CommandSay, _super);

    function CommandSay() {}

    CommandSay.prototype.handle = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      var broadcast, e, message, success, target;
      if (args.length === 1 || (args.length === 2 && args[1] === "")) {
        return false;
      }
      broadcast = true;
      target = null;
      if (sender.target.match(/^#+[a-z]+/i)) {
        broadcast = false;
      } else if (args[1].match(/^#+[a-z]+/i)) {
        broadcast = false;
        target = args[1];
        sender.target = args[1];
        args = [args[0]].concat(__slice.call(args.slice(2)));
      } else if (fromBinding === true) {
        broadcast = false;
      }
      if (args[1] === '-r') {
        message = args.slice(2).join(" ");
      } else if (args[1] === '-j') {
        message = args.slice(2).join(" ");
        message = '"' + message + '"';
        try {
          message = JSON.parse(message);
          message = message.toString();
        } catch (_error) {
          e = _error;
          console.log(e);
          message = args.slice(2).join(" ");
        }
      } else {
        message = args.slice(1).join(" ");
        message = message.replace(/\\n/g, "\n");
      }
      if (sender.target.match(/^#+[a-z]+/i)) {
        commandManager.send(sender, textRouter, message);
      } else {
        if (!broadcast) {
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
      return ["make this bot to say some message, Usage", "" + commandPrefix + " #channel_name [-rj] messages..", "" + commandPrefix + " [-rj] messages..", "flags:", "r: raw string, no line break", "j: full js format string"];
    };

    CommandSay.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return true;
    };

    return CommandSay;

  })(Icommand);

  module.exports = CommandSay;

}).call(this);
