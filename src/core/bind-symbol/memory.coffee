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

formatMemory = (num, type, showType = 'show')->
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
  
class Memory 
  constructor : ()->
    @symbols = ['memory']
  
  handle : (sender, content, args, manager, router)->
    if args.length is 0
      args.push 'all'
    
    if args.length is 1
      args.push 'auto'
    
    if args.length is 2
      args.push 'show'
    
    totalmem = os.totalmem()
    freemem = os.freemem()
    usedmem = totalmem - freemem
    
    if args[0] is 'all'
      if usedmem / totalmem < 0.4
        status = style.dark_green
      else if usedmem / totalmem < 0.7
        status = style.orange
      else
        status = style.red
        
      return "#{status}#{formatMemory usedmem, args[1], args[2]}#{style.reset}
        / #{formatMemory totalmem, args[1], args[2]}"
    
    if args[0] is 'used'
      return formatMemory usedmem, args[1], args[2]
    
    if args[0] is 'free'
      return formatMemory freemem, args[1], args[2]
      
    if args[0] is 'total'
      return formatMemory totalmem, args[1], args[2]
      
      
module.exports = new Memory