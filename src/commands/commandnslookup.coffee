Icommand = require '../icommand.js'
dns = require 'dns'
punycode = require 'punycode'

class CommandNslookup extends Icommand
  constructor: ()->
    @avaliableTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SRV', 'PTR', 'CNAME']
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length == 1
      return false
    
    if args.length == 2
      type = 'A'
      target = args[1]
    else
      type = args[1]
      target = (args[2...].join " ")
    
    if 0 > @avaliableTypes.indexOf type
      return false
    
    try
      dns.resolve (punycode.toASCII target), type, (err, addresses)=>
        if err
          commandManager.sendPv sender, textRouter, "Lookup : fail to resolve #{target} in type #{type} due to #{err.toString()}"
          return
        i = 0
        
        while i < addresses.length
          if 'string' != typeof addresses[i]
            addresses[i] = JSON.stringify addresses[i]
          addresses[i] = 'Lookup : ' + addresses[i]
          i++
        
        commandManager.sendPv sender, textRouter, "Lookup : Results for #{target} in type #{type} :"
        commandManager.sendPv sender, textRouter, addresses
        return
    catch err
      commandManager.sendPv sender, textRouter, "Lookup : fail to resolve #{target} in type #{type} due to #{err.toString()}"
      
    return true
  
  help: (commandPrefix)->
    return ["make this bot to lookup a server, will send with private message. Usage", "#{commandPrefix} [#{@avaliableTypes.join '|'}] server"];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true

module.exports = CommandNslookup