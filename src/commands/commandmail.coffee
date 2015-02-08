Icommand = require '../icommand.js'

class CommandMail extends Icommand
  constructor: (@storage)->
    
  handle: (sender ,text, args, storage, textRouter, commandManager)->
    accountRule = /^[a-z_\-\[\]\\^{}|`][a-z0-9_\-\[\]\\^{}|`]*$/i
    
    if args.length < 3
      return false
    account = args[1].toLowerCase()
    message = args[2..].join " "
    if not accountRule.test account
      textRouter.notice sender.sender, "invalid account #{account}"
      return false
      
    @addMail sender.sender, account, message
    textRouter.notice sender.sender, "already added nick to mailbox of #{account}"
    
    success = true
    return success
  
  help: (commandPrefix)->
    #console.log "add method to override this!"
    return ["mail someone a message", 
      "he will be recieved when he join this channel",
      "#{commandPrefix} account messages.."];
  
  hasPermission: (sender ,text, args, storage, textRouter, commandManager, fromBinding)->
    not fromBinding
  
  handleRaw: (sender, type, content, textRouter, commandManager)->
    if type is 'join'
      textRouter.whois sender.sender, (info)=>
        if info.account
          mails = @getMails info.account
          @dropMails info.account
          if mails.length > 0
            messages = mails.map (mail)-> "[#{mail.from}] #{mail.message}"
            commandManager.sendPv sender, textRouter, messages
        else
          mails = @getMails sender.sender
          if mails.length > 0
            textRouter.notice sender.sender, "you have #{mails.length} mails, login to view all mails"
    true
          
  getMails: (account)->
    account = account.toLowerCase()
    mailboxs = @storage.get "mailboxs", {}
    mailbox  = mailboxs[account]
    mailbox = mailbox || []
    return mailbox
  
  dropMails: (account)->
    account = account.toLowerCase()
    mailboxs = @storage.get "mailboxs", {}
    delete mailboxs[account]
    @storage.set "mailboxs", mailboxs
    return true
  
  addMail: (from, account, message)->
    account = account.toLowerCase()
    mailboxs = @storage.get "mailboxs", {}
    mailboxs[account]  = mailboxs[account] || []
    mailboxs[account].push {from : from, message : message}
    @storage.set "mailboxs", mailboxs
    return true
        
module.exports = CommandMail