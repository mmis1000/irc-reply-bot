(function() {
  var GM_Storage, fs, getFile, setFile, setFileSync;

  fs = require('fs');

  getFile = function(path) {
    var e;
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

  GM_Storage = class GM_Storage {
    constructor(savePath) {
      this.savePath = savePath;
      this.useQuery = true;
      this.scheduled = false;
      this.saveInterval = 600 * 1000;
      this.cache = null;
      this._load();
      this.writing = false;
      this.writeNext = false;
      process.on("exit", () => {
        console.log("saveing storage dump...");
        return this._save(true);
      });
    }

    set(key, value) {
      //make sure always get newest value
      //@_load()
      this.cache[key] = value;
      return this._save();
    }

    get(key, defaultValue) {
      //make sure always get newest value
      //@_load()
      if (this.cache[key] !== void 0) {
        return this.cache[key];
      } else if (defaultValue != null) {
        return defaultValue;
      } else {
        return void 0;
      }
    }

    remove(key) {
      //make sure always get newest value
      //@_load()
      delete this.cache[key];
      return this._save();
    }

    removeAll() {
      this.cache = {};
      return this._save();
    }

    
      //use when storage was modified by another program
    reload() {
      return this._load;
    }

    _load() {
      if (getFile(this.savePath)) {
        return this.cache = JSON.parse(getFile(this.savePath));
      } else {
        this.cache = {};
        return this._save(true);
      }
    }

    _save(noQuery) {
      var setTimeoutR;
      setTimeoutR = function(a, b) {
        return setTimeout(b, a);
      };
      //console.log @
      if (this.useQuery && !noQuery) {
        if (!this.scheduled) {
          //console.log "[debug] write scheduled"
          setTimeoutR(this.saveInterval, () => {
            this._writeFile();
            return this.scheduled = false;
          });
          return this.scheduled = true;
        }
      } else {
        return this._writeFileSync();
      }
    }

    _writeFileSync() {
      var JSONText;
      JSONText = JSON.stringify(this.cache, null, 4);
      return setFileSync(this.savePath, JSONText);
    }

    _writeFile() {
      var JSONText;
      if (!this.writing) {
        //console.log "[debug] write start"
        JSONText = JSON.stringify(this.cache, null, 4);
        setFile(this.savePath, JSONText, this._onWriteFinish.bind(this));
        return this.writing = true;
      } else {
        return this.writeNext = true;
      }
    }

    _onWriteFinish() {
      //console.log "[debug] write finished"
      this.writing = false;
      if (this.writeNext) {
        this.writeNext = false;
        return this._writeFile();
      }
    }

  };

  module.exports = GM_Storage;

}).call(this);
