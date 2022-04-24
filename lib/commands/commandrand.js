(function() {
  var CommandRand, Icommand, TraceRouter;

  Icommand = require('../icommand.js');

  TraceRouter = require('../router/tracerouter');

  CommandRand = class CommandRand extends Icommand {
    constructor(seperator = "|") {
      super();
      this.seperator = seperator;
    }

    handle(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      var all, chances, chosen, commands, done, i, j, k, len, trace;
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
//console.log "all = #{all}"
      for (j = k = 0, len = chances.length; k < len; j = ++k) {
        i = chances[j];
        //console.log all, i, j
        if ((i / all) > Math.random()) {
          chosen = j;
          break;
        } else {
          all -= i;
        }
      }
      
      //console.log chosen
      if (!commands[chosen]) {
        return false;
      }
      done = textRouter.async(`[ running selected random command: ${commands[chosen]} ]`);
      trace = new TraceRouter(textRouter);
      commandManager.handleText(sender, commands[chosen], trace, {
        fromBinding: fromBinding,
        isCommand: true
      });
      trace.forceCheck();
      trace.promise.then(function() {
        return done();
      }).catch(function() {
        return done();
      });
      
      //textRouter.output message, sender.channel
      return true;
    }

    help(commandPrefix) {
      return ["make this bot exec random command, Usage:", `${commandPrefix} chance1,chance2,chance3 command1 ${this.seperator} command2 ${this.seperator} command3`, `for example: ${commandPrefix} 1,2.5,3 say 1 ${this.seperator} say 2 ${this.seperator} say 3`];
    }

    hasPermission(sender, text, args, storage, textRouter, commandManager) {
      return true;
    }

  };

  module.exports = CommandRand;

}).call(this);
