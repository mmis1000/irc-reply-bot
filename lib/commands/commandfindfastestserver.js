var CommandFindFastestServer, Icommand, dns, ping, punycode;

Icommand = require('../icommand.js');

dns = require('dns');

ping = require('net-ping');

punycode = require('punycode');

CommandFindFastestServer = class CommandFindFastestServer extends Icommand {
  constructor() {
    super();
    this.session = ping.createSession();
  }

  handle(sender, text, args, storage, textRouter, commandManager) {
    var done, err, mainDomain, target;
    if (args.length !== 2) {
      return false;
    }
    target = args[1];
    mainDomain = punycode.toASCII(target);
    done = textRouter.async();
    try {
      dns.resolve(mainDomain, 'A', (err, addresses) => {
        var AddressStates, check, factory, item, j, len;
        if (err) {
          commandManager.sendPv(sender, textRouter, `FindFastestServer : fail to resolve ${target} in type A due to ${err.toString()}`);
          done();
          return;
        }
        AddressStates = [];
        factory = function(addresses, handle) {
          return function(...arg) {
            return handle.apply(null, [addresses].concat(arg));
          };
        };
        for (j = 0, len = addresses.length; j < len; j++) {
          item = addresses[j];
          AddressStates.push({
            finished: false,
            ping: null,
            address: item,
            reverseLookup: null
          });
          this.session.pingHost(item, (error, target, sent, rcvd) => {
            var ms, worker;
            ms = rcvd - sent;
            if (err) {
              (AddressStates.filter(function(i) {
                return i.address === target;
              }))[0].finished = true;
              check();
              return true;
            }
            (AddressStates.filter(function(i) {
              return i.address === target;
            }))[0].ping = ms;
            worker = factory(target, function(address, err, addresses) {
              if (addresses) {
                addresses = addresses.filter(function(i) {
                  return i !== mainDomain;
                });
              }
              if (!err && addresses.length > 0) {
                (AddressStates.filter(function(i) {
                  return i.address === target;
                }))[0].reverseLookup = addresses[0];
              }
              (AddressStates.filter(function(i) {
                return i.address === target;
              }))[0].finished = true;
              return check();
            });
            return dns.resolve(target, 'PTR', worker);
          });
        }
        check = () => {
          var i, k, len1;
          if ((AddressStates.filter(function(i) {
            return !i.finished;
          })).length !== 0) {
            return;
          }
          //console.log AddressStates
          AddressStates = AddressStates.filter(function(i) {
            return null !== i.ping;
          });
          AddressStates = AddressStates.sort(function(a, b) {
            return a.ping - b.ping;
          });
          AddressStates = AddressStates.slice(0, 10);
          i = 1;
          for (k = 0, len1 = AddressStates.length; k < len1; k++) {
            item = AddressStates[k];
            commandManager.sendPv(sender, textRouter, `FindFastestServer : ${i}. ${item.address} (${item.ping}ms) ${item.reverseLookup ? item.reverseLookup : ''}`);
            i++;
          }
          return done();
        };
        
        //commandManager.sendPv sender, textRouter, "Lookup : Results for #{target} in type #{type} :"
        commandManager.sendPv(sender, textRouter, `FindFastestServer : IPs for ${target} has been resolved, start to ping server`);
      });
    } catch (error1) {
      //commandManager.sendPv sender, textRouter, addresses
      err = error1;
      commandManager.sendPv(sender, textRouter, `FindFastestServer : fail to resolve ${target} in type A due to ${err.toString()}`);
      done();
    }
    return true;
  }

  help(commandPrefix) {
    return ["make this bot to find the fastest site with domain name, will send with private message. Usage", `${commandPrefix} server_name`];
  }

  hasPermission(sender, text, args, storage, textRouter, commandManager, fromBinding) {
    return !fromBinding;
  }

};

module.exports = CommandFindFastestServer;
