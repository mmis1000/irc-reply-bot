module.exports = (function(){
    "use restrict";
    var _Pb = Pb;
    function Pb(id, data){
        this.buffers = [];
    }
    Pb.lengthOf = function lengthOf (item, encode) {
        return _Pb.pack(item, encode).length;
    };
    Pb.reverseDouble = function reverseDouble (item) {
                    //console.log('st' + ' ' + dump(item));/*debug*/
        var length = item.length,
            i,
            newPacket;
        newPacket = new Buffer(length);
        for (i = 0; i < length - 1; i += 2) {
            newPacket[i] = item[i + 1];
            newPacket[i + 1] = item[i];
        }
        
                    //console.log('ed' + ' ' + dump(newPacket));/*debug*/
        return newPacket;
    };
    Pb.pack = function pack(item, encode) {
        var buffer, length, array, bufferSize, temp, frag, i, reverseDouble = false;
        switch (encode) {
            case 'bool' :
            case 'byte' :
                item = (item + 256) % 256;
                buffer = new Buffer([item]);
                return buffer;
            case 'short' : 
                buffer = new Buffer(2);
                buffer.writeInt16BE(item, 0);
                return buffer;
            case 'int' :
                buffer = new Buffer(4);
                buffer.writeInt32BE(item, 0);
                return buffer;
            case 'long' :
                buffer = new Buffer(8);
                buffer.writeDoubleBE(item, 0);
                return buffer;
            case 'varint' :
                temp = item.toString(2);
                length = temp.length;
                bufferSize = Math.ceil(length / 7);/*each ocelet has 7 bit number and 1 bit indetical*/
                array = [];
                for (i = 0; i < bufferSize; i++) {
                    frag = (temp.length > 7) ? temp.slice(temp.length - 7) : temp;
                    frag = parseInt(frag, 2);
                    frag = (i === bufferSize - 1) ? frag : frag + 128;
                    /*write the indetical bit*/
                    array.push(frag);
                    temp = (temp.length > 7) ? temp.slice(0, temp.length - 7) : '';
                }
                buffer = new Buffer(array);
                return buffer;
            case 'utf16be' :
                reverseDouble = true;
                encode = 'utf16le';
            case 'ascii' :
            case 'utf8' :
            case 'utf16le' :
            case 'ucs2' :
                buffer = new Buffer(item, encode);
                if (reverseDouble) {
                    buffer = _Pb.reverseDouble(buffer);
                }
                /*buffer = Buffer.concat([_Pb.pack(buffer.length, 'varint'), buffer])//let appendWithLength do this*/
                return buffer;
            default :
                throw new Error('unknown data type ' + encode);
        }
        
    };
    Pb.prototype.append = function append(item, encode){
        var buffer = _Pb.pack(item, encode);
        this.buffers.push(buffer);
        return this;
    };
    Pb.prototype.appendWithLength = function appendWithLength(item, encode, lengthEncode){
        var buffer = _Pb.pack(item, encode);
        lengthEncode = (lengthEncode === undefined) ? 'varint' : lengthEncode;
        buffer = Buffer.concat([_Pb.pack(buffer.length, lengthEncode), buffer]);
        this.buffers.push(buffer);
        return this;
    };
    Pb.prototype.buildWithLength = function buildWithLength() {
        var length, buffers, head, i, finished;
        /* make a surface copy */
        buffers = this.buffers.concat([]);
        length = 0;
        for (i = 0; i < buffers.length; i++) {
            length += buffers[i].length;
        }
        head = _Pb.pack(length, 'varint');
        buffers.unshift(head);
        finished = Buffer.concat(buffers);
        return finished;
    };
    Pb.prototype.build = function build() {
        var buffers, finished;
        /* make a surface copy */
        buffers = this.buffers.concat([]);
        finished = Buffer.concat(buffers);
        return finished;
    };
    Pb.prototype.dropAll = function dropAll() {
        this.buffers = [];
    };
    return Pb;
}());