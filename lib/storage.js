(function() {
  var GM_Storage, fs, getFile, setFile, setFileSync;

  fs = require('fs');

  getFile = function(path) {
    var e, error;
    try {
      return fs.readFileSync(path).toString();
    } catch (error) {
      e = error;
      return null;
    }
  };

  setFile = function(path, content, cb) {
    return fs.writeFile(path, content, cb);
  };

  setFileSync = function(path, content) {
    return fs.writeFileSync(path, content);
  };

  GM_Storage = (function() {
    function GM_Storage(savePath) {
      this.savePath = savePath;
      this.useQuery = true;
      this.scheduled = false;
      this.saveInterval = 600 * 1000;
      this.cache = null;
      this._load();
      this.writing = false;
      this.writeNext = false;
      process.on("exit", (function(_this) {
        return function() {
          console.log("saveing storage dump...");
          return _this._save(true);
        };
      })(this));
    }

    GM_Storage.prototype.set = function(key, value) {
      this.cache[key] = value;
      return this._save();
    };

    GM_Storage.prototype.get = function(key, defaultValue) {
      if (this.cache[key] !== void 0) {
        return this.cache[key];
      } else if (defaultValue != null) {
        return defaultValue;
      } else {
        return void 0;
      }
    };

    GM_Storage.prototype.remove = function(key) {
      delete this.cache[key];
      return this._save();
    };

    GM_Storage.prototype.removeAll = function() {
      this.cache = {};
      return this._save();
    };

    GM_Storage.prototype.reload = function() {
      return this._load;
    };

    GM_Storage.prototype._load = function() {
      if (getFile(this.savePath)) {
        return this.cache = JSON.parse(getFile(this.savePath));
      } else {
        this.cache = {};
        return this._save(true);
      }
    };

    GM_Storage.prototype._save = function(noQuery) {
      var setTimeoutR;
      setTimeoutR = function(a, b) {
        return setTimeout(b, a);
      };
      if (this.useQuery && !noQuery) {
        if (!this.scheduled) {
          setTimeoutR(this.saveInterval, (function(_this) {
            return function() {
              _this._writeFile();
              return _this.scheduled = false;
            };
          })(this));
          return this.scheduled = true;
        }
      } else {
        return this._writeFileSync();
      }
    };

    GM_Storage.prototype._writeFileSync = function() {
      var JSONText;
      JSONText = JSON.stringify(this.cache, null, 4);
      return setFileSync(this.savePath, JSONText);
    };

    GM_Storage.prototype._writeFile = function() {
      var JSONText;
      if (!this.writing) {
        JSONText = JSON.stringify(this.cache, null, 4);
        setFile(this.savePath, JSONText, this._onWriteFinish.bind(this));
        return this.writing = true;
      } else {
        return this.writeNext = true;
      }
    };

    GM_Storage.prototype._onWriteFinish = function() {
      this.writing = false;
      if (this.writeNext) {
        this.writeNext = false;
        return this._writeFile();
      }
    };

    return GM_Storage;

  })();

  module.exports = GM_Storage;

}).call(this);
