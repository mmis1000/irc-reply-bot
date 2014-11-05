Icommand = require './icommand.js'
dns = require 'dns'
ping = require 'net-ping'
punycode = require 'punycode'

class CommandPing extends Icommand
  constructor: ()->
    @session = ping.createSession()
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
    
    dns.lookup (punycode.toASCII args[1]), (err, address, family)=>
      if err
        commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "Ping : fail to find #{args[1]} due to #{err.toString()}"
        return
      commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "Ping : solved server! #{args[1]} is #{address}. Start to ping server"
      
      @session.pingHost address, (error, target, sent, rcvd)=>
        ms = rcvd - sent
        if error
          commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "Ping : fail to ping #{target} due to #{error.toString()}"
          return
        commandManager._sendToPlace textRouter, sender.sender, sender.target, sender.channel, "Ping : #{target} replied in #{ms} ms"
    
    return true
  
  help: (commandPrefix)->
    console.log "add method to override this!"
    return ["make this bot to ping a server, Usage", "#{commandPrefix} server"];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true

module.exports = CommandPing