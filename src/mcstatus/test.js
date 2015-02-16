var server = 'localhost';
var port = 25565;
var mc_status = require('mc_status');
var tryTimes = 5

mc_status.setDebugMode(false);

function main () {
mc_status.status(server, port, function(data){
    console.log(data);
    if (data.error && tryTimes > 0) {
        console.log('retry in 5 second!')
        setTimeout(main, 5000)
        tryTimes--;
    }
    //console.log(JSON.stringify(data));
})
}
main();