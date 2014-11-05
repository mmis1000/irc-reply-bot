##irc-reply-bot
------------

a bot for user to set some keyword and reply pre-defined message

------------

###how to build

1. pull down the project with **git clone https://github.com/YSITD/irc-reply-bot.git**
2. run **npm install** to solve dependency
3. run **npm install -g grunt-cli** if you have not do it before
4. run **grunt** to build the bot

------------

###notes

Don't put anything directly into **/lib**, the folder **will be deleted** during building this bot.

Please put them into **/src** instead, they will be copied into **/lib** during building.

    