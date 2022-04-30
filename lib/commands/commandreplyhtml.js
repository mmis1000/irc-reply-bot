var CommandReply, Icommand, Message;

Icommand = require('../icommand.js');

Message = require('../models/message');

CommandReply = class CommandReply extends Icommand {
  constructor() {
    super();
  }

  handle(sender, text, args, storage, textRouter, commandManager) {
    var e, message, messageModel;
    if (args.length === 1 || (args.length === 2 && args[1] === "")) {
      return false;
    }
    if (args[1] === '-r') {
      message = args.slice(2).join(" ");
    } else if (args[1] === '-j') {
      message = args.slice(2).join(" ");
      message = '"' + message + '"';
      try {
        message = JSON.parse(message);
        message = message.toString();
      } catch (error) {
        e = error;
        console.log(e);
        message = args.slice(2).join(" ");
      }
    } else {
      message = args.slice(1).join(" ");
      message = message.replace(/\\n/g, "\n");
    }
    if (message.match(/^\s*$/g)) {
      return false;
    }
    messageModel = new Message(message, null, true);
    messageModel.textFormat = 'html';
    commandManager.sendMessage(sender, textRouter, messageModel);
    return true;
  }

  help(commandPrefix) {
    //console.log "add method to override this!"
    return ["make this bot to say some message", "this command will send to you according to where you exec this command, Usage", `${commandPrefix} [-rj] messages..`, "flags:", "r: raw string, no line break", "j: full js format string"];
  }

  hasPermission(sender, text, args, storage, textRouter, commandManager, fromBinding) {
    return true;
  }

};

module.exports = CommandReply;
