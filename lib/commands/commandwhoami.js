var CommandWhoami, Icommand;

Icommand = require('../icommand.js');

CommandWhoami = class CommandWhoami extends Icommand {
  constructor() {
    super();
  }

  handle(sender, text, args, storage, textRouter, commandManager) {
    if (args.length > 1) {
      return false;
    }
    commandManager.send(sender, textRouter, commandManager.toDisplayName(sender.sender));
    return true;
  }

  help(commandPrefix) {
    //console.log "add method to override this!"
    return ["make this bot to say your name, Usage", `${commandPrefix}`];
  }

  hasPermission(sender, text, args, storage, textRouter, commandManager, fromBinding) {
    return true;
  }

};

module.exports = CommandWhoami;
