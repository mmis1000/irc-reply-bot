Icommand = require '../icommand.js'
dns = require 'dns'
ping = require 'net-ping'
punycode = require 'punycode'


class CommandFindFastestServer extends Icommand
  constructor: ()->
    super()
    @session = ping.createSession()
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length != 2
      return false
    
    target = args[1]
    mainDomain = (punycode.toASCII target)
    
    done = textRouter.async()
    
    try
      dns.resolve mainDomain, 'A', (err, addresses)=>
        if err
          commandManager.sendPv sender, textRouter, "FindFastestServer : fail to resolve #{target} in type A due to #{err.toString()}"
          done()
          return
        
        AddressStates = []
        
        factory = (addresses, handle)->
          (arg...)->
            handle.apply null, [addresses].concat arg
          
        for item in addresses
          AddressStates.push
            finished : false
            ping : null
            address : item
            reverseLookup : null
            
          @session.pingHost item, (error, target, sent, rcvd)=>
            ms = rcvd - sent
            if err
              (AddressStates.filter (i)->i.address==target)[0].finished = true
              check()
              return true
            
            (AddressStates.filter (i)->i.address==target)[0].ping = ms
            
            worker = factory target, (address, err, addresses)->
              if addresses
                addresses = (addresses.filter (i)->i != mainDomain)
              if !err and addresses.length > 0
                (AddressStates.filter (i)->i.address == target)[0].reverseLookup = addresses[0]
              (AddressStates.filter (i)->i.address == target)[0].finished = true
              check()
            
            dns.resolve target, 'PTR',worker
        
        check = ()=>
          if (AddressStates.filter (i)->not i.finished).length != 0
            return
          #console.log AddressStates
          AddressStates = AddressStates.filter (i)->null != i.ping
          AddressStates = AddressStates.sort (a, b)->a.ping - b.ping 
          AddressStates = AddressStates[0..9]
          
          i = 1
          for item in AddressStates
            commandManager.sendPv sender, textRouter, "FindFastestServer : #{i}. #{item.address} (#{item.ping}ms) #{if item.reverseLookup then item.reverseLookup else ''}"
            i++
          done()
          
          #commandManager.sendPv sender, textRouter, "Lookup : Results for #{target} in type #{type} :"
          
        commandManager.sendPv sender, textRouter, "FindFastestServer : IPs for #{target} has been resolved, start to ping server"
        #commandManager.sendPv sender, textRouter, addresses
        return
    catch err
      commandManager.sendPv sender, textRouter, "FindFastestServer : fail to resolve #{target} in type A due to #{err.toString()}"
      done()
      
    return true
  
  help: (commandPrefix)->
    return [
      "make this bot to find the fastest site with domain name, will send with private message. Usage", 
      "#{commandPrefix} server_name"
    ];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    return not fromBinding

module.exports = CommandFindFastestServer