var Defer, IRouter, PipeRouter, Senter, TextRouter;

IRouter = require('./irouter');

Senter = require('../senter.js');

Defer = require('../defer');

TextRouter = require('./textrouter');

PipeRouter = class PipeRouter extends IRouter {
  constructor(parentRouter) {
    var key, ref, value;
    super();
    this.parentRouter = parentRouter;
    ref = TextRouter.prototype;
    
    // proxy methods
    for (key in ref) {
      value = ref[key];
      if (!PipeRouter.prototype.hasOwnProperty(key)) {
        if (!Defer.prototype[key]) {
          if ('function' === typeof value) {
            this[key] = this.parentRouter[key].bind(this.parentRouter);
          }
        }
        if (Defer.prototype[key] && this.hasOwnProperty(key)) {
          delete this[key];
        }
      }
    }
  }

  output(message, to) {
    return this.addResult({
      type: 'output',
      message: message,
      to: to
    });
  }

  outputMessage(message, to) {
    this.addResult({
      type: 'outputMessage',
      message: message,
      to: to
    });
    return false;
  }

  transformResults(res) {
    var i, len, output, result;
    output = [];
    for (i = 0, len = res.length; i < len; i++) {
      result = res[i];
      if (result.type === 'output') {
        if (Array.isArray(typeof result.message)) {
          output.push(result.message.join("\r\n"));
        } else {
          output.push(result.message);
        }
      }
      if (result.type === 'outputMessage') {
        output.push(result.message.text);
      }
    }
    return output.join('\r\n');
  }

  getRouterIdentifier() {
    return null;
  }

};

module.exports = PipeRouter;
