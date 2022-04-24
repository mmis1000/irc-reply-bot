(function() {
  var IMedia, Media, Q;

  IMedia = require('./i_media');

  Q = require('q');

  Media = class Media extends IMedia {
    constructor(options) {
      var key, value;
      super();
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

    getAllFiles(cb) {
      var promise;
      promise = Q.all(this.files.map(function(file) {
        return file.getFile();
      }));
      promise.nodeify(cb);
      return promise;
    }

  };

  module.exports = Media;

}).call(this);
