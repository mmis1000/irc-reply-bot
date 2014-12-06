Icommand = require '../icommand.js'

class CommandRand extends Icommand
  constructor: (@seperator = "|")->
    
  handle: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    if args.length == 1 or (args.length == 2 and args[1] == "")
      return false
    chances = args[1].split ","
    chances = chances.map (i)-> return parseFloat i
    commands = (args[2..].join " ").split @seperator
    commands = commands.map (i)-> return i.replace /(?:^\s+|\s+$)/g, ''
    
    if chances.length isnt commands.length
      return false
    
    if (chances.filter (i)-> return (i < 0 ||isNaN i)).length > 0
      return false
    
    chosen = -1
    all = chances.reduce ((i, j)-> i + j), 0
    #console.log "all = #{all}"
    
    for i, j in chances
      #console.log all, i, j
      if (i / all) > Math.random()
        chosen = j
        break
      else
        all -= i
    
    #console.log chosen
    
    if not commands[chosen]
      return false
    
    commandManager.handleText sender, commands[chosen], textRouter, true, fromBinding
    
    #textRouter.output message, sender.channel
    return true
  
  help: (commandPrefix)->
    return ["make this bot exec random command, Usage:", 
      "#{commandPrefix} chance1,chance2,chance3 command1 #{@seperator} command2 #{@seperator} command3", 
      "for example: #{commandPrefix} 1,2.5,3 say 1 #{@seperator} say 2 #{@seperator} say 3"];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true

module.exports = CommandRand