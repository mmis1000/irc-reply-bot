
class Icommand
  constructor: ()->

  handle: (senter ,text, args, storage, textRouter, commandManager, fromBinding, originalMessage)->
    textRouter.output "add method to compelete this!"
    success = false
    return success
  
  help: (commandPrefix)->
    console.log "add method to override this!"
    return [];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    return true
  
  handleRaw: (sender, type, content, textRouter, commandManager, event)->return false
  
  isBindSymbol: ()-> false
  
  Icommand.__createAsInstance__ = (obj)->
    instance = new Icommand
    for key, value of instance
      if not obj[key]?
        obj[key] = instance[key]
    obj
  
module.exports = Icommand