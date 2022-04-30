var Sender;

Sender = class Sender {
  constructor(sender, target, text, channel) {
    this.sender = sender;
    this.target = target;
    this.text = text;
    this.channel = channel;
    this.senderInfo = null;
    this.targetInfo = null;
    this.channelInfo = null;
  }

  toString() {
    return this.sender;
  }

};

module.exports = Sender;
