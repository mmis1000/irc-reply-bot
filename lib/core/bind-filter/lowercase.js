var LowerCase;

LowerCase = class LowerCase {
  constructor() {
    this.symbols = ['lowercase'];
  }

  handle(sender, content, args, manager, router) {
    return content.toLowerCase();
  }

};

module.exports = new LowerCase();
