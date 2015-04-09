(function() {
  var BindHelper, escapeRegex, folderLoader, path;

  folderLoader = require('../folderloader');

  path = require('path');

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
      var item, symbol, temp, _i, _j, _k, _len, _len1, _len2, _ref, _results;
      temp = folderLoader(path.resolve(__dirname, 'bind-symbol'));
      for (_i = 0, _len = temp.length; _i < _len; _i++) {
        item = temp[_i];
        if (item.module.symbols) {
          _ref = item.module.symbols;
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            symbol = _ref[_j];
            this.symbolMap[symbol] = item.module;
          }
        }
      }
      temp = folderLoader(path.resolve(__dirname, 'bind-filter'));
      _results = [];
      for (_k = 0, _len2 = temp.length; _k < _len2; _k++) {
        item = temp[_k];
        if (item.module.symbols) {
          _results.push((function() {
            var _l, _len3, _ref1, _results1;
            _ref1 = item.module.symbols;
            _results1 = [];
            for (_l = 0, _len3 = _ref1.length; _l < _len3; _l++) {
              symbol = _ref1[_l];
              _results1.push(this.filterMap[symbol] = item.module);
            }
            return _results1;
          }).call(this));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    BindHelper.prototype.escapeRegex = function(str, isOp) {
      var endPos, i, index, item, mask, startPos, temp, whiteSpaced, _i, _j, _len, _len1;
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
      for (_i = 0, _len = whiteSpaced.length; _i < _len; _i++) {
        item = whiteSpaced[_i];
        i = item[0];
        while (i < item[1]) {
          mask[i] = true;
          i++;
        }
      }
      for (index = _j = 0, _len1 = temp.length; _j < _len1; index = ++_j) {
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
      var args, e, index, item, output, pair, pairName, pairs, symbol, temp, temp2, temp3, _i, _j, _k, _len, _len1, _len2, _ref;
      temp = str.split(/(#\{.*?[^\\]\})/g);
      for (index = _i = 0, _len = temp.length; _i < _len; index = ++_i) {
        item = temp[index];
        if (item.match(/(#\{.*[^\\]\})/)) {
          temp2 = (item.slice(2, -1)).match(/\\u....|\\x..|\\.|./g);
          temp2 = this._splitArray(temp2, "|");
          temp2 = temp2.map(function(item) {
            return (item.join('')).replace(/^\s+|\s+$/g, '');
          });
          pairs = [];
          for (_j = 0, _len1 = temp2.length; _j < _len1; _j++) {
            pair = temp2[_j];
            temp3 = (pair.split(',')).map(function(item) {
              return item.replace(/^\s+|\s+$/g, '');
            });
            pairName = temp3[0];
            args = temp3.slice(1);
            pairs.push([pairName, args]);
          }
          symbol = pairs[0][0];
          args = pairs[0][1];
          try {
            output = this.symbolMap[symbol].handle(sender, str, args, manager, router);
            _ref = pairs.slice(1);
            for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
              pair = _ref[_k];
              output = this.filterMap[pair[0]].handle(sender, output, pair.slice(1), manager, router);
            }
            temp[index] = output;
          } catch (_error) {
            e = _error;
            console.log(e);
            temp[index] = "";
          }
        }
      }
      return temp.join("");
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
