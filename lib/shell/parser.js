(function() {
  var Byte, Parser, handle, parser, removeSlash;

  handle = {
    b: "\b",
    f: "\f",
    n: "\n",
    r: "\r",
    t: "\t",
    v: "\v",
    x: function(i) {
      if (i.match(/^\\x[1-9a-z][1-9a-z]$/i)) {
        return String.fromCharCode(parseInt((/^\\x([1-9a-z][1-9a-z])$/i.exec(i))[1], 16));
      } else {
        return "\uFFFD";
      }
    },
    u: function(i) {
      if (i.match(/^\\u[1-9a-z][1-9a-z][1-9a-z][1-9a-z]$/i)) {
        return String.fromCharCode(parseInt((/^\\u([1-9a-z][1-9a-z][1-9a-z][1-9a-z])$/i.exec(i))[1], 16));
      } else {
        return "\uFFFD";
      }
    }
  };

  removeSlash = function(str) {
    return str.match(/\\u....|\\x..|\\.|./g).map(function(i) {
      var identifier;
      if (i.length === 1 || !("\\" === i.charAt(0))) {
        return i;
      } else {
        identifier = i.charAt(1);
        if (!handle[identifier]) {
          return identifier;
        } else if ('function' === typeof handle[identifier]) {
          return handle[identifier](i);
        } else {
          return handle[identifier];
        }
      }
    }).join('');
  };

  Byte = (function() {
    function Byte(type, contentText) {
      this.type = type;
      this.contentText = contentText;
    }

    return Byte;

  })();

  Parser = (function() {
    function Parser() {}

    Parser.prototype.parseQuote = function(str) {
      var bytes, compund, compunds, currentMatching, i, isEscaping, j, len, ref, start, tags;
      bytes = str.match(/\\u....|\\x..|\\.|#{|./g);
      compunds = [];
      i = 0;
      isEscaping = false;
      start = -1;
      currentMatching = null;
      tags = ['/', '"', "'"];
      while (i < bytes.length) {
        if ((0 <= tags.indexOf(bytes[i])) && (isEscaping === false || bytes[i] === currentMatching)) {
          currentMatching = bytes[i];
          isEscaping = !isEscaping;
          if (isEscaping) {
            start = i;
          } else {
            compunds.push({
              start: start,
              end: i
            });
          }
        }
        i++;
      }
      if (isEscaping) {
        compunds.push({
          start: start,
          end: i
        });
      }
      ref = compunds.reverse();
      for (j = 0, len = ref.length; j < len; j++) {
        compund = ref[j];
        bytes.splice(compund.start, compund.end - compund.start + 1, bytes.slice(compund.start, +compund.end + 1 || 9e9).join(''));
      }
      bytes = bytes.map(function(i) {
        switch (i.charAt(0)) {
          case "'":
            return new Byte('data', removeSlash(i.replace(/^'|'$/g, '')));
          case '"':
            return new Byte('data', removeSlash(i.replace(/^"|"$/g, '')));
          case '/':
            return new Byte('data', i.replace(/^\/|\/$/g, ''));
          default:
            return new Byte('unknown', removeSlash(i));
        }
      });
      return bytes;
    };

    Parser.prototype.parseArgument = function(arr) {
      var frag, i, index, j, len, output;
      output = [];
      frag = "";
      for (index = j = 0, len = arr.length; j < len; index = ++j) {
        i = arr[index];
        if (i.type === 'data') {
          frag += i.contentText;
          continue;
        }
        if (i.contentText === '|') {
          if (frag.length > 0) {
            output.push(frag);
          }
          output.push('|');
          frag = '';
          continue;
        }
        if (i.contentText === ' ') {
          if (frag.length > 0) {
            output.push(frag);
            frag = '';
          }
          continue;
        }
        frag += i.contentText;
      }
      if (frag.length > 0) {
        output.push(frag);
      }
      return console.log(output);
    };

    return Parser;

  })();

  parser = new Parser;

  console.log(parser.parseArgument(parser.parseQuote('"\\ufffd 1"| | \'\\ufffd\' /\\ufffd\\x77/ \\\\ "\\ufffd\\x77"')));

  console.log(removeSlash('\\ufffd"12\\x77\\\\{'));

}).call(this);
