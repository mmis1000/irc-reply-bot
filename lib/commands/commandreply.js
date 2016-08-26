(function() {
  var CommandReply, Icommand,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Icommand = require('../icommand.js');

  CommandReply = (function(superClass) {
    extend(CommandReply, superClass);

    function CommandReply() {}

    CommandReply.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var e, error, message;
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
      commandManager.send(sender, textRouter, message);
      return true;
    };

    CommandReply.prototype.help = function(commandPrefix) {
      return ["make this bot to say some message", "this command will send to you according to where you exec this command, Usage", commandPrefix + " [-rj] messages..", "flags:", "r: raw string, no line break", "j: full js format string"];
    };

    CommandReply.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    };

    return CommandReply;

  })(Icommand);

  module.exports = CommandReply;

}).call(this);
