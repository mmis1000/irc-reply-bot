class SelfName 
  constructor : ()->
    @symbols = ['selfname']
  
  handle : (sender, content, args, manager, router)->
    sender.toString()

module.exports = new SelfName