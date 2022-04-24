(function() {
  var Icommand, Imodule;

  Icommand = require('./icommand');

  Imodule = class Imodule extends Icommand {
    constructor() {
      super();
      this.name = null;
      this.commandMap = {};
      this.registerCommand('help', {
        help: this.help.bind(this),
        handle: this.subCommandHelp.bind(this),
        hasPermission: (function() {
          return true;
        }),
        handleRaw: (function() {
          return false;
        })
      });
    }

    handleRaw(sender, type, content, textRouter, commandManager) {
      return false;
    }

    registerCommand(name, command, alias) {
      return this.commandMap[name] = command;
    }

    handle(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      var command, newArgs, success;
      command = args[1];
      if (!(this.commandMap[command] != null)) {
        return false;
      }
      newArgs = args.slice(1);
      success = this.commandMap[command].handle(sender, text, newArgs, storage, textRouter, commandManager, fromBinding);
      if (!success) {
        commandManager.send(sender, textRouter, this.getSubHelpMessage(`${commandManager.identifier} ${args[0]} ${args[1]}`, command));
      }
      return true;
    }

    help(commandPrefix) {
      var message;
      message = "sub commands: ";
      message += (Object.keys(this.commandMap)).join(', ');
      message += '\r\n';
      message += `run sub command with ${commandPrefix} [subcommand]
show help message of sub commands by ${commandPrefix} help [subcommand]
show current message with ${commandPrefix} help`;
      return message;
    }

    hasPermission(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      var command, newArgs, result;
      command = args[1];
      if (!(this.commandMap[command] != null)) {
        return true;
      }
      newArgs = args.slice(1);
      
      //console.log sender ,text, newArgs, storage, textRouter, commandManager, fromBinding
      result = this.commandMap[command].hasPermission(sender, text, newArgs, storage, textRouter, commandManager, fromBinding);
      //console.log result
      return result;
    }

    subCommandHelp(sender, text, args, storage, textRouter, commandManager) {
      var prefix, subcommand;
      subcommand = args[1];
      if (!this.commandMap[subcommand]) {
        return false;
      }
      prefix = commandManager.parseArgs(text);
      prefix = textRouter.getIdentifier() + prefix[0] + " " + prefix[2];
      text = this.getSubHelpMessage(prefix, subcommand);
      commandManager.send(sender, textRouter, text);
      return true;
    }

    getSubHelpMessage(prefix, command) {
      var temp;
      temp = this.commandMap[command].help(prefix);
      if (Array.isArray(temp)) {
        return temp.join('\r\n');
      } else {
        return temp;
      }
    }

  };

  module.exports = Imodule;

}).call(this);
