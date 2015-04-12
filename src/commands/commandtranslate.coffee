Icommand = require '../icommand.js'
request = require 'request'

class CommandTranslate extends Icommand
  constructor: ()->
    
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length == 1 or (args.length == 2 and args[1] == "")
      return false
    
    langPair = 'en|zh'
    
    if args[1] is '-l'
      langPair = args[2]
      message = args[3..].join " "
    else
      message = args[1..].join " "
    
    options =
      timeout : 10000
      uri : "http://api.mymemory.translated.net/get?q=#{encodeURIComponent message}&langpair=#{encodeURIComponent langPair}"
      json : true
    
    done = textRouter.async()
    
    request options, (error, res, body)->
      if error
        commandManager.send sender, textRouter, 'translate: ' + error.toString()
      else
        commandManager.send sender, textRouter, 'translate: ' + body.responseData.translatedText
      done()
      
    success = true
    return success
  
  help: (commandPrefix)->
    #console.log "add method to override this!"
    return ["make this bot to translate some message. the languagePair is ISO_639-1 language seperated by |"
      "Usage :"
      "#{commandPrefix} (-l languagePair) messages.."
      "For example:"
      "{commandPrefix} test"
      "{commandPrefix} -l en|ja test"
    ];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    return true

module.exports = CommandTranslate