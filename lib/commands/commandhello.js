(function() {
  var CommandHello, Icommand,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('../icommand.js');

  CommandHello = (function(_super) {
    __extends(CommandHello, _super);

    function CommandHello() {}

    CommandHello.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var identufier, message;
      if (args.length !== 1) {
        return false;
      }
      if (textRouter.getIdentifier) {
        identufier = textRouter.getIdentifier();
      } else {
        identufier = commandManager.identifier;
      }
      message = "Hello " + sender + ", \nI am " + (textRouter.getSelfName()) + ".\nYou could use " + identufier + "help to get all commands and usage of this bot.";
      commandManager.send(sender, textRouter, message);
      return true;
    };

    CommandHello.prototype.help = function(commandPrefix) {
      return ["A command to say hello to user, Usage", "" + commandPrefix];
    };

    CommandHello.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    };

    return CommandHello;

  })(Icommand);

  module.exports = CommandHello;

}).call(this);
