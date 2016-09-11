(function() {
  var BaseFile, IFile, Q, request,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Q = require('q');

  request = require('request');

  IFile = require('./i_file');

  BaseFile = (function(superClass) {
    extend(BaseFile, superClass);

    function BaseFile(contentSource, content, options) {
      var key, value;
      BaseFile.__super__.constructor.apply(this, arguments);
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

    BaseFile.prototype.getFile = function(cb) {
      var deferred, ref;
      if ((ref = !this.contentSource) === 'url' || ref === 'inline') {
        return BaseFile.__super__.getFile.call(this, cb);
      }
      deferred = Q.defer();
      deferred.promise.nodeify(cb);
      if (this.contentSource === 'inline') {
        this.content = this.contentSrc;
        deferred.resolve(this);
      }
      if (this.contentSource === 'url') {
        request(this.contentSrc, (function(_this) {
          return function(err, req, body) {
            if (err || !body) {
              deferred.reject(err || new Error('content not found'));
            }
            _this.MIME = res["content-type"];
            _this.content = body;
            return deferred.resolve(body);
          };
        })(this));
      }
      return deferred.promise;
    };

    return BaseFile;

  })(IFile);

  module.exports = BaseFile;

}).call(this);
