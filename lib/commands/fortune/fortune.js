(function() {
  var CommandFortune, Icommand;

  Icommand = require('../../icommand.js');

  CommandFortune = class CommandFortune extends Icommand {
    constructor(list) {
      super();
      this.list = list;
    }

    handle(sender, text, args, storage, textRouter, commandManager) {
      var key, output, ref, selected, success, value;
      if (args.length !== 1) {
        return false;
      }
      selected = this.list[Math.floor(this.list.length * Math.random())];
      output = `${selected.id} ${selected.type} ${selected.poem}
解 : ${selected.explain}`;
      ref = selected.result;
      for (key in ref) {
        value = ref[key];
        output += "\n" + key + " : " + value;
      }
      commandManager.sendPv(sender, textRouter, output);
      success = true;
      return success;
    }

    help(commandPrefix) {
      console.log("add method to override this!");
      return ["get a fortune stick, Usage", `${commandPrefix}`];
    }

    hasPermission(sender, text, args, storage, textRouter, commandManager) {
      return true;
    }

  };

  module.exports = CommandFortune;

}).call(this);
