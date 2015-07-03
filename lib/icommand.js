(function() {
  var Icommand;

  Icommand = (function() {
    function Icommand() {}

    Icommand.prototype.handle = function(senter, text, args, storage, textRouter, commandManager, fromBinding) {
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

    Icommand.prototype.__createAsInstance__ = function(obj) {
      var instance, key, value;
      instance = new Icommand;
      for (key in obj) {
        value = obj[key];
        instance[key] = value;
      }
      return instance;
    };

    return Icommand;

  })();

  module.exports = Icommand;

}).call(this);
