Icommand = require '../icommand.js'

padding = (str, fill, len)->
  str = str.toString()
  while str.length < len
    str = fill + str
  return str

class CommandChannelName extends Icommand
  constructor: ()->
    super()
    @lastStartUp = Date.now()
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 1
      return false
    
    if sender.target.match /^#/
      commandManager.send sender, textRouter, sender.target
    else
      commandManager.send sender, textRouter, sender.sender
      
    return true
  
  help: (commandPrefix)->
    return ["show the current channel name (or target of pm), Usage", "#{commandPrefix}"];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true

module.exports = CommandChannelName