(function() {
  var CommandPy, Icommand, request,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('../icommand.js');

  request = require('request');

  CommandPy = (function(_super) {
    __extends(CommandPy, _super);

    function CommandPy() {}

    CommandPy.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var done, message, options, success;
      if (args.length === 1 || (args.length === 2 && args[1] === "")) {
        return false;
      }
      message = args.slice(1).join(" ");
      message = message.replace(/\\n/g, "\n");
      done = textRouter.async();
      options = {
        timeout: 10000,
        uri: "http://tumbolia.appspot.com/py/" + (encodeURIComponent(message))
      };
      request(options, function(error, res, body) {
        if (error) {
          commandManager.send(sender, textRouter, 'py: ' + error.toString());
        } else {
          commandManager.send(sender, textRouter, 'py: ' + (body.slice(0, 300)));
        }
        return done();
      });
      success = true;
      return success;
    };

    CommandPy.prototype.help = function(commandPrefix) {
      return ["exec python command and return result", "this command will send to you according to where you exec this command, Usage", "" + commandPrefix + " comnnands.."];
    };

    CommandPy.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return true;
    };

    return CommandPy;

  })(Icommand);

  module.exports = CommandPy;

}).call(this);
