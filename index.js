TextRouter = require('./lib/textrouter.js');
Storage = require('./lib/storage.js');
CommandManager = require('./lib/commandmanager.js');
path = require('path');

var botName = "mmis1000_bot"
var channel = "#ysttd"
var irc = require('irc');
var savePath = path.resolve(__dirname, 'save/cm.json')
var chatLogPath = path.resolve(__dirname, 'save/chatlog.json')

var msPingTimeout = 600 * 1000;
var msRetryDelay = 60 * 1000;

var client = new irc.Client('chat.freenode.net', botName, {
    channels: [channel],
    debug: true
});
client.activateFloodProtection(500);


textRouter = new TextRouter

commandManager = new CommandManager (new Storage(savePath), textRouter)

CommandSay = require('./lib/commandsay.js')
CommandRainbow = require('./lib/commandrainbow.js')
CommandRainbow2 = require('./lib/commandrainbow2.js')
CommandLog = require('./lib/commandlog.js')


commandManager.register ("say", new CommandSay, []);
commandManager.register ("rainbow", new CommandRainbow, []);
commandManager.register ("rainbow2", new CommandRainbow2, []);
commandManager.register ("log", new CommandLog(new Storage(chatLogPath)), []);



(function(){
    
    //handle for netError
    
    function resetClient(client) {
        console.log('reseting client...');
        client.conn.destroy();
        client.conn.removeAllListeners();
        client.connect();
    }
    
    var listenerId = null;
    
    function onPing() {
        clearTimeout(listenerId)
        listenerId = setTimeout(timeoutHandle, msPingTimeout);
    }
    
    function onConnect() {
        clearTimeout(listenerId)
        listenerId = setTimeout(timeoutHandle, msPingTimeout);
    }
    
    function timeoutHandle () {
        /*listenerId = null;
        console.log('ping timeout, assume connection was dropped, reconnecting...');
        client.disconnect('ping timeout', function(){
        
            console.log('old connection closed, connecting...');
            client.connect();
        })*/
        resetClient(client);
    }
    
    listenerId = setTimeout(timeoutHandle, msPingTimeout);
    
    client.on('ping', onPing);
    
    client.on('registered', onConnect);
    /*
    client.on('netError', function(e){
        console.log('unable to connect to server! retry after ' + msRetryDelay + ' ms', e);
        setTimeout(function(){
            client.connect();
        }, msRetryDelay)
    })*/
    
}());



client.on('error', function(err){
    console.log(err);
});

textRouter.on("output", function(m, target){
    if (target) {
        client.say(target, m);
    } else {
        client.say(channel, m);
    }
});

client.on("raw", function(e){
    if (e.command === "rpl_creationtime") {
        textRouter.output('bot loaded!');
    }
});

client.addListener('message', function (from, to, message) {
    console.log(from + ' => ' + to + ': ' + message);
    textRouter.input(message, from, to, channel);
});



//fix exit Handler
process.stdin.resume();//so the program will not close instantly
process.nextTick(function() {
    function exitHandler(options, err) {
        if (options.cleanup) console.log('clean');
        if (err) console.log(err.stack);
        if (options.exit) process.exit();
    }

    //do something when app is closing
    process.on('exit', exitHandler.bind(null,{cleanup:true}));

    //catches ctrl+c event
    process.on('SIGINT', exitHandler.bind(null, {exit:true}));

    //catches uncaught exceptions
    process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
});



//debugs
//console.log(commandManager)
