(function() {
  var LowerCase;

  LowerCase = (function() {
    function LowerCase() {
      this.symbols = ['lowercase'];
    }

    LowerCase.prototype.handle = function(sender, content, args, manager, router) {
      return content.toLowerCase();
    };

    return LowerCase;

  })();

  module.exports = new LowerCase;

}).call(this);
