class UpperCase 
  constructor : ()->
    @symbols = ['uppercase']
  
  handle : (sender, content, args, manager, router)->
    content.toUpperCase()

module.exports = new UpperCase