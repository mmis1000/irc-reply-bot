const TextRouter = require('./lib/textrouter.js');
const Storage = require('./lib/storage.js');
const CommandManager = require('./lib/commandmanager.js');
const path = require('path');
const irc = require('irc');

var config = require('./config.js')
var bootstrapHelper = require("./bootstraphelper.js")(config.saveFolder);

var botName = config.nick
var server = config.host
var channel = config.channel

var msPingTimeout = config.pingTimeout;

var client = new irc.Client(server, botName, {
    channels: [channel],
    userName: 'replybot',
    realName: 'The Irc Reply Bot Project - http://goo.gl/fCPD4A'
});
if (config.floodProtection) {
    client.activateFloodProtection(config.floodProtection);
}

var textRouter = new TextRouter;

var commandManager = new CommandManager (bootstrapHelper.createStorage(config.saveName), textRouter);
commandManager.identifier = config.identifier;
config.init(commandManager, bootstrapHelper);


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

client.on('join', function (channel, nick, message) {
    if (nick !== botName) {
        textRouter.rplJoin(channel, nick);
    }
})

client.on('error', function(err){
    console.log(err);
});

textRouter.on("output", function(m, target){
    target = target || channel;
    client.say(target, m);
    console.log(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + " " + '*self* => ' + target + ': ' + m);
});

textRouter.on("whois", function(user, callback){
    client.whois(user, callback);
});

textRouter.on("notice", function(user, message){
    client.send('NOTICE', user, message);
});

client.on("raw", function(e){
    if (e.command === "rpl_welcome") {
        botName = e.args[0];
    }
    if (e.command === "JOIN" && botName === e.nick) {
        textRouter.output('bot connected');
        textRouter.emit('connect')
    }
    
    if (e.command === "PRIVMSG" && (/\u0001action\s(.*)\u0001/i).test(e.args[1])) {
        client.emit("me", e.nick, e.args[0], (/\u0001action\s(.*)\u0001/i).exec(e.args[1])[1])
    }
    //console.log(e);
    textRouter.rplRaw(e)
});

client.addListener('message', function (from, to, message) {
    console.log(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + " " + from + ' => ' + to + ': ' + message);
    textRouter.input(message, from, to, channel);
});

client.addListener('me', function (from, to, message) {
    console.log(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + " (E) " + from + ' => ' + to + ': ' + message);
    textRouter.inputMe(message, from, to, channel);
});

//name list query
(function(){
    var waitingForChannel = [];
    client.on("raw", function(e){
        if (e.command === "rpl_namreply") {
            var channel = e.args[2];
            var names = e.args[3].split(' ');
            //console.log('debug', channel, names);
            waitingForChannel.forEach(function(item){
                if (channel === item.channel) {
                    item.callback(names);
                }
            });
            waitingForChannel = waitingForChannel.filter(function(item){
              return item.channel !== channel;
            });
        }
        if (e.command === "rpl_endofnames") {
            waitingForChannel.forEach(function(item){
                item.callback([]);
            });
            waitingForChannel = [];
        }
    })
  
    textRouter.on("names", function(channel, callback){
        waitingForChannel.push({
            channel : channel,
            callback : callback
        })
        client.send('NAMES', channel);
    });
}());

//fix exit Handler
process.stdin.resume();//so the program will not close instantly
process.nextTick(function() {
    function exitHandler(options, err) {
        if (options.cleanup) console.log('clean');
        if (err) console.log(err.stack);
        if (options.exit) {
            process.nextTick(function() {
                process.exit();
                //make sure a clear shut down and will not exit until all exit call finished
            })
            
        };
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

textRouter.on('rpl_join', function(channel, sender) {
    console.log(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '') + " " + sender.sender + " joined " + channel)
})
