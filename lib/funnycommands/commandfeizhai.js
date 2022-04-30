// (1 + 2 ^ ((BMI - 20) / 2)) * DAY
// (1 + 2 ^ ((Weight / Height ^ 2 - 20) / 2) * DAY
var CommandFeiZhai, Icommand;

Icommand = require('../icommand.js');

CommandFeiZhai = class CommandFeiZhai extends Icommand {
  constructor() {
    super();
  }

  handle(sender, text, args, storage, textRouter, commandManager) {
    var day, height, value, weight;
    if (args.length !== 4) {
      return false;
    }
    weight = parseFloat(args[1], 10);
    height = parseFloat(args[2], 10);
    day = parseFloat(args[3], 10);
    if (isNaN(weight)) {
      return false;
    }
    if (isNaN(height)) {
      return false;
    }
    if (isNaN(day)) {
      return false;
    }
    value = (1 + 2 ** ((weight / height ** 2 - 20) / 2)) * day;
    if (value === 2e308) {
      value = "Infinity (或是你老媽)";
    }
    commandManager.send(sender, textRouter, `the fei zhai value of given input is ${value}`);
    return true;
  }

  help(commandPrefix) {
    //console.log "add method to override this!"
    return ["caulcalate fei zhai tai you are", "this command will send to you according to where you exec this command, Usage", `${commandPrefix} <weight in kg> <height in meter> <days you stay home per week>`];
  }

  hasPermission(sender, text, args, storage, textRouter, commandManager, fromBinding) {
    return true;
  }

};

module.exports = CommandFeiZhai;
