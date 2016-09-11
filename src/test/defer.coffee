Defer = require "../defer"

def = new Defer
def.setTimeout 10 * 1000

a = def.async 'taskA'

a('testA')


d = def.async 'taskD'

d('testD')

b = def.async 'taskB'

setTimeout (b.bind 'testB'), 5000

c = def.async 'taskC'

def.on 'clear', (err, res)->
  console.log 'defA',err, res

def.on 'error', (e)->
  console.error e

def.transformResults = (results)->
  return results.join "\n"

defB = new Defer

g = defB.async()

def.on 'clear', (err, res)->g res

defB.on 'clear', (err, res)->
  console.log 'defB', err, res

defB.on 'error', (e)->
  console.error e

defC = new Defer
defC.forceCheck()

defC.on 'clear', (err, res)->
  console.log 'defC', err, res

defD = new Defer
defD.forceCheck()

x = defD.async()
setTimeout x, 5000

defD.on 'clear', (err, res)->
  console.log 'defD', err, res

console.log 'test'