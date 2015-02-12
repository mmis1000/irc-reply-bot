Icommand = require '../icommand.js'
dns = require 'dns'
ping = require 'net-ping'
punycode = require 'punycode'


options = 
  networkProtocol: ping.NetworkProtocol.IPv4,
  packetSize: 16,
  retries: 1,
  sessionId: (process.pid % 65535),
  timeout: 2000,
  ttl: 128

class CommandTrace extends Icommand
  constructor: ()->
    @session = ping.createSession(options)
    @TTL_LIMIT = 30
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
    
    dns.lookup (punycode.toASCII args[1]), (err, address, family)=>
      if err
        commandManager.sendPv sender, textRouter, "Trace : fail to find #{args[1]} due to #{err.toString()}"
        return
      commandManager.sendPv sender, textRouter, "Trace : solved server! #{args[1]} is #{address}. Start to trace server"
      
      doneCb = (error, target)->
        #console.log arguments
        if (not error) or error instanceof ping.TimeExceededError
          commandManager.sendPv sender, textRouter, "Trace : #{target}, Done!"
        else
          commandManager.sendPv sender, textRouter, "Trace : #{target}, Terminated! #{error.toString()}"
        return
      
      feedCb = (error, target, ttl, sent, rcvd)->
        #console.log arguments
        ms = rcvd - sent
        if error 
          if error instanceof ping.TimeExceededError
            commandManager.sendPv sender, textRouter, "Trace : #{error.source} (ttl = #{ttl}, ms = #{ms})"
          else
            commandManager.sendPv sender, textRouter, "Trace : #{error.toString()} (ttl = #{ttl}, ms = #{ms})"
        return
      
      @session.traceRoute address, @TTL_LIMIT, feedCb, doneCb
      
    return true
  
  help: (commandPrefix)->
    #console.log "add method to override this!"
    return ["make this bot to trace a server, will send with private message. Usage", "#{commandPrefix} server"];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true

module.exports = CommandTrace