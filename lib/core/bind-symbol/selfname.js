(function() {
  var SelfName;

  SelfName = (function() {
    function SelfName() {
      this.symbols = ['selfname'];
    }

    SelfName.prototype.handle = function(sender, content, args, manager, router) {
      return manager.toDisplayName(sender);
    };

    return SelfName;

  })();

  module.exports = new SelfName;

}).call(this);
