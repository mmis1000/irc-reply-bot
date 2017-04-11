(function() {
  var BaseFile, Q, TelegramFile, request,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Q = require('q');

  BaseFile = require('./base_file');

  request = require('request');

  TelegramFile = (function(superClass) {
    extend(TelegramFile, superClass);

    function TelegramFile(fileId, api, options) {
      var key, value;
      this.api = api;
      TelegramFile.__super__.constructor.call(this, 'telegram', fileId, {
        UID: fileId + "@telegram"
      });
      options = options || {};
      for (key in options) {
        value = options[key];
        if (this.hasOwnProperty(key)) {
          this[key] = value;
        }
      }
    }

    TelegramFile.prototype.getFile = function(cb, retryTimes, defered) {
      if (retryTimes == null) {
        retryTimes = 1;
      }
      if (defered == null) {
        defered = Q.defer();
      }
      defered.promise.nodeify(cb);
      this._getFile((function(_this) {
        return function(err) {
          if (err && retryTimes > 0) {
            console.error("Error get file " + _this.contentSrc + ". retry after 5 seconds");
            return setTimeout(function() {
              console.error('retry start');
              return _this.getFile(null, retryTimes - 1, defered);
            }, 5000);
          }
          if (err) {
            console.error("Error get file " + _this.contentSrc + ".");
            defered.reject(err);
          }
          return defered.resolve(_this);
        };
      })(this));
      return defered.promise;
    };

    TelegramFile.prototype._getFile = function(cb, retryTimes) {
      var deferred;
      if (retryTimes == null) {
        retryTimes = 1;
      }
      deferred = Q.defer();
      deferred.promise.nodeify(cb);
      this.api.getFile(this.contentSrc, (function(_this) {
        return function(err, res) {
          if (err || !res) {
            return deferred.reject(err || new Error('cannot get content'));
          }
          return _this.api.getFileContent(res.file_path, function(err, res, body) {
            if (err || !body) {
              return deferred.reject(err || new Error('no content found'));
            }
            _this.MIME = res.headers["content-type"];
            if (_this.meta.overrides && _this.meta.overrides.MIME) {
              _this.MIME = _this.meta.overrides.MIME;
            }
            _this.content = body;
            _this.length = body.length;
            return deferred.resolve(_this);
          });
        };
      })(this));
      return deferred.promise;
    };

    TelegramFile.prototype.toJSON = function() {
      var key, newItem, value;
      newItem = {};
      for (key in this) {
        value = this[key];
        if ((this.hasOwnProperty(key)) && key !== "api") {
          newItem[key] = value;
        }
      }
      return newItem;
    };

    return TelegramFile;

  })(BaseFile);

  module.exports = TelegramFile;

}).call(this);
