(function() {
  var Cpu, addStat, computeLoads, getLoads, intervalMS, loadToString, loads, os, stats, style;

  os = require("os");

  intervalMS = 30 * 1000;

  stats = [];

  loads = null;

  style = {
    red: "\u000304",
    yellow: "\u000308",
    green: "\u000309",
    dark_red: "\u000305",
    dark_green: "\u000303",
    orange: "\u000307",
    bold: "\u0002",
    reset: "\u000f"
  };

  addStat = function() {
    stats.unshift(os.cpus());
    return stats = stats.slice(0, 2);
  };

  computeLoads = function() {
    var all, core, e, error, field, i, index, len, ref, ref1, results, used, value;
    loads = [];
    ref = stats[0];
    results = [];
    for (index = i = 0, len = ref.length; i < len; index = ++i) {
      core = ref[index];
      all = 0;
      used = 0;
      ref1 = core.times;
      for (field in ref1) {
        value = ref1[field];
        all += value;
        if (field !== 'idle') {
          used += value;
        }
        all -= stats[1][index].times[field];
        if (field !== 'idle') {
          used -= stats[1][index].times[field];
        }
      }
      try {
        results.push(loads.push(used / all));
      } catch (error) {
        e = error;
        results.push(loads.push(-1));
      }
    }
    return results;
  };

  getLoads = function() {
    if (loads === null) {
      if (stats.length === 1) {
        addStat();
      }
    }
    computeLoads();
    return loads;
  };

  loadToString = function(num) {
    var str;
    str = style.reset;
    if (num < 0.3) {
      str += style.dark_green;
    } else if (num < 0.7) {
      str += style.orange;
    } else {
      str += style.red;
    }
    str += (num * 100).toFixed(1);
    return str += style.reset;
  };

  addStat();

  setInterval(addStat, intervalMS);

  Cpu = (function() {
    function Cpu() {
      this.symbols = ['cpu'];
    }

    Cpu.prototype.handle = function(sender, content, args, manager, router) {
      var current, i, index, item, len, output;
      if (args.length === 0) {
        args.push('all');
      }
      if (args.length === 1) {
        args.push(-1);
      }
      output = "";
      current = stats[0];
      loads = getLoads();
      if (args[1] === -1) {
        for (index = i = 0, len = current.length; i < len; index = ++i) {
          item = current[index];
          output += style.bold + "#" + index + ":" + style.reset + " ";
          if (args[0] === 'all') {
            output += "Load " + (loadToString(loads[index])) + "% ";
            output += "Clock " + item.speed + "mhz ";
            output += "Model " + item.model + " \n";
          }
          if (args[0] === 'load') {
            output += (loadToString(loads[index])) + "%, ";
          }
          if (args[0] === 'clock') {
            output += item.speed + "Mhz, ";
          }
          if (args[0] === 'model') {
            output += item.model + " \n";
          }
        }
      } else {
        item = current[args[1]];
        if (!item) {
          return "core " + args[1] + " does not exist";
        }
        if (args[0] === 'all') {
          output += "Load " + (loadToString(loads[index])) + "% ";
          output += "Clock " + item.speed + "mhz ";
          output += "Model " + item.model;
        }
        if (args[0] === 'load') {
          output += (loadToString(loads[index])) + "%, ";
        }
        if (args[0] === 'clock') {
          output += item.speed + "Mhz, ";
        }
        if (args[0] === 'model') {
          output += item.model + "n";
        }
      }
      return output;
    };

    return Cpu;

  })();

  module.exports = new Cpu;

}).call(this);
