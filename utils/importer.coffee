###
importer to import irssi format log to mongo database
###
dbpath = 'mongodb://localhost/test'
collectionName = 'Messages'
channelName = '#ysitd'
rawLogsPath = './irc.log'



moment = require 'moment'
fs = require 'fs'
rawLogs = fs.readFileSync(rawLogsPath).toString().split(/\r?\n/g)
fineLogs = []

#channel name
channel = '#ysitd'

dateTemp = null

###
for item in rawLogs
  if 0 == item.search '-'
    #console.log item 
    if temp = (/^--- Log opened .+ (.+ .+) .+ (.+)$/).exec item
      #console.log (moment "#{temp[1]} +0800", "MMM DD HH:mm:ss YYYY Z").toDate()
      dateTemp = temp[1..]
    if temp = (/^--- Day changed .+ (.+ .+) (.+)$/).exec item
      #console.log (moment "#{temp[1]} +0800", "MMM DD YYYY Z").toDate()
      dateTemp = temp[1..]
  if temp = (/^(\d+:\d+) <.(.+)> (.+)$/g).exec item
    #console.log temp[1..]
    temp2 = "#{dateTemp[0]} #{temp[1]}:00 #{dateTemp[1]} +0800"
    #console.log temp2
    #console.log (moment temp2, "MMM DD HH:mm:ss YYYY Z").toDate()
    date = (moment temp2, "MMM DD HH:mm:ss YYYY Z").toDate()
    fineLogs.push [date, temp[2], temp[3]]

rawLogs = null
console.log 'finish parsing log'

###
mongoose = require 'mongoose'

mongoose.connect dbpath

db = mongoose.connection;

Message = null

db.once 'open', (err, cb)=>
  if err
    console.error 'db error : '
    console.error err
    return
  
  MessageSchema = mongoose.Schema {
    from : String
    to : String
    message : String
    isOnChannel : Boolean
    time : { type : Date, index : true }
  }, { collection : collectionName }
  
  
  Message =  mongoose.model 'Message', MessageSchema
  console.log 'start adding log'
  
  afterInit()

afterInit = ()->
  readlines = require 'lines-reader'
  
  dateTemp = null
  lastDate = null
  offset = 0
  
  reader =  new readlines({fileName : rawLogsPath, encode : "utf8"})
  reader.on 'line', (line)->
    console.log line
    
    if 0 == line.search '-'
      #console.log item 
      if temp = (/^--- Log opened .+ (.+ .+) .+ (.+)$/).exec line
        #console.log (moment "#{temp[1]} +0800", "MMM DD HH:mm:ss YYYY Z").toDate()
        dateTemp = temp[1..]
      if temp = (/^--- Day changed .+ (.+ .+) (.+)$/).exec line
        #console.log (moment "#{temp[1]} +0800", "MMM DD YYYY Z").toDate()
        dateTemp = temp[1..]
    if temp = (/^(\d+:\d+) <.(.+)> (.+)$/g).exec line
      #console.log temp[1..]
      temp2 = "#{dateTemp[0]} #{temp[1]}:00 #{dateTemp[1]} +0800"
      #console.log temp2
      #console.log (moment temp2, "MMM DD HH:mm:ss YYYY Z").toDate()
      date = (moment temp2, "MMM DD HH:mm:ss YYYY Z").toDate()
      
      if lastDate is date.toString()
        offset += 1
        date = (moment date).add offset, 'ms'
        .toDate()
      else
        offset = 0
        lastDate = date.toString()
      
      log = [date, temp[2], temp[3]]
      
      message = new Message {
        from : log[1],
        to : channelName,
        message : log[2],
        time : log[0],
        isOnChannel : true 
      }
      message.save (err, cb)->
        if err
          console.log err
      
    
  
  ###
  for log in fineLogs
    message = new Message {
      from : log[1],
      to : channelName,
      message : log[2],
      time : log[0],
      isOnChannel : true 
    }
    message.save (err, cb)->
      if err
        console.log err
  ###