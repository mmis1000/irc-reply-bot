(function() {
  var UpperCase;

  UpperCase = (function() {
    function UpperCase() {
      this.symbols = ['uppercase'];
    }

    UpperCase.prototype.handle = function(sender, content, args, manager, router) {
      return content.toUpperCase();
    };

    return UpperCase;

  })();

  module.exports = new UpperCase;

}).call(this);
