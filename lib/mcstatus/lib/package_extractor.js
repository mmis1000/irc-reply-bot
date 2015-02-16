module.exports = (function(){
    "use restrict";
    _Pw = Pw;
    function Pw(packet){
        if (!(this instanceof Pw)) {return new Pw(packet);}
        this.item = packet;
        this.offset = 0;
        this.defaultDoubleByteNull = false;
        /*console.log(this.item);//debug*/
    }
    Pw.reverseDouble = function reverseDouble (item) {
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
    Pw.prototype.setDoubleByteNull = function setDoubleByteNull (val) {
        this.defaultDoubleByteNull = !!val;
    };
    Pw.prototype.move = function move(step) {
        if (typeof step !== 'number') {return false;}
        this.offset +=  step;
        this.offset = (this.offset >= 0) ? this.offset : 0;
    };
    Pw.prototype.extract = function extract(encode, length, doubleByteNull){
        var start, end, i, pack, frag, reverseDouble = false;
        function padding(str, fill, len){
            while(str.length < len) {
                str = fill + str;
            }
            return str;
        }
        fullLength = this.item.length;
        pack = this.item;
        start = this.offset;
        
        if (start >= fullLength) {return null;}
        
        doubleByteNull = doubleByteNull !== undefined ? doubleByteNull : this.defaultDoubleByteNull;
        
        switch (encode) {
            case 'bool' :
                this.offset += 1;
                return !!pack.readInt8(start);
            case 'byte' :
                this.offset += 1;
                return pack.readInt8(start);
            case 'short' :
                this.offset += 2;
                return pack.readInt16BE(start);
            case 'int' :
                this.offset += 4;
                return pack.readInt32BE(start);
            case 'long' :
                this.offset += 8;
                return pack.writeDoubleBE(start);
            case 'varint' :
                /*TODO*/
                end = -1;
                i = start;
                while (i < fullLength) {
                    if (pack[i] <= 127) {
                        this.offset = end = i + 1;
                        break;
                    }
                    i++;
                }
                if (end === -1) {
                    console.error('unexpect end of varint of offset' + i);
                    console.error(pack);
                    return null;
                }
                this.offset = end;
                //console.log('varint:' + start + ' ' + end);
                frag = pack.slice(start, end);
                frag = Array.prototype.slice.call(frag, 0);
                result = frag.map(function(input, index, array){
                    input = input & 0x7f;
                    input = input.toString(2);
                    input = (index === array.length - 1) ? input : padding(input, '0', 7);
                    return input;
                }).reverse().join('');
                if (result.length <= 32) {
                    return parseInt(result, 2);
                } else {
                    return '0b' + result;
                    /* since the value exceeded the max in js,
                    return in boolen string*/
                }
                return null;
            case 'utf16be' :
                reverseDouble = true;
                encode = 'utf16le';
            case 'ascii' :
            case 'utf8' :
            case 'utf16le' :
            case 'ucs2' :
                end = fullLength;
                i = start;
                while (i < fullLength) {
                    if (doubleByteNull) {
                        if (pack[i] === 0 && pack[i+1] === 0) {
                            end = i;
                            this.offset = i + 2;
                            break;
                        }
                    } else {
                        if (pack[i] === 0) {
                            end = i;
                            this.offset = i + 1;
                            break;
                        }
                    }
                    i++;
                }
                if (length !== undefined && length > 0) {
                    this.offset = end = start + length;
                } else if (length !== undefined && length === -1) {
                    this.offset = end = fullLength;
                }
                /*console.log('start : ' + start + ', end : ' + end + ', length : ' + length);//debug
                console.log(this.item);//debug*/
                end = (end <= fullLength) ? end : fullLength;
                /*console.log('start : ' + start + ', end : ' + end + ', length : ' + length);//debug*/
                frag = pack.slice(start, end);
                /*console.log('frag : ' + frag.length);//debug*/
                if (reverseDouble) {
                    frag = _Pw.reverseDouble(frag);
                }
                var finished;
                try {
                    finished = frag.toString(encode);
                } catch (e) {
                    finished = null;
                }
                return finished;
            default :
                throw new Error('unknown data type ' + encode);
        }
    };
    Pw.setOffset = function setOffset(offset){
        this.offset = offset;
    };
    return Pw;
}());