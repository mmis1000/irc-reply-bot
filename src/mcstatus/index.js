var debug = false;
function log (msg) {
    if (debug) {
        console.log("mc_status : " + msg);
    }
}
function error (msg) {
    if (debug) {
        console.error("mc_status : " + msg);
    }
}

function setDebugMode (val) {
    debug = !!val;
}

var Builder = require('./lib/package_builder.js');
var Extractor = require('./lib/package_extractor.js')
function getOldRequest (host, port, protocolVersion){
        var request, temp;
        request = (new Builder())
            .append(0xFE, 'byte')
            .append(1, 'byte')
            .append(0xFA, 'byte')
        temp = Builder.lengthOf('MC|PingHost', 'utf16be') / 2;
        request = request
            .append(temp, 'short')
            .append('MC|PingHost', 'utf16be');
        temp = Builder.lengthOf(host, 'utf16be') + 7;
            //alert(host + ' ' + temp)
        request = request
            .append(temp, 'short')
            .append(protocolVersion, 'byte')
        temp = Builder.lengthOf(host, 'utf16be') / 2;
        request = request
            .append(temp, 'short')
            .append(host, 'utf16be', 'short')
            .append(port, 'int').build();
        return request;
}

function getHandShake(host, port, protocolVersion) {
    var PACKETID = 0x00;/*for handshake*/
    var NEXTSTATE = 1;/*for state*/
    var packet = (new Builder())
        .append(PACKETID, 'varint')
        .append(protocolVersion, 'varint')
        .appendWithLength(host, 'utf8', 'varint')
        .append(port, 'short')
        .append(NEXTSTATE, 'varint')
        .buildWithLength();
    return packet;
}
function getRequest(){
    var PACKETID = 0x00;/*for state*/
    var packet = (new Builder())
        .append(PACKETID, 'varint')
        .buildWithLength();
    return packet;
}
function extractOldPacket (packet) {
    var protocolVersion;
    var result = {
        'online' : true,
        'useOldProtocol' : true,/*custom field*/
        'error' : null,/*custom field*/
        "version": {
            "name": null,
            "protocol": null
        },
        "players": {
            "max": null,
            "online": null,
            "sample": null
        },
        "description" : null,
        "favicon": null
    }
    var wrap = Extractor(packet);
    wrap.setDoubleByteNull(true);
    try {
        wrap.move(3);
        wrap.extract('utf16be');
        result.version.protocol = parseInt(wrap.extract('utf16be'), 10);
        result.version.name = wrap.extract('utf16be')
        result.description = wrap.extract('utf16be')
        result.players.online = wrap.extract('utf16be')
        result.players.max = wrap.extract('utf16be')
    } catch (e) {
        result.error = e;
        result.online = false;
    }
    return result;
}
function extractPacket(packet){
    var result;
    var defaultResult = {    
    'useOldProtocol' : false,//custom field
        'online' : false,
        'error' : null,//custom field
        "version": {
            "name": null,
            "protocol": null
        },
        "players": {
            "max": null,
            "online": null,
            "sample": null
        },
        "description" : null,
        "favicon": null
    };
    try {
        var wrap = Extractor(packet);
        wrap.extract('varint');
        wrap.move(1);
        var length = wrap.extract('varint')
        
        log('total length - ' + length + ' byte');
        //console.log(wrap.offset);
        
        var data = wrap.extract('utf8', length, false);
        
        log('extracted text - ' + data);
        //console.log(data.length);
        
        result = JSON.parse(data);
        result.useOldProtocol = false;
        result.error = null;
        result.players.sample = result.players.sample || null;
        result.favicon = result.favicon || null;
        result.online = true;
    } catch (e) {
        result = defaultResult;
        result.error = e;
    }
    return result;
}
/*
* options = {
*    oldProtocol : 74,
*    protocol : 4
* }
*/
function status (ip, port, callback, options) {
    var net = require('net');
    var self = {};
    var result;
    var timeout = 10000;
    var defaultResult = {    
    'useOldProtocol' : null,//custom field
        'online' : false,
        'error' : null,//custom field
        "version": {
            "name": null,
            "protocol": null
        },
        "players": {
            "max": null,
            "online": null,
            "sample": null
        },
        "description" : null,
        "favicon": null
    };
    options = options || {};
    options.oldProtocol = options.oldProtocol || 74;
    options.protocol = options.protocol || 4;
    self.state = options.forceNewProrocol ? 1 : 0;/*0 for old protocol, 1 for new protocol*/
    
    function send () {
        var buffers = [];
        var length = -1;
        var headLength = -1;
        var fullPack;
        
        var client = net.createConnection({host: ip, port: port}, onConnect);
        client.on('data', onData);
        client.on('error', onError);
        client.setTimeout(timeout, onTimeout);
        function onConnect () {
            var handShake;
            var request;
            var protocolVersion;
            if (self.state === 0) {
                protocolVersion = options.oldProtocol;
                request = getOldRequest(ip, port, protocolVersion);
                client.write(request);
            } else if (self.state === 1){
                protocolVersion = options.protocol;
                handShake = getHandShake(ip, port, protocolVersion);
                request = getRequest();
                client.write(handShake);
                client.write(request);
            }
            log('request sented!' + (" $$0 : $$1 ").replace('$$0', ip).replace('$$1', port) + (self.state ? " (using new protocol)" : ""));
        }
        function onData (chunk) {
            log('data getted!' + (" $$0 : $$1 ").replace('$$0', ip).replace('$$1', port))
            if (self.state === 0) {
                result = extractOldPacket(chunk);
                if (result.version.protocol === 127) {
                    log('assume as a 1.7+ server, switch to new protocol for icon and player list.' + (" $$0 : $$1 ").replace('$$0', ip).replace('$$1', port))
                    self.state = 1;
                    send();
                    client.destroy();
                    return;
                }
            } else if (self.state === 1) {
                buffers.push(chunk);
                if (buffers.length == 1) {
                    length = (new Extractor(chunk)).extract('varint');
                    headLength = Builder.lengthOf(length, 'varint')
                }   
                if (Buffer.concat(buffers).length < length + headLength) {
                    log('unfinished packet; wait for next data;' + (" $$0 : $$1 ").replace('$$0', ip).replace('$$1', port))
                    return;
                }
                fullPack = Buffer.concat(buffers);
                result = extractPacket(fullPack);
            }
            result.ip = ip;
            result.port = port;
            callback(result);
            client.destroy();
        }
        function onError (e) {
            defaultResult.error = e;
            defaultResult.ip = ip;
            defaultResult.port = port;
            error('error happened!' + (" $$0 : $$1 ").replace('$$0', ip).replace('$$1', port) + " " + e.toString());
            callback(defaultResult);
            client.destroy();
        }
        function onTimeout () {
            defaultResult.error = new Error('timeout');
            defaultResult.ip = ip;
            defaultResult.port = port;
            error('timeout happened!' + (" $$0 : $$1 ").replace('$$0', ip).replace('$$1', port))
            callback(defaultResult);
            client.destroy();
        }
    }
    send();
}
/*callBack : function(json data) {}*/

exports.getHandShake = getHandShake;
exports.getRequest = getRequest;
exports.getOldRequest = getOldRequest;
exports.extractOldPacket = extractOldPacket;
exports.extractPacket = extractPacket;
exports.status = status;
exports.setDebugMode = setDebugMode;