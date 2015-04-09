class Time 
  constructor : ()->
    @symbols = ['time']
  
  handle : (sender, content, args, manager, router)->
    (new Date).toString()

module.exports = new Time