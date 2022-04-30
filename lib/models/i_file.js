var IFile, Q;

Q = require('q');

IFile = class IFile {
  constructor() {
    // these property may work only after getFile got called
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

  getFile(cb) {
    var deferred;
    deferred = Q.defer();
    deferred.promise.nodeify(cb);
    deferred.reject(Error('not implemented'));
    return deferred.promise;
  }

};

module.exports = IFile;
