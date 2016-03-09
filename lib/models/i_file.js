(function() {
  var IFile, Q;

  Q = require('q');

  IFile = (function() {
    function IFile() {
      this.MIME = null;
      this.length = null;
      this.photoSize = null;
      this.meta = {};
      this.duration = null;
      this.isThumb = null;
      this.contentSource = null;
      this.contentSrc = null;
      this.UID = null;
    }

    IFile.prototype.getFile = function(cb) {
      var deferred;
      deferred = Q.defer();
      deferred.promise.nodeify(cb);
      deferred.reject(Error('not implemented'));
      return deferred.promise;
    };

    return IFile;

  })();

  module.exports = IFile;

}).call(this);
