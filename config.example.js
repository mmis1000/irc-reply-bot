var config = {
  saveFolder : "save",
  saveName : "cm.json",
  init : function (commandManager, helper) {
    
    // load gateway to irc server
    var IrcRouter = require('./lib/router/ircrouter');
    var ircConfig = {
      host: "chat.freenode.net",
      nick: "repltbot",
      channels: ["#test5566", "#text5577"],
      port: null,
      SASL: null,
      // SASL : {account:"your_awesome_account", password: "pa$$w()rd"},
      identifier: "*"
    }
    var ircRouter = new IrcRouter(
      ircConfig.host, 
      ircConfig.nick, 
      ircConfig.channels, 
      ircConfig.port, 
      ircConfig.SASL, 
      ircConfig.identifier
    );
    ircRouter.enableFloodProtection(1000);
    // ircRouter.enableTimeout(600 * 1000)
    commandManager.addRouter(ircRouter);
    
    // load gateway to telegram
    // var TelegramRouter = require('./lib/router/tgrouter')
    // commandManager.addRouter(new TelegramRouter('000000000:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'))
    
    var path = require("path");
    
    var chatLogPath = 'chatlog.json';
    var regexConfigPath = 'regex.json';
    var titleParserConfigPath = 'titleparse.json';
    var mailboxPath = 'mailbox.json';
    
    
    var CommandSay = require('./lib/commands/commandsay.js')
    var CommandRainbow = require('./lib/commands/commandrainbow.js')
    var CommandRainbow2 = require('./lib/commands/commandrainbow2.js')
    var CommandLog = require('./lib/commands/commandlog.js')
    var CommandUptime = require('./lib/commands/commanduptime.js')
    var CommandPass = require('./lib/commands/commandpass.js')
    var CommandLookup = require('./lib/commands/commandnslookup.js')
    var CommandNotifyAll = require('./lib/commands/commandnotifyall.js')
    var CommandRand = require('./lib/commands/commandrand.js')
    var CommandReply = require('./lib/commands/commandreply.js')
    var CommandFortune = require('./lib/commands/fortune')
    var CommandRegex = require('./lib/commands/commandregex.js')
    var CommandPython = require('./lib/commands/commandpy.js')
    var CommandMorse = require('./lib/commands/commandmorse.js')
    var CommandMe = require('./lib/commands/commandme.js')
    var CommandMail = require('./lib/commands/commandmail.js')
    var CommandMcStatus = require('./lib/commands/commandmcstatus.js');
    
    var CommandDemorse = require('./lib/commands/commanddemorse.js');
    
    var CommandMe = require('./lib/commands/commandme.js');
    var CommandMail = require('./lib/commands/commandmail.js');
    var CommandMcStatus = require('./lib/commands/commandmcstatus.js');
    var CommandTranslate = require('./lib/commands/commandtranslate.js');
    var CommandHello = require('./lib/commands/commandhello.js');
    var CommandGoogle = require('./lib/commands/commandgoogle.js');
    
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
    commandManager.register ("mcstatus", new CommandMcStatus(), ['mc']);
    
    commandManager.register ("demorse", new CommandDemorse(), []);
    
    commandManager.register ("me", new CommandMe(), []);
    commandManager.register ("mail", new CommandMail(helper.createStorage(mailboxPath)), []);
    commandManager.register ("mcstatus", new CommandMcStatus(), ['mc']);
    commandManager.register ("translate", new CommandTranslate(), ['tr']);
    commandManager.register ("hello", new CommandHello(), ['start']);
    commandManager.register ("google", new CommandGoogle({
      tld: "com.tw",
      lang: "zh-TW",
      nextText: "下一頁"
    }), ['g']);
    
    var CommandTranslate = require('./lib/commands/commandtranslate.js');
    commandManager.register ("translate", new CommandTranslate(), ['tr']);

    
    // mongodb based log command
    //var CommandLog2 = require('./lib/commands/commandlog2.js');
    //commandManager.register ("log", new CommandLog2('mongodb://localhost/test', '+08:00', 'zh-tw'), []);
    
    
    var CommandZhengTai = require('./lib/funnycommands/commandzhengtai.js');
    commandManager.register ("zhengtai", new CommandZhengTai(), ['cute', '正太']);
    
    var CommandFeiZhai = require('./lib/funnycommands/commandfeizhai.js');
    commandManager.register ("feizhai", new CommandFeiZhai(), ['fat', '肥宅']);
    
    var CommandChannelName = require('./lib/commands/commandchannelname.js');
    commandManager.register ("channel_name", new CommandChannelName(), ['channel']);
    
    var CommandEchoReply = require('./lib/commands/commandechoreply.js');
    commandManager.register ("echo_reply", new CommandEchoReply(), []);
    
    var CommandReplyHtml = require('./lib/commands/commandreplyhtml.js');
    commandManager.register ("reply_html", new CommandReplyHtml(), []);
    
    var CommandUpsideDown = require('./lib/commands/commandupsidedown.js');
    commandManager.register ("upsidedown", new CommandUpsideDown(), ['upd']);
    
    // potential memeroy and cpu usage spam
    // var CommandMath = require('./lib/commands/commandmath.js');
    // commandManager.register ("calc", new CommandMath(), ['math', 'c']);
    
    var CommandCpu = require('./lib/commands/commandcpu.js');
    commandManager.register ("cpu", new CommandCpu(), []);
    
    var CommandOsInfo = require('./lib/commands/commandosinfo.js');
    commandManager.register ("os", new CommandOsInfo(), []);
    
    var CommandMemory = require('./lib/commands/commandmemory.js');
    commandManager.register ("memory", new CommandMemory(), []);
    
    var CommandProcess = require('./lib/commands/commandprocess.js');
    commandManager.register ("process", new CommandProcess(), []);
    
    var CommandBotName = require('./lib/commands/commandbotname.js');
    commandManager.register ("botname", new CommandBotName(), []);
    
    var CommandWhoami = require('./lib/commands/commandwhoami.js');
    commandManager.register ("whoami", new CommandWhoami(), ['selfname']);
    
    var CommandTime = require('./lib/commands/commandtime.js');
    commandManager.register ("time", new CommandTime(), []);

    helper.safeLoad(function(){
      var CommandTrace = require('./lib/commands/commandtrace.js')
      commandManager.register ("trace", new CommandTrace(), ['t']);
    }, "trace");
    
    helper.safeLoad(function(){
      var CommandPing = require('./lib/commands/commandping.js')
      commandManager.register ("ping", new CommandPing(), ['p']);
    }, "ping");
    
    helper.safeLoad(function(){
      var CommandFindFastestServer = require('./lib/commands/commandfindfastestserver.js')
      commandManager.register ("findfastestserver", new CommandFindFastestServer(), ['ffs']);
    }, "findFastestServer");
    
  }
}
module.exports = config
