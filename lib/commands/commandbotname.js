(function() {
  var CommandBotName, Icommand,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Icommand = require('../icommand.js');

  CommandBotName = (function(superClass) {
    extend(CommandBotName, superClass);

    function CommandBotName() {}

    CommandBotName.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      if (args.length > 1) {
        return false;
      }
      commandManager.send(sender, textRouter, commandManager.toDisplayName(textRouter.getSelfName()));
      return true;
    };

    CommandBotName.prototype.help = function(commandPrefix) {
      return ["make this bot to say his name, Usage:", "" + commandPrefix];
    };

    CommandBotName.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    };

    return CommandBotName;

  })(Icommand);

  module.exports = CommandBotName;

}).call(this);
