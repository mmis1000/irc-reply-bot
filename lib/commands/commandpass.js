(function() {
  var CommandPass, Icommand,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Icommand = require('../icommand.js');

  CommandPass = (function(superClass) {
    extend(CommandPass, superClass);

    function CommandPass() {}

    CommandPass.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      return args.length === 1;
    };

    CommandPass.prototype.help = function(commandPrefix) {
      return ["This command does nothing!, Usage", "" + commandPrefix];
    };

    CommandPass.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return true;
    };

    return CommandPass;

  })(Icommand);

  module.exports = CommandPass;

}).call(this);
