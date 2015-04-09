class NormalizeCase 
  constructor : ()->
    @symbols = ['normalize']
  
  handle : (sender, content, args, manager, router)->
    content = content.split /\b([a-z]+)/ig
    content = content.map (i)->
      if i.match /\b[a-z]+\b/ig
        newI = i.toLowerCase().split ''
        newI[0] = newI[0].toUpperCase()
        newI.join ''
      else
        i
    content.join ''
module.exports = new NormalizeCase