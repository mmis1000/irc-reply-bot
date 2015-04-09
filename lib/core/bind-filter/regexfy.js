(function() {
  var Regexfy, escapeRegex;

  escapeRegex = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  };

  Regexfy = (function() {
    function Regexfy() {
      this.symbols = ['regexfy'];
    }

    Regexfy.prototype.handle = function(sender, content, args, manager, router) {
      return escapeRegex(content);
    };

    return Regexfy;

  })();

  module.exports = new Regexfy;

}).call(this);
