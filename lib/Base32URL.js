'use strict'

const base32 = require('hi-base32');

// Decodes from Base32 and adds the padding
function decode(base32Str) {
    switch (base32Str.length % 8) {
        case 2: return base32.decode.asBytes(base32Str + "======"); 
        case 4: return base32.decode.asBytes(base32Str + "===="); 
        case 5: return base32.decode.asBytes(base32Str + "==="); 
        case 7: return base32.decode.asBytes(base32Str + "="); 
    }
    return base32.decode.asBytes(base32Str);
}

// Encodes to Base32 and removes the padding
function encode(bytes) {
    return base32.encode(bytes).replace(/=/g, '');
}

module.exports = {
    encode, decode
};
