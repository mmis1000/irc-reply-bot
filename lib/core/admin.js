var Admin, Imodule;

Imodule = require('../imodule');

Admin = class Admin extends Imodule {
  constructor(bot) {
    var exitCommand, reloadCommand;
    super();
    this.bot = bot;
    this.name = 'admin';
    exitCommand = {
      handle: (sender, text, args, storage, textRouter, commandManager) => {
        return this._exit(sender, text, args, storage, textRouter, commandManager);
      },
      help: function(commandPrefix) {
        return ["command exit the bot itself : ", `${commandPrefix}`];
      },
      hasPermission: (sender, text, args, storage, textRouter, commandManager, fromBinding) => {
        if (fromBinding) {
          return false;
        }
        return commandManager.isOp(sender.sender);
      },
      handleRaw: function(sender, type, content) {
        return false;
      }
    };
    this.registerCommand('exit', exitCommand, []);
    reloadCommand = {
      handle: (sender, text, args, storage, textRouter, commandManager) => {
        return this._reload(sender, text, args, storage, textRouter, commandManager);
      },
      help: function(commandPrefix) {
        return ["command reload this bot : ", `${commandPrefix}`];
      },
      hasPermission: (sender, text, args, storage, textRouter, commandManager, fromBinding) => {
        if (fromBinding) {
          return false;
        }
        return commandManager.isOp(sender.sender);
      },
      handleRaw: function(sender, type, content) {
        return false;
      }
    };
    this.registerCommand('reload', reloadCommand, []);
  }

  _exit(sender, text, args, storage, textRouter, commandManager) {
    commandManager.send(sender, textRouter, 'exiting the bot...');
    this.bot.exit();
    return true;
  }

  _reload(sender, text, args, storage, textRouter, commandManager) {
    if (!this.bot.reload()) {
      commandManager.send(sender, textRouter, 'it seems the bot can\'t reload itself');
    } else {
      commandManager.send(sender, textRouter, 'reloading the bot...');
    }
    return true;
  }

};

module.exports = Admin;
