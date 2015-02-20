Icommand = require '../icommand.js'
mcStatus = require '../mcstatus'
#mcStatus.setDebugMode true
class CommandReply extends Icommand
  constructor: ()->
    
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 3 && args.length != 2
      return false
    if args.length == 3
      port = parseInt args[2]
      if port <= 0 or isNaN port
        return false
    
    host = args[1]
    port = port || 25565
    
    try
      mcStatus.status host, port, (res)->
        if res.online
          commandManager.send sender, textRouter, "[#{host}:#{port}] Motd: \x02#{res.description}\x0f Players: \x02#{res.players.online}/#{res.players.max}\x0f Version: \x02#{res.version.name}\x0f"
        else
          commandManager.send sender, textRouter, "[#{host}:#{port}] Currently offline"
          #console.log res
    catch e
      commandManager.send sender, textRouter, "McStatus : error during query status : #{e.toString()}"

    success = true
    return success
  
  help: (commandPrefix)->
    #console.log "add method to override this!"
    return ["make this bot to get status of minceraft server, Usage", 
      "#{commandPrefix} host [port]"];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true

module.exports = CommandReply