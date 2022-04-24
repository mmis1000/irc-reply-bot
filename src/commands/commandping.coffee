Icommand = require '../icommand.js'
dns = require 'dns'
ping = require 'net-ping'
punycode = require 'punycode'
patch_ping = require '../net-ping-hrtime-patch.js'
patch_ping ping.Session

class CommandPing extends Icommand
  constructor: ()->
    super()
    @session = ping.createSession()
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
    
    done = textRouter.async()
    
    dns.lookup (punycode.toASCII args[1]), (err, address, family)=>
      if err
        commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "Ping : fail to find #{args[1]} due to #{err.toString()}"
        done()
        return
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "Ping : solved server! #{args[1]} is #{address}. Start to ping server"
      
      @session.pingHost address, (error, target, sent, rcvd, sent_hr, rcvd_hr)=>
        #console.log arguments
        sent_hr = sent_hr[0] * 1000 + sent_hr[1] / 1000000
        rcvd_hr = rcvd_hr[0] * 1000 + rcvd_hr[1] / 1000000
        ms = (rcvd_hr - sent_hr).toFixed 3
        if error
          commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "Ping : fail to ping #{target} due to #{error.toString()}"
        else
          commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "Ping : #{target} replied in #{ms} ms"
        done()
    
    return true
  
  help: (commandPrefix)->
    console.log "add method to override this!"
    return ["make this bot to ping a server, Usage", "#{commandPrefix} server"];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true

module.exports = CommandPing