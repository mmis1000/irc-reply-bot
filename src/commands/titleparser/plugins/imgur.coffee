plugin = (command)->
  command.on 'beforeopen', (event)->
    if event.url.match /https?:\/\/(?:i\.)?imgur\.com\/(?:gallery\/)?([0-9a-zA-Z]{7,7})/g
      imageId = ((/https?:\/\/(?:i\.)?imgur\.com\/(?:gallery\/)?([0-9a-zA-Z]{7,7})/g).exec event.url)[1]
      event.url = "http://imgur.com/#{imageId}"
      
  command.on 'beforequery', (event)->
    if event.url.match /\/\/imgur.com\/[a-zA-Z0-9]+$/g
      event.queryCallback = ()->
        result = {
          title : document.title
          url : location.href
        }
        
        try
          result.title = document.querySelector('meta[property="og:title"]').content
        catch e
          console.log e
          
        try
          result.views = querySelector('#views').textContent
        catch
          try 
            result.views = querySelector('#stats-overview-views .value').textContent
          catch 
            result.views = ""
        
        JSON.stringify result
        
  command.on 'afterquery', (event)->
    if event.result.url.match /\/\/imgur\.com\/[a-zA-Z0-9]+$/g
      event.title = "[imgur] #{event.result.title} - #{ if event.result.views then event.result.views + ' views - ' else '' }#{event.result.url}"
  
module.exports = plugin