var Defer, IRouter, Senter, TextRouter, TraceRouter;

IRouter = require('./irouter');

Senter = require('../senter.js');

Defer = require('../defer');

TextRouter = require('./textrouter');

// almost the same with piperouter, but just used to trace buffer status and not buffer
TraceRouter = class TraceRouter extends IRouter {
  constructor(parentRouter) {
    var key, ref, value;
    super();
    this.parentRouter = parentRouter;
    ref = TextRouter.prototype;
    
    // proxy methods
    for (key in ref) {
      value = ref[key];
      if (!TraceRouter.prototype.hasOwnProperty(key)) {
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

  /*
  output : (message, to)->
    @addResult
      type : 'output'
      message : message
      to : to

  outputMessage : (message, to)->
    @addResult
      type : 'outputMessage'
      message : message
      to : to
  */
  transformResults(res) {
    var output, result;
    output = [];
    for (result of res) {
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

module.exports = TraceRouter;
