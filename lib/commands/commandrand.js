(function() {
  var CommandRand, Icommand,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('../icommand.js');

  CommandRand = (function(_super) {
    __extends(CommandRand, _super);

    function CommandRand(seperator) {
      this.seperator = seperator != null ? seperator : "|";
    }

    CommandRand.prototype.handle = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      var all, chances, chosen, commands, i, j, _i, _len;
      if (args.length === 1 || (args.length === 2 && args[1] === "")) {
        return false;
      }
      chances = args[1].split(",");
      chances = chances.map(function(i) {
        return parseFloat(i);
      });
      commands = (args.slice(2).join(" ")).split(this.seperator);
      commands = commands.map(function(i) {
        return i.replace(/(?:^\s+|\s+$)/g, '');
      });
      if (chances.length !== commands.length) {
        return false;
      }
      if ((chances.filter(function(i) {
        return i < 0 || isNaN(i);
      })).length > 0) {
        return false;
      }
      chosen = -1;
      all = chances.reduce((function(i, j) {
        return i + j;
      }), 0);
      for (j = _i = 0, _len = chances.length; _i < _len; j = ++_i) {
        i = chances[j];
        if ((i / all) > Math.random()) {
          chosen = j;
          break;
        } else {
          all -= i;
        }
      }
      if (!commands[chosen]) {
        return false;
      }
      commandManager.handleText(sender, commands[chosen], textRouter, true, fromBinding);
      return true;
    };

    CommandRand.prototype.help = function(commandPrefix) {
      return ["make this bot exec random command, Usage:", "" + commandPrefix + " chance1,chance2,chance3 command1 " + this.seperator + " command2 " + this.seperator + " command3", "for example: " + commandPrefix + " 1,2.5,3 say 1 " + this.seperator + " say 2 " + this.seperator + " say 3"];
    };

    CommandRand.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return true;
    };

    return CommandRand;

  })(Icommand);

  module.exports = CommandRand;

}).call(this);
