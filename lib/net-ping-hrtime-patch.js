const net_ping = require('net-ping');
const raw = require ("net-ping/node_modules/raw-socket");

var DestinationUnreachableError = net_ping.DestinationUnreachableError;
var PacketTooBigError = net_ping.PacketTooBigError;
var ParameterProblemError = net_ping.ParameterProblemError;
var RedirectReceivedError = net_ping.RedirectReceivedError;
var RequestTimedOutError = net_ping.RequestTimedOutError;
var SourceQuenchError = net_ping.SourceQuenchError;
var TimeExceededError = net_ping.TimeExceededError;


var patch = {};
patch.onSocketSend = function (req, error, bytes) {
	if (! req.sent)
		req.sent = new Date ();
		req.hr_sent = process.hrtime();
	if (error) {
		this.reqRemove (req.id);
		req.callback (error, req.target, req.sent, req.sent);
	} else {
		var me = this;
		req.timer = setTimeout (this.onTimeout.bind (me, req), req.timeout);
	}
};

patch.onTimeout = function (req) {
	if (req.retries > 0) {
		req.retries--;
		this.send (req);
	} else {
		this.reqRemove (req.id);
		req.callback (new RequestTimedOutError ("Request timed out"),
				req.target, req.sent, new Date, req.hr_sent, process.hrtime());
	}
};

patch.onSocketMessage = function (buffer, source) {
	if (this._debug)
		this._debugResponse (source, buffer);

	var req = this.fromBuffer (buffer);
	if (req) {
		/**
		 ** If we ping'd ourself (i.e. 127.0.0.1 or ::1) then it is likely we
		 ** will receive the echo request in addition to any corresponding echo
		 ** responses.  We discard the request packets here so that we don't
		 ** delete the request from the from the request queue since we haven't
		 ** actually received a response yet.
		 **/
		if (this.addressFamily == raw.AddressFamily.IPv6) {
			if (req.type == 128)
				return;
		} else {
			if (req.type == 8)
				return;
		}
		
		this.reqRemove (req.id);
		
		if (this.addressFamily == raw.AddressFamily.IPv6) {
			if (req.type == 1) {
				req.callback (new DestinationUnreachableError (source), req.target,
						req.sent, new Date (),
						req.hr_sent, process.hrtime());
			} else if (req.type == 2) {
				req.callback (new PacketTooBigError (source), req.target,
						req.sent, new Date (),
						req.hr_sent, process.hrtime());
			} else if (req.type == 3) {
				req.callback (new TimeExceededError (source), req.target,
						req.sent, new Date (),
						req.hr_sent, process.hrtime());
			} else if (req.type == 4) {
				req.callback (new ParameterProblemError (source), req.target,
						req.sent, new Date (),
						req.hr_sent, process.hrtime());
			} else if (req.type == 129) {
				req.callback (null, req.target,
						req.sent, new Date (),
						req.hr_sent, process.hrtime());
			} else {
				req.callback (new Error ("Unknown response type '" + req.type
						+ "' (source=" + source + ")"), req.target,
						req.sent, new Date (),
						req.hr_sent, process.hrtime());
			}
		} else {
			if (req.type == 0) {
				req.callback (null, req.target,
						req.sent, new Date (),
						req.hr_sent, process.hrtime());
			} else if (req.type == 3) {
				req.callback (new DestinationUnreachableError (source), req.target,
						req.sent, new Date (),
						req.hr_sent, process.hrtime());
			} else if (req.type == 4) {
				req.callback (new SourceQuenchError (source), req.target,
						req.sent, new Date (),
						req.hr_sent, process.hrtime());
			} else if (req.type == 5) {
				req.callback (new RedirectReceivedError (source), req.target,
						req.sent, new Date (),
						req.hr_sent, process.hrtime());
			} else if (req.type == 11) {
				req.callback (new TimeExceededError (source), req.target,
						req.sent, new Date (),
						req.hr_sent, process.hrtime());
			} else {
				req.callback (new Error ("Unknown response type '" + req.type
						+ "' (source=" + source + ")"), req.target,
						req.sent, new Date (),
						req.hr_sent, process.hrtime());
			}
		}
	}
};

function patchClass(Class) {
  for (var method in patch) {
    if (patch.hasOwnProperty(method)) {
      Class.prototype[method] = patch[method];
    }
  }
  return Class;
}

module.exports = patchClass;