(function() {
  var CommandFortune, Icommand,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Icommand = require('../../icommand.js');

  CommandFortune = (function(superClass) {
    extend(CommandFortune, superClass);

    function CommandFortune(list) {
      this.list = list;
    }

    CommandFortune.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var key, output, ref, selected, success, value;
      if (args.length !== 1) {
        return false;
      }
      selected = this.list[Math.floor(this.list.length * Math.random())];
      output = selected.id + " " + selected.type + " " + selected.poem + "\n解 : " + selected.explain;
      ref = selected.result;
      for (key in ref) {
        value = ref[key];
        output += "\n" + key + " : " + value;
      }
      commandManager.sendPv(sender, textRouter, output);
      success = true;
      return success;
    };

    CommandFortune.prototype.help = function(commandPrefix) {
      console.log("add method to override this!");
      return ["get a fortune stick, Usage", "" + commandPrefix];
    };

    CommandFortune.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return true;
    };

    return CommandFortune;

  })(Icommand);

  module.exports = CommandFortune;

}).call(this);
