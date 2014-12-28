plugin = (command)->
  command.on 'afterquery', (event)->
    if event.result.url.match /\/\/\w+.hackpad.com/g
      event.result.title = event.result.title.replace /&#(\d+);/g, (a,b)->String.fromCharCode(b)

module.exports = plugin