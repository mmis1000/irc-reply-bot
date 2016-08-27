folderLoader = require '../folderloader'
path = require 'path'
PipeRouter = require '../router/piperouter'
Q = require 'q'
escapeRegex = (text)->text.replace /[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"

class BindHelper
  constructor:()->
    @symbolMap = {}
    @filterMap = {}
    @_init()
  
  _init: ()->
    ###
    temp = folderLoader path.resolve __dirname, 'bind-symbol'
    for item in temp
      if item.module.symbols
        for symbol in item.module.symbols
          @symbolMap[symbol] = item.module
    #console.log @symbolMap
    
    temp = folderLoader path.resolve __dirname, 'bind-filter'
    for item in temp
      if item.module.symbols
        for symbol in item.module.symbols
          @filterMap[symbol] = item.module
    #console.log @filterMap
    ###
    
    
    
  escapeRegex:(str, isOp)->
    temp = str.match /(\\u....|\\x..|\\.|.)/g
    
    whiteSpaced = []
    i = 0
    while i < temp.length
      if temp[i] is "#" and temp[i + 1] is "{"
        startPos = i;
        endPos = temp.indexOf "}", i + 3
        if endPos isnt -1
          whiteSpaced.push [startPos, endPos + 1]
      if temp[i] is "\s"
        whiteSpaced.push [i, i + 1]
      i++
    
    mask = {}
    
    for item in whiteSpaced
      i = item[0]
      while i < item[1]
        mask[i] = true
        i++
    
    #console.log temp, mask, whiteSpaced
    
    for item, index in temp
      if index is 0 and item is "^"
        continue
      if (index is temp.length - 1)  and item is "$"
        continue
      if item is "\\s"
        continue
      
      if not mask[index]
        #console.log temp[index], escapeRegex temp[index]
        temp[index] = escapeRegex temp[index]
    if temp[0] isnt "^"
      temp.unshift "^"
    
    temp.join ""
    
  compileText:(str, sender, manager, router, envs = [])->
    temp = str.split /(#\{.*?[^\\]\})/g
    
    #console.log temp
    for item, index in temp
      if item.match /(#\{.*[^\\]\})/
        temp2 = (item.slice 2, -1).match /\\u....|\\x..|\\.|./g
        temp2 = @_splitArray temp2, "|"
        temp2 = temp2.map (item)->
          item
          .join ''
          .replace /^\s+|\s+$/g, ''
        
        pairs = []
        
        # for pair in temp2
        pipe = new PipeRouter router
        
        text = temp2[0]
        
        replaceText = (text, envs = [])->
          if envs.length > 0
            envs.forEach (env, i)->
              if i <= 10
                text = text.replace "$#{i}", env
          text
          
        nextCommand = (promise, next_text)->
          promise.then (out)->
            pipe = new PipeRouter router
            envs = out.split /\s+/g
            envs = [out, envs...]
            next_text = replaceText next_text, envs
            manager.handleText sender, next_text, pipe, true, true, null
            pipe.forceCheck()
            pipe.promise
          .then (data)->data.result
          
        text = replaceText text, envs
        
        manager.handleText sender, temp2[0], pipe, true, true, null
        pipe.forceCheck()
        
        promise = pipe.promise.then (data)-> data.result
        
        temp2[1..].forEach (command)->
          promise = nextCommand promise, command
        
        temp[index] = promise
        
        ###
        try
          output = @symbolMap[symbol].handle sender, str, args, manager, router
          for pair in pairs[1..]
            output = @filterMap[pair[0]].handle sender, output, pair[1..], manager, router
          temp[index] = output
        catch e
          #console.log e
          temp[index] = ""
        ###
    return Q
    .all temp
    .then (frag)-> frag.join ''
    .catch (err)->
      console.log err.stack or err.toString()
      throw err
  _splitArray: (arr, seperator)->
    temp = []
    i = 0
    while true
      newI = arr.indexOf seperator, i
      if newI == -1
        temp.push arr[i..arr.length - 1]
        break
      if newI - 1 >= 0
        temp.push arr[i..newI - 1]
      else
        temp.push []
      i = newI + 1
    temp

module.exports = BindHelper

###
test = new BindHelper
original = 'current Time : #{time|lowercase|normalize}'

console.log test.compileText original
###