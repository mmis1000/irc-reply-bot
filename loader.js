const chile_process = require('child_process');
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const CHILD_MARKUP_EVN = require("./enum").CHILD_MARKUP_EVN
const path = require("path");
/*
 * Emits : 
 *     destroyed
 * parameter :
 *     filename : default filename of child
 * receive commands from child :
 *     init
 *     reload   (reason)
 *     exit     (reason)
 *     message  (message)
 *     pong
 * sends commands to child :
 *     init     (config)
 *     ping
 * IPC command Format :
 *     {
 *         'command' : command,
 *         'data'    : data
 *     }
 * child_process property
 *     callbackFired
 *     exited
 *     exiting
 *     inited
 */

function Loader (filename, scriptOptions) {
  EventEmitter.call(this);
  this.filename = path.resolve(__dirname, filename);
  
  this.scriptOptions = scriptOptions;
  
  this.currentScript = null;
  
  
  this.timeout = 0;
  this.intervalId = null;
  
  this.sigKillWait = 5000;
  
  this.duringInit  = false;
  
  this.scheduleExit = false;
  
  this.config = {
    maxInitRetry : 3
  };
  
  
  this.initRetry = this.config.maxInitRetry;
}
util.inherits(Loader, EventEmitter);

Loader.prototype.initBot = function () {
  this.initRetry--;
  console.log('=============================================\r\n[Loader] starting script...\r\n')
  var childEnv = {};
  
  for (var name in process.env) {
    childEnv[name] = process.env[name];
  }
  childEnv[CHILD_MARKUP_EVN] = 'TRUE';
  
  this.currentScript = chile_process.fork(this.filename, [], {
    env : childEnv,
    silent: true
  });
  
  this.currentScript.on('message', this.onScriptEvent.bind(this));
  this.currentScript.on('exit', this.onScriptExit.bind(this));
  this.currentScript.on('error', this.onScriptError.bind(this));
  
  this.currentScript.stdout.pipe(process.stdout, {end : false});
  this.currentScript.stderr.pipe(process.stderr, {end : false});
};

Loader.prototype.reload = function () {
  this.shutdownScript(function () {
    this.afterDestroyScript(event);
  }.bind(this));
};

Loader.prototype.shutdownScript = function (cb_) {
  var cb = function () {
    // unpipe streams
    exitingScript.stdout.unpipe(process.stdout);
    exitingScript.stderr.unpipe(process.stderr);
    cb_();
  }
    
  console.log('[Loader] shuting down script...')
  var exitingScript = this.currentScript;
  exitingScript.removeAllListeners('message');
  exitingScript.removeAllListeners('exit');
  exitingScript.removeAllListeners('error');
  exitingScript.exiting = true;
  
  this.currentScript = null;
  
  // fire callback directly when the process is actually terminated
  if (exitingScript.exited) {
    if (exitingScript.callbackFired) { return; }
    process.nextTick(cb);
    exitingScript.callbackFired = true;
    return;
  }
  
  exitingScript.on('error', function () {
    if (exitingScript.callbackFired) { return; }
    //bad exit;
    console.error('[Loader] Fail to exit current script, killing script with SIGKILL!!!');
    try {
      process.kill(exitingScript.pid, 'SIGKILL');
    } catch (e) {
      console.error(e);
    }
    exitingScript.callbackFired = true;
    cb();
  });
  exitingScript.on('exit', function () {
    if (exitingScript.callbackFired) { return; }
    cb();
    exitingScript.callbackFired = true;
  });
  
  // firing error when script doesn't stop
  setTimeout(function () {
    if (exitingScript.callbackFired !== true) {
      exitingScript.emit(new Error('exit timeout'))
    }
  }, this.sigKillWait);

  
  // win32 Signal workaround
  if (process.platform === "win32") {
    exitingScript.send({command : 'exit'})
  } else {
    exitingScript.kill('SIGINT');
  }
};

Loader.prototype.onScriptEvent = function(event) {
  //console.log('[Loader] got script event %j', event);
  if (event.command === 'init') {
    this.initRetry = this.config.maxInitRetry;
    this.currentScript.inited = true;
  }
  if (event.command === 'reload') {
    this.shutdownScript(function () {
      this.afterDestroyScript(event);
    }.bind(this));
  }
  if (event.command === 'exit') {
    this.scheduleExit = true;
    this.shutdownScript(function () {
      this.afterDestroyScript(event);
    }.bind(this));
  }
};

Loader.prototype.onScriptExit = function(event) {
  console.log('[Loader] script exited...')
  if (this.scheduleExit) {
    event = null;
  }
  this.currentScript.exited = true;
  this.shutdownScript(function () {
    this.afterDestroyScript(event);
  }.bind(this));
};

Loader.prototype.onScriptError = function(event) {
  console.log('[Loader] script error...')
  if (this.duringInit) {
    this.initRetry--;
  }
  if (this.initRetry === 0) {
    this.scheduleExit = true;
  }
  this.shutdownScript(function () {
    this.afterDestroyScript(event);
  }.bind(this));
};
/*
Loader.prototype.onScriptTimeout = function(event) {
  var err = new Error('[Loader] script timeout');
  this.shutdownScript(function () {
    this.afterDestroyScript(event);
  }.bind(this));
};
*/
Loader.prototype.afterDestroyScript = function(error) {
  console.log('[Loader] after script destroy...');
  
  if (this.initRetry === 0) {
    this.scheduleExit = true;
    error = new Error('Too much init failure !!!')
    error.reason = 'Too much init failure !!!';
  }
  if (!this.scheduleExit) {
    // recreate a new bot
    this.initBot();
  } else if (!error){
    this.emit('exit');
  } else {
    console.error('[Loader] script exit due to %j', error);
    this.emit('exit', error);
  }
};

Loader.prototype.updateTimeout = function () {
  var script = this.currentScript;
  var id = Math.random()
  
  if (!script || !script.inited) {
    return;
  }
  
  var callbackListener = function (ev) {
    if (ev.command === 'pong' && ev.data === id) {
      //console.log('[Loader] bot heart beating...')
      clearTimeout(timeoutId);
      script.removeListener('message', callbackListener);
    }
  };
  
  script.on('message', callbackListener);
  script.send({
    command : 'ping',
    data : id
  })
  
  var timeoutListener = function () {
    var error = new Error('script failed to response')
    error.reason = 'script failed to response';
    script.removeListener('message', callbackListener);
    if (script.exiting !== true) {
      this.shutdownScript(function () {
        this.afterDestroyScript(error);
      }.bind(this));
    }
  }.bind(this);
  
  var timeoutId = setTimeout(timeoutListener, this.timeout);
  
};
Loader.prototype.setTimeout = function (ms) {
  if (this.intervalId !== null) {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }
  this.timeout = ms;
  if (ms > 0) {
    this.intervalId = setInterval(this.updateTimeout.bind(this), this.timeout)
  }
};
/*
Loader.prototype.onBotTimeout = function () {
  console.error('the script failed to response, killing...');
  this.shutdownScript(function () {
    this.afterDestroyScript(event);
  }.bind(this));
};

Loader.prototype.updateTimeoutListener = function() {
  clearTimeout(this.timeout);
  if (this.timeout > 0) {
    this.timeoutId = setTimeout(this.onBotTimeout.bind(this), this.timeout);
  }
}

Loader.prototype.setBotTimeout = function(ms) {
  this.timeout = ms;
  this.updateTimeoutListener()
};
*/
Loader.prototype.destroy = function(event) {
  this.scheduleExit = true;
  this.shutdownScript(function () {
    this.afterDestroyScript(event);
  }.bind(this));
};
module.exports = Loader;