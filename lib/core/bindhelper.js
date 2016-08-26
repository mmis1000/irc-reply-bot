(function() {
  var BindHelper, PipeRouter, Q, escapeRegex, folderLoader, path;

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
      
      temp = folderLoader path.resolve __dirname, 'bind-filter'
      for item in temp
        if item.module.symbols
          for symbol in item.module.symbols
            @filterMap[symbol] = item.module
      #console.log @filterMap
       */
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

    BindHelper.prototype.compileText = function(str, sender, manager, router) {
      var index, item, j, len, pairs, pipe, temp, temp2;
      temp = str.split(/(#\{.*?[^\\]\})/g);
      for (index = j = 0, len = temp.length; j < len; index = ++j) {
        item = temp[index];
        if (item.match(/(#\{.*[^\\]\})/)) {
          temp2 = (item.slice(2, -1)).match(/\\u....|\\x..|\\.|./g);
          temp2 = this._splitArray(temp2, "|");
          temp2 = temp2.map(function(item) {
            return item.join('').replace(/^\s+|\s+$/g, '');
          });
          pairs = [];
          pipe = new PipeRouter(router);
          manager.handleText(sender, temp2[0], pipe, true, true, null);
          pipe.forceCheck();
          temp[index] = pipe.promise.then(function(data) {
            return data.result;
          });

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
