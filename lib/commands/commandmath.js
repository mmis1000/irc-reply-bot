(function() {
  var CommandMath, Icommand, math;

  Icommand = require('../icommand.js');

  math = require('mathjs');

  CommandMath = class CommandMath extends Icommand {
    constructor() {
      super();
    }

    handle(sender, text, args, storage, textRouter, commandManager) {
      var err, message, result;
      if (args.length === 1 || (args.length === 2 && args[1] === "")) {
        return false;
      }
      message = args.slice(1).join(' ');
      if (message.match(/^\s*$/g)) {
        return false;
      }
      try {
        result = math.eval(message);
      } catch (error) {
        err = error;
        commandManager.send(sender, textRouter, err.message || err.toString());
      }
      if (result != null) {
        commandManager.send(sender, textRouter, `result of ${message} is  ${result}`);
      }
      return true;
    }

    help(commandPrefix) {
      //console.log "add method to override this!"
      return ["this command will do some math calculation with [mathjs](http://mathjs.org/)", "and this command will send to you according to where you exec this command, Usage", `${commandPrefix} {expression}`];
    }

    hasPermission(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    }

  };

  module.exports = CommandMath;

}).call(this);
