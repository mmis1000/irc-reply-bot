(function() {
  var Defer, a, b, c, d, def, defB, defC, defD, g, x;

  Defer = require("../defer");

  def = new Defer;

  def.setTimeout(10 * 1000);

  a = def.async('taskA');

  a('testA');

  d = def.async('taskD');

  d('testD');

  b = def.async('taskB');

  setTimeout(b.bind('testB'), 5000);

  c = def.async('taskC');

  def.on('clear', function(err, res) {
    return console.log('defA', err, res);
  });

  def.on('error', function(e) {
    return console.error(e);
  });

  def.transformResults = function(results) {
    return results.join("\n");
  };

  defB = new Defer;

  g = defB.async();

  def.on('clear', function(err, res) {
    return g(res);
  });

  defB.on('clear', function(err, res) {
    return console.log('defB', err, res);
  });

  defB.on('error', function(e) {
    return console.error(e);
  });

  defC = new Defer;

  defC.forceCheck();

  defC.on('clear', function(err, res) {
    return console.log('defC', err, res);
  });

  defD = new Defer;

  defD.forceCheck();

  x = defD.async();

  setTimeout(x, 5000);

  defD.on('clear', function(err, res) {
    return console.log('defD', err, res);
  });

  console.log('test');

}).call(this);
