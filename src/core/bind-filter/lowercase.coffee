class LowerCase 
  constructor : ()->
    @symbols = ['lowercase']
  
  handle : (sender, content, args, manager, router)->
    content.toLowerCase()

module.exports = new LowerCase