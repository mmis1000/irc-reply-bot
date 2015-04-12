Defer = require "../defer"

def = new Defer

a = def.async 'taskA'

a('testA')


d = def.async 'taskD'

d('testD')

b = def.async 'taskB'

setTimeout (b.bind 'testB'), 5000

c = def.async 'taskC'

def.on 'clear', (err, res)->
  console.log err, res

def.on 'error', (e)->
  console.error e

def.transformResults = (results)->
  return results.join "\n"
  
console.log 'test'