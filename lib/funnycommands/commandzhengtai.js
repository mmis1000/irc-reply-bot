(function() {
  // h / (2 * ln(age) + zeta(IQ / 100))
  var CommandZhengTai, Icommand, ln, zeta;

  Icommand = require('../icommand.js');

  // https://github.com/rauljordan/zeta.js/blob/master/index.js
  zeta = function(z) {
    var secondTerm, thirdTerm;
    secondTerm = (z + 3) / (z - 1);
    thirdTerm = 1 / 2 ** (z + 1);
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
    return (Math.log(value)) / (Math.log(Math.E));
  };

  CommandZhengTai = class CommandZhengTai extends Icommand {
    constructor() {
      super();
    }

    handle(sender, text, args, storage, textRouter, commandManager) {
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
      commandManager.send(sender, textRouter, `the zheng tai value of given input is ${value}`);
      return true;
    }

    help(commandPrefix) {
      //console.log "add method to override this!"
      return ["caulcalate how cheng tai you are", "this command will send to you according to where you exec this command, Usage", `${commandPrefix} <height in meter> <age> <IQ>`];
    }

    hasPermission(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return true;
    }

  };

  module.exports = CommandZhengTai;

}).call(this);
