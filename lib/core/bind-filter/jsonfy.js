var JSONfy;

JSONfy = class JSONfy {
  constructor() {
    this.symbols = ['jsonfy'];
  }

  handle(sender, content, args, manager, router) {
    return (JSON.stringify(content)).replace(/^"|"$/g, '');
  }

};

module.exports = new JSONfy();
