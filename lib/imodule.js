(function() {
  var Icommand, Imodule,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Icommand = require('./icommand');

  Imodule = (function(superClass) {
    extend(Imodule, superClass);

    function Imodule() {
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

    Imodule.prototype.handleRaw = function(sender, type, content, textRouter, commandManager) {
      return false;
    };

    Imodule.prototype.registerCommand = function(name, command, alias) {
      return this.commandMap[name] = command;
    };

    Imodule.prototype.handle = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      var command, newArgs, success;
      command = args[1];
      if (!(this.commandMap[command] != null)) {
        return false;
      }
      newArgs = args.slice(1);
      success = this.commandMap[command].handle(sender, text, newArgs, storage, textRouter, commandManager, fromBinding);
      if (!success) {
        commandManager.send(sender, textRouter, this.getSubHelpMessage(commandManager.identifier + " " + args[0] + " " + args[1], command));
      }
      return true;
    };

    Imodule.prototype.help = function(commandPrefix) {
      var message;
      message = "sub commands: ";
      message += (Object.keys(this.commandMap)).join(', ');
      message += '\r\n';
      message += "run sub command with " + commandPrefix + " [subcommand]\nshow help message of sub commands by " + commandPrefix + " help [subcommand]\nshow current message with " + commandPrefix + " help";
      return message;
    };

    Imodule.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      var command, newArgs, result;
      command = args[1];
      if (!(this.commandMap[command] != null)) {
        return true;
      }
      newArgs = args.slice(1);
      result = this.commandMap[command].hasPermission(sender, text, newArgs, storage, textRouter, commandManager, fromBinding);
      return result;
    };

    Imodule.prototype.subCommandHelp = function(sender, text, args, storage, textRouter, commandManager) {
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
    };

    Imodule.prototype.getSubHelpMessage = function(prefix, command) {
      var temp;
      temp = this.commandMap[command].help(prefix);
      if (Array.isArray(temp)) {
        return temp.join('\r\n');
      } else {
        return temp;
      }
    };

    return Imodule;

  })(Icommand);

  module.exports = Imodule;

}).call(this);
