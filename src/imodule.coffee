Icommand = require './icommand'
class Imodule extends Icommand
  constructor: ()->
    @name = null
    @commandMap = {}
    
    @registerCommand 'help', {
      help : (@help.bind this),
      handle : (@subCommandHelp.bind this),
      hasPermission : (()-> true),
      handleRaw : (()-> false)
    }
    
  handleRaw: (sender, type, content, textRouter, commandManager)->return false
  
  registerCommand: (name, command, alias)->
    @commandMap[name] = command
  
  handle: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    command = args[1]
    
    if not (@commandMap[command]?)
      return false
    
    newArgs = args[1..]
    
    success = @commandMap[command].handle sender ,text, newArgs, storage, textRouter, commandManager, fromBinding
    
    if not success
      commandManager.send sender, textRouter, @getSubHelpMessage "#{commandManager.identifier} #{args[0]} #{args[1]}", command
    
    true
  help: (commandPrefix)->
    
    message = "sub commands: "
    message += ((Object.keys @commandMap).join ', ')
    message += '\r\n'
    message += """
      run sub command with #{commandPrefix} [subcommand]
      show help message of sub commands by #{commandPrefix} help [subcommand]
      show current message with #{commandPrefix} help
    """
    message
  
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    command = args[1]
    
    if not (@commandMap[command]?)
      return true
    
    newArgs = args[1..]
    
    #console.log sender ,text, newArgs, storage, textRouter, commandManager, fromBinding
    result = @commandMap[command].hasPermission sender ,text, newArgs, storage, textRouter, commandManager, fromBinding
    #console.log result
    result
  
  subCommandHelp: (sender ,text, args, storage, textRouter, commandManager)->
    subcommand = args[1]
    if not @commandMap[subcommand]
      return false
    prefix = commandManager.parseArgs text
    prefix = textRouter.getIdentifier() + prefix[0] + " " + prefix[2]
    text = @getSubHelpMessage prefix, subcommand
    commandManager.send sender, textRouter, text
    
    true
  
  getSubHelpMessage: (prefix, command)->
    temp = @commandMap[command].help prefix
    if Array.isArray temp
      temp.join '\r\n'
    else
      temp
    
module.exports = Imodule