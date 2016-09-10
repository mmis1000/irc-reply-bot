(function() {
  var BindHelper, PipeRouter, Q, escapeRegex, folderLoader, path,
    slice = [].slice;

  folderLoader = require('../folderloader');

  path = require('path');

  PipeRouter = require('../router/piperouter');

  Q = require('q');

  escapeRegex = function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  };

  BindHelper = (function() {
    function BindHelper() {
      this.symbolMap = {};
      this.filterMap = {};
      this._init();
    }

    BindHelper.prototype._init = function() {

      /*
      temp = folderLoader path.resolve __dirname, 'bind-symbol'
      for item in temp
        if item.module.symbols
          for symbol in item.module.symbols
            @symbolMap[symbol] = item.module
      #console.log @symbolMap
       */
      var item, j, len, results, symbol, temp;
      temp = folderLoader(path.resolve(__dirname, 'bind-filter'));
      results = [];
      for (j = 0, len = temp.length; j < len; j++) {
        item = temp[j];
        if (item.module.symbols) {
          results.push((function() {
            var k, len1, ref, results1;
            ref = item.module.symbols;
            results1 = [];
            for (k = 0, len1 = ref.length; k < len1; k++) {
              symbol = ref[k];
              results1.push(this.filterMap[symbol] = item.module);
            }
            return results1;
          }).call(this));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    BindHelper.prototype.escapeRegex = function(str, isOp) {
      var endPos, i, index, item, j, k, len, len1, mask, startPos, temp, whiteSpaced;
      temp = str.match(/(\\u....|\\x..|\\.|.)/g);
      whiteSpaced = [];
      i = 0;
      while (i < temp.length) {
        if (temp[i] === "#" && temp[i + 1] === "{") {
          startPos = i;
          endPos = temp.indexOf("}", i + 3);
          if (endPos !== -1) {
            whiteSpaced.push([startPos, endPos + 1]);
          }
        }
        if (temp[i] === "\s") {
          whiteSpaced.push([i, i + 1]);
        }
        i++;
      }
      mask = {};
      for (j = 0, len = whiteSpaced.length; j < len; j++) {
        item = whiteSpaced[j];
        i = item[0];
        while (i < item[1]) {
          mask[i] = true;
          i++;
        }
      }
      for (index = k = 0, len1 = temp.length; k < len1; index = ++k) {
        item = temp[index];
        if (index === 0 && item === "^") {
          continue;
        }
        if ((index === temp.length - 1) && item === "$") {
          continue;
        }
        if (item === "\\s") {
          continue;
        }
        if (!mask[index]) {
          temp[index] = escapeRegex(temp[index]);
        }
      }
      if (temp[0] !== "^") {
        temp.unshift("^");
      }
      return temp.join("");
    };

    BindHelper.prototype.compileText = function(str, sender, manager, router, envs) {
      var index, item, j, len, nextCommand, pairs, pipe, promise, replaceText, temp, temp2, text;
      if (envs == null) {
        envs = [];
      }
      temp = str.split(/(#\{.*?[^\\]\})/g);
      for (index = j = 0, len = temp.length; j < len; index = ++j) {
        item = temp[index];
        if (item.match(/(#\{.*[^\\]\})/)) {
          temp2 = (item.slice(2, -1)).match(/\\u....|\\x..|\\.|./g);
          temp2 = this._splitArray(temp2, "|");
          temp2 = temp2.map(function(item) {
            return item.join('').replace(/\\u....|\\x..|\\.|./g, function(i) {
              if (i[0] === '\\') {
                if (i[1] === 'u') {
                  return String.fromCharCode(parseInt(i.slice(2, 6), 16));
                } else if (i[1] === 'x') {
                  return String.fromCharCode(parseInt(i.slice(2, 4), 16));
                } else {
                  return i[1];
                }
              } else {
                return i;
              }
            }).replace(/^\s+|\s+$/g, '');
          });
          pairs = [];
          pipe = new PipeRouter(router);
          text = temp2[0];
          replaceText = function(text, envs) {
            if (envs == null) {
              envs = [];
            }
            if (envs.length > 0) {
              envs.forEach(function(env, i) {
                if (i <= 10) {
                  return text = text.replace("$" + i, env);
                }
              });
            }
            return text;
          };
          nextCommand = (function(_this) {
            return function(promise, next_text) {
              return promise.then(function(out) {
                var next_args;
                pipe = new PipeRouter(router);
                envs = out.split(/\s+/g);
                envs = [out].concat(slice.call(envs));
                next_text = replaceText(next_text, envs);
                next_args = manager.parseArgs(next_text);
                if (_this.filterMap[next_args[0]]) {
                  return new Promise(function(resolve, reject) {
                    return resolve({
                      result: _this.filterMap[next_args[0]].handle(sender, out, next_args, manager, router)
                    });
                  });
                } else {
                  manager.handleText(sender, next_text, pipe, {
                    fromBinding: true,
                    isCommand: true
                  }, null);
                  pipe.forceCheck();
                  return pipe.promise;
                }
              }).then(function(data) {
                return data.result;
              });
            };
          })(this);
          text = replaceText(text, envs);
          manager.handleText(sender, text, pipe, {
            fromBinding: true,
            isCommand: true
          }, null);
          pipe.forceCheck();
          promise = pipe.promise.then(function(data) {
            return data.result;
          });
          temp2.slice(1).forEach(function(command) {
            return promise = nextCommand(promise, command);
          });
          temp[index] = promise;

          /*
          try
            output = @symbolMap[symbol].handle sender, str, args, manager, router
            for pair in pairs[1..]
              output = @filterMap[pair[0]].handle sender, output, pair[1..], manager, router
            temp[index] = output
          catch e
            #console.log e
            temp[index] = ""
           */
        }
      }
      return Q.all(temp).then(function(frag) {
        return frag.join('');
      })["catch"](function(err) {
        console.log(err.stack || err.toString());
        throw err;
      });
    };

    BindHelper.prototype._splitArray = function(arr, seperator) {
      var i, newI, temp;
      temp = [];
      i = 0;
      while (true) {
        newI = arr.indexOf(seperator, i);
        if (newI === -1) {
          temp.push(arr.slice(i, +(arr.length - 1) + 1 || 9e9));
          break;
        }
        if (newI - 1 >= 0) {
          temp.push(arr.slice(i, +(newI - 1) + 1 || 9e9));
        } else {
          temp.push([]);
        }
        i = newI + 1;
      }
      return temp;
    };

    return BindHelper;

  })();

  module.exports = BindHelper;


  /*
  test = new BindHelper
  original = 'current Time : #{time|lowercase|normalize}'
  
  console.log test.compileText original
   */

}).call(this);
