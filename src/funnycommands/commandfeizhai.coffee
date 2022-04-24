# (1 + 2 ^ ((BMI - 20) / 2)) * DAY
# (1 + 2 ^ ((Weight / Height ^ 2 - 20) / 2) * DAY
Icommand = require '../icommand.js'


class CommandFeiZhai extends Icommand
  constructor: ()->
    super()
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length isnt 4
      return false
    
    weight = parseFloat args[1], 10
    height = parseFloat args[2], 10
    day = parseFloat args[3], 10
    
    return false if isNaN weight
    return false if isNaN height
    return false if isNaN day
    
    
    value = (1 + 2 ** ((weight / height ** 2 - 20) / 2)) * day
    
    if value is Infinity
      value = "Infinity (或是你老媽)"
    
    commandManager.send sender, textRouter, "the fei zhai value of given input is #{value}"
    
    return true
  
  help: (commandPrefix)->
    #console.log "add method to override this!"
    return ["caulcalate fei zhai tai you are", 
      "this command will send to you according to where you exec this command, Usage", 
      "#{commandPrefix} <weight in kg> <height in meter> <days you stay home per week>"
    ];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    return true

module.exports = CommandFeiZhai