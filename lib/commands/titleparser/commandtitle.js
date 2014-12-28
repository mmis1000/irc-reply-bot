(function() {
  var CommandTitle, EventEmitter, Icommand, loadFileIn, path, phantom, virtual_class,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  virtual_class = require('../../virtualclass.js');

  Icommand = require('../../icommand.js');

  EventEmitter = require('events').EventEmitter;

  phantom = require('phantom');

  loadFileIn = require('../../folderloader.js');

  path = require('path');


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
      this.ph = null;
      phantom.create('--ignore-ssl-errors=yes', '--web-security=false', '--ssl-protocol=any', {
        onStdout: function() {
          return null;
        }
      }, (function(_this) {
        return function(ph) {
          _this.ph = ph;
          return console.log('phantom instance created');
        };
      })(this));
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
      return ["make this bot to parse title in talks, Usage", "" + commandPrefix + " toggle [on|off] #toggle this module", "" + commandPrefix + " mode [" + (this._getAllMatchModes().join('|')) + "] #should this bot parse URL contains non-ascii characetr", "" + commandPrefix + " exclude add {regex} #don't detect url which matched this rule", "" + commandPrefix + " exclude remove {regex} #remove exclude rule", "" + commandPrefix + " exclude list #show current exclude rules", "" + commandPrefix + " drop #remove all exclude rules"];
    };

    CommandTitle.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager) {
      return commandManager.isOp(sender.sender);
    };

    CommandTitle.prototype.handleRaw = function(sender, type, content, textRouter, commandManager) {
      var event;
      if (type !== 'text') {
        return true;
      }
      if (0 !== sender.target.search('#')) {
        return true;
      }
      if (!this.setting.enabled) {
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
      event.cb = function(title) {
        return commandManager.send(sender, textRouter, title);
      };
      this._queryTitle(event);
      return true;
    };

    CommandTitle.prototype._extractURL = function(text) {
      var allURLs;
      text = text.toString();
      allURLs = text.match(this.matchRuleMap[this.setting.mode]);
      if (!allURLs) {
        return null;
      }
      return allURLs[0];
    };

    CommandTitle.prototype._queryTitle = function(event) {
      this.emit('beforecreate', event);
      if (event.canceled) {
        return true;
      }
      return this.ph.createPage((function(_this) {
        return function(page) {
          page.set('settings.resourceTimeout', 5000);
          page.set('settings.webSecurityEnabled ', false);
          page.set('settings.loadImages', false);
          page.set('settings.userAgent', 'Mozilla/5.0 (X11; Linux i686) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1478.0 Safari/537.36');
          event.page = page;
          _this.emit('beforeopen', event);
          if (event.canceled) {
            return true;
          }
          if (_this.debug) {
            console.log("phantomJS : opening URL " + event.url);
          }
          return page.open(event.url, function(status) {
            if (_this.debug) {
              console.log("phantomJS : opened site? ", status);
            }
            event.pageResult = status;
            event.queryCallback = function() {
              return JSON.stringify({
                title: document.title,
                url: location.href
              });
            };
            _this.emit('beforequery', event);
            if (event.canceled) {
              return true;
            }
            if (event.pageResult === 'success') {
              return page.evaluate(event.queryCallback, function(result) {
                event.result = JSON.parse(result);
                _this.emit('afterquery', event);
                if (event.canceled) {
                  return true;
                }
                if (!event.title) {
                  event.title = "[ " + event.result.title + " ] - " + event.result.url;
                }
                if (_this.debug) {
                  console.log('phantomJS : Page title is ' + event.title);
                }
                return event.cb(event.title);
              });
            }
          });
        };
      })(this));
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

    return CommandTitle;

  })(virtual_class(Icommand, EventEmitter));

  module.exports = CommandTitle;

}).call(this);