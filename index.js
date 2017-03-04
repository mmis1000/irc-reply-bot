var Loader, loader, exitHandler;

if (process.env.NO_LOADER) {
  require("./bot.js");
} else {
  Loader = require('./loader')
  
  loader = new Loader('./bot.js')
  loader.initBot();
  loader.setTimeout(180 * 1000)
  
  loader.on('exit', function () {
    process.exit();
  })
  
  process.stdin.resume();//so the program will not close instantly
  
  process.nextTick(function() {
    exitHandler = function exitHandler(options, err) {
      if (options.cleanup) console.log('[Loader] cleaning up...');
      if (err) {
        console.log(err.stack);
      }
      if (options.exit) {
        loader.destroy();
      };
    }
    
    //do something when app is closing
    process.on('exit', exitHandler.bind(null,{cleanup:true}));
    
    //catches ctrl+c event
    process.on('SIGINT', exitHandler.bind(null, {exit:true}));
    
    //catches signal
    process.on('SIGTERM', exitHandler.bind(null, {exit:true}));
    
    //catches uncaught exceptions
    process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
  });
}