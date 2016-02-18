var request = require('request');
var EventEmitter = require('events').EventEmitter;
var util = require('util')

function TelegramAPI (token) {
    EventEmitter.call(this);
    this.pollingEnabled = false;
    
    this.token = token;
    
    this.lastOffset = null;
    
    this.pollingTimeout = null;
    this.pollingTimeoutId = null;
    
    this.currentPollRequest = null;
}
util.inherits(TelegramAPI, EventEmitter);


TelegramAPI.prototype.startPolling = function (timeout) {
    timeout = timeout == null ? 40 : timeout;
    
    this.pollingTimeout = timeout * 1000 + 20000;
    
    var self = this;
    
    if (this.pollingEnabled) return false;
    this.pollingEnabled = true;
    
    function checkTimeout () {
        if (self.pollingEnabled) {
            console.error('request failed to response, restart polling...')
            try {
                self.currentPollRequest.abort();
                // restart polling...
            } catch (err) {
                console.error(err)
            }
            self.pollingEnabled = false;
            self.startPolling(timeout)
        }
    }
    
    clearTimeout(this.pollingTimeoutId);
    this.pollingTimeoutId = setTimeout(checkTimeout, this.pollingTimeout);
    this.currentPollRequest = this._poll(timeout, null, function handle(err, response, body) {
        var i;
        if (err || response.statusCode !== 200) {
            self.emit('error', err || new Error('unexpect response code: ' + response.statusCode));
        } else {
            try {
                body = JSON.parse(body)
            } catch (err) {
                self.emit('error', err);
            }
            if (body.ok !== true || !Array.isArray(body.result)) {
                self.emit('error', new Error('bad response format: ' + body));
            } else {
                body.result.forEach(function (update) {
                    if (update.update_id >= self.lastOffset) {
                        self.lastOffset = update.update_id
                    }
                    if (update.message) {
                        self.emit('message', update.message)
                    } else if (update.inline_query) {
                        self.emit('inline_query', update.inline_query)
                    } else if (update.chosen_inline_result) {
                        self.emit('chosen_inline_result', update.chosen_inline_result)
                    }
                })
            }
        }
        
        if (self.pollingEnabled) {
            // console.log('current offset: ' + self.lastOffset)
            clearTimeout(self.pollingTimeoutId);
            self.pollingTimeoutId = setTimeout(checkTimeout, self.pollingTimeout);
            self.currentPollRequest = self._poll(timeout, self.lastOffset + 1, handle);
        }
    })
}
TelegramAPI.prototype._poll = function _poll (timeout, offset, cb) {
    var param = {
        timeout: timeout
    }
    if (offset != null) {
        param.offset = offset
    }
    request.get({url:'https://api.telegram.org/bot' + this.token + '/getUpdates', qs:param}, cb)
}

TelegramAPI.prototype._invoke = function _invoke(apiName, params, cb, multiPart) {
    cb = cb || function () {};
    var targetURL = 'https://api.telegram.org/bot' + this.token + '/' + apiName;
    
    var requestData = {url: targetURL};
    if (!multiPart || !params) {
        params = params || {};
        requestData.form = params;
    } else {
        params = params || {};
        requestData.formData = params;
    }
    requestData.timeout = 10000;
    
    request.post(requestData, function (err, response, body) {
        // console.log(response);
        if (err || response.statusCode !== 200) {
            return cb(err || new Error('unexpect response code: ' + response.statusCode));
        }
        try {
            body = JSON.parse(body)
        } catch (e) {
            return cb(e)
        }
        if (body.ok !== true) {
            return cb (new Error('respense in not ok'))
        }
        cb(null, body.result);
    });
}
TelegramAPI.prototype.getMe = function getMe(cb) {
    return this._invoke('getMe', null , cb);
}
TelegramAPI.prototype.answerInlineQuery = function answerInlineQuery(id, results, cb) {
    if ('string' !== typeof results) {
        results = JSON.stringify(results)
    }
    return this._invoke('answerInlineQuery', {
        inline_query_id: id,
        results: results
    } , cb);
}
TelegramAPI.prototype.sendMessage = function sendMessage(chat_id, text, cb, datas) {
    datas = typeof datas === "object" ? datas : {};
    datas.chat_id = chat_id;
    datas.text = text;
    return this._invoke('sendMessage', datas , cb);
}
module.exports = TelegramAPI