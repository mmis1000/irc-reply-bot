(function() {
  var fortune, list, wrap;

  list = require("./fortune.json");

  fortune = require("./fortune.js");

  wrap = (function() {
    function wrap() {
      return new fortune(list);
    }

    return wrap;

  })();

  module.exports = wrap;

}).call(this);
