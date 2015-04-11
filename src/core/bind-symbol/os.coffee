os = require 'os'

style = 
  red : "\u000304"
  yellow : "\u000308"
  green : "\u000309"
  
  dark_red : "\u000305"
  dark_green : "\u000303"
  orange : "\u000307"
  
  bold : "\u0002"
  reset : "\u000f"

padding = (str, fill, len)->
  str = str.toString()
  while str.length < len
    str = fill + str
  return str


class Memory 
  constructor : ()->
    @symbols = ['os']
    @displayed = ['hostname', 'type', 'platform', 'arch', 'release', 'uptime', 'loadavg']
  
  handle : (sender, content, args, manager, router)->
    if args.length is 0
      args.push 'all'
    output = []
    if args[0] is 'all'
      for type in @displayed
        output.push "#{style.bold}#{type}#{style.reset} : #{@_mapper os[type](), type}"
    else if args[0] in @displayed
      output.push "#{@_mapper os[args[0]](), args[0]}"
    else
      output.push "unknown type #{args[0]}"
    output.join ', '
    
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

module.exports = new Memory