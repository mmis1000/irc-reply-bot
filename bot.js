const CHILD_MARKUP_EVN = require("./enum").CHILD_MARKUP_EVN
//console.log(process.version);
function Bot () {
  this.manager = null;
  this.router = null;
  this.adminCommand = null;
  this.config = null;
  this.helper = null;
  this._exiting = false;
  
  this.isChild = null;
  this.exiting = false;
  
  this._initChildHandler();
  this._load();
  this._setExitHandle();
}

Bot.prototype._load = function () {
  this._loadConfig();
  this._loadRouter();
  this._loadManager();
  this._loadCoreModule();
  this._loadAdminModule();
  
  this._loadAddition();
  
};

Bot.prototype._loadAdminModule = function () {
  this.adminCommand = new (require("./lib/core/admin")) (this);
  this.manager.load(this.adminCommand);
};

Bot.prototype._loadRouter = function () {
  this.router = new (require('./lib/router/ircrouter')) (this.config.host, this.config.nick, this.config.channels);
  if (this.config.floodProtection) {
    this.router.enableFloodProtection(this.config.floodProtection);
  }
  if (this.config.pingTimeout) {
    this.router.enableTiemout(this.config.pingTimeout)
  }
  //console.log(this.config.floodProtection, this.config.pingTimeout);
};

Bot.prototype._loadManager = function () {
  this.manager = new (require("./lib/commandmanager"))(this.helper.createStorage(this.config.saveName), this.router);
  this.manager.identifier = this.config.identifier;
};

Bot.prototype._loadConfig = function () {
  this.config = require("./config");
  this.helper = require("./bootstraphelper")(this.config.saveFolder);
};

Bot.prototype._loadCoreModule = function () {
  
};

Bot.prototype._loadAddition = function () {
  this.config.init(this.manager, this.helper);
}

Bot.prototype._initChildHandler = function () {
  var self = this;
  if (!process.env[CHILD_MARKUP_EVN]) {
    this.isChild = false;
  } else {
    process.on('message', function (ev) {
      self.onMessage(ev.command, ev.data)
    })
    this.isChild = true;
    this.postMessage('init');
    
  }
};


Bot.prototype.reload = function () {
  /*
   * Since it is impossible to reload the process itself without ran by a
   * loader.
   */
  if (!this.isChild) {
    return false;
  } else {
    this.postMessage('reload');
    return true;
  }
};

Bot.prototype.exit = function () {
  if (this.exiting) {
    return;
  }
  
  this.exiting = true;
  
  if (this.isChild) {
    this.postMessage('exit');
  } else {
    process.kill(process.pid, 'SIGINT');
    // so it has time for every module to shutdown
  }
};

Bot.prototype.onMessage = function (command, data) {
  if (command === 'ping') {
    this.postMessage('pong', data);
    return;
  }
};

Bot.prototype.postMessage = function (command, data) {
  process.send({
    command : command,
    data : data
  });
};

//fix exit Handler
Bot.prototype._setExitHandle = function () {
  var self = this;
  process.stdin.resume();//so the program will not close instantly

  function exitHandler(options, err) {
    //console.log((new Error).stack);
    
    if (options.cleanup) console.log('cleaning up...');
    if (err) {
      console.error(err, err.stack);
    }
    if (options.exit) {
      if (self._exiting) {return;}
      console.log('exit phase called')
      self._exiting = true;
      
      self._beforeExit(function () {
        if (options.originalListeners && options.originalListeners.length > 0) {
          // call the listeners which were removed from process previously
          options.originalListeners.forEach(function(listener) {
            listener.call(null, err)
          });
        } else {
          process.exit();
        }
      });
    };
  }

  // do something when app is closing
  process.on('exit', exitHandler.bind(null,{cleanup:true}));
  
  // catches ctrl+c event
  var originalSIGINT = process.listeners('SIGINT');
  process.removeAllListeners('SIGINT');
  process.on('SIGINT', exitHandler.bind(null, {exit:true, originalListeners:originalSIGINT}));
  
  // catches signal
  var originalSIGTERM = process.listeners('SIGTERM');
  process.removeAllListeners('SIGTERM');
  process.on('SIGTERM', exitHandler.bind(null, {exit:true, originalListeners:originalSIGTERM}));

  // catches uncaught exceptions
  process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

  // win32 Signal workaround
  if (process.platform === "win32" && this.isChild === true) {
    process.on('message', function (ev) {
      if (ev.command === 'exit') {
        process.exit('SIGINT');
      }
    })
  }

}

Bot.prototype._beforeExit = function (cb) {
  this.manager.handleRaw(null, 'exit', null, this.router);
  console.log('disconnecting from server...');
  //setTimeout(function () {}, 100000000);
  this.router.disconnect('good bye!', function () {
    console.log('disconnected from server!');
    cb();
  });
};

new Bot();

