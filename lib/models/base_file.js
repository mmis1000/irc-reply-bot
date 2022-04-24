(function() {
  var BaseFile, IFile, Q, request;

  Q = require('q');

  request = require('request');

  IFile = require('./i_file');

  BaseFile = class BaseFile extends IFile {
    constructor(contentSource, content, options) {
      var key, value;
      super();
      if (!'object' === typeof options) {
        options = {};
      }
      this.contentSource = contentSource;
      this.contentSrc = content;
      for (key in options) {
        value = options[key];
        if (this.hasOwnProperty(key)) {
          this[key] = value;
        }
      }
    }

    getFile(cb) {
      var deferred, ref;
      if ((ref = !this.contentSource) === 'url' || ref === 'inline') {
        return super.getFile(cb);
      }
      deferred = Q.defer();
      deferred.promise.nodeify(cb);
      if (this.contentSource === 'inline') {
        this.content = this.contentSrc;
        deferred.resolve(this);
      }
      if (this.contentSource === 'url') {
        request(this.contentSrc, (err, req, body) => {
          if (err || !body) {
            deferred.reject(err || new Error('content not found'));
          }
          this.MIME = res["content-type"];
          this.content = body;
          return deferred.resolve(body);
        });
      }
      return deferred.promise;
    }

  };

  module.exports = BaseFile;

}).call(this);
