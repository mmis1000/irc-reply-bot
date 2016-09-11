(function() {
  var CommandEchoReply, Icommand,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Icommand = require('../icommand.js');

  CommandEchoReply = (function(superClass) {
    extend(CommandEchoReply, superClass);

    function CommandEchoReply() {}

    CommandEchoReply.prototype.handle = function(sender, text, args, storage, textRouter, commandManager, formBinding, originalMessage) {
      if (args.length !== 1) {
        return false;
      }
      if (originalMessage.replyTo) {
        commandManager.sendMessage(sender, textRouter, originalMessage.replyTo.message);
      } else {
        commandManager.send(sender, textRouter, "you didn't reply to a message yet");
      }
      return true;
    };

    CommandEchoReply.prototype.help = function(commandPrefix) {
      return ["reply the message you reply to", "this command will send to you according to where you exec this command, Usage", commandPrefix + " [-rj] messages.."];
    };

    CommandEchoReply.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    };

    return CommandEchoReply;

  })(Icommand);

  module.exports = CommandEchoReply;

}).call(this);
