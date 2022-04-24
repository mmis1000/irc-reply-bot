(function() {
  var Icommand;

  Icommand = class Icommand {
    constructor() {}

    handle(senter, text, args, storage, textRouter, commandManager, fromBinding, originalMessage) {
      var success;
      textRouter.output("add method to compelete this!");
      success = false;
      return success;
    }

    help(commandPrefix) {
      console.log("add method to override this!");
      return [];
    }

    hasPermission(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    }

    handleRaw(sender, type, content, textRouter, commandManager, event) {
      return false;
    }

    isBindSymbol() {
      return false;
    }

    static __createAsInstance__(obj) {
      var instance, key, value;
      instance = new Icommand();
      for (key in instance) {
        value = instance[key];
        if (obj[key] == null) {
          obj[key] = instance[key];
        }
      }
      return obj;
    }

  };

  module.exports = Icommand;

}).call(this);
