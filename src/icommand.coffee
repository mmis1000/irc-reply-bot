
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
    allEntry = new Map()
    currentProto = Icommand::

    while currentProto isnt null
      for key from Reflect.ownKeys currentProto
        if !allEntry.has(key) and 'function' is typeof currentProto[key]
          allEntry.set(key, currentProto[key])
      currentProto = currentProto.__proto__

    for [key, value] from allEntry
      if not obj[key]?
        obj[key] = value
    obj
  
module.exports = Icommand