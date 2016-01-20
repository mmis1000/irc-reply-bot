TextRouter = require './textrouter'
irc = require 'irc'
class IrcRouter extends TextRouter
  constructor: (@server, @nick = 'irc-bot', @channels = [], @port = null)->
    super
    @_timeoutId = null;
    @_timeoutInterval = null;
    @_init()
    
  enableFloodProtection: (floodProtection)->
    @client.activateFloodProtection floodProtection
  
  enableTiemout: (timeout)->
    @_timeoutInterval = timeout
    
    @client.on 'ping', @onPing.bind this;
    @client.on 'registered', @onConnect.bind this;
    @client.on 'message', @onMessage.bind this;
    
    @_timeoutId = setTimeout (@onTimeout.bind this), @_timeoutInterval
    
  onPing: ()->
    clearTimeout @_timeoutId
    @_timeoutId = setTimeout (@onTimeout.bind this), @_timeoutInterval
  
  IrcRouter::onMessage = IrcRouter::onConnect = IrcRouter::onPing
  
  onTimeout: ()->
    @reconnect()
  
  reconnect: ()->
    console.log('reseting client...');
    @client.conn.destroy();
    @client.conn.removeAllListeners();
    @client.connect();
  
  _init: ()->
    @client = new irc.Client @server, @nick, {
      channels: @channels,
      userName: 'replybot',
      realName: 'The Irc Reply Bot Project - http://goo.gl/fCPD4A'
    }
    @client.on 'join', (channel, nick, message) =>
      #console.log Object.keys @client.chans
      @setChannels Object.keys @client.chans
      if nick != @nick
        @rplJoin channel, nick
      return
    @client.on 'error', (err) =>
      console.log err
      return
    
    @on 'output', (m, target) =>
      target = target or @channels
      if 'string' == typeof target
        @client.say target, m
        console.log (new Date).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ' + '*self* => ' + target + ': ' + m
      else if Array.isArray target
        for person in target
          @client.say person, m
          console.log (new Date).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ' + '*self* => ' + person + ': ' + m
      return
    
    @on 'whois', (user, callback) =>
      @client.whois user, callback
      return
    @on 'notice', (user, message) =>
      @client.send 'NOTICE', user, message
      return
    
    @client.on 'raw', (e) =>
      if e.command == 'rpl_welcome'
        @nick = e.args[0]
        @setSelfName e.args[0]
      ###
      if e.command == 'JOIN' and @nick == e.nick
        #textRouter.output('bot connected');
        @emit 'connect'
        console.log "joined channel"
      ###
      #console.log(e);
      @rplRaw e
      return
    
    @client.on 'join', (channel, nick, message)=>
      if @nick == nick
        @emit 'connect'
        console.log "joined channel #{channel}"
    
    @client.addListener 'message', (from, to, message) =>
      console.log (new Date).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' ' + from + ' => ' + to + ': ' + message
      @input message, from, to, @channels
      return
    @client.addListener 'action', (from, to, message) =>
      console.log (new Date).toISOString().replace(/T/, ' ').replace(/\..+/, '') + ' (E) ' + from + ' => ' + to + ': ' + message
      @inputMe message, from, to, @channels
      # also route the message as text
      @input "\u0001ACTION #{message} \u0001", from, to, @channels
      return
    
    #name list query
    do =>
      waitingForChannel = []
      @client.on 'raw', (e) ->
        if e.command == 'rpl_namreply'
          channel = e.args[2]
          names = e.args[3].split(' ')
          #console.log('debug', channel, names);
          waitingForChannel.forEach (item) ->
            if channel == item.channel
              item.callback names
            return
          waitingForChannel = waitingForChannel.filter((item) ->
            item.channel != channel
          )
        if e.command == 'rpl_endofnames'
          waitingForChannel.forEach (item) ->
            item.callback []
            return
          waitingForChannel = []
        return
      @on 'names', (channel, callback) =>
        waitingForChannel.push
          channel: channel
          callback: callback
        @client.send 'NAMES', channel
        return
      return
  disconnect: (msg, cb)->
    @client.disconnect msg, cb
  
  getRouterIdentifier : ()->
    return @server
module.exports = IrcRouter