# h / (2 * ln(age) + zeta(IQ / 100))
Icommand = require '../icommand.js'

# https://github.com/rauljordan/zeta.js/blob/master/index.js
zeta = (z) ->
  secondTerm = (z + 3) / (z - 1)
  thirdTerm = 1 / 2 ** (z + 1)

  ###*
  # Approximation relies on the fact that we can
  # take Bernoulli numbers to not have a large
  # impact on the accuracy of the implementation
  # We approximate the third term as follows and 
  # return the final result
  ###

  1 + secondTerm * thirdTerm

ln = (value)->
  (Math.log value) / (Math.log Math.E)

class CommandZhengTai extends Icommand
  constructor: ()->
    
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length isnt 4
      return false
    
    height = parseFloat args[1], 10
    age = parseFloat args[2], 10
    iq = parseInt args[3], 10
    
    return false if isNaN height
    return false if isNaN age
    return false if isNaN iq
    
    
    value = height / (2 * (ln age) + (zeta iq / 100))
    
    commandManager.send sender, textRouter, "the zheng tai value of given input is #{value}"
    
    return true
  
  help: (commandPrefix)->
    #console.log "add method to override this!"
    return ["caulcalate how cheng tai you are", 
      "this command will send to you according to where you exec this command, Usage", 
      "#{commandPrefix} <height in meter> <age> <IQ>"
    ];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    return true

module.exports = CommandZhengTai