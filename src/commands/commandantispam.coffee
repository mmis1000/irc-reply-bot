#TODO
Icommand = require '../icommand.js'

class CommandAntiSpam extends Icommand
  constructor: ()->
    @defaultData = {
      mode : {
        channelSpam : true,
        commandSpam : true
      },
      config : {
        channelSpam : { 
          autoSilent : true,
          silentTimeSecond : 600,
          timeRangeSecond : 10,
          warningLevel : 10,
          maxLevel : 15,
          notify : true
        },
        channelSpam : {
          throttle: true,
          timeRangeSecond : 60,
          maxLevel : 15,
          notify : true
        }
      },
      ignore : []
      notify : []
    }
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length == 1 or (args.length == 2 and args[1] == "")
      return false
    message = args[1..].join " "
    message = message.replace /\\n/g, "\n"
    
    commandManager.send sender, textRouter, message
    
    success = true
    return success
  
  help: (commandPrefix)->
    #console.log "add method to override this!"
    return [
      "anti spam feature , Usage"
      "#{commandPrefix} mode #get all current feature status"
      "#{commandPrefix} mode set {feature} [on/off] #toggle feature"
      "#{commandPrefix} ignore #get all ignored users"
      "#{commandPrefix} ignore add {nick} #ignore some user"
      "#{commandPrefix} ignore remove {nick} #don't ignore some user"
      "#{commandPrefix} ignore drop # drop ignored users list"
      "#{commandPrefix} config #get all configs"
      "#{commandPrefix} config set {settingName} {value} #set config"
      "#{commandPrefix} notify #get all users to notify"
      "#{commandPrefix} notify add {nick} #add user to notify"
      "#{commandPrefix} notify remove {nick} #remove user to notify"
      "#{commandPrefix} notify drop #drop users to notify"
    ]
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    commandManager.isOp sender.sender

  handleRaw: (sender, type, content, textRouter, commandManager)->
    if type isnt "text"
      return false

module.exports = CommandAntiSpam