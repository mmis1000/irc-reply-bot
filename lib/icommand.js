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
    var allEntry, currentProto, key, ref, value, x;
    allEntry = new Map();
    currentProto = Icommand.prototype;
    while (currentProto !== null) {
      ref = Reflect.ownKeys(currentProto);
      for (key of ref) {
        if (!allEntry.has(key) && 'function' === typeof currentProto[key]) {
          allEntry.set(key, currentProto[key]);
        }
      }
      currentProto = currentProto.__proto__;
    }
    for (x of allEntry) {
      [key, value] = x;
      if (obj[key] == null) {
        obj[key] = value;
      }
    }
    return obj;
  }

};

module.exports = Icommand;
