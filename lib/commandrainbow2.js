(function() {
  var CommandSay, Icommand, colors,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('./icommand.js');

  colors = ["\u000304", "\u000307", "\u000308", "\u000309", "\u000312", "\u000302", "\u000306"];

  CommandSay = (function(_super) {
    __extends(CommandSay, _super);

    function CommandSay() {}

    CommandSay.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var i, message, success, temp;
      if (args.length === 1 || (args.length === 2 && args[1] === "")) {
        return false;
      }
      message = args.slice(1).join(" ");
      message = message.replace(/\\n/g, "\n");
      temp = message.split(/(?:\r\n|\n)/g);
      i = temp.length - 1;
      while (i >= 0) {
        temp[i] = this._colorText(temp[i]);
        i--;
      }
      message = temp.join("\n");
      textRouter.output(message, sender.channel);
      success = true;
      return success;
    };

    CommandSay.prototype.help = function(commandPrefix) {
      return ["make this bot to say some message, Usage", "" + commandPrefix + " messages.."];
    };

    CommandSay.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return true;
    };

    CommandSay.prototype._colorText = function(text) {
      var i, pos, sep, temp;
      temp = text.split("");
      sep = temp.length / colors.length;
      i = temp.length - 1;
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
