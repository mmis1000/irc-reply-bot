(function() {
  var NormalizeCase;

  NormalizeCase = class NormalizeCase {
    constructor() {
      this.symbols = ['normalize'];
    }

    handle(sender, content, args, manager, router) {
      content = content.split(/\b([a-z]+)/ig);
      content = content.map(function(i) {
        var newI;
        if (i.match(/\b[a-z]+\b/ig)) {
          newI = i.toLowerCase().split('');
          newI[0] = newI[0].toUpperCase();
          return newI.join('');
        } else {
          return i;
        }
      });
      return content.join('');
    }

  };

  module.exports = new NormalizeCase();

}).call(this);
