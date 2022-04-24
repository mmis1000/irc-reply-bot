(function() {
  var CommandBotName, Icommand;

  Icommand = require('../icommand.js');

  CommandBotName = class CommandBotName extends Icommand {
    constructor() {
      super();
    }

    handle(sender, text, args, storage, textRouter, commandManager) {
      if (args.length > 1) {
        return false;
      }
      commandManager.send(sender, textRouter, commandManager.toDisplayName(textRouter.getSelfName()));
      return true;
    }

    help(commandPrefix) {
      //console.log "add method to override this!"
      return ["make this bot to say his name, Usage:", `${commandPrefix}`];
    }

    hasPermission(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    }

  };

  module.exports = CommandBotName;

}).call(this);
