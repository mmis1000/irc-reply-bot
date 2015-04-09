(function() {
  var Time;

  Time = (function() {
    function Time() {
      this.symbols = ['time'];
    }

    Time.prototype.handle = function(sender, content, args, manager, router) {
      return (new Date).toString();
    };

    return Time;

  })();

  module.exports = new Time;

}).call(this);
