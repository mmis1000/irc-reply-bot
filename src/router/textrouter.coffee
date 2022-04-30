IRouter = require './irouter'
Senter = require '../senter.js'
{UTF8LengthSplit} = require '../util.js'
Q = require 'q'
imgur = require 'imgur'

class TextRouter extends IRouter
  constructor: ()->
    super()
    @maxLength = 350

  output : (message, to)->
    if Array.isArray message
      message = message.join "\n"
    message = message.split /(?:\r\n|\n)/g
    
    temp = []
    
    for text from message
      temp = temp.concat UTF8LengthSplit text, @maxLength
    
    #console.log temp
    #console.log temp.length
    if ('string' == typeof to) || not to?
      for item from temp
        @emit "output", item, to
    else
      for person from to
        for item from temp
          @emit "output", item, person
    true
    
  outputMessage: (message, to)->
    if message.medias.length > 0
      Q.all (message.medias.map (i)-> i.getAllFiles())
      .then (arr_arr_file)->
        files = [].concat.apply arr_arr_file[0], arr_arr_file[1..]
        
        files = files
        .filter (file)->
          file.MIME and file.MIME.match /^image/
        .map (file)->
          imgur.uploadBase64 file.content.toString 'base64'
        
        Q.all files
      .then (results)=>
        if message.asContentText
          @output message.text
        Q.all results.map (i)=> 
          @output i.data.link, to
      .catch (err)->
        console.error err.message or err.stack or '' + err
        
    else
      @output message.text, to
    true
  
  input : (message, from, to, channal)->
    sender = new Senter from, to, message, channal
    @emit "input", message, sender
  
  inputMessage : (message, from, to, channal)->
    sender = new Senter from, to, message, channal
    @emit "message", message, sender
    
  inputMe : (message, from, to, channal)->
    sender = new Senter from, to, message, channal
    @emit "input_me", message, sender
  
  whois : (user, callback)->
    @emit "whois", user, callback
    
  names : (channal, callback)->
    @emit "names", channal, callback
  
  notice : (nick, message)->
    @emit "notice", nick, message
    
  raw : (args...)->
    if args.length == 1 && Array.isArray args[0]
      args = args[0]
    
    @emit "raw", args
  
  rplRaw : (reply)->
    @emit "rpl_raw", reply
  
  rplJoin : (channel, nick)->
    sender = new Senter nick, channel, null, channel
    @emit "rpl_join", channel, sender
  
  setSelfName : (name)->
    @_selfName = name
  
  getSelfName : (name)->
    @_selfName
  
  setChannels : (channels)->
    @_channels = channels
  
  getChannels : (channels)->
    @_channels
    
  async: ()-> 
    # console.log "requested async work"
    ()->
      # console.log "async work finished"
  addResult: ()->;
  addError: ()->;
  
  getSelfInfo: ()-> Promise.resolve null

module.exports = TextRouter