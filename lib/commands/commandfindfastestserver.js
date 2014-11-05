(function() {
  var CommandFindFastestServer, Icommand, dns, ping, punycode,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  Icommand = require('../icommand.js');

  dns = require('dns');

  ping = require('net-ping');

  punycode = require('punycode');

  CommandFindFastestServer = (function(_super) {
    __extends(CommandFindFastestServer, _super);

    function CommandFindFastestServer() {
      this.session = ping.createSession();
    }

    CommandFindFastestServer.prototype.handle = function(sender, text, args, storage, textRouter, commandManager) {
      var err, mainDomain, target;
      if (args.length !== 2) {
        return false;
      }
      target = args[1];
      mainDomain = punycode.toASCII(target);
      try {
        dns.resolve(mainDomain, 'A', (function(_this) {
          return function(err, addresses) {
            var AddressStates, check, factory, item, _i, _len;
            if (err) {
              commandManager.sendPv(sender, textRouter, "FindFastestServer : fail to resolve " + target + " in type A due to " + (err.toString()));
              return;
            }
            AddressStates = [];
            factory = function(addresses, handle) {
              return function() {
                var arg;
                arg = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
                return handle.apply(null, [addresses].concat(arg));
              };
            };
            for (_i = 0, _len = addresses.length; _i < _len; _i++) {
              item = addresses[_i];
              AddressStates.push({
                finished: false,
                ping: null,
                address: item,
                reverseLookup: null
              });
              _this.session.pingHost(item, function(error, target, sent, rcvd) {
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
            check = function() {
              var i, _j, _len1, _results;
              if ((AddressStates.filter(function(i) {
                return !i.finished;
              })).length !== 0) {
                return;
              }
              console.log(AddressStates);
              AddressStates = AddressStates.filter(function(i) {
                return null !== i.ping;
              });
              AddressStates = AddressStates.sort(function(a, b) {
                return a.ping - b.ping;
              });
              AddressStates = AddressStates.slice(0, 10);
              i = 1;
              _results = [];
              for (_j = 0, _len1 = AddressStates.length; _j < _len1; _j++) {
                item = AddressStates[_j];
                commandManager.sendPv(sender, textRouter, "FindFastestServer : " + i + ". " + item.address + " (" + item.ping + "ms) " + (item.reverseLookup ? item.reverseLookup : ''));
                _results.push(i++);
              }
              return _results;
            };
            commandManager.sendPv(sender, textRouter, "FindFastestServer : IPs for " + target + " has been resolved, start to ping server");
          };
        })(this));
      } catch (_error) {
        err = _error;
        commandManager.sendPv(sender, textRouter, "FindFastestServer : fail to resolve " + target + " in type A due to " + (err.toString()));
      }
      return true;
    };

    CommandFindFastestServer.prototype.help = function(commandPrefix) {
      return ["make this bot to find the fastest site with domain name, will send with private message. Usage", "" + commandPrefix + " server_name"];
    };

    CommandFindFastestServer.prototype.hasPermission = function(sender, text, args, storage, textRouter, commandManager, fromBinding) {
      return !fromBinding;
    };

    return CommandFindFastestServer;

  })(Icommand);

  module.exports = CommandFindFastestServer;

}).call(this);
