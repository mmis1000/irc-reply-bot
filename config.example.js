var config = {
  host : "chat.freenode.net",
  nick : "repltbot",
  channel : "#test5566",
  pingTimeout : 600 * 1000,
  identifier : "*",
  floodProtection : 1000,
  saveFolder : "save",
  saveName : "cm.json",
  init : function (commandManager, helper) {
    var path = require("path");
    
    var chatLogPath = 'chatlog.json';
    var regexConfigPath = 'regex.json';
    var titleParserConfigPath = 'titleparse.json';
    var mailboxPath = 'mailbox.json';
    
    
    var CommandSay = require('./lib/commandsay.js')
    var CommandRainbow = require('./lib/commandrainbow.js')
    var CommandRainbow2 = require('./lib/commandrainbow2.js')
    var CommandLog = require('./lib/commandlog.js')
    var CommandUptime = require('./lib/commanduptime.js')
    var CommandPass = require('./lib/commandpass.js')
    var CommandLookup = require('./lib/commandnslookup.js')
    var CommandNotifyAll = require('./lib/commandnotifyall.js')
    var CommandRand = require('./lib/commands/commandrand.js')
    var CommandReply = require('./lib/commands/commandreply.js')
    var CommandFortune = require('./lib/commands/fortune')
    var CommandRegex = require('./lib/commands/commandregex.js')
    var CommandPython = require('./lib/commands/commandpy.js')
    var CommandMorse = require('./lib/commands/commandmorse.js')
    var CommandMe = require('./lib/commands/commandme.js')
    var CommandMail = require('./lib/commands/commandmail.js')
    
    
    commandManager.register ("say", new CommandSay, []);
    commandManager.register ("rainbow", new CommandRainbow, []);
    commandManager.register ("rainbow2", new CommandRainbow2, []);
    commandManager.register ("log", new CommandLog(helper.createStorage(chatLogPath)), []);
    commandManager.register ("uptime", new CommandUptime(), []);
    commandManager.register ("pass", new CommandPass(), []);
    commandManager.register ("notifyall", new CommandNotifyAll(), ['na']);
    commandManager.register ("lookup", new CommandLookup(), []);
    commandManager.register ("rand", new CommandRand(), []);
    commandManager.register ("reply", new CommandReply(), []);
    commandManager.register ("fortune", new CommandFortune(), []);
    commandManager.register ("regex", new CommandRegex(helper.createStorage(regexConfigPath)), []);
    commandManager.register ("python", new CommandPython(), ['py']);
    commandManager.register ("morse", new CommandMorse(), []);
    commandManager.register ("me", new CommandMe(), []);
    commandManager.register ("mail", new CommandMail(helper.createStorage(mailboxPath)), []);
    
    helper.safeLoad(function(){
      var CommandTitle = require('./lib/commands/titleparser')
      commandManager.register ("title", new CommandTitle(helper.createStorage(titleParserConfigPath)), []);
    }, "title");
    
    helper.safeLoad(function(){
      var CommandTrace = require('./lib/commandtrace.js')
      commandManager.register ("trace", new CommandTrace(), ['t']);
    }, "trace");
    
    helper.safeLoad(function(){
      var CommandPing = require('./lib/commandping.js')
      commandManager.register ("ping", new CommandPing(), ['p']);
    }, "ping");
    
    helper.safeLoad(function(){
      var CommandFindFastestServer = require('./lib/commands/commandfindfastestserver.js')
      commandManager.register ("findfastestserver", new CommandFindFastestServer(), ['ffs']);
    }, "findFastestServer");
    
  }
}
module.exports = config