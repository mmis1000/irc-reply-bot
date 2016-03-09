(function() {
  var CommandZhengTai, Icommand, ln, zeta,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Icommand = require('../icommand.js');

  zeta = function(z) {
    var secondTerm, thirdTerm;
    secondTerm = (z + 3) / (z - 1);
    thirdTerm = 1 / Math.pow(2, z + 1);

    /**
     * Approximation relies on the fact that we can
     * take Bernoulli numbers to not have a large
     * impact on the accuracy of the implementation
     * We approximate the third term as follows and 
     * return the final result
     */
    return 1 + secondTerm * thirdTerm;
  };

  ln = function(value) {
    return (Math.log(value)) / Math.log(2);
  };

  CommandZhengTai = (function(_super) {
    __extends(CommandZhengTai, _super);

    function CommandZhengTai() {}

    CommandZhengTai.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var age, height, iq, value;
      if (args.length !== 4) {
        return false;
      }
      height = parseFloat(args[1], 10);
      age = parseFloat(args[2], 10);
      iq = parseInt(args[3], 10);
      if (isNaN(height)) {
        return false;
      }
      if (isNaN(age)) {
        return false;
      }
      if (isNaN(iq)) {
        return false;
      }
      value = height / (2 * (ln(age)) + (zeta(iq / 100)));
      commandManager.send(sender, textRouter, "the zheng tai value of given input is " + value);
      return true;
    };

    CommandZhengTai.prototype.help = function(commandPrefix) {
      return ["caulcalate how cheng tai you are", "this command will send to you according to where you exec this command, Usage", "" + commandPrefix + " <height in meter> <age> <IQ>"];
    };

    CommandZhengTai.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    };

    return CommandZhengTai;

  })(Icommand);

  module.exports = CommandZhengTai;

}).call(this);
