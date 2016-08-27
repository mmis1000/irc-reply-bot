(function() {
  var Bind, BindHelper, Imodule, Q, escapeRegex, helper,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Imodule = require('../imodule.js');

  BindHelper = require('./bindhelper');

  helper = new BindHelper;

  Q = require('q');

  escapeRegex = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  };

  Bind = (function(superClass) {
    extend(Bind, superClass);

    function Bind() {
      Bind.__super__.constructor.apply(this, arguments);
      this.name = 'bind';
    }

    Bind.prototype.handleRaw = function(sender, type, content, textRouter, commandManager, event) {
      if (type === 'init') {
        this.storage = commandManager.getStorage();
        this.manager = commandManager;
        this._init();
      }
      if (type === 'before_iscommand') {
        if (content.isCommand) {
          return;
        }
        if (content.fromBinding) {
          return;
        }
        if (this._isIgnored(sender)) {
          return;
        }
        event.cancelled = this._getBinding(content.text, commandManager, sender, textRouter).then(function(result) {
          if (result !== false) {
            content.text = result;
            content.isCommand = true;
            content.fromBinding = true;
            event.cancelled = false;
          }
          return false;
        }).then((function(i) {
          return i;
        }), function(err) {
          console.error(err.stack || err.toString());
          throw err;
        });
      }
      return null;
    };

    Bind.prototype._getBinding = function(original, commandManager, sender, router) {
      var isCommand, result, textPromise;
      result = false;
      isCommand = null;
      if (router.isCommand != null) {
        isCommand = router.isCommand(original, sender, commandManager);
      } else {
        isCommand = (original.search(escapeRegex(commandManager.identifier))) === 0;
      }
      if (!isCommand) {

        /*
        for keyword in @keywords
          newKeyword = helper.compileText keyword, sender, commandManager, router
          try
            if (original.search newKeyword) >= 0
              regex = new RegExp newKeyword
              replace = helper.compileText @keywordMap[keyword], sender, commandManager, router
              text = (regex.exec original)[0].replace regex, replace
              break
          catch e
            console.log e
         */
        textPromise = Q.all(this.keywords.map((function(_this) {
          return function(keyword) {
            var envs, regex;
            regex = null;
            envs = [];
            return helper.compileText(keyword, sender, commandManager, router).then(function(newKeyword) {
              if ((original.search(newKeyword)) >= 0) {
                regex = new RegExp(newKeyword);
              } else {
                throw new Error('not match');
              }
              envs = regex.exec(original);
              return helper.compileText(_this.keywordMap[keyword], sender, commandManager, router, envs);
            }).then(function(replace) {
              return (regex.exec(original))[0].replace(regex, replace);
            }).then((function(i) {
              return i;
            }), function(err) {
              if (err.message !== 'not match') {
                console.error(err.stack || err.toString());
              }
              return false;
            });
          };
        })(this))).then(function(results) {
          results = results.filter(function(i) {
            return !!i;
          });
          return results[0] || false;
        });
      }
      return textPromise;
    };

    Bind.prototype._getBindingInfos = function(original, commandManager, sender, router) {
      var e, error, j, keyword, len, newKeyword, ref, regex, replace, results, text;
      results = [];
      if ((original.search(escapeRegex(commandManager.identifier))) !== 0) {
        ref = this.keywords;
        for (j = 0, len = ref.length; j < len; j++) {
          keyword = ref[j];
          newKeyword = helper.compileText(keyword, sender, commandManager, router);
          try {
            if ((original.search(newKeyword)) >= 0) {
              regex = new RegExp(newKeyword);
              replace = helper.compileText(this.keywordMap[keyword], sender, commandManager, router);
              text = (regex.exec(original))[0].replace(regex, replace);
              results.push({
                keyword: keyword,
                keywordCompiled: newKeyword,
                text: this.keywordMap[keyword],
                textCompiled: replace,
                resultCommand: text
              });
            }
          } catch (error) {
            e = error;
            console.log(e);
          }
        }
      }
      return results;
    };

    Bind.prototype._isIgnored = function(sender) {
      if (0 <= (this.storage.get('bindingIgnoredChannel', [])).indexOf(sender.target)) {
        return true;
      }
      return false;
    };

    Bind.prototype._init = function() {
      var bindAppendCommand, bindCommand, bindListCommand, bindSearchCommand, bindShowCommand, ignoreChannelCommand, listignoreChannelCommand, unbindCommand, unignoreChannelCommand;
      this.keywords = this.storage.get("keywords", []);
      this.keywordMap = this.storage.get("keywordMap", {});
      bindCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandBind(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command bind command to keyword! usage : ", commandPrefix + " keyword commandText.."];
        },
        hasPermission: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
            return !fromBinding;
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.registerCommand('add', bindCommand, []);
      bindAppendCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandBindAppend(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command append command text to keyword! usage : ", commandPrefix + " keyword commandText.."];
        },
        hasPermission: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
            return !fromBinding;
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.registerCommand('append', bindAppendCommand, []);
      unbindCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandUnbind(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command unbind command from keyword! usage : ", commandPrefix + " keyword"];
        },
        hasPermission: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
            return !fromBinding;
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.registerCommand('remove', unbindCommand, []);
      bindListCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandBindList(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command show  keywords! usage : ", "" + commandPrefix];
        },
        hasPermission: (function(_this) {
          return function() {
            return true;
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.registerCommand('list', bindListCommand, []);
      bindSearchCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandBindSearch(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command find  keywords! usage : ", commandPrefix + " text to match..."];
        },
        hasPermission: (function(_this) {
          return function() {
            return true;
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.registerCommand('search', bindSearchCommand, []);
      bindShowCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandBindShow(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["command show keyword content! usage: ", commandPrefix + " keyword"];
        },
        hasPermission: (function(_this) {
          return function() {
            return true;
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      this.registerCommand('show', bindShowCommand, []);
      ignoreChannelCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandIgnoreChannel(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["ignore keyword in a channel! usage: ", commandPrefix + " <channel>"];
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
      this.registerCommand('ignoreChannel', ignoreChannelCommand, []);
      unignoreChannelCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandRemoveIgnoredChannel(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["unignore keyword in a channel! usage: ", commandPrefix + " <channel>"];
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
      this.registerCommand('unignoreChannel', unignoreChannelCommand, []);
      listignoreChannelCommand = {
        handle: (function(_this) {
          return function(sender, text, args, storage, textRouter, commandManager) {
            return _this._commandListIgnoredChannel(sender, text, args, storage, textRouter, commandManager);
          };
        })(this),
        help: function(commandPrefix) {
          return ["list ignored channel! usage: ", "" + commandPrefix];
        },
        hasPermission: (function(_this) {
          return function() {
            return true;
          };
        })(this),
        handleRaw: function(sender, type, content) {
          return false;
        }
      };
      return this.registerCommand('listIgnoreChannel', listignoreChannelCommand, []);
    };

    Bind.prototype._commandBind = function(sender, text, args, storage, textRouter, commandManager) {
      var keyword;
      if (args.length < 3) {
        return false;
      }
      keyword = args[1];
      if (keyword.length < 1) {
        commandManager.send(sender, textRouter, "\u000304you need to bind at least one word!");
        return true;
      }
      if (!this.manager.isOp(sender.sender)) {
        keyword = helper.escapeRegex(keyword);
      }
      text = args.slice(2).join(" ");
      if (0 > this.keywords.indexOf(keyword)) {
        if (this.manager.isOp(sender.sender)) {
          this.keywords.unshift(keyword);
        } else {
          this.keywords.push(keyword);
        }
      }
      this.keywordMap[keyword] = text;
      this.storage.set("keywords", this.keywords);
      this.storage.set("keywordMap", this.keywordMap);
      commandManager.send(sender, textRouter, "binded " + keyword + " to " + text);
      return true;
    };

    Bind.prototype._commandBindAppend = function(sender, text, args, storage, textRouter, commandManager) {
      var keyword;
      if (args.length < 3) {
        return false;
      }
      keyword = args[1];
      keyword = keyword.replace(/\\s/g, " ");
      if (keyword.length < 1) {
        commandManager.send(sender, textRouter, "\u000304you need to identify at least one word!");
        return true;
      }
      if ((!this.manager.isOp(sender.sender)) && ((keyword.search(/\^/)) !== 0)) {
        keyword = "^" + keyword;
      }
      text = args.slice(2).join(" ");
      if (0 > this.keywords.indexOf(keyword)) {
        commandManager.send(sender, textRouter, "\u000304No such keyword!");
        return true;
      }
      this.keywordMap[keyword] += text;
      this.storage.set("keywordMap", this.keywordMap);
      commandManager.send(sender, textRouter, "appended " + text + " to " + keyword);
      return true;
    };

    Bind.prototype._commandUnbind = function(sender, text, args, storage, textRouter, commandManager) {
      var index, keyword;
      if (null !== /^"(.+)"$/.exec(args.slice(1).join(" "))) {
        args[1] = (/^"(.+)"$/.exec(args.slice(1).join(" ")))[1];
        args = args.slice(0, 2);
      }
      if (args.length !== 2) {
        return false;
      }
      keyword = args[1];
      if ((!this.manager.isOp(sender.sender)) && ((keyword.search(/\^/)) !== 0)) {
        keyword = "^" + keyword;
      }
      index = this.keywords.indexOf(keyword);
      if (0 <= index) {
        this.keywords.splice(index, 1);
        delete this.keywordMap[keyword];
      } else {
        commandManager.send(sender, textRouter, "keyword " + keyword + " not found");
        return true;
      }
      this.storage.set("keywords", this.keywords);
      this.storage.set("keywordMap", this.keywordMap);
      commandManager.send(sender, textRouter, "unbinded commands from " + keyword);
      return true;
    };

    Bind.prototype._commandBindList = function(sender, text, args, storage, textRouter, commandManager) {
      if (args.length !== 1) {
        return false;
      }
      commandManager.sendPv(sender, textRouter, "all used keywords : " + (this.keywords.join(', ')));
      return true;
    };

    Bind.prototype._commandBindSearch = function(sender, text, args, storage, textRouter, commandManager) {
      var binding, bindings, index, j, len, searchText;
      if (args.length === 1) {
        return false;
      }
      searchText = args.slice(1).join(' ');
      bindings = this._getBindingInfos(searchText, commandManager, sender, textRouter);
      commandManager.sendPv(sender, textRouter, "Total matched bindings : " + bindings.length);
      for (index = j = 0, len = bindings.length; j < len; index = ++j) {
        binding = bindings[index];
        commandManager.sendPv(sender, textRouter, "[Binding " + index + "] keyword: " + binding.keyword + ", keywordCompiled: " + binding.keywordCompiled + ", text: " + binding.text + ", textCompiled: " + binding.text + ", resultCommand: " + binding.resultCommand);
      }
      return true;
    };

    Bind.prototype._commandBindShow = function(sender, text, args, storage, textRouter, commandManager) {
      if (args.length !== 2) {
        return false;
      }
      if (this.keywordMap[args[1]]) {
        commandManager.send(sender, textRouter, "#Found result binding text: " + this.keywordMap[args[1]]);
      } else {
        commandManager.send(sender, textRouter, "#Keyword not found.");
      }
      return true;
    };

    Bind.prototype._commandIgnoreChannel = function(sender, text, args, storage, textRouter, commandManager) {
      var currentList;
      if (args.length !== 2) {
        return false;
      }
      currentList = this.storage.get('bindingIgnoredChannel', []);
      if ('#' !== args[1].slice(0, 1)) {
        commandManager.send(sender, textRouter, args[1] + " isnt a valid channel");
        return true;
      }
      if (0 <= currentList.indexOf(args[1])) {
        commandManager.send(sender, textRouter, "This channel was already ignored");
        return true;
      }
      currentList.push(args[1]);
      this.storage.set('bindingIgnoredChannel', currentList);
      commandManager.send(sender, textRouter, "ignored channel " + args[1]);
      return true;
    };

    Bind.prototype._commandRemoveIgnoredChannel = function(sender, text, args, storage, textRouter, commandManager) {
      var currentList, index;
      if (args.length !== 2) {
        return false;
      }
      currentList = this.storage.get('bindingIgnoredChannel', []);
      if ('#' !== args[1].slice(0, 1)) {
        commandManager.send(sender, textRouter, args[1] + " isnt a valid channel");
        return true;
      }
      index = currentList.indexOf(args[1]);
      if (0 > index) {
        commandManager.send(sender, textRouter, "This channel was not ignored");
        return true;
      }
      currentList.splice(index, 1);
      this.storage.set('bindingIgnoredChannel', currentList);
      commandManager.send(sender, textRouter, "unignored channel " + args[1]);
      return true;
    };

    Bind.prototype._commandListIgnoredChannel = function(sender, text, args, storage, textRouter, commandManager) {
      var currentList;
      if (args.length !== 1) {
        return false;
      }
      currentList = this.storage.get('bindingIgnoredChannel', []);
      commandManager.send(sender, textRouter, "all ignored channel: " + (currentList.join(', ')));
      return true;
    };

    return Bind;

  })(Imodule);

  module.exports = Bind;

}).call(this);
