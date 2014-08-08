var botName = "mmis1000_bot"
var channal = "#ysitd"
var irc = require('irc');
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

path = require('path');


TextRouter = require('./lib/textrouter.js');
textRouter = new TextRouter

Storage = require('./lib/storage.js');
CommandManager = require('./lib/commandmanager.js');
commandManager = new CommandManager (new Storage(path.resolve(__dirname, 'save/cm.json')), textRouter)
commandSay = new require('./lib/commandsay.js')
commandManager.register ("say", (new commandSay()), [])


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