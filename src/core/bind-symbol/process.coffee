#os = require 'os'

style = 
  red : "\u000304"
  yellow : "\u000308"
  green : "\u000309"
  
  dark_red : "\u000305"
  dark_green : "\u000303"
  orange : "\u000307"
  
  bold : "\u0002"
  reset : "\u000f"

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


class Process 
  constructor : ()->
    @symbols = ['process']
    @displayed = ['pid', 'memoryUsage', 'uptime']
  
  handle : (sender, content, args, manager, router)->
    if args.length is 0
      args.push 'all'
    output = []
    if args[0] is 'all'
      for type in @displayed
        output.push "#{style.bold}#{type}#{style.reset} : #{@_getValue type}"
    else if args[0] in @displayed
      output.push @_getValue type
    else
      output.push "unknown type #{args[0]}"
    output.join ', '
    
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

module.exports = new Process