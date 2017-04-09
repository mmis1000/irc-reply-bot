class User
  constructor: (@id, prop)->
    @images = [] # intance of Media
    @aliases = [] # global alias
    @nicknames = [@id] # router only alias
    
    @firstName = null
    @midName = null
    @lastName = null
    
    @profileUrl = null
    
    for key, value of prop
      @[key] = value
  
  is: (someone)->
    if @ is someone
      return true
    
    ids = []
    
    if 'string' is typeof someone
      ids.push someone
      
    if someone instanceof User
      ids.push someone.id
      ids = ids.concat someone.aliases
    
    for id in ids
      if @id is id
        return true
      if id in @alias
        return true
    
    return false
    
  isNickname: (name)->
    name in @nicknames
      
module.exports = User