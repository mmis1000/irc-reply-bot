(function() {
  var Defer, IRouter, PipeRouter, Senter,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  IRouter = require('./irouter');

  Senter = require('../senter.js');

  Defer = require('../defer');

  PipeRouter = (function(_super) {
    __extends(PipeRouter, _super);

    function PipeRouter(parentRouter) {
      var key, value, _ref;
      this.parentRouter = parentRouter;
      PipeRouter.__super__.constructor.apply(this, arguments);
      _ref = this.parentRouter.constructor.prototype;
      for (key in _ref) {
        value = _ref[key];
        if (!PipeRouter.prototype.hasOwnProperty(key)) {
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

    PipeRouter.prototype.output = function(message, to) {
      return this.addResult({
        type: 'output',
        message: message,
        to: to
      });
    };

    PipeRouter.prototype.outputMessage = function(message, to) {
      return this.addResult({
        type: 'outputMessage',
        message: message,
        to: to
      });
    };

    PipeRouter.prototype.transformResults = function(res) {
      var output, result, _i, _len;
      output = [];
      for (_i = 0, _len = res.length; _i < _len; _i++) {
        result = res[_i];
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
