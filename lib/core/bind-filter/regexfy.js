(function() {
  var Regexfy, escapeRegex;

  escapeRegex = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  };

  Regexfy = class Regexfy {
    constructor() {
      this.symbols = ['regexfy'];
    }

    handle(sender, content, args, manager, router) {
      return escapeRegex(content);
    }

  };

  module.exports = new Regexfy();

}).call(this);
