(function() {
  var CommandSay, Icommand, colors,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Icommand = require('../icommand.js');

  colors = ["\u000304", "\u000307", "\u000308", "\u000309", "\u000312", "\u000302", "\u000306"];

  CommandSay = (function(superClass) {
    extend(CommandSay, superClass);

    function CommandSay() {}

    CommandSay.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var e, error, i, message, success, temp;
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
      temp = message.split(/(?:\r\n|\n)/g);
      i = temp.length - 1;
      while (i >= 0) {
        temp[i] = this._colorText(temp[i]);
        i--;
      }
      message = temp.join("\n");
      commandManager.send(sender, textRouter, message);
      success = true;
      return success;
    };

    CommandSay.prototype.help = function(commandPrefix) {
      return ["make this bot to say some message, Usage", commandPrefix + " [-rj] messages..", "flags:", "r: raw string, no line break", "j: full js format string"];
    };

    CommandSay.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return true;
    };

    CommandSay.prototype._colorText = function(text) {
      var i, pos, sep, temp;
      temp = text.split("");
      sep = temp.length / colors.length;
      i = colors.length - 1;
      while (i >= 0) {
        pos = Math.floor(i * sep);
        temp.splice(pos, 0, colors[i]);
        i--;
      }
      return temp.join("");
    };

    return CommandSay;

  })(Icommand);

  module.exports = CommandSay;

}).call(this);
