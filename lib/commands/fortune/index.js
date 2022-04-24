(function() {
  var fortune, list, wrap;

  list = require("./fortune.json");

  fortune = require("./fortune.js");

  wrap = class wrap {
    constructor() {
      return new fortune(list);
    }

  };

  module.exports = wrap;

}).call(this);
