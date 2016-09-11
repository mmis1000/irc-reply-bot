(function() {
  var CommandNotifyAll, Icommand,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Icommand = require('../icommand.js');

  CommandNotifyAll = (function(superClass) {
    extend(CommandNotifyAll, superClass);

    function CommandNotifyAll() {
      this.cd_min = 10;
      this.lockUntil = Date.now();
    }

    CommandNotifyAll.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var channel;
      if (args.length !== 1) {
        return false;
      }
      if (Date.now() > this.lockUntil || commandManager.isOp(sender.sender)) {
        channel = sender.channel;
        textRouter.names(channel, (function(_this) {
          return function(names) {
            return textRouter.output("Hello All! " + (names.join(' ')), sender.channel);
          };
        })(this));
        if (!commandManager.isOp(sender.sender)) {
          this.lockUntil = Date.now() + this.cd_min * 60 * 1000;
        }
      } else {
        textRouter.output("This command is temporarily locked until " + (new Date(this.lockUntil)), sender.channel);
      }
      return true;
    };

    CommandNotifyAll.prototype.help = function(commandPrefix) {
      return ["notify everyone on this channel, Usage", "" + commandPrefix];
    };

    CommandNotifyAll.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return commandManager.isOp(sender.sender);
    };

    return CommandNotifyAll;

  })(Icommand);

  module.exports = CommandNotifyAll;

}).call(this);
