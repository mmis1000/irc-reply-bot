Icommand = require '../icommand.js'

os = require 'os'

padding = (str, fill, len)->
  str = str.toString()
  while str.length < len
    str = fill + str
  return str

class CommandOsInfo extends Icommand
  constructor: ()->
    @displayed = ['hostname', 'type', 'platform', 'arch', 'release', 'uptime', 'loadavg']
    
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length > 2
      return false
    if args.length is 1
      args.push 'all'
    output = []
    if args[1] is 'all'
      for type in @displayed
        output.push "#{type} : #{@_mapper os[type](), type}"
    else if args[1] in @displayed
      output.push "#{@_mapper os[args[1]](), args[1]}"
    else
      return false
    commandManager.send sender, textRouter, output.join ', '
    true
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
    
    if type is 'loadavg'
      return val.map (i)->
        i.toFixed 1
      .join ', '
    
    val.toString()
  
  help: (commandPrefix)->
    #console.log "add method to override this!"
    return [
      "check os info Usage:",
      "#{commandPrefix} [all|hostname|type|platform|arch|release|uptime|loadavg]",
    ];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    return true

module.exports = CommandOsInfo