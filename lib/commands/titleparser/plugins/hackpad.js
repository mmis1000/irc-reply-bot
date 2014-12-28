(function() {
  var plugin;

  plugin = function(command) {
    return command.on('afterquery', function(event) {
      if (event.result.url.match(/\/\/\w+.hackpad.com/g)) {
        return event.result.title = event.result.title.replace(/&#(\d+);/g, function(a, b) {
          return String.fromCharCode(b);
        });
      }
    });
  };

  module.exports = plugin;

}).call(this);
