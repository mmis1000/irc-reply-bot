(function() {
  var plugin;

  plugin = function(command) {
    command.on('beforeopen', function(event) {
      var imageId;
      if (event.url.match(/https?:\/\/(?:i\.)?imgur\.com\/(?:gallery\/)?([0-9a-zA-Z]{7,7})/g)) {
        imageId = (/https?:\/\/(?:i\.)?imgur\.com\/(?:gallery\/)?([0-9a-zA-Z]{7,7})/g.exec(event.url))[1];
        return event.url = `http://imgur.com/${imageId}`;
      }
    });
    command.on('beforequery', function(event) {
      if (event.url.match(/\/\/imgur.com\/[a-zA-Z0-9]+$/g)) {
        return event.queryCallback = function() {
          var e, result;
          result = {
            title: document.title,
            url: location.href
          };
          try {
            result.title = document.querySelector('meta[property="og:title"]').content;
          } catch (error) {
            e = error;
            console.log(e);
          }
          try {
            result.views = querySelector('#views').textContent;
          } catch (error) {
            try {
              result.views = querySelector('#stats-overview-views .value').textContent;
            } catch (error) {
              result.views = "";
            }
          }
          return JSON.stringify(result);
        };
      }
    });
    return command.on('afterquery', function(event) {
      if (event.result.url.match(/\/\/imgur\.com\/[a-zA-Z0-9]+$/g)) {
        return event.title = `[imgur] ${event.result.title} - ${event.result.views ? event.result.views + ' views - ' : ''}${event.result.url}`;
      }
    });
  };

  module.exports = plugin;

}).call(this);
