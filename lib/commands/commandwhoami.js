(function() {
  var CommandWhoami, Icommand,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Icommand = require('../icommand.js');

  CommandWhoami = (function(superClass) {
    extend(CommandWhoami, superClass);

    function CommandWhoami() {}

    CommandWhoami.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      if (args.length > 1) {
        return false;
      }
      commandManager.send(sender, textRouter, commandManager.toDisplayName(sender.sender));
      return true;
    };

    CommandWhoami.prototype.help = function(commandPrefix) {
      return ["make this bot to say your name, Usage", "" + commandPrefix];
    };

    CommandWhoami.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    };

    return CommandWhoami;

  })(Icommand);

  module.exports = CommandWhoami;

}).call(this);
