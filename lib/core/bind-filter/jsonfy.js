(function() {
  var JSONfy;

  JSONfy = (function() {
    function JSONfy() {
      this.symbols = ['jsonfy'];
    }

    JSONfy.prototype.handle = function(sender, content, args, manager, router) {
      return (JSON.stringify(content)).replace(/^"|"$/g, '');
    };

    return JSONfy;

  })();

  module.exports = new JSONfy;

}).call(this);
