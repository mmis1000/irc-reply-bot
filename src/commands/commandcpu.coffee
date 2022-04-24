Icommand = require '../icommand.js'
os = require "os"

intervalMS = 30 * 1000

stats = []

loads = null

style = 
  red : ""
  yellow : ""
  green : ""
  
  dark_red : ""
  dark_green : ""
  orange : ""
  
  bold : ""
  reset : ""

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

loadToString = (num)->
  str = style.reset
  if num < 0.3
    str += style.dark_green
  else if num < 0.7
    str += style.orange
  else
    str += style.red
  str += (num * 100).toFixed 1
  str += style.reset 
    
addStat()

setInterval addStat, intervalMS

class CommandCpu extends Icommand
  constructor: ()->
    super()
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    args = args[1..]
    
    if args.length is 0
      args.push 'all'
    
    if args.length is 1
      args.push -1

    if args.length > 2
      return false
    if 0 > ['all', 'load', 'clock', 'model', 'debug'].indexOf args[0]
      return false
    if isNaN Number args[1]
      return false
    
    output = ""
    
    current = stats[0]
    
    loads = getLoads()

    if args[0] == 'debug'
      output = JSON.stringify(stats, 0, 4)
    else if args[1] is -1
      for item, index in current
        output += "#{style.bold}##{index}:#{style.reset} "
        if args[0] is 'all'
          output += "Load #{loadToString loads[index]}% "
          output += "Clock #{item.speed}mhz "
          output += "Model #{item.model} \n"
        
        if args[0] is 'load'
          output += "#{loadToString loads[index]}%, "
        
        if args[0] is 'clock'
          output += "#{item.speed}Mhz, "
        
        if args[0] is 'model'
          output += "#{item.model} \n"
    else
      item = current[args[1]]
      if not item
        return "core #{args[1]} does not exist"
      
      if args[0] is 'all'
        output += "Load #{loadToString loads[index]}% "
        output += "Clock #{item.speed}mhz "
        output += "Model #{item.model}"
      
      if args[0] is 'load'
        output += "#{loadToString loads[index]}%, "
      
      if args[0] is 'clock'
        output += "#{item.speed}Mhz, "
      
      if args[0] is 'model'
        output += "#{item.model}n"
      
    commandManager.send sender, textRouter, output 
    true

  help: (commandPrefix)->
    #console.log "add method to override this!"
    return [
      "check cpu info Usage:",
      "#{commandPrefix} [all|load|clock|model] [core number]",
      "use -1 to show all cores"
    ];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    return true

module.exports = CommandCpu