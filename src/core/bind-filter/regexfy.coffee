
escapeRegex = (text)->text.replace /[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"

class Regexfy 
  constructor : ()->
    @symbols = ['regexfy']
  
  handle : (sender, content, args, manager, router)->
    escapeRegex content

module.exports = new Regexfy