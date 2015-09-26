Icommand = require '../icommand.js'

colors = [
    "\u000304",
    "\u000307",
    "\u000308",
    "\u000309",
    "\u000312",
    "\u000302",
    "\u000306",
]

class CommandSay extends Icommand
  constructor: ()->
    
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length == 1 or (args.length == 2 and args[1] == "")
      return false
    
    if args[1] == '-r'
      message = args[2..].join " "
    else if args[1] == '-j'
      message = args[2..].join " "
      message = '"' + message + '"'
      try
        message = JSON.parse message
        message = message.toString()
      catch e
        console.log e
        message = args[2..].join " "
    else
      message = args[1..].join " "
      message = message.replace /\\n/g, "\n"
    
    temp = message.split /(?:\r\n|\n)/g
    
    i = temp.length - 1
    while i >= 0
      temp[i] = @_colorText temp[i]
      i--
    
    message = temp.join "\n"
    
    commandManager.send sender, textRouter, message
    
    success = true
    return success
  
  help: (commandPrefix)->
    return [
      "make this bot to say some message, Usage", 
      "#{commandPrefix} [-rj] messages..",
      "flags:",
      "r: raw string, no line break",
      "j: full js format string"
    ];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true

  _colorText: (text)->
    temp = text.split ""
    sep = temp.length / colors.length
    
    i = colors.length - 1
    while i >= 0
      pos = Math.floor i * sep
      temp.splice pos, 0, colors[i]
      i--
    
    return temp.join ""
    
module.exports = CommandSay