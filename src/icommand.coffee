
class Icommand
  constructor: ()->
    
  handle: (senter ,text, args, storage, textRouter, commandManager, fromBinding)->
    textRouter.output "add method to compelete this!"
    success = false
    return success
  
  help: (commandPrefix)->
    console.log "add method to override this!"
    return [];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    return true
  
  handleRaw: (sender, type, content, textRouter, commandManager)->return false

module.exports = Icommand