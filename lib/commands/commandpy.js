(function() {
  var CommandPy, Icommand, request;

  Icommand = require('../icommand.js');

  request = require('request');

  CommandPy = class CommandPy extends Icommand {
    constructor() {
      super();
    }

    handle(sender, text, args, storage, textRouter, commandManager) {
      var done, message, options, success;
      if (args.length === 1 || (args.length === 2 && args[1] === "")) {
        return false;
      }
      message = args.slice(1).join(" ");
      message = message.replace(/\\n/g, "\n");
      done = textRouter.async();
      options = {
        timeout: 10000,
        uri: `http://tumbolia.appspot.com/py/${encodeURIComponent(message)}`
      };
      request(options, function(error, res, body) {
        if (error) {
          commandManager.send(sender, textRouter, 'py: ' + error.toString());
        } else {
          commandManager.send(sender, textRouter, 'py: ' + (body.slice(0, 300)));
        }
        return done();
      });
      
      //commandManager.send sender, textRouter, message
      success = true;
      return success;
    }

    help(commandPrefix) {
      //console.log "add method to override this!"
      return ["exec python command and return result", "this command will send to you according to where you exec this command, Usage", `${commandPrefix} comnnands..`];
    }

    hasPermission(sender, text, args, storage, textRouter, commandManager) {
      return true;
    }

  };

  module.exports = CommandPy;

}).call(this);
