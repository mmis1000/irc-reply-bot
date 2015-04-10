os = require "os"

intervalMS = 30 * 1000

stats = []

loads = null

addStat = ()->
  stats.unshift os.cpus()
  stats = stats[0..1]
  #console.log JSON.stringify stats, null, 4

computeLoads = ()->
  loads = []
  for core, index in stats[0]
    all = 0
    used = 0
    for field, value of core.times
      all += value
      used += value if field isnt 'idle'
      all -= stats[1][index].times[field]
      used -= stats[1][index].times[field] if field isnt 'idle'
    try
      loads.push used / all
    catch e
      loads.push -1

getLoads = ()->
  if loads is null
    if stats.length is 1
      addStat()
  computeLoads()
  return loads

addStat()

setInterval addStat, intervalMS

class Cpu
  constructor : ()->
    @symbols = ['cpu']
  
  handle : (sender, content, args, manager, router)->
    #types all, load, speed, model
    
    if args.length is 0
      args.push 'all'
    
    output = ""
    
    current = stats[0]
    
    for item, index in current
      if args[0] is 'all'
        output += "[Core #{index}]"
        
        output += " Load #{(getLoads()[index] * 100).toFixed 1}%"
        
        output += " Clock #{item.speed}mhz"
        
        output += " Model #{item.model} \n"
      if args[0] is 'load'
        
        output += "#{(getLoads()[index] * 100).toFixed 1}% "
    output 
module.exports = new Cpu