(function() {
  var BaseFile, Q, TelegramFile, request,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Q = require('q');

  BaseFile = require('./base_file');

  request = require('request');

  TelegramFile = (function(_super) {
    __extends(TelegramFile, _super);

    function TelegramFile(fileId, api, options) {
      var key, value;
      this.api = api;
      TelegramFile.__super__.constructor.call(this, 'telegram', fileId, {
        UID: "" + fileId + "@telegram"
      });
      options = options || {};
      for (key in options) {
        value = options[key];
        if (this.hasOwnProperty(key)) {
          this[key] = value;
        }
      }
    }

    TelegramFile.prototype.getFile = function(cb) {
      var deferred;
      deferred = Q.defer();
      deferred.promise.nodeify(cb);
      this.api.getFile(this.contentSrc, (function(_this) {
        return function(err, res) {
          if (err || !res) {
            return deferred.reject(err || new Error('cannot get content'));
          }
          console.log(res);
          return _this.api.getFileContent(res.file_path, function(err, res, body) {
            if (err || !body) {
              return deferred.reject(err || now(Error('no content found')));
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

    return TelegramFile;

  })(BaseFile);

  module.exports = TelegramFile;

}).call(this);
