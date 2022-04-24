(function() {
  var Accept_Language, CommandTitle, EventEmitter, Icommand, MAX_SCREEN_SIZE_X, MAX_SCREEN_SIZE_Y, Q, cache, fs, imgur, loadFileIn, path, phantom, phantomjs, phatomDir, punycode, tmp, url, virtual_class,
    indexOf = [].indexOf;

  virtual_class = require('../../virtualclass.js');

  Icommand = require('../../icommand.js');

  ({EventEmitter} = require('events'));

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

  phatomDir = `${path.dirname(phantomjs.path)}${path.sep}`;

  Accept_Language = "zh-TW,zh;q=0.8,en-US;q=0.5,en;q=0.3";

  MAX_SCREEN_SIZE_X = 2400;

  MAX_SCREEN_SIZE_Y = 2400;

  /*
   * emit : parseurl
   * emit : beforecreate
   * emit : beforeopen
   * emit : beforequery
   * emit : afterquery
   */
  CommandTitle = class CommandTitle extends virtual_class(EventEmitter, Icommand) {
    constructor(storage1) {
      super();
      this.storage = storage1;
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
      this.setting.exclude_image = this.setting.excludeImage || [];
      this.setting.image_size = this.setting.image_size || {
        width: 1366,
        height: 768
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

    handle(sender, text, args, storage, textRouter, commandManager) {
      var x, y;
      switch (args[1]) {
        case 'toggle':
          if (args.length !== 3) {
            return false;
          }
          if (this._toggle(args[2], sender)) {
            commandManager.send(sender, textRouter, `title parser has been toggled to ${args[2]} for ${sender.target}`);
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
            commandManager.send(sender, textRouter, `Changed mode to ${args[2]}`);
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
          break;
        case 'exclude-image':
          switch (args[2]) {
            case 'add':
              if (args.length !== 4) {
                return false;
              }
              if (this._addExclude(args[3], 'exclude_image')) {
                commandManager.send(sender, textRouter, 'Added image excluded rule successfully');
              } else {
                commandManager.send(sender, textRouter, 'Invalid rule!');
              }
              return true;
            case 'remove':
              if (args.length !== 4) {
                return false;
              }
              if (this._removeExclude(args[3], 'exclude_image')) {
                commandManager.send(sender, textRouter, 'Removed image excluded rule successfully');
              } else {
                commandManager.send(sender, textRouter, 'No such rule!');
              }
              return true;
            case 'list':
              if (args.length !== 3) {
                return false;
              }
              commandManager.sendPv(sender, textRouter, 'All excluded image URLs :');
              commandManager.sendPv(sender, textRouter, (this._getExclude('exclude_image')).join(', '));
              return true;
            case 'drop':
              if (args.length !== 3) {
                return false;
              }
              if (this._dropExclude('exclude_image')) {
                commandManager.send(sender, textRouter, 'Dropped image excluded rules!');
              } else {
                commandManager.send(sender, textRouter, 'Fail to drop rule.');
              }
              return true;
          }
          break;
        case 'size':
          switch (args[2]) {
            case 'set':
              if (args.length !== 5) {
                return false;
              }
              if (isNaN(parseInt(args[3], 10))) {
                return false;
              }
              if (isNaN(parseInt(args[4], 10))) {
                return false;
              }
              x = parseInt(args[3], 10);
              y = parseInt(args[4], 10);
              x = Math.min(x, MAX_SCREEN_SIZE_X);
              y = Math.min(y, MAX_SCREEN_SIZE_Y);
              this.setting.image_size = {
                width: x,
                height: y
              };
              this._save();
              commandManager.send(sender, textRouter, `sett size size to ${this.setting.image_size.width} / ${this.setting.image_size.height}`);
              return true;
            case 'get':
              if (args.length !== 3) {
                return false;
              }
              commandManager.send(sender, textRouter, `cuurent size is ${this.setting.image_size.width} / ${this.setting.image_size.height}`);
              return true;
          }
      }
      return false;
    }

    help(commandPrefix) {
      return ["make this bot to parse title in talks, Usage", `${commandPrefix} toggle [on|off] #toggle this module`, `${commandPrefix} mode [${this._getAllMatchModes().join('|')}] #should this bot parse URL contains non-ascii characetr`, `${commandPrefix} exclude add {regex} #don't detect url which matched this rule`, `${commandPrefix} exclude remove {regex} #remove exclude rule`, `${commandPrefix} exclude list #show current exclude rules`, `${commandPrefix} exclude drop #remove all exclude rules`, `${commandPrefix} exclude-image add {regex} #don't create screenshot which matched this rule`, `${commandPrefix} exclude-image remove {regex} #remove screenshot exclude rule`, `${commandPrefix} exclude-image list #show current screenshot exclude rules`, `${commandPrefix} exclude-image drop #remove all screenshot exclude rules`, `${commandPrefix} size set {width} {heaigh} #set screenshot size`, `${commandPrefix} size get #get screenshot size`];
    }

    hasPermission(sender, text, args, storage, textRouter, commandManager) {
      return commandManager.isOp(sender.sender);
    }

    
      //url parsing
    handleRaw(sender, type, content, textRouter, commandManager) {
      var event, originalUrl;
      if (type !== 'text') {
        return true;
      }
      if (0 !== sender.target.search('#')) {
        return true;
      }
      if ('object' !== typeof this.setting.enabled) {
        this.setting.enabled = {};
      }
      if (!this.setting.enabled[sender.target]) {
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
      if (event.url && this._matchExclude(event.url, 'exclude_image')) {
        event.noImage = true;
      }
      event.viewport = this.setting.image_size;
      event.cb = function(title) {
        cache.put(originalUrl, title, 2 * 3600 * 1000);
        return commandManager.send(sender, textRouter, title);
      };
      this._queryTitle(event);
      return true;
    }

    _extractURL(text) {
      var allURLs, fixCJKInPath, temp;
      text = text.toString();
      
      //dirty hack to remove irc color code
      text = text.replace(/((?:\u0003\d\d?,\d\d?|\u0003\d\d?|\u0002|\u001d|\u000f|\u0016|\u001f))/g, '');
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
    }

    _queryTitle(event) {
      var getpage, p;
      getpage = () => {
        var deferred;
        
        // get runner
        deferred = Q.defer();
        this._getRunner().createPage((page) => {
          return deferred.resolve(page);
        });
        return deferred.promise;
      };
      this.emit('beforecreate', event);
      if (event.canceled) {
        return true;
      }
      p = getpage();
      
      // open page
      p = p.then((page) => {
        var deferred, e;
        page.set('settings.resourceTimeout', 5000);
        page.set('settings.webSecurityEnabled ', false);
        //page.set 'settings.loadImages', false
        page.set('settings.userAgent', 'Mozilla/5.0 (Windows NT 6.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.93 Safari/537.36');
        page.set('customHeaders', {
          "Accept-Language": Accept_Language
        });
        event.page = page;
        this.emit('beforeopen', event);
        if (event.canceled) {
          page.close();
          e = new Error('canceled');
          e.type = 'CANCELED';
          throw e;
        }
        if (this.debug) {
          console.log(`Title : opening URL ${event.url}`);
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
      });
      
      // after open page
      p = p.then((page) => {
        var e;
        event.pageResult = event.status;
        if (event.status === 'fail') {
          page.close();
          e = new Error('fail to open page');
          e.type = 'CANNOT_OPEN_PAGE';
          throw e;
        }
        return page;
      });
      
      // get title
      p = p.then((page) => {
        var deferred, e;
        event.queryCallback = () => {
          document.body.bgColor = 'white';
          return JSON.stringify({
            title: document.title,
            url: location.href,
            rwd: !!(document.querySelectorAll('meta[name=viewport]')).length
          });
        };
        this.emit('beforequery', event);
        if (event.canceled) {
          page.close();
          e = new Error('canceled');
          e.type = 'CANCELED';
          throw e;
        }
        deferred = Q.defer();
        page.evaluate(event.queryCallback, (result) => {
          event.result = JSON.parse(result);
          return deferred.resolve(page);
        });
        return deferred.promise;
      });
      
      // after get title
      p = p.then((page) => {
        var e;
        this.emit('afterquery', event);
        if (event.canceled) {
          page.close();
          e = new Error('canceled');
          e.type = 'CANCELED';
          throw e;
        }
        if (!event.title) {
          event.title = `[ ${event.result.title} ] - ${event.result.rwd ? 'Mobile supported - ' : ''}${Date.now() - event.timeOpen}ms - ${event.result.url}`;
        }
        if (this.debug) {
          console.log('Title : Page title is ' + event.title);
        }
        return page;
      });
      if (!event.noImage) {
        
        // set viewport
        p = p.then((page) => {
          var deferred, viewport;
          viewport = event.viewport || {
            width: 1366,
            height: 768
          };
          deferred = Q.defer();
          page.set('viewportSize', viewport, function(result) {
            console.log("Title : Viewport set to: " + result.width + "x" + result.height);
            return deferred.resolve(page);
          });
          return deferred.promise;
        });
        
        // create directory
        p = p.then((page) => {
          var deferred;
          deferred = Q.defer();
          tmp.dir(function(err, dirPath, cleanupCallback) {
            console.log(`Title : created dir ${dirPath}`);
            event.imagePath = path.resolve(dirPath, 'result.jpg');
            event.cleanupCallback = cleanupCallback;
            return deferred.resolve(page);
          });
          return deferred.promise;
        });
        
        // render image
        p = p.then((page) => {
          var deferred;
          deferred = Q.defer();
          page.render(event.imagePath, {
            format: 'jpeg',
            quality: '90'
          }, function() {
            console.log(`Title : file created at ${event.imagePath}`);
            return deferred.resolve(page);
          });
          return deferred.promise;
        });
        
        //upload image
        p = p.then((page) => {
          var clearUp, deferred;
          clearUp = function(path, cleanupCallback) {
            var e;
            try {
              return fs.unlink(path, function() {
                return cleanupCallback();
              });
            } catch (error1) {
              e = error1;
              return console.log(e);
            }
          };
          page.close();
          console.log(`Title : start to upload ${event.imagePath} to imgur`);
          deferred = Q.defer();
          imgur.uploadFile(event.imagePath).then(function(json) {
            event.imgurPath = json.data.link;
            console.log(`Title : uploaded ${event.imagePath}, URL is ${event.imgurPath}`);
            clearUp(event.imagePath, event.cleanupCallback);
            return deferred.resolve(null);
          }).catch(function(err) {
            console.error(err.message);
            clearUp(event.imagePath, event.cleanupCallback);
            return deferred.resolve(null);
          });
          return deferred.promise;
        });
      } else {
        
        //just close the page
        p = p.then((page) => {
          return page.close();
        });
      }
      
      //append url if screenshot exist
      p = p.then(() => {
        if (event.imgurPath) {
          event.title = event.title + " - screenshot: " + event.imgurPath;
        }
        return event.cb(event.title);
      });
      return p = p.catch(function(e) {
        return console.log(e);
      });
    }

    
      //configs
    _save() {
      return this.storage.set('titleParser', this.setting);
    }

    _toggle(value, sender) {
      if ('object' !== typeof this.setting.enabled) {
        this.setting.enabled = {};
      }
      if ('#' !== sender.target.slice(0, 1)) {
        return false;
      }
      if (value !== 'on' && value !== 'off') {
        return false;
      }
      if (value === 'on') {
        this.setting.enabled[sender.target] = true;
      } else {
        this.setting.enabled[sender.target] = false;
      }
      this._save();
      return true;
    }

    _setMode(value) {
      if (0 > this._getAllMatchModes().indexOf(value)) {
        return false;
      }
      this.setting.mode = value;
      this._save();
      return true;
    }

    _getAllMatchModes() {
      var key, modes, ref, value;
      modes = [];
      ref = this.matchRuleMap;
      for (key in ref) {
        value = ref[key];
        if (this.matchRuleMap.hasOwnProperty(key)) {
          modes.push(key);
        }
      }
      return modes;
    }

    _matchExclude(url, name = 'exclude') {
      var i, item, len, ref;
      ref = this.setting[name];
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        if (url.match(item)) {
          return true;
        }
      }
      return false;
    }

    _addExclude(regex, name = 'exclude') {
      var e;
      regex = regex.toString();
      if (indexOf.call(this.setting[name], regex) >= 0) {
        return true;
      }
      try {
        new RegExp(regex);
        this.setting[name].push(regex);
        this._save();
        return true;
      } catch (error1) {
        e = error1;
        return false;
      }
    }

    _removeExclude(regex, name = 'exclude') {
      var index;
      index = this.setting[name].indexOf(regex);
      if (index < 0) {
        return false;
      }
      this.setting[name].splice(index, 1);
      this._save();
      return true;
    }

    _getExclude(name = 'exclude') {
      return this.setting[name].slice(0);
    }

    _dropExclude(name = 'exclude') {
      this.setting[name] = [];
      this._save();
      return true;
    }

    _loadPlugins() {
      var e, i, len, plugin, plugins, results;
      plugins = loadFileIn(path.resolve(__dirname, 'plugins'));
      results = [];
      for (i = 0, len = plugins.length; i < len; i++) {
        plugin = plugins[i];
        try {
          plugin.module(this);
          if (this.debug) {
            results.push(console.log(`loaded plugin from ${plugin.path}`));
          } else {
            results.push(void 0);
          }
        } catch (error1) {
          e = error1;
          results.push(console.log(`fail to load plugin from ${plugin.path} due to`, e));
        }
      }
      return results;
    }

    _createRunner() {
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
            return console.log(`[Error] phantom instance killed due to ${signal}`);
          }
        }
      }, (ph, error) => {
        var old_createPage;
        //console.log 'create runner', ph
        this.fresh_phs.push(ph);
        ph.running = 0;
        old_createPage = ph.createPage;
        ph.createPage = (callback) => {
          var old_callback;
          ph.running += 1;
          ph.dirty = true;
          old_callback = callback;
          callback = (page) => {
            var old_close;
            //console.log 'create'
            old_close = page.close;
            page.close = (...args) => {
              ph.running -= 1;
              //console.log 'closed'
              old_close.apply(page, args);
              return this._finishPage();
            };
            return old_callback.call(null, page);
          };
          return old_createPage.call(ph, callback);
        };
        
        //console.log 'phantom instance created'
        if (error) {
          console.log(error);
        }
        this.waiting = false;
        return this._freshRunner();
      });
      return this.waiting = true;
    }

    _freshRunner() {
      if (!this.ph) {
        this.ph = this.fresh_phs.pop();
      }
      if (this.ph.dirty && this.ph.running === 0 && this.fresh_phs.length > 0) {
        this.ph.exit();
        return this.ph = this.fresh_phs.pop();
      }
    }

    //console.log "runner updated"
    _finishPage() {
      return this._freshRunner();
    }

    _getRunner() {
      if (!this.waiting && this.fresh_phs.length === 0) {
        this._createRunner();
      }
      return this.ph;
    }

  };

  module.exports = CommandTitle;

}).call(this);
