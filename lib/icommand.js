(function() {
  var Icommand;

  Icommand = (function() {
    function Icommand() {}

    Icommand.prototype.handle = function(senter, text, args, storage, textRouter, commandManager, fromBinding, originalMessage) {
      var success;
      textRouter.output("add method to compelete this!");
      success = false;
      return success;
    };

    Icommand.prototype.help = function(commandPrefix) {
      console.log("add method to override this!");
      return [];
    };

    Icommand.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    };

    Icommand.prototype.handleRaw = function(sender, type, content, textRouter, commandManager, event) {
      return false;
    };

    Icommand.prototype.isBindSymbol = function() {
      return false;
    };

    Icommand.__createAsInstance__ = function(obj) {
      var instance, key, value;
      instance = new Icommand;
      for (key in instance) {
        value = instance[key];
        if (obj[key] == null) {
          obj[key] = instance[key];
        }
      }
      return obj;
    };

    return Icommand;

  })();

  module.exports = Icommand;

}).call(this);
