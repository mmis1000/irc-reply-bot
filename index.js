TextRouter = require('./lib/textrouter.js');
Storage = require('./lib/storage.js');
CommandManager = require('./lib/commandmanager.js');
path = require('path');

var botName = "mmis1000_bot"
var channel = "#ysttd"
var irc = require('irc');
var savePath = path.resolve(__dirname, 'save/cm.json')
var chatLogPath = path.resolve(__dirname, 'save/chatlog.json')

var client = new irc.Client('chat.freenode.net', botName, {
    channels: [channel],
});
client.activateFloodProtection(500);
/*
client.addListener('message', function (from, to, message) {
    console.log(from + ' => ' + to + ': ' + message);
    if (message === 'test' || message.search("botTest") >= 0) {
        client.say(to, "海豹愛尻尻");
    }
});*/




textRouter = new TextRouter

commandManager = new CommandManager (new Storage(savePath), textRouter)

CommandSay = require('./lib/commandsay.js')
CommandRainbow = require('./lib/commandrainbow.js')
CommandRainbow2 = require('./lib/commandrainbow2.js')
CommandLog = require('./lib/commandlog.js')


commandManager.register ("say", new CommandSay, [])
commandManager.register ("rainbow", new CommandRainbow, [])
commandManager.register ("rainbow2", new CommandRainbow2, [])
commandManager.register ("log", new CommandLog(new Storage(chatLogPath)), [])


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
    //console.log(m)
    if (e.command === "rpl_creationtime") {
        textRouter.output('bot loaded!');
    }
});
client.addListener('message', function (from, to, message) {
    console.log(from + ' => ' + to + ': ' + message);
    textRouter.input(message, from, to, channel);
});

//debugs
//console.log(commandManager)