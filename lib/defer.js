(function() {
  var Defer, EventEmitter, uuid, _Task,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  EventEmitter = require('events').EventEmitter;

  uuid = function() {
    var s4;
    s4 = function() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    };
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  };

  _Task = (function() {
    function _Task(display) {
      this.uuid = uuid();
      if (display == null) {
        display = "unnamed task " + this.uuid;
      }
      this.display = display;
      this.result = null;
      this.finished = false;
      this.error = null;
      this.done = false;
      this.clear = false;
    }

    return _Task;

  })();

  Defer = (function(_super) {
    __extends(Defer, _super);

    function Defer() {
      this.tasklist = [];
      this.results = [];
      this.errors = [];
      this.timeout = -1;
    }

    Defer.prototype.async = function(display) {
      var onTimeout, runner, task, timeout;
      if (display == null) {
        display = null;
      }
      task = new _Task(display);
      this.tasklist.push(task);
      runner = (function(_this) {
        return function(result) {
          if (task.done !== true) {
            clearTimeout(timeout);
            task.result = result;
            task.finished = true;
            task.done = true;
            console.log("finished " + task.display);
            return _this._checkUpTesk();
          }
        };
      })(this);
      onTimeout = (function(_this) {
        return function() {
          task.error = new Error("timeout " + task.display);
          task.error.type = "task_timeout";
          task.done = true;
          _this._checkUpTesk();
          return console.log("timeout happend " + task.display);
        };
      })(this);
      if (this.timeout !== -1) {
        timeout = setTimeout(onTimeout, this.timeout);
      }
      return runner;
    };

    Defer.prototype.isWaiting = function() {
      return this.tasklist.length > 0;
    };

    Defer.prototype.setTimeout = function(num) {
      num = Number(num);
      if (num > 0 && !isNaN(num)) {
        return this.timeout = num;
      }
    };

    Defer.prototype.addResult = function(result) {
      return this.results.push(result);
    };

    Defer.prototype.getResults = function() {
      return this.transformResults(this.results.slice(0));
    };

    Defer.prototype.dropResults = function() {
      var originalResults;
      originalResults = this.results;
      this.results = [];
      return originalResults;
    };

    Defer.prototype.addError = function(error) {
      return this.errors.push(error);
    };

    Defer.prototype.getErrors = function() {
      return this.errors.slice(0);
    };

    Defer.prototype.dropErrors = function() {
      var originalErrors;
      originalErrors = this.errors;
      this.errors = [];
      return originalErrors;
    };

    Defer.prototype.hasError = function() {
      return this.errors.length > 0;
    };

    Defer.prototype.transformResults = function(res) {
      return res;
    };

    Defer.prototype.forceCheck = function() {
      return process.nextTick(this._checkUpTesk.bind(this));
    };

    Defer.prototype._checkUpTesk = function() {
      return process.nextTick((function(_this) {
        return function() {
          var task, _i, _len, _ref;
          _ref = _this.tasklist;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            task = _ref[_i];
            if (task.done === true) {
              _this.emit('done', task);
              if (task.finished) {
                _this.emit('finish', task);
                if (task.result != null) {
                  _this.addResult(task.result);
                }
              } else {
                _this.addError(task.error);
                _this.emit('error', task.error);
              }
              task.clear = true;
            }
          }
          _this.tasklist = _this.tasklist.filter(function(task) {
            return task.clear === false;
          });
          if (_this.tasklist.length > 0) {
            return;
          }
          if (_this.hasError()) {
            _this.emit('clear', _this.getErrors(), _this.getResults());
          } else {
            _this.emit('clear', null, _this.getResults());
          }
          _this.dropErrors();
          return _this.dropResults();
        };
      })(this));
    };

    return Defer;

  })(EventEmitter);

  module.exports = Defer;

}).call(this);
