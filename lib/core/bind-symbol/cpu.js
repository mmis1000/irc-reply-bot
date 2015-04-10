(function() {
  var Cpu, addStat, computeLoads, getLoads, intervalMS, loads, os, stats;

  os = require("os");

  intervalMS = 30 * 1000;

  stats = [];

  loads = null;

  addStat = function() {
    stats.unshift(os.cpus());
    return stats = stats.slice(0, 2);
  };

  computeLoads = function() {
    var all, core, e, field, index, used, value, _i, _len, _ref, _ref1, _results;
    loads = [];
    _ref = stats[0];
    _results = [];
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      core = _ref[index];
      all = 0;
      used = 0;
      _ref1 = core.times;
      for (field in _ref1) {
        value = _ref1[field];
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
        _results.push(loads.push(used / all));
      } catch (_error) {
        e = _error;
        _results.push(loads.push(-1));
      }
    }
    return _results;
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

  addStat();

  setInterval(addStat, intervalMS);

  Cpu = (function() {
    function Cpu() {
      this.symbols = ['cpu'];
    }

    Cpu.prototype.handle = function(sender, content, args, manager, router) {
      var current, index, item, output, _i, _len;
      if (args.length === 0) {
        args.push('all');
      }
      output = "";
      current = stats[0];
      for (index = _i = 0, _len = current.length; _i < _len; index = ++_i) {
        item = current[index];
        if (args[0] === 'all') {
          output += "[Core " + index + "]";
          output += " Load " + ((getLoads()[index] * 100).toFixed(1)) + "%";
          output += " Clock " + item.speed + "mhz";
          output += " Model " + item.model + " \n";
        }
        if (args[0] === 'load') {
          output += "" + ((getLoads()[index] * 100).toFixed(1)) + "% ";
        }
      }
      return output;
    };

    return Cpu;

  })();

  module.exports = new Cpu;

}).call(this);
