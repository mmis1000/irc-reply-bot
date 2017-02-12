(function() {
  var CommandEchoReply, Icommand,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Icommand = require('../icommand.js');

  CommandEchoReply = (function(superClass) {
    extend(CommandEchoReply, superClass);

    function CommandEchoReply() {}

    CommandEchoReply.prototype.handle = function(sender, text, args, storage, textRouter, commandManager, formBinding, originalMessage) {
      var target;
      if (args.length > 2) {
        return false;
      }
      if (originalMessage.replyTo) {
        if (args.length === 2) {
          if (!args[1].match(/^#.+/i)) {
            return false;
          }
          target = args[1];
          sender.target = target;
        }
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
