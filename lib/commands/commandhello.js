var CommandHello, Icommand;

Icommand = require('../icommand.js');

CommandHello = class CommandHello extends Icommand {
  constructor() {
    super();
  }

  handle(sender, text, args, storage, textRouter, commandManager) {
    var identufier, message;
    if (args.length !== 1) {
      return false;
    }
    if (textRouter.getIdentifier) {
      identufier = textRouter.getIdentifier();
    } else {
      identufier = commandManager.identifier;
    }
    message = `Hello ${sender}, 
I am ${textRouter.getSelfName()}.
You could use ${identufier}help to get all commands and usage of this bot.`;
    commandManager.send(sender, textRouter, message);
    return true;
  }

  help(commandPrefix) {
    //console.log "add method to override this!"
    return ["A command to say hello to user, Usage", `${commandPrefix}`];
  }

  hasPermission(sender, text, args, storage, textRouter, commandManager, fromBinding) {
    return true;
  }

};

module.exports = CommandHello;
