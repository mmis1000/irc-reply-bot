(function() {
  var CommandReply, Icommand,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('../icommand.js');

  CommandReply = (function(_super) {
    __extends(CommandReply, _super);

    function CommandReply() {}

    CommandReply.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
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

    CommandReply.prototype.help = function(commandPrefix) {
      return ["A command to say hello to user, Usage", "" + commandPrefix];
    };

    CommandReply.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    };

    return CommandReply;

  })(Icommand);

  module.exports = CommandReply;

}).call(this);
