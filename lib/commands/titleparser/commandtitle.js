(function() {
  var Accept_Language, CommandTitle, EventEmitter, Icommand, Q, cache, fs, imgur, loadFileIn, path, phantom, phantomjs, phatomDir, punycode, tmp, url, virtual_class,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __slice = [].slice;

  virtual_class = require('../../virtualclass.js');

  Icommand = require('../../icommand.js');

  EventEmitter = require('events').EventEmitter;

  phantom = require('phantom');

  phantomjs = require('phantomjs');

  loadFileIn = require('../../folderloader.js');

  path = require('path');

  imgur = require('imgur');

  tmp = require('tmp');

  fs = require('fs');

  cache = require('memory-cache');

  url = require('url');

  punycode = require('punycode');

  Q = require('q');

  phatomDir = "" + (path.dirname(phantomjs.path)) + path.sep;

  Accept_Language = "zh-TW,zh;q=0.8,en-US;q=0.5,en;q=0.3";


  /*
   * emit : parseurl
   * emit : beforecreate
   * emit : beforeopen
   * emit : beforequery
   * emit : afterquery
   */

  CommandTitle = (function(_super) {
    __extends(CommandTitle, _super);

    function CommandTitle(storage) {
      this.storage = storage;
      this.debug = true;
      this.setting = this.storage.get('titleParser', {
        enabled: true,
        mode: 'default',
        exclude: []
      });
      this.matchRuleMap = {
        'default': /https?:\/\/[^\.\s\/]+(?:\.[^\.\s\/]+)+(?:\/[^\s]*)?/g,
        'strict': /https?:\/\/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b[-a-zA-Z0-9@:%_\+.~#?&\/=]*/g
      };
      this.fresh_phs = [];
      this.ph = false;
      this._createRunner();

      /*
      phantom.create '--ignore-ssl-errors=yes', '--web-security=false', '--ssl-protocol=any', {path : phatomDir, onStdout : ()->null},(ph, error)=>
        @ph = ph
        console.log 'phantom instance created'
        if error
          console.log error
       */
      this._loadPlugins();
    }

    CommandTitle.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      switch (args[1]) {
        case 'toggle':
          if (args.length !== 3) {
            return false;
          }
          if (this._toggle(args[2])) {
            commandManager.send(sender, textRouter, "title parser has been toggled to " + args[2]);
            return true;
          } else {
            return false;
          }
          break;
        case 'mode':
          if (args.length !== 3) {
            return false;
          }
          if (this._setMode(args[2])) {
            commandManager.send(sender, textRouter, "Changed mode to " + args[2]);
          } else {
            commandManager.send(sender, textRouter, "Failed to Change mode");
          }
          return true;
        case 'exclude':
          switch (args[2]) {
            case 'add':
              if (args.length !== 4) {
                return false;
              }
              if (this._addExclude(args[3])) {
                commandManager.send(sender, textRouter, 'Added rule successfully');
              } else {
                commandManager.send(sender, textRouter, 'Invalid rule!');
              }
              return true;
            case 'remove':
              if (args.length !== 4) {
                return false;
              }
              if (this._removeExclude(args[3])) {
                commandManager.send(sender, textRouter, 'Removed successfully');
              } else {
                commandManager.send(sender, textRouter, 'No such rule!');
              }
              return true;
            case 'list':
              if (args.length !== 3) {
                return false;
              }
              commandManager.sendPv(sender, textRouter, 'All excluded URLs :');
              commandManager.sendPv(sender, textRouter, this._getExclude().join(', '));
              return true;
            case 'drop':
              if (args.length !== 3) {
                return false;
              }
              if (this._dropExclude()) {
                commandManager.send(sender, textRouter, 'Dropped rules!');
              } else {
                commandManager.send(sender, textRouter, 'Fail to drop rule.');
              }
              return true;
          }
      }
      return false;
    };

    CommandTitle.prototype.help = function(commandPrefix) {
      return ["make this bot to parse title in talks, Usage", "" + commandPrefix + " toggle [on|off] #toggle this module", "" + commandPrefix + " mode [" + (this._getAllMatchModes().join('|')) + "] #should this bot parse URL contains non-ascii characetr", "" + commandPrefix + " exclude add {regex} #don't detect url which matched this rule", "" + commandPrefix + " exclude remove {regex} #remove exclude rule", "" + commandPrefix + " exclude list #show current exclude rules", "" + commandPrefix + " exclude drop #remove all exclude rules"];
    };

    CommandTitle.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return commandManager.isOp(sender.sender);
    };

    CommandTitle.prototype.handleRaw = function(sender, type, content, textRouter, commandManager) {
      var event, originalUrl;
      if (type !== 'text') {
        return true;
      }
      if (0 !== sender.target.search('#')) {
        return true;
      }
      if (!this.setting.enabled) {
        return true;
      }
      if (commandManager.isBanned(sender)) {
        return true;
      }
      event = {
        canceled: false
      };
      event.command = this;
      event.sender = sender;
      event.text = content;
      event.router = textRouter;
      event.manager = commandManager;
      event.url = this._extractURL(content);
      if (event.url && this._matchExclude(event.url)) {
        event.canceled = true;
      }
      this.emit('parseurl', event);
      if (!event.url || event.canceled) {
        return true;
      }
      originalUrl = event.url;
      if (cache.get(originalUrl)) {
        commandManager.send(sender, textRouter, cache.get(originalUrl));
        return true;
      }
      event.cb = function(title) {
        cache.put(originalUrl, title, 2 * 3600 * 1000);
        return commandManager.send(sender, textRouter, title);
      };
      this._queryTitle(event);
      return true;
    };

    CommandTitle.prototype._extractURL = function(text) {
      var allURLs, fixCJKInPath, temp;
      text = text.toString();
      allURLs = text.match(this.matchRuleMap[this.setting.mode]);
      if (!allURLs) {
        return null;
      }
      temp = url.parse(allURLs[0]);
      fixCJKInPath = function(str) {
        return str.split('').map(function(char) {
          if (127 > char.charCodeAt(0)) {
            return char;
          }
          return encodeURIComponent(char);
        }).join('');
      };
      if (temp.pathname) {
        temp.pathname = fixCJKInPath(temp.pathname);
      }
      if (temp.search) {
        temp.search = fixCJKInPath(temp.search);
      }
      if (temp.hash) {
        temp.hash = fixCJKInPath(temp.hash);
      }
      return url.format(temp);
    };

    CommandTitle.prototype._queryTitle = function(event) {
      var getpage, p;
      getpage = (function(_this) {
        return function() {
          var deferred;
          deferred = Q.defer();
          _this._getRunner().createPage(function(page) {
            return deferred.resolve(page);
          });
          return deferred.promise;
        };
      })(this);
      this.emit('beforecreate', event);
      if (event.canceled) {
        return true;
      }
      p = getpage();
      p = p.then((function(_this) {
        return function(page) {
          var deferred, e;
          page.set('settings.resourceTimeout', 5000);
          page.set('settings.webSecurityEnabled ', false);
          page.set('settings.userAgent', 'Mozilla/5.0 (Windows NT 6.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.93 Safari/537.36');
          page.set('customHeaders', {
            "Accept-Language": Accept_Language
          });
          event.page = page;
          _this.emit('beforeopen', event);
          if (event.canceled) {
            page.close();
            e = new Error('canceled');
            e.type = 'CANCELED';
            throw e;
          }
          if (_this.debug) {
            console.log("Title : opening URL " + event.url);
          }
          event.timeOpen = Date.now();
          deferred = Q.defer();
          page.open(event.url, function(status) {
            console.log('test');
            event.status = status;
            if (this.debug) {
              console.log("Title : : opened site? ", status);
            }
            return deferred.resolve(page);
          });
          return deferred.promise;
        };
      })(this));
      p = p.then((function(_this) {
        return function(page) {
          var deferred, e;
          if (event.status === 'fail') {
            page.close();
            e = new Error('fail to open page');
            e.type = 'CANNOT_OPEN_PAGE';
            throw e;
          }
          event.pageResult = event.status;
          event.queryCallback = function() {
            document.body.bgColor = 'white';
            return JSON.stringify({
              title: document.title,
              url: location.href,
              rwd: !!(document.querySelectorAll('meta[name=viewport]')).length
            });
          };
          _this.emit('beforequery', event);
          if (event.canceled) {
            page.close();
            e = new Error('canceled');
            e.type = 'CANCELED';
            throw e;
          }
          deferred = Q.defer();
          page.evaluate(event.queryCallback, function(result) {
            event.result = JSON.parse(result);
            return deferred.resolve(page);
          });
          return deferred.promise;
        };
      })(this));
      p = p.then((function(_this) {
        return function(page) {
          var deferred, e;
          _this.emit('afterquery', event);
          if (event.canceled) {
            page.close();
            e = new Error('canceled');
            e.type = 'CANCELED';
            throw e;
          }
          if (!event.title) {
            event.title = "[ " + event.result.title + " ] - " + (event.result.rwd ? 'Mobile supported - ' : '') + (Date.now() - event.timeOpen) + "ms - " + event.result.url;
          }
          if (_this.debug) {
            console.log('Title : Page title is ' + event.title);
          }
          deferred = Q.defer();
          page.set('viewportSize', {
            width: 1366,
            height: 768
          }, function(result) {
            console.log("Title : Viewport set to: " + result.width + "x" + result.height);
            return deferred.resolve(page);
          });
          return deferred.promise;
        };
      })(this));
      p = p.then((function(_this) {
        return function(page) {
          var deferred;
          deferred = Q.defer();
          tmp.dir(function(err, dirPath, cleanupCallback) {
            console.log("Title : created dir " + dirPath);
            event.imagePath = path.resolve(dirPath, 'result.jpg');
            event.cleanupCallback = cleanupCallback;
            return deferred.resolve(page);
          });
          return deferred.promise;
        };
      })(this));
      p = p.then((function(_this) {
        return function(page) {
          var deferred;
          deferred = Q.defer();
          page.render(event.imagePath, {
            format: 'jpeg',
            quality: '90'
          }, function() {
            console.log("Title : file created at " + event.imagePath);
            return deferred.resolve(page);
          });
          return deferred.promise;
        };
      })(this));
      p = p.then((function(_this) {
        return function(page) {
          var clearUp, deferred;
          clearUp = function(path, cleanupCallback) {
            var e;
            try {
              return fs.unlink(path, function() {
                return cleanupCallback();
              });
            } catch (_error) {
              e = _error;
              return console.log(e);
            }
          };
          page.close();
          console.log("Title : start to upload " + event.imagePath + " to imgur");
          deferred = Q.defer();
          imgur.uploadFile(event.imagePath).then(function(json) {
            event.imgurPath = json.data.link;
            console.log("Title : uploaded " + event.imagePath + ", URL is " + event.imgurPath);
            clearUp(event.imagePath, event.cleanupCallback);
            return deferred.resolve(null);
          })["catch"](function(err) {
            console.error(err.message);
            clearUp(event.imagePath, event.cleanupCallback);
            return deferred.resolve(null);
          });
          return deferred.promise;
        };
      })(this));
      p = p.then((function(_this) {
        return function() {
          if (event.imgurPath) {
            event.title = event.title + " - screenshot: " + event.imgurPath;
          }
          return event.cb(event.title);
        };
      })(this));
      return p = p["catch"](function(e) {
        return console.log(e);
      });
    };

    CommandTitle.prototype._save = function() {
      return this.storage.set('titleParser', this.setting);
    };

    CommandTitle.prototype._toggle = function(value) {
      if (value !== 'on' && value !== 'off') {
        return false;
      }
      if (value === 'on') {
        this.setting.enabled = true;
      } else {
        this.setting.enabled = false;
      }
      this._save();
      return true;
    };

    CommandTitle.prototype._setMode = function(value) {
      if (0 > this._getAllMatchModes().indexOf(value)) {
        return false;
      }
      this.setting.mode = value;
      this._save();
      return true;
    };

    CommandTitle.prototype._getAllMatchModes = function() {
      var key, modes, value, _ref;
      modes = [];
      _ref = this.matchRuleMap;
      for (key in _ref) {
        value = _ref[key];
        if (this.matchRuleMap.hasOwnProperty(key)) {
          modes.push(key);
        }
      }
      return modes;
    };

    CommandTitle.prototype._addExclude = function(regex) {
      var e;
      regex = regex.toString();
      if (__indexOf.call(this.setting.exclude, regex) >= 0) {
        return true;
      }
      try {
        new RegExp(regex);
        this.setting.exclude.push(regex);
        this._save();
        return true;
      } catch (_error) {
        e = _error;
        return false;
      }
    };

    CommandTitle.prototype._removeExclude = function(regex) {
      var index;
      index = this.setting.exclude.indexOf(regex);
      if (index < 0) {
        return false;
      }
      this.setting.exclude.splice(index, 1);
      this._save();
      return true;
    };

    CommandTitle.prototype._matchExclude = function(url) {
      var item, _i, _len, _ref;
      _ref = this.setting.exclude;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        if (url.match(item)) {
          return true;
        }
      }
      return false;
    };

    CommandTitle.prototype._getExclude = function() {
      return this.setting.exclude.slice(0);
    };

    CommandTitle.prototype._dropExclude = function() {
      this.setting.exclude = [];
      this._save();
      return true;
    };

    CommandTitle.prototype._loadPlugins = function() {
      var e, plugin, plugins, _i, _len, _results;
      plugins = loadFileIn(path.resolve(__dirname, 'plugins'));
      _results = [];
      for (_i = 0, _len = plugins.length; _i < _len; _i++) {
        plugin = plugins[_i];
        try {
          plugin.module(this);
          if (this.debug) {
            _results.push(console.log("loaded plugin from " + plugin.path));
          } else {
            _results.push(void 0);
          }
        } catch (_error) {
          e = _error;
          _results.push(console.log("fail to load plugin from " + plugin.path + " due to", e));
        }
      }
      return _results;
    };

    CommandTitle.prototype._createRunner = function() {
      var self;
      self = this;
      phantom.create('--ignore-ssl-errors=true', '--web-security=false', '--ssl-protocol=any', {
        path: phatomDir,
        onStdout: (function() {
          return null;
        }),
        onStderr: (function() {
          return null;
        }),
        onExit: function(code, signal) {
          if (signal !== null) {
            self.ph = null;
            self._freshRunner();
            return console.log("[Error] phantom instance killed due to " + signal);
          }
        }
      }, (function(_this) {
        return function(ph, error) {
          var old_createPage;
          _this.fresh_phs.push(ph);
          ph.running = 0;
          old_createPage = ph.createPage;
          ph.createPage = function(callback) {
            var old_callback;
            ph.running += 1;
            ph.dirty = true;
            old_callback = callback;
            callback = function(page) {
              var old_close;
              old_close = page.close;
              page.close = function() {
                var args;
                args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
                ph.running -= 1;
                old_close.apply(page, args);
                return _this._finishPage();
              };
              return old_callback.call(null, page);
            };
            return old_createPage.call(ph, callback);
          };
          if (error) {
            console.log(error);
          }
          _this.waiting = false;
          return _this._freshRunner();
        };
      })(this));
      return this.waiting = true;
    };

    CommandTitle.prototype._freshRunner = function() {
      if (!this.ph) {
        this.ph = this.fresh_phs.pop();
      }
      if (this.ph.dirty && this.ph.running === 0 && this.fresh_phs.length > 0) {
        this.ph.exit();
        return this.ph = this.fresh_phs.pop();
      }
    };

    CommandTitle.prototype._finishPage = function() {
      return this._freshRunner();
    };

    CommandTitle.prototype._getRunner = function() {
      if (!this.waiting && this.fresh_phs.length === 0) {
        this._createRunner();
      }
      return this.ph;
    };

    return CommandTitle;

  })(virtual_class(Icommand, EventEmitter));

  module.exports = CommandTitle;

}).call(this);
