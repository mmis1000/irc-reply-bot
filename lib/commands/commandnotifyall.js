(function() {
  var CommandNotifyAll, Icommand;

  Icommand = require('../icommand.js');

  CommandNotifyAll = class CommandNotifyAll extends Icommand {
    constructor() {
      super();
      this.cd_min = 10;
      this.lockUntil = Date.now();
    }

    handle(sender, text, args, storage, textRouter, commandManager) {
      var channel;
      if (args.length !== 1) {
        return false;
      }
      if (Date.now() > this.lockUntil || commandManager.isOp(sender.sender)) {
        channel = sender.channel;
        textRouter.names(channel, (names) => {
          return textRouter.output(`Hello All! ${names.join(' ')}`, sender.channel);
        });
        if (!commandManager.isOp(sender.sender)) {
          this.lockUntil = Date.now() + this.cd_min * 60 * 1000;
        }
      } else {
        textRouter.output(`This command is temporarily locked until ${new Date(this.lockUntil)}`, sender.channel);
      }
      return true;
    }

    help(commandPrefix) {
      return ["notify everyone on this channel, Usage", `${commandPrefix}`];
    }

    hasPermission(sender, text, args, storage, textRouter, commandManager) {
      return commandManager.isOp(sender.sender);
    }

  };

  module.exports = CommandNotifyAll;

}).call(this);
