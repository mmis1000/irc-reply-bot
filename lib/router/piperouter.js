(function() {
  var Defer, IRouter, PipeRouter, Senter, TextRouter,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  IRouter = require('./irouter');

  Senter = require('../senter.js');

  Defer = require('../defer');

  TextRouter = require('./textrouter');

  PipeRouter = (function(superClass) {
    extend(PipeRouter, superClass);

    function PipeRouter(parentRouter) {
      var key, ref, value;
      this.parentRouter = parentRouter;
      PipeRouter.__super__.constructor.apply(this, arguments);
      ref = TextRouter.prototype;
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

    PipeRouter.prototype.output = function(message, to) {
      return this.addResult({
        type: 'output',
        message: message,
        to: to
      });
    };

    PipeRouter.prototype.outputMessage = function(message, to) {
      this.addResult({
        type: 'outputMessage',
        message: message,
        to: to
      });
      return false;
    };

    PipeRouter.prototype.transformResults = function(res) {
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

    PipeRouter.prototype.getRouterIdentifier = function() {
      return null;
    };

    return PipeRouter;

  })(IRouter);

  module.exports = PipeRouter;

}).call(this);
