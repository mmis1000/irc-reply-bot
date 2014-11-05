(function() {
  var CommandPass, Icommand,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('./icommand.js');

  CommandPass = (function(_super) {
    __extends(CommandPass, _super);

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
