(function() {
  var IMedia, Media, Q,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  IMedia = require('./i_media');

  Q = require('q');

  Media = (function(superClass) {
    extend(Media, superClass);

    function Media(options) {
      var key, value;
      Media.__super__.constructor.apply(this, arguments);
      if (!'object' === typeof options) {
        options = {};
      }
      for (key in options) {
        value = options[key];
        if (options.hasOwnProperty(key)) {
          this[key] = value;
        }
      }
      if (!this.id) {
        throw new Error('media must have a identifier');
      }
    }

    Media.prototype.getAllFiles = function(cb) {
      var promise;
      promise = Q.all(this.files.map(function(file) {
        return file.getFile();
      }));
      promise.nodeify(cb);
      return promise;
    };

    return Media;

  })(IMedia);

  module.exports = Media;

}).call(this);
