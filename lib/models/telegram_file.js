(function() {
  var BaseFile, Q, TelegramFile, request;

  Q = require('q');

  BaseFile = require('./base_file');

  request = require('request');

  TelegramFile = class TelegramFile extends BaseFile {
    constructor(fileId, api, options) {
      var key, value;
      super('telegram', fileId, {
        UID: `${fileId}@telegram`
      });
      this.api = api;
      options = options || {};
      for (key in options) {
        value = options[key];
        if (this.hasOwnProperty(key)) {
          this[key] = value;
        }
      }
    }

    getFile(cb, retryTimes = 1, defered = Q.defer()) {
      defered.promise.nodeify(cb);
      this._getFile((err) => {
        if (err && retryTimes > 0) {
          console.error(`Error get file ${this.contentSrc}. retry after 5 seconds`);
          return setTimeout(() => {
            console.error('retry start');
            return this.getFile(null, retryTimes - 1, defered);
          }, 5000);
        }
        if (err) {
          console.error(`Error get file ${this.contentSrc}.`);
          defered.reject(err);
        }
        // console.log "File #{@contentSrc} retrieved."
        return defered.resolve(this);
      });
      return defered.promise;
    }

    _getFile(cb, retryTimes = 1) {
      var deferred;
      deferred = Q.defer();
      deferred.promise.nodeify(cb);
      this.api.getFile(this.contentSrc, (err, res) => {
        if (err || !res) {
          return deferred.reject(err || new Error('cannot get content'));
        }
        
        // console.log res
        return this.api.getFileContent(res.file_path, (err, res, body) => {
          if (err || !body) {
            return deferred.reject(err || new Error('no content found'));
          }
          this.MIME = res.headers["content-type"];
          if (this.meta.overrides && this.meta.overrides.MIME) {
            this.MIME = this.meta.overrides.MIME;
          }
          this.content = body;
          this.length = body.length;
          return deferred.resolve(this);
        });
      });
      return deferred.promise;
    }

    toJSON() {
      var key, newItem, ref, value;
      newItem = {};
      ref = this;
      for (key in ref) {
        value = ref[key];
        if ((this.hasOwnProperty(key)) && key !== "api") {
          newItem[key] = value;
        }
      }
      return newItem;
    }

  };

  module.exports = TelegramFile;

}).call(this);
