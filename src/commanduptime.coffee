Icommand = require './icommand.js'

padding = (str, fill, len)->
  str = str.toString()
  while str.length < len
    str = fill + str
  return str

class CommandSay extends Icommand
  constructor: ()->
    @lastStartUp = Date.now()
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 1
      return false
    
    current = Date.now()
    space = (current - @lastStartUp) // 1000
    
    second = space % 60
    minute = (space // 60) % 60
    hour = (space // (60 * 60)) % 24
    day = (space // (60 * 60 * 24))
    
    commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "
      I have been here for
      #{
      if day > 1 then day + ' days, ' 
      else if day > 0 then '1 day, ' 
      else ''
      }\
      #{padding hour, "0", 2}:\
      #{padding minute, "0", 2}:\
      #{padding second, "0", 2} .
    "
    return true
  
  help: (commandPrefix)->
    return ["make this bot say how long did it stay here, Usage", "#{commandPrefix}"];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true

module.exports = CommandSay