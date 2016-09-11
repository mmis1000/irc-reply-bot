(function() {
  var CommandTime, Icommand,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Icommand = require('../icommand.js');

  CommandTime = (function(superClass) {
    extend(CommandTime, superClass);

    function CommandTime() {}

    CommandTime.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      if (args.length > 1) {
        return false;
      }
      commandManager.send(sender, textRouter, (new Date).toString());
      return true;
    };

    CommandTime.prototype.help = function(commandPrefix) {
      return ["Show current Time, Usage:", "" + commandPrefix];
    };

    CommandTime.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    };

    return CommandTime;

  })(Icommand);

  module.exports = CommandTime;

}).call(this);
