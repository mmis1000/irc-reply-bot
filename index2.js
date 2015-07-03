var Loader = require('./loader')

var loader = new Loader('./bot.js')
loader.initBot();


process.stdin.resume();//so the program will not close instantly
process.nextTick(function() {
function exitHandler(options, err) {
  if (options.cleanup) console.log('[Loader] clean');
  if (err) {
    console.log(err.stack);
  }
  if (options.exit) {
    loader.destroy();
    loader.on('exit', function () {
      process.exit();
    })
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
