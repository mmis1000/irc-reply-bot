class Channel 
  constructor : ()->
    @symbols = ['channel']
  
  handle : (sender, content, args, manager, router)->
    router.getChannels().join ', '

module.exports = new Channel

