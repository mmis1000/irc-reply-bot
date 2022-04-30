var Defer, EventEmitter, Q, _Task, uuid;

({EventEmitter} = require('events'));

Q = require('q');

uuid = function() {
  var s4;
  s4 = function() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  };
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

// emit error   Error error
// emit done    Task task
// emit finish  Task task
// emit clear   Array buffered_error, Array buffered_result
_Task = class _Task {
  constructor(display) {
    this.uuid = uuid();
    if (display == null) {
      // console.log (new Error).stack
      display = `unamed task created at ${new Date()}`;
    }
    this.display = display;
    this.result = null;
    this.finished = false; // only when correct
    this.error = null; // when timeout
    this.done = false; // either finish or timeout
    this.clear = false;
  }

};

Defer = class Defer extends EventEmitter {
  constructor() {
    super();
    this.tasklist = [];
    this.results = [];
    this.errors = [];
    this._defered = Q.defer();
    this.promise = this._defered.promise;
    this.timeout = -1; // no timeout default
  }

  async(display = null) {
    var onTimeout, runner, task, timeout;
    task = new _Task(display);
    this.tasklist.push(task);
    runner = (result) => {
      if (task.done !== true) {
        clearTimeout(timeout);
        task.result = result;
        task.finished = true;
        task.done = true;
        if (task.display !== "") {
          console.log(`finished ${task.display}`);
        }
        return this._checkUpTesk();
      }
    };
    onTimeout = () => {
      task.error = new Error(`timeout ${task.display}`);
      task.error.type = "task_timeout";
      task.done = true;
      this._checkUpTesk();
      return console.log(`timeout happend ${task.display}`);
    };
    if (this.timeout !== -1) {
      timeout = setTimeout(onTimeout, this.timeout);
    }
    return runner;
  }

  isWaiting() {
    return this.tasklist.length > 0;
  }

  setTimeout(num) {
    num = Number(num);
    if (num > 0 && !isNaN(num)) {
      return this.timeout = num;
    }
  }

  addResult(result) {
    return this.results.push(result);
  }

  getResults() {
    return this.transformResults(this.results.slice(0));
  }

  dropResults() {
    var originalResults;
    originalResults = this.results;
    this.results = [];
    return originalResults;
  }

  addError(error) {
    return this.errors.push(error);
  }

  getErrors() {
    return this.errors.slice(0);
  }

  dropErrors() {
    var originalErrors;
    originalErrors = this.errors;
    this.errors = [];
    return originalErrors;
  }

  hasError() {
    return this.errors.length > 0;
  }

  
    //implement by subclass to transform result into rhe form you need
  transformResults(res) {
    return res;
  }

  forceCheck() {
    return process.nextTick(this._checkUpTesk.bind(this));
  }

  _checkUpTesk() {
    return process.nextTick(() => {
      var i, len, ref, task;
      ref = this.tasklist;
      for (i = 0, len = ref.length; i < len; i++) {
        task = ref[i];
        if (task.done === true) {
          this.emit('done', task);
          if (task.finished) {
            this.emit('finish', task);
            if (task.result != null) {
              //console.log @, @addResult, @addError
              this.addResult(task.result);
            }
          } else {
            this.addError(task.error);
            this.emit('error', task.error);
          }
          task.clear = true;
        }
      }
      this.tasklist = this.tasklist.filter(function(task) {
        return task.clear === false;
      });
      if (this.tasklist.length > 0) {
        return;
      }
      if (this.hasError()) {
        this._defered.reject({
          error: this.getErrors(),
          result: this.getResults()
        });
        this.emit('clear', this.getErrors(), this.getResults());
      } else {
        this._defered.resolve({
          error: null,
          result: this.getResults()
        });
        this.emit('clear', null, this.getResults());
      }
      this.dropErrors();
      return this.dropResults();
    });
  }

};

module.exports = Defer;
