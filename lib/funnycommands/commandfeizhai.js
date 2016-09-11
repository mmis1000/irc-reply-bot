(function() {
  var CommandFeiZhai, Icommand,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Icommand = require('../icommand.js');

  CommandFeiZhai = (function(superClass) {
    extend(CommandFeiZhai, superClass);

    function CommandFeiZhai() {}

    CommandFeiZhai.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var day, height, value, weight;
      if (args.length !== 4) {
        return false;
      }
      weight = parseFloat(args[1], 10);
      height = parseFloat(args[2], 10);
      day = parseFloat(args[3], 10);
      if (isNaN(weight)) {
        return false;
      }
      if (isNaN(height)) {
        return false;
      }
      if (isNaN(day)) {
        return false;
      }
      value = (1 + Math.pow(2, (weight / Math.pow(height, 2) - 20) / 2)) * day;
      if (value === Infinity) {
        value = "Infinity (或是你老媽)";
      }
      commandManager.send(sender, textRouter, "the fei zhai value of given input is " + value);
      return true;
    };

    CommandFeiZhai.prototype.help = function(commandPrefix) {
      return ["caulcalate fei zhai tai you are", "this command will send to you according to where you exec this command, Usage", commandPrefix + " <weight in kg> <height in meter> <days you stay home per week>"];
    };

    CommandFeiZhai.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    };

    return CommandFeiZhai;

  })(Icommand);

  module.exports = CommandFeiZhai;

}).call(this);
