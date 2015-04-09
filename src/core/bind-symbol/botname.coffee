class BotName 
  constructor : ()->
    @symbols = ['botname']
  
  handle : (sender, content, args, manager, router)->
    router.getSelfName()

module.exports = new BotName