class JSONfy 
  constructor : ()->
    @symbols = ['jsonfy']
  
  handle : (sender, content, args, manager, router)->
    (JSON.stringify content).replace /^"|"$/g, ''

module.exports = new JSONfy