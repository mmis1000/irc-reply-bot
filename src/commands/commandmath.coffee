Icommand = require '../icommand.js'
math = require 'mathjs'

class CommandMath extends Icommand
  constructor: ()->
    
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length == 1 or (args.length == 2 and args[1] == "")
      return false
    
    message = args[1..].join ' '
    
    if message.match /^\s*$/g 
      return false
    try 
      result = math.eval message
    catch err
      commandManager.send sender, textRouter, err.message or err.toString()
    if result
      commandManager.send sender, textRouter, "result of #{message} is  #{result}"
    
    return true
  
  help: (commandPrefix)->
    #console.log "add method to override this!"
    return ["this command will do some math calculation with [mathjs](http://mathjs.org/)", 
      "and this command will send to you according to where you exec this command, Usage", 
      "#{commandPrefix} {expression}"
    ];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    return true

module.exports = CommandMath