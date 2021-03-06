(function() {
  var CommandMath, Icommand, math,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Icommand = require('../icommand.js');

  math = require('mathjs');

  CommandMath = (function(superClass) {
    extend(CommandMath, superClass);

    function CommandMath() {}

    CommandMath.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var err, error, message, result;
      if (args.length === 1 || (args.length === 2 && args[1] === "")) {
        return false;
      }
      message = args.slice(1).join(' ');
      if (message.match(/^\s*$/g)) {
        return false;
      }
      try {
        result = math["eval"](message);
      } catch (error) {
        err = error;
        commandManager.send(sender, textRouter, err.message || err.toString());
      }
      if (result != null) {
        commandManager.send(sender, textRouter, "result of " + message + " is  " + result);
      }
      return true;
    };

    CommandMath.prototype.help = function(commandPrefix) {
      return ["this command will do some math calculation with [mathjs](http://mathjs.org/)", "and this command will send to you according to where you exec this command, Usage", commandPrefix + " {expression}"];
    };

    CommandMath.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    };

    return CommandMath;

  })(Icommand);

  module.exports = CommandMath;

}).call(this);
