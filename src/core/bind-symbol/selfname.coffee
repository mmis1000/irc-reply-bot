class SelfName 
  constructor : ()->
    @symbols = ['selfname']
  
  handle : (sender, content, args, manager, router)->
    manager.toDisplayName sender

module.exports = new SelfName