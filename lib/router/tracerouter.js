(function() {
  var Defer, IRouter, Senter, TraceRouter,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  IRouter = require('./irouter');

  Senter = require('../senter.js');

  Defer = require('../defer');

  TraceRouter = (function(superClass) {
    extend(TraceRouter, superClass);

    function TraceRouter(parentRouter) {
      var key, ref, value;
      this.parentRouter = parentRouter;
      TraceRouter.__super__.constructor.apply(this, arguments);
      ref = this.parentRouter.constructor.prototype;
      for (key in ref) {
        value = ref[key];
        if (!TraceRouter.prototype.hasOwnProperty(key)) {
          if (!Defer.prototype[key]) {
            if ('function' === typeof value) {
              this[key] = value.bind(this.parentRouter);
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

    TraceRouter.prototype.transformResults = function(res) {
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
    };

    TraceRouter.prototype.getRouterIdentifier = function() {
      return null;
    };

    return TraceRouter;

  })(IRouter);

  module.exports = TraceRouter;

}).call(this);
