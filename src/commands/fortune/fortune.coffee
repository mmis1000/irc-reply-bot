Icommand = require '../../icommand.js'

class CommandFortune extends Icommand
  constructor: (@list)->
    
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 1
      return false
    selected = @list[Math.floor(@list.length * Math.random())]
    
    output = """
    #{selected.id} #{selected.type} #{selected.poem}
    解 : #{selected.explain}
    """
    for key, value of selected.result
      output += "\n" + key + " : " + value
    
    commandManager.sendPv sender, textRouter, output
    
    success = true
    return success
  
  help: (commandPrefix)->
    console.log "add method to override this!"
    return ["get a fortune stick, Usage", "#{commandPrefix}"];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true

module.exports = CommandFortune