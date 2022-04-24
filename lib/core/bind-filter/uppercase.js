(function() {
  var UpperCase;

  UpperCase = class UpperCase {
    constructor() {
      this.symbols = ['uppercase'];
    }

    handle(sender, content, args, manager, router) {
      return content.toUpperCase();
    }

  };

  module.exports = new UpperCase();

}).call(this);
