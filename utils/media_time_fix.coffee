mongoose = require "mongoose"
mediaSchema = require("../lib/commands/log_modules/media_schema_factory")(mongoose);
messageSchema = require("../lib/commands/log_modules/message_schema_factory")(mongoose, null, null);

Media = mongoose.model 'Media', mediaSchema
Message = mongoose.model 'Message', messageSchema

# change this
mongoose.connect "mongodb://localhost/test"

count = 0
waiting = 0


Message.find {}
.sort {time: 1}
.select 'medias time'
.lean()
.stream()
.on 'data', (doc)->
  if doc.medias and doc.medias.length > 0
    doc.medias.forEach (id)->
      count++
      waiting++
      console.log "updating ##{count}"
      do (count)->
        # console.log doc
        Media.update {_id: id}, {time: doc.time}, (err)->
          waiting--
          if err
            console.error err;
          else
            console.log "finished #{count}, remaining #{waiting}"
            if waiting is 0 
              setTimeout ()->
                if waiting is 0 
                  process.exit()
              , 1000
          
.on 'error', (err)->
  console.error err
###
.on 'close', ()->
  console.log 'all done'
  process.exit()
###