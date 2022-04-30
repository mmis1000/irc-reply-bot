var Ban, Bind, CommandManager, EventEmitter, Icommand, LRU, Message, PipeRouter, Sender, TraceRouter, co, escapeRegex,
  indexOf = [].indexOf;

({EventEmitter} = require('events'));

Bind = require('./core/bind.js');

Ban = require('./core/ban.js');

Icommand = require('./icommand');

Message = require('./models/message');

TraceRouter = require('./router/tracerouter');

PipeRouter = require('./router/piperouter');

Sender = require('./senter');

LRU = require('lru-cache');

co = require('co');

escapeRegex = function(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

CommandManager = class CommandManager extends EventEmitter {
  constructor(storage1, textRouter) {
    var deopCommand, helpCommand, opCommand, opList, sudoCommand;
    super();
    this.storage = storage1;
    // @identifier = "!"
    this.commandFormat = /^.*$/g;
    // @keywordPrefix = "^"
    // these command is deeply hook into runtime thus cannot be implement seperately
    // @reservedKeyWord = ["help", "op", "deop", "bind", "unbind", "bindlist", "ban", "unban"];
    this.sessionLength = 10 * 60 * 1000;
    this.sessionExpire = {};
    this.userInfoCache = LRU({
      max: 400,
      maxAge: 1000 * 60 * 60 * 2
    });
    this.defaultOps = [];
    this.commands = [];
    this.commandMap = {};
    this.commandAliasMap = {};
    
    //for multi command module
    this.modules = [];
    this.aliasMap = {};
    this.routers = [];
    //bind default commands
    helpCommand = {
      handle: (sender, text, args, storage, textRouter, commandManager) => {
        return this._commandHelp(sender, text, args, storage, textRouter, commandManager);
      },
      help: function(commandPrefix) {
        return ["command for print out help message! usage : ", `${commandPrefix}    for all commands.`, `${commandPrefix} [commandName]    for specified command!`];
      },
      hasPermission: function() {
        return true;
      },
      handleRaw: function(sender, type, content) {
        return false;
      }
    };
    this.register('help', helpCommand, ['?']);
    opCommand = {
      handle: (sender, text, args, storage, textRouter, commandManager) => {
        return this._commandOp(sender, text, args, storage, textRouter, commandManager);
      },
      help: function(commandPrefix) {
        return ["command to op someone! usage : ", `${commandPrefix} nick`];
      },
      hasPermission: (sender, text, args, storage, textRouter, commandManager, fromBinding) => {
        if (fromBinding) {
          return false;
        }
        return commandManager.isOp(sender.sender);
      },
      handleRaw: function(sender, type, content) {
        return false;
      }
    };
    this.register('op', opCommand, []);
    deopCommand = {
      handle: (sender, text, args, storage, textRouter, commandManager) => {
        return this._commandDeop(sender, text, args, storage, textRouter, commandManager);
      },
      help: function(commandPrefix) {
        return ["command to deop someone! usage : ", `${commandPrefix} nick`];
      },
      hasPermission: (sender, text, args, storage, textRouter, commandManager, fromBinding) => {
        if (fromBinding) {
          return false;
        }
        return commandManager.isOp(sender.sender);
      },
      handleRaw: function(sender, type, content) {
        return false;
      }
    };
    this.register('deop', deopCommand, []);
    sudoCommand = {
      handle: (sender, text, args, storage, textRouter, commandManager, fromBinding, originalMessage) => {
        return this._commandSudo(sender, text, args, storage, textRouter, commandManager, originalMessage);
      },
      help: function(commandPrefix) {
        return ["update current user session to op session! usage : ", `${commandPrefix} # login or log out`, `${commandPrefix} <command text> # exec command as operator`];
      },
      hasPermission: (sender, text, args, storage, textRouter, commandManager, fromBinding) => {
        if (fromBinding) {
          return false;
        }
        return true;
      },
      handleRaw: function(sender, type, content) {
        return false;
      }
    };
    this.register('sudo', sudoCommand, []);
    this.load(new Bind());
    this.load(new Ban());
    //bind input stream
    if (textRouter) {
      this.defaultRouter = textRouter;
      this.addRouter(textRouter);
      opList = this.storage.get("ops", this.defaultOps);
      if (opList.length === 0) {
        textRouter.on('connect', function() {
          return textRouter.output("[Warning] no op setted, assume everyone has operator permission");
        });
      }
      this.currentRouter = textRouter;
    }
  }

  handleRaw(sender, type, contents, textRouter) {
    var command, event, module, ref, ref1;
    event = {
      cancelled: false
    };
    ref = this.commands;
    for (command of ref) {
      this.commandMap[command].handleRaw(sender, type, contents, textRouter, this, event);
    }
    ref1 = this.modules;
    for (module of ref1) {
      module.handleRaw(sender, type, contents, textRouter, this, event);
    }
    return event;
  }

  // handleText: (sender, text, textRouter, isCommand = false, fromBinding = false, originalMessage = null)->
  handleText(sender, text, textRouter, opts = {}, originalMessage = null) {
    var done, result;
    result = Object.create(opts);
    result.isCommand = result.isCommand || false;
    result.fromBinding = result.fromBinding || false;
    result.text = text;
    // hold the router
    done = textRouter.async("");
    return co.call(this, function*() {
      var args, command, commandManager, currentIdentifier, fromBinding;
      currentIdentifier = "(unknown identifier)";
      if (textRouter.getIdentifier) {
        currentIdentifier = textRouter.getIdentifier();
      }
      this.currentRouter = textRouter;
      commandManager = this;
      result.isCommand = result.isCommand || textRouter.isCommand(text, sender, this);
      result.sender = sender;
      result.text = text;
      result.fromBinding = fromBinding || false;
      if ((yield Promise.resolve((this.handleRaw(sender, "before_iscommand", result, textRouter)).cancelled))) {
        done();
        return false;
      }
      text = result.text;
      fromBinding = result.fromBinding;
      if (!result.isCommand) {
        //it seems it isn't a command, so return at fast as possible
        done();
        return false;
      }
      args = opts.args || this.parseArgs(text);
      command = args[0];
      if (!fromBinding && !command.match(this.commandFormat)) {
        done();
        return false;
      }
      if ((this.commands.indexOf(command)) < 0) {
        if (this.aliasMap[command]) {
          command = this.aliasMap[command];
        } else {
          done();
          return false;
        }
      }
      if (((yield Promise.resolve(this.handleRaw(sender, "before_permission", [sender, text, args, this.storage, textRouter, commandManager, fromBinding], textRouter)))).cancelled) {
        done();
        return false;
      }
      if (this.commandMap[command].hasPermission(sender, text, args, this.storage, textRouter, commandManager, fromBinding)) {
        if (((yield Promise.resolve(this.handleRaw(sender, "before_command", [sender, text, args, this.storage, textRouter, commandManager, fromBinding], textRouter)))).cancelled) {
          done();
          return false;
        }
        if (!this.commandMap[command].handle(sender, text, args, this.storage, textRouter, commandManager, fromBinding, originalMessage)) {
          this._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, this.commandMap[command].help(`${currentIdentifier} ${command}`));
        }
        return done();
      } else {
        this._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, 'Access Denied! You may have to login or this command was not allowed to be exec from keyword binding.');
        return done();
      }
    }).catch(function(err) {
      console.error(err.stack || err.toString());
      return done();
    });
  }

  register(keyword, iCommand, aliasList) {
    var command, results;
    if (!(iCommand instanceof Icommand)) {
      iCommand = Icommand.__createAsInstance__(iCommand);
    }
    this.commands.push(keyword);
    this.commandMap[keyword] = iCommand;
    this.commandAliasMap[keyword] = aliasList;
//generate reverse map for fast access
    results = [];
    for (command of aliasList) {
      results.push(this.aliasMap[command] = keyword);
    }
    return results;
  }

  load(moudle) {
    this.modules.push(moudle);
    moudle.handleRaw(null, 'init', null, null, this);
    if (moudle.name !== null) {
      return this.register(moudle.name, moudle, []);
    }
  }

  getStorage() {
    return this.storage;
  }

  isOp(name, noSession) {
    var authed, opList;
    opList = this.storage.get("ops", this.defaultOps);
    if (opList.length === 0) {
      return true;
    }
    if (noSession) {
      return indexOf.call(opList, name) >= 0;
    }
    
    //console.log(@sessionExpire)
    authed = this.sessionExpire[name] && (this.sessionExpire[name] >= Date.now() || this.sessionExpire[name] === -1);
    if (this.sessionExpire[name] < Date.now() || this.sessionExpire[name] === -1) {
      delete this.sessionExpire[name];
    }
    return authed;
  }

  /*
   * @method
   * private
   */
  login(name, once) {
    if (once) {
      return this.sessionExpire[name] = -1;
    } else {
      return this.sessionExpire[name] = Date.now() + this.sessionLength;
    }
  }

  /*
   * @method
   * private
   */
  logout(name, once) {
    return delete this.sessionExpire[name];
  }

  /*
   * @method
   * @deprecated
   */
  _sendToPlace(textRouter, from, to, channel, text) {
    var message, sender, target;
    if (0 === to.search(/^#/)) {
      target = to;
    } else {
      target = from;
    }
    // textRouter.output(message, target)
    if (Array.isArray(text)) {
      text = text.join('\n');
    }
    sender = new Sender(from, to, text, []);
    message = new Message(text, [], true, true, true);
    console.warn((new Error('[deprcated] _sendToPlace')).stack);
    return this.sendMessage(sender, textRouter, message, target);
  }

  send(sender, router, text) {
    var message;
    message = new Message(text, [], true, true, true);
    return this.sendMessage(sender, router, message);
  }

  sendPv(sender, router, text) {
    var message;
    message = new Message(text, [], true, true, true);
    return this.sendMessage(sender, router, message, sender.sender);
  }

  sendChannel(sender, router, text) {
    var message, results, target, targets;
    message = new Message(text, [], true, true, true);
    if (!Array.isArray(sender.channel)) {
      targets = [sender.channel];
    } else {
      targets = sender.channel;
    }
    results = [];
    for (target of targets) {
      results.push(this.sendMessage(sender, router, message, target));
    }
    return results;
  }

  /**
   * test if we can send message to target through this router. 
   * If can't, return the correct one.
   */
  selectRouter(target, currentRouter) {
    var ref, router, routerId, targetId;
    if (currentRouter instanceof PipeRouter) {
      return currentRouter;
    }
    if (currentRouter instanceof TraceRouter) {
      return currentRouter;
    }
    target = target.split(/@/g);
    if (!target[1]) {
      targetId = '';
    } else {
      targetId = target[target.length - 1];
    }
    routerId = currentRouter.getRouterIdentifier() || '';
    if (targetId === routerId) {
      return currentRouter;
    }
    ref = this.routers;
    for (router of ref) {
      routerId = router.getRouterIdentifier() || '';
      if (targetId === routerId) {
        return router;
      }
    }
    // if we were unable to handle it, just return
    console.warn(`unable to find target router ${targetId}`);
    return currentRouter;
  }

  sendMessage(sender, router, message, target) {
    var res;
    if (!target) {
      if (0 === sender.target.search(/^#/)) {
        target = sender.target;
      } else {
        target = sender.sender;
      }
    }
    router = this.selectRouter(target, router);
    res = router.outputMessage(message, target);
    if ((res != null) && 'function' === typeof res.then) {
      res.then((temp) => {
        return this.emitMessageEvent(sender, temp.message, temp.target, router);
      }).catch((err) => {
        return console.error(err.message || err.stack || err);
      });
    } else if (res === true || 'boolean' !== typeof res) {
      return this.emitMessageEvent(sender, message, target, router);
    } else {
      return console.error('fail to send message from ' + sender.sender + ' to ' + target);
    }
  }

  /*
   * @method
   * @private
   */
  emitMessageEvent(sender, message, target, router) {
    this.handleRaw(sender, 'outputMessage', {
      message: message,
      target: target
    }, router);
    return this.handleRaw(sender, 'output', {
      message: message.text,
      target: target
    }, router);
  }

  parseArgs(text) {
    var args, argsText;
    if (this.currentRouter.parseArgs) {
      return this.currentRouter.parseArgs(text);
    }
    argsText = 0 === (text.search(escapeRegex(this.identifier))) ? text.replace(escapeRegex(this.identifier), "") : text;
    argsText = argsText.replace(/^\s*/g, "");
    args = argsText.split(" ");
    return args;
  }

  _commandHelp(sender, text, args, storage, textRouter, commandManager) {
    var command, currentIdentifier, i, index, len, message, ref;
    currentIdentifier = "(unknown identifier)";
    if (textRouter.getIdentifier) {
      currentIdentifier = textRouter.getIdentifier();
    }
    if (args.length > 2) {
      return false;
    }
    if (args.length === 1) {
      message = "";
      ref = this.commands;
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        command = ref[index];
        message += command;
        if (this.commandAliasMap[command].length > 0) {
          message += `[${this.commandAliasMap[command].join(', ')}]`;
        }
        if (index !== this.commands.length - 1) {
          message += ", ";
        }
      }
      commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, `all commands : ${message}\nuse { ${currentIdentifier}help [command] } to see usage of command`);
    } else {
      if ((this.commands.indexOf(args[1])) < 0) {
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "no such command!");
      } else {
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, this.commandMap[args[1]].help(`${currentIdentifier}${args[1]}`));
      }
    }
    return true;
  }

  _commandOp(sender, text, args, storage, textRouter, commandManager) {
    var index, newOp, ops;
    if (args.length !== 2) {
      return false;
    }
    newOp = textRouter.fromDisplayName(args[1]);
    ops = this.storage.get("ops", this.defaultOps);
    index = ops.indexOf(newOp);
    if (0 > index) {
      ops.push(newOp);
      commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, `oped ${newOp}`);
    } else {
      commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, `${newOp} is already op!`);
    }
    this.storage.set("ops", ops);
    return true;
  }

  _commandDeop(sender, text, args, storage, textRouter, commandManager) {
    var index, ops, removeOp;
    if (args.length !== 2) {
      return false;
    }
    removeOp = textRouter.fromDisplayName(args[1]);
    ops = this.storage.get("ops", this.defaultOps);
    index = ops.indexOf(removeOp);
    if (0 > index) {
      commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, `${removeOp} is not op`);
    } else {
      ops.splice(index, 1);
      commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, `deoped ${removeOp}`);
    }
    this.storage.set("ops", ops);
    return true;
  }

  _commandSudo(sender, text, args, storage, textRouter, commandManager, originalMessage) {
    var command;
    if (args.length !== 1) {
      command = args.slice(1).join(' ');
    }
    if (command && (args[0] === (this.parseArgs(command))[0])) {
      commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, `Sorry, but it does'nt make sence to exec ${args[0]} from ${args[0]}.`);
      return true;
    }
    if (this.isOp(sender.sender)) {
      if (command) {
        this.handleText(sender, command, textRouter, {
          fromBinding: false,
          isCommand: true,
          args: args.slice(1)
        });
      } else {
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "logout successfully");
        this.logout(sender.sender);
      }
      return true;
    }
    //textRouter.output "test", sender.channel
    textRouter.whois(sender.sender, (info) => {
      var trace;
      //textRouter.output "test#{JSON.stringify info}", sender.channel
      if (this.isOp(info.account, true)) {
        if (command) {
          this.login(sender.sender);
          
          // trace the command status, finish command, then log out
          trace = new TraceRouter(textRouter);
          this.handleText(sender, command, trace, {
            fromBinding: false,
            isCommand: true,
            args: args.slice(1)
          });
          trace.forceCheck();
          return trace.promise.then(() => {
            return this.logout(sender.sender);
          }).catch(function(err) {
            console.error(err.stack || err.toString());
            return this.logout(sender.sender);
          });
        } else {
          this.login(sender.sender);
          return commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "login successfully");
        }
      } else {
        return commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "access denied");
      }
    });
    return true;
  }

  addRouter(textRouter) {
    this.routers.push(textRouter);
    if (!this.defaultRouter) {
      this.defaultRouter = textRouter;
    }
    if (!this.currentRouter) {
      this.currentRouter = textRouter;
    }
    textRouter.on("input", (message, sender, router = textRouter) => {
      var messageModel;
      this.lastChannel = sender.channel;
      this.lastSender = sender.channel;
      messageModel = new Message(message, [], true, true);
      this.handleRaw(sender, "text", message, router);
      this.handleRaw(sender, "message", messageModel, router);
      return this.handleText(sender, message, router, {
        fromBinding: false,
        isCommand: false
      }, messageModel);
    });
    textRouter.on("message", (message, sender, router = textRouter) => {
      this.lastChannel = sender.channel;
      this.lastSender = sender.channel;
      this.handleRaw(sender, "message", message, router);
      if (message.asText) {
        this.handleRaw(sender, "text", message.text, router);
      }
      
      // for binding to detect stickers or other...
      // if message.asCommand
      return this.handleText(sender, message.text, router, {
        fromBinding: false,
        isCommand: false
      }, message);
    });
    textRouter.on("rpl_join", (channel, sender, router = textRouter) => {
      return this.handleRaw(sender, "join", channel, router);
    });
    textRouter.on("rpl_raw", (reply, router = textRouter) => {
      return this.handleRaw(null, "raw", reply, router);
    });
    return textRouter.emit('manager_register', this);
  }

  toDisplayName(sender) {
    var router;
    if (sender && 'object' === typeof sender) {
      sender = sender.sender;
    }
    if ('string' !== typeof sender) {
      return '' + sender;
    }
    router = /@(.*)$/.exec(sender);
    if (router) {
      router = router[1];
    } else {
      router = '';
    }
    router = this.routers.find(function(messageRouter) {
      return router === messageRouter.getRouterIdentifier();
    });
    if (!router) {
      return '' + sender;
    }
    return router.toDisplayName(sender);
  }

  hasCommand(command) {
    if (!command.match(this.commandFormat)) {
      return false;
    }
    if ((this.commands.indexOf(command)) >= 0) {
      return true;
    }
    if (this.aliasMap[command]) {
      return true;
    }
    return false;
  }

};

module.exports = CommandManager;
