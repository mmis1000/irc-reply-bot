Icommand = require './icommand.js'

class CommandVote extends Icommand
  constructor: (@storage, @options)->
    @options = @options || {}
    @maxCampaignPerPerson = @options.maxCampaignPerPerson || 3 
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    if args.length == 1 or (args.length == 2 and args[1] == "")
      return false
    message = args[1..].join " "
    message = message.replace /\\n/g, "\n"
    textRouter.output message, sender.channal
    success = true
    return success
  
  help: (commandPrefix)->
    console.log "add method to override this!"
    return [
      "create campaign or vote for campaign, ",
      "one person can create #{@maxCampaignPerPerson} campaign at same time Usage",
      "#{commandPrefix} vote [number, campaign number] //view all question",
      "#{commandPrefix} vote [number, campaign number] [number, answer] //vote for specified campaign",
      "#{commandPrefix} [number, answer]  // vote for newest campaign",
      "#{commandPrefix} result [campaign number] //view the campaign result",
      "#{commandPrefix} list // show all exist campaign",
      "#format of answer is something like '12304' one number for one question, 0 for skip",
      "#{commandPrefix} create [string,campaign number] [number, duration second, default to 3600, 0 for unlimited] [true, if anonymous]",
      "#{commandPrefix} add [number, campaign number] [question] | [answer1] | [answer2] | [answer3]..... ",
      "//add question, campaign owner only, will remove exist vote",
      "#{commandPrefix} delete [campaign number] //delete the campaign, campaign owner only"
    ];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    return not fromBinding

module.exports = CommandVote