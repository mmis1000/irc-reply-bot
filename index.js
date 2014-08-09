TextRouter = require('./lib/textrouter.js');
Storage = require('./lib/storage.js');
CommandManager = require('./lib/commandmanager.js');
commandSay = new require('./lib/commandsay.js')
path = require('path');

var botName = "mmis1000_bot"
var channal = "#ysttd"
var irc = require('irc');
var savePath = path.resolve(__dirname, 'save/cm.json')

var client = new irc.Client('chat.freenode.net', botName, {
    channels: [channal],
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
commandSay = new require('./lib/commandsay.js')
commandRainbow = new require('./lib/commandrainbow.js')
commandManager.register ("say", new commandSay, [])
commandManager.register ("rainbow", new commandRainbow, [])


client.on('error', function(err){
    console.log(err);
});
textRouter.on("output", function(m, target){
    if (target) {
        client.say(target, m);
    } else {
        client.say(channal, m);
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
    textRouter.input(message, from, to, channal);
});

//debugs
console.log(commandManager)