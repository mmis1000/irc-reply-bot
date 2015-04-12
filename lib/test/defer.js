(function() {
  var Defer, a, b, c, d, def;

  Defer = require("../defer");

  def = new Defer;

  a = def.async('taskA');

  a('testA');

  d = def.async('taskD');

  d('testD');

  b = def.async('taskB');

  setTimeout(b.bind('testB'), 5000);

  c = def.async('taskC');

  def.on('clear', function(err, res) {
    return console.log(err, res);
  });

  def.on('error', function(e) {
    return console.error(e);
  });

  def.transformResults = function(results) {
    return results.join("\n");
  };

  console.log('test');

}).call(this);
