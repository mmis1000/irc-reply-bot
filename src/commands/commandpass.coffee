Icommand = require '../icommand.js'

class CommandPass extends Icommand
  constructor: ()->
    super()
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    return args.length == 1
  
  help: (commandPrefix)->
    return ["This command does nothing!, Usage", "#{commandPrefix}"];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager)->
    return true

module.exports = CommandPass