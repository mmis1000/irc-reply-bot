(function() {
  var SelfName;

  SelfName = (function() {
    function SelfName() {
      this.symbols = ['selfname'];
    }

    SelfName.prototype.handle = function(sender, content, args, manager, router) {
      return sender.toString();
    };

    return SelfName;

  })();

  module.exports = new SelfName;

}).call(this);
