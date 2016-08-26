(function() {
  var Ban, Bind, CommandManager, EventEmitter, Icommand, Message, co, escapeRegex,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  EventEmitter = require('events').EventEmitter;

  Bind = require('./core/bind.js');

  Ban = require('./core/ban.js');

  Icommand = require('./icommand');

  Message = require('./models/message');

  co = require('co');

  escapeRegex = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  };

  CommandManager = (function(superClass) {
    extend(CommandManager, superClass);

    function CommandManager(storage1, textRouter) {
      var deopCommand, helpCommand, opCommand, opList, sudoCommand;
      this.storage = storage1;
      this.identifier = "!";
      this.commandFormat = /^.*$/g;
      this.keywordPrefix = "^";
      this.reservedKeyWord = ["help", "op", "deop", "bind", "unbind", "bindlist", "ban", "unban"];
      this.sessionLength = 10 * 60 * 1000;
      this.sessionExpire = {};
      this.defaultOps = [];
      this.commands = [];
      this.commandMap = {};
      this.commandAliasMap = {};
      this.modules = [];
      this.aliasMap = {};
      this.routers = [];
      helpCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandHelp(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command for print out help message! usage : ", commandPrefix + "    for all commands.", commandPrefix + " [commandName]    for specified command!"];
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
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandOp(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command to op someone! usage : ", commandPrefix + " nick"];
        },
        hasPermission: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
            if (fromBinding) {
              return false;
            }
            return commandManager.isOp(sender.sender);
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.register('op', opCommand, []);
      deopCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandDeop(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command to deop someone! usage : ", commandPrefix + " nick"];
        },
        hasPermission: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
            if (fromBinding) {
              return false;
            }
            return commandManager.isOp(sender.sender);
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.register('deop', deopCommand, []);
      sudoCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager, fromBinding, originalMessage) {
            return _this._commandSudo(sender, text, args, storage, textRouter, commandManager, originalMessage);
          };
        })(this),
        help: function(commandPrefix) {
          return ["update current user session to op session! usage : ", commandPrefix + " # login or log out", commandPrefix + " <command text> # exec command as operator"];
        },
        hasPermission: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
            if (fromBinding) {
              return false;
            }
            return true;
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.register('sudo', sudoCommand, []);
      this.load(new Bind);
      this.load(new Ban);
      this.defaultRouter = textRouter;
      this.routers.push(textRouter);
      this.addRouter(textRouter);

      /*
      textRouter.on "input", (message, sender)=>
        
        @lastChannel = sender.channel
        @lastSender = sender.channel
        
        @handleRaw sender, "text", message, textRouter
        @handleText sender, message, textRouter
      
      textRouter.on "rpl_join", (channel, sender)=>
        @handleRaw sender, "join", channel, textRouter
      
      textRouter.on "rpl_raw", (reply)=>
        @handleRaw null, "raw", reply, textRouter
       */
      opList = this.storage.get("ops", this.defaultOps);
      if (opList.length === 0) {
        textRouter.on('connect', function() {
          return textRouter.output("[Warning] no op setted, assume everyone has operator permission");
        });
      }
      this.currentRouter = textRouter;
    }

    CommandManager.prototype.handleRaw = function(sender, type, contents, textRouter) {
      var command, event, i, j, len, len1, module, ref, ref1;
      event = {
        cancelled: false
      };
      ref = this.commands;
      for (i = 0, len = ref.length; i < len; i++) {
        command = ref[i];
        this.commandMap[command].handleRaw(sender, type, contents, textRouter, this, event);
      }
      ref1 = this.modules;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        module = ref1[j];
        module.handleRaw(sender, type, contents, textRouter, this, event);
      }
      return event;
    };

    CommandManager.prototype.handleText = function(sender, text, textRouter, isCommand, fromBinding, originalMessage) {
      var done;
      if (isCommand == null) {
        isCommand = false;
      }
      if (fromBinding == null) {
        fromBinding = false;
      }
      if (originalMessage == null) {
        originalMessage = null;
      }
      done = textRouter.async();
      return co.call(this, function*() {
        var args, command, commandManager, currentIdentifier, identifierRegex, result;
        currentIdentifier = this.identifier;
        if (textRouter.getIdentifier) {
          currentIdentifier = textRouter.getIdentifier();
        }
        this.currentRouter = textRouter;
        result = {};
        commandManager = this;
        if (!textRouter.isCommand) {
          result.isCommand = isCommand || ((text.search(escapeRegex(currentIdentifier))) === 0);
        } else {
          result.isCommand = isCommand || textRouter.isCommand(text, sender, this);
        }
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
          done();
          return false;
        }
        identifierRegex = escapeRegex(this.identifier);

        /*
        if 0 == text.search identifierRegex
          argsText = text.replace @identifier, ""
        else
          argsText = text
        
        argsText = argsText.replace /^\s+/g, ""
         */
        args = this.parseArgs(text);
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
            this._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, this.commandMap[command].help(currentIdentifier + " " + command));
          }
          return done();
        } else {
          this._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, 'Access Denied! You may have to login or this command was not allowed to be exec from keyword binding.');
          return done();
        }
      })["catch"](function(err) {
        console.error(err.stack || err.toString());
        return done();
      });
    };

    CommandManager.prototype.register = function(keyword, iCommand, aliasList) {
      var command, i, len, results;
      if (!(iCommand instanceof Icommand)) {
        iCommand = Icommand.__createAsInstance__(iCommand);
      }
      this.commands.push(keyword);
      this.commandMap[keyword] = iCommand;
      this.commandAliasMap[keyword] = aliasList;
      results = [];
      for (i = 0, len = aliasList.length; i < len; i++) {
        command = aliasList[i];
        results.push(this.aliasMap[command] = keyword);
      }
      return results;
    };

    CommandManager.prototype.load = function(moudle) {
      this.modules.push(moudle);
      moudle.handleRaw(null, 'init', null, null, this);
      if (moudle.name !== null) {
        return this.register(moudle.name, moudle, []);
      }
    };

    CommandManager.prototype.getStorage = function() {
      return this.storage;
    };

    CommandManager.prototype.isOp = function(name, noSession) {
      var authed, opList;
      opList = this.storage.get("ops", this.defaultOps);
      if (opList.length === 0) {
        return true;
      }
      if (noSession) {
        return indexOf.call(opList, name) >= 0;
      }
      authed = this.sessionExpire[name] && (this.sessionExpire[name] >= Date.now() || this.sessionExpire[name] === -1);
      if (this.sessionExpire[name] < Date.now() || this.sessionExpire[name] === -1) {
        delete this.sessionExpire[name];
      }
      return authed;
    };

    CommandManager.prototype.login = function(name, once) {
      if (once) {
        return this.sessionExpire[name] = -1;
      } else {
        return this.sessionExpire[name] = Date.now() + this.sessionLength;
      }
    };

    CommandManager.prototype.logout = function(name, once) {
      return delete this.sessionExpire[name];
    };

    CommandManager.prototype._sendToPlace = function(textRouter, from, to, channel, message) {
      var target;
      if (0 === to.search(/^#/)) {
        target = to;
      } else {
        target = from;
      }
      return textRouter.output(message, target);
    };

    CommandManager.prototype.send = function(sender, router, text) {
      var message;
      message = new Message(text, [], true, true, true);
      return this.sendMessage(sender, router, message);
    };

    CommandManager.prototype.sendPv = function(sender, router, text) {
      var message;
      message = new Message(text, [], true, true, true);
      return this.sendMessage(sender, router, message, sender.sender);
    };

    CommandManager.prototype.sendChannel = function(sender, router, text) {
      var i, len, message, results, target, targets;
      message = new Message(text, [], true, true, true);
      if (!Array.isArray(sender.channel)) {
        targets = [sender.channel];
      } else {
        targets = sender.channel;
      }
      results = [];
      for (i = 0, len = targets.length; i < len; i++) {
        target = targets[i];
        results.push(this.sendMessage(sender, router, message, target));
      }
      return results;
    };

    CommandManager.prototype.sendMessage = function(sender, router, message, target) {
      var res;
      if (!target) {
        if (0 === sender.target.search(/^#/)) {
          target = sender.target;
        } else {
          target = sender.sender;
        }
      }
      res = router.outputMessage(message, target);
      if ((res != null) && 'function' === typeof res.then) {
        res.then((function(_this) {
          return function(temp) {
            return _this.emitMessageEvent(sender, temp.message, temp.target, router);
          };
        })(this))["catch"]((function(_this) {
          return function(err) {
            return console.error(err.message || err.stack || err);
          };
        })(this));
      } else if (res === true || 'boolean' !== typeof res) {
        return this.emitMessageEvent(sender, message, target, router);
      } else {
        return console.error('fail to send message from ' + sender.sender + ' to ' + target);
      }
    };

    CommandManager.prototype.emitMessageEvent = function(sender, message, target, router) {
      this.handleRaw(sender, 'outputMessage', {
        message: message,
        target: target
      }, router);
      return this.handleRaw(sender, 'output', {
        message: message.text,
        target: target
      }, router);
    };

    CommandManager.prototype.parseArgs = function(text) {
      var args, argsText;
      if (this.currentRouter.parseArgs) {
        return this.currentRouter.parseArgs(text);
      }
      argsText = 0 === (text.search(escapeRegex(this.identifier))) ? text.replace(escapeRegex(this.identifier), "") : text;
      argsText = argsText.replace(/^\s*/g, "");
      args = argsText.split(" ");
      return args;
    };

    CommandManager.prototype._commandHelp = function(sender, text, args, storage, textRouter, commandManager) {
      var command, currentIdentifier, i, index, len, message, ref;
      currentIdentifier = this.identifier;
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
            message += "[" + (this.commandAliasMap[command].join(', ')) + "]";
          }
          if (index !== this.commands.length - 1) {
            message += ", ";
          }
        }
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "all commands : " + message + "\nuse { " + currentIdentifier + "help [command] } to see usage of command");
      } else {
        if ((this.commands.indexOf(args[1])) < 0) {
          commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "no such command!");
        } else {
          commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, this.commandMap[args[1]].help("" + currentIdentifier + args[1]));
        }
      }
      return true;
    };

    CommandManager.prototype._commandOp = function(sender, text, args, storage, textRouter, commandManager) {
      var index, newOp, ops;
      if (args.length !== 2) {
        return false;
      }
      newOp = textRouter.fromDisplayName(args[1]);
      ops = this.storage.get("ops", this.defaultOps);
      index = ops.indexOf(newOp);
      if (0 > index) {
        ops.push(newOp);
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "oped " + newOp);
      } else {
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, newOp + " is already op!");
      }
      this.storage.set("ops", ops);
      return true;
    };

    CommandManager.prototype._commandDeop = function(sender, text, args, storage, textRouter, commandManager) {
      var index, ops, removeOp;
      if (args.length !== 2) {
        return false;
      }
      removeOp = textRouter.fromDisplayName(args[1]);
      ops = this.storage.get("ops", this.defaultOps);
      index = ops.indexOf(removeOp);
      if (0 > index) {
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, removeOp + " is not op");
      } else {
        ops.splice(index, 1);
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "deoped " + removeOp);
      }
      this.storage.set("ops", ops);
      return true;
    };

    CommandManager.prototype._commandSudo = function(sender, text, args, storage, textRouter, commandManager, originalMessage) {
      var command;
      if (args.length !== 1) {
        command = args.slice(1).join(' ');
      }
      if (command && (args[0] === (this.parseArgs(command))[0])) {
        commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "Sorry, but it does'nt make sence to exec " + args[0] + " from " + args[0] + ".");
        return true;
      }
      if (this.isOp(sender.sender)) {
        if (command) {
          this.handleText(sender, command, textRouter, true, false);
        } else {
          commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "logout successfully");
          this.logout(sender.sender);
        }
        return true;
      }
      textRouter.whois(sender.sender, (function(_this) {
        return function(info) {
          if (_this.isOp(info.account, true)) {
            if (command) {
              _this.login(sender.sender);
              _this.handleText(sender, command, textRouter, true);
              return _this.logout(sender.sender);
            } else {
              _this.login(sender.sender);
              return commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "login successfully");
            }
          } else {
            return commandManager._sendToPlace(textRouter, sender.sender, sender.target, sender.channel, "access denied");
          }
        };
      })(this));
      return true;
    };

    CommandManager.prototype.addRouter = function(textRouter) {
      this.routers.push(textRouter);
      textRouter.on("input", (function(_this) {
        return function(message, sender, router) {
          var messageModel;
          if (router == null) {
            router = textRouter;
          }
          _this.lastChannel = sender.channel;
          _this.lastSender = sender.channel;
          messageModel = new Message(message, [], true, true);
          _this.handleRaw(sender, "text", message, router);
          _this.handleRaw(sender, "message", messageModel, router);
          return _this.handleText(sender, message, router, false, false, messageModel);
        };
      })(this));
      textRouter.on("message", (function(_this) {
        return function(message, sender, router) {
          if (router == null) {
            router = textRouter;
          }
          _this.lastChannel = sender.channel;
          _this.lastSender = sender.channel;
          _this.handleRaw(sender, "message", message, router);
          if (message.asText) {
            _this.handleRaw(sender, "text", message.text, router);
          }
          return _this.handleText(sender, message.text, router, false, false, message);
        };
      })(this));
      textRouter.on("rpl_join", (function(_this) {
        return function(channel, sender, router) {
          if (router == null) {
            router = textRouter;
          }
          return _this.handleRaw(sender, "join", channel, router);
        };
      })(this));
      return textRouter.on("rpl_raw", (function(_this) {
        return function(reply, router) {
          if (router == null) {
            router = textRouter;
          }
          return _this.handleRaw(null, "raw", reply, router);
        };
      })(this));
    };

    CommandManager.prototype.toDisplayName = function(sender) {
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
    };

    CommandManager.prototype.hasCommand = function(command) {
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
    };

    return CommandManager;

  })(EventEmitter);

  module.exports = CommandManager;

}).call(this);
