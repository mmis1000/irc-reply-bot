(function() {
  var CommandUpsideDown, Icommand,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('../icommand.js');

  CommandUpsideDown = (function(_super) {
    __extends(CommandUpsideDown, _super);

    function CommandUpsideDown() {}

    CommandUpsideDown.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var froms, map, message, tos;
      if (args.length === 1 || (args.length === 2 && args[1] === "")) {
        return false;
      }
      message = args.slice(1).join(" ");
      if (message.match(/^\s*$/g)) {
        return false;
      }
      froms = "abcdefghijklmopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZɐqɔpǝɟƃɥᴉɾʞlɯodbɹsʇnʌʍxʎz∀qƆpƎℲפHIſʞ˥WNOԀQɹS┴∩ΛMX⅄Z¯_><".split("");
      tos = "ɐqɔpǝɟƃɥᴉɾʞlɯodbɹsʇnʌʍxʎz∀qƆpƎℲפHIſʞ˥WNOԀQɹS┴∩ΛMX⅄ZabcdefghijklmopqrstuvwxyzAbCdEFGHIJkLMNOPQrSTUVWXYZ_¯<>".split("");
      map = froms.reduce(function(all, key, i) {
        all[key] = tos[i];
        return all;
      }, {});
      message = message.split('').map(function(ch) {
        return map[ch] || ch;
      }).reverse().join('');
      commandManager.send(sender, textRouter, message);
      return true;
    };

    CommandUpsideDown.prototype.help = function(commandPrefix) {
      return ["make this bot to say some message", "this command will send to you according to where you exec this command, Usage", "" + commandPrefix + " [-rj] messages..", "flags:", "r: raw string, no line break", "j: full js format string"];
    };

    CommandUpsideDown.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    };

    return CommandUpsideDown;

  })(Icommand);

  module.exports = CommandUpsideDown;

}).call(this);
