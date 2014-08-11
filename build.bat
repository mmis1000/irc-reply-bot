@echo off


if exist node_modules/coffee-script/lib/coffee-script/command.js (
    echo building irc bot
    coffee ^
        --output lib ^
        --compile src/textrouter.coffee
    coffee ^
        --output lib ^
        --compile src/storage.coffee
    coffee ^
        --output lib ^
        --compile src/senter.coffee
    coffee ^
        --output lib ^
        --compile src/icommand.coffee
    coffee ^
        --output lib ^
        --compile src/commandmanager.coffee
    coffee ^
        --output lib ^
        --compile src/commandsay.coffee
    coffee ^
        --output lib ^
        --compile src/commandrainbow.coffee
    coffee ^
        --output lib ^
        --compile src/commandrainbow2.coffee
    coffee ^
        --output lib ^
        --compile src/commandlog.coffee
    echo build done!
) else (
    echo Dependencies missing. Run npm install
)