Icommand = require '../icommand.js'

formatMemory = (num, type = 'auto', showType = 'show')->
  if type is 'auto'
    type = 'mb'
    type = 'gb' if num > 1024 * 1024 * 1024 * 0.9
  
  output = ''
  
  if type is 'mb'
    output += (num / 1024 / 1024 ).toFixed 1
  else
    output += (num / 1024 / 1024 / 1024).toFixed 1
  
  output += type if showType is 'show'
  
  output

padding = (str, fill, len)->
  str = str.toString()
  while str.length < len
    str = fill + str
  return str

class CommandProcess extends Icommand
  constructor: ()->
    @displayed = ['pid', 'memoryUsage', 'uptime']
    
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length is 1
      args.push 'all'

    if args.length > 2
      return false
    if 0 > (['all'].concat @displayed).indexOf args[1]
      return false
    
    output = []
    if args[1] is 'all'
      for type in @displayed
        output.push "#{type} : #{@_getValue type}"
    else if args[1] in @displayed
      output.push @_getValue args[1]
    else
      return false
    
    commandManager.send sender, textRouter, output.join ', '
    
    true
  _getValue : (type)->
    
    if 'function' is typeof process[type]
      result = process[type]()
    else
      result = process[type]
    
    result = @_mapper result, type
    result
    
  _mapper : (val, type)->
    if type is 'uptime'
      val = val  // 1
      second = val % 60
      minute = (val // 60) % 60
      hour = (val // (60 * 60)) % 24
      day = (val // (60 * 60 * 24))
      return "
        #{
        if day > 1 then day + ' days, ' 
        else if day > 0 then '1 day, ' 
        else ''
        }\
        #{padding hour, "0", 2}:\
        #{padding minute, "0", 2}:\
        #{padding second, "0", 2}
      "
    
    if type is 'memoryUsage'
      res = []
      for name, value of val
        res.push "#{name} : #{formatMemory value}"
      return res.join ', '
    
    val.toString()
  
  help: (commandPrefix)->
    #console.log "add method to override this!"
    return ["Show process info of this bot, Usage: ", 
      "#{commandPrefix} [all|pid|memoryUsage|uptime].",
    ];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    return true

module.exports = CommandProcess