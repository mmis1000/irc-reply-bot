handle =
  b : "\b"
  f : "\f"
  n : "\n"
  r : "\r"
  t : "\t"
  v : "\v"
  x : (i)->
    if i.match /^\\x[1-9a-z][1-9a-z]$/i
      String.fromCharCode parseInt ((/^\\x([1-9a-z][1-9a-z])$/i).exec i)[1], 16
    else
      "\uFFFD"
  u : (i)->
    if i.match /^\\u[1-9a-z][1-9a-z][1-9a-z][1-9a-z]$/i
      String.fromCharCode parseInt ((/^\\u([1-9a-z][1-9a-z][1-9a-z][1-9a-z])$/i).exec i)[1], 16
    else
      "\uFFFD"
  
removeSlash = (str)->
  str.match /\\u....|\\x..|\\.|./g
  .map (i)->
    if i.length is 1 or not ("\\" is i.charAt 0)
      return i
    else 
      identifier = i.charAt 1
      if not handle[identifier]
        return identifier
      else if 'function' is typeof handle[identifier]
        return handle[identifier](i)
      else
        return handle[identifier]
  .join ''

class Byte 
  constructor: (@type, @contentText)->

  
  
class Parser
  constructor: ()->
  
  parseQuote: (str)->
    bytes = str.match /\\u....|\\x..|\\.|#{|./g
    compunds = []
    i = 0
    isEscaping = false
    
    start = -1
    
    currentMatching = null
    
    tags = ['/', '"', "'"];
    
    while i < bytes.length
      if (0 <= tags.indexOf bytes[i]) and (isEscaping is false or bytes[i] is currentMatching)
        currentMatching = bytes[i]
        isEscaping = !isEscaping
        if isEscaping
          start = i
        else
          compunds.push 
            start: start
            end: i
      i++
    
    if isEscaping
      compunds.push 
        start: start
        end: i
    
    for compund from compunds.reverse()
      bytes.splice compund.start, compund.end - compund.start + 1, bytes[compund.start .. compund.end].join ''
    
    bytes = bytes.map (i)->
      switch i.charAt 0
        when "'"
          new Byte 'data', removeSlash i.replace /^'|'$/g, ''
        when '"'
          new Byte 'data', removeSlash i.replace /^"|"$/g, ''
        when '/'
          new Byte 'data', i.replace /^\/|\/$/g, ''
        else
          new Byte 'unknown', removeSlash i
    return bytes
  
  parseArgument: (arr)->
    output = []
    frag = ""
    for i, index in arr
      if i.type is 'data'
        frag += i.contentText
        continue
        
      if i.contentText is '|'
        if frag.length > 0
          output.push frag
        output.push '|'
        frag = ''
        continue
        
      if i.contentText is ' '
        if frag.length > 0
          output.push frag
          frag = ''
        continue
      
      frag +=  i.contentText
        
    if frag.length > 0
      output.push frag
    console.log output
    
parser = new Parser

console.log parser.parseArgument parser.parseQuote '"\\ufffd 1"| | \'\\ufffd\' /\\ufffd\\x77/ \\\\ "\\ufffd\\x77"'
console.log removeSlash '\\ufffd"12\\x77\\\\{'