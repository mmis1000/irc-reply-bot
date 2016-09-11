Icommand = require '../icommand.js'

class CommandTime extends Icommand
  constructor: ()->
    
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length > 1
      return false
    commandManager.send sender, textRouter, (new Date).toString()
    return true
  
  help: (commandPrefix)->
    #console.log "add method to override this!"
    return ["Show current Time, Usage:", 
      "#{commandPrefix}"
    ];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    return true

module.exports = CommandTime