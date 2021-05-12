'use strict'

const base32 = require('hi-base32');
var EC = require('elliptic').ec;
var ASN1 = require('asn1.js');
var SHA256 = require("crypto-js/sha256");

const resolver = require('./resolver');

// PEM Definitions
const ECPublicKey = ASN1.define("PublicKey", function() {
    this.seq().obj(
        this.key("algorithm").seq().obj(
            this.key("id").objid(),
            this.key("curve").objid()
        ),
        this.key("pub").bitstr()
    );
});

const ECPrivateKey = ASN1.define("ECPrivateKey", function() {
    this.seq().obj(
        this.key('version').int().def(1),
        this.key('privateKey').octstr(),
        this.key('parameters').explicit(0).objid().optional(),
        this.key('publicKey').explicit(1).bitstr().optional()
    );
});

const ALGOS = {'1.2.840.10045.2.1':'Elliptic curve public key cryptography'};
const CURVES = {'1.3.132.0.10': 'secp256k1'};

async function buildPayload(valueArray) {
    const fields = valueArray.map(function(elem) {
        return encodeURIComponent(elem.toUpperCase());
    })
    return fields.join('/');
}

async function parsePayload(payload) {
    const encodedFields = payload.split("/");
    const decodedFields = encodedFields.map(function(field) {
        return decodeURIComponent(field);
    })
    return decodedFields;
}

async function buildHashPayload(elemArray) {
    const RS = String.fromCharCode(30);
    let fields = elemArray.map(function(elem) {
        return elem.toUpperCase();
    })
    return fields.join(RS);
}

async function pad(base32Str) {
    switch (base32Str.length % 8) {
        case 2: return base32Str + "======"; 
        case 4: return base32Str + "===="; 
        case 5: return base32Str + "==="; 
        case 7: return base32Str + "="; 
    }
    return base32Str;
}

async function rmPad(base32Str) {
    return base32Str.replace(/=/g, '');
}       

async function verify(pubkey, payload, signatureBase32NoPad) {
    // Decoding the public key to get curve algorithm + key itself
    const pubk = ECPublicKey.decode(pubkey, 'pem', {label: 'PUBLIC KEY'});

    // Get Encryption Algorithm: EC
    const algoCode = pubk.algorithm.id.join('.');
    // Get Curve Algorithm: secp256k1
    const curveCode = pubk.algorithm.curve.join('.');
    
    // Prepare EC with assigned curve
    const ec = new EC(CURVES[curveCode]);
    
    // Load public key from PEM as DER
    const key = ec.keyFromPublic(pubk.pub.data, 'der');

    // Converts to UTF-8 -> WorldArray -> SHA256 Hash 
    const payloadSHA256 = SHA256(payload).toString();

    // Gets the Base32 enconded, add padding and convert to DER.
    const signatureDER = base32.decode.asBytes(await pad(signatureBase32NoPad));

    // Verifies Signature. 
    return key.verify(payloadSHA256, signatureDER);
}

async function sign(type, version, priKeyPEM, pubKeyLink, payloadValueArray) {
    // Load Primary Key
    const ec_pk = ECPrivateKey.decode(priKeyPEM, 'pem', {label: 'EC PRIVATE KEY'});
    
    // Get Curve Algorithm.
    const curveCode = ec_pk.parameters.join('.');
    
    // Prepare EC with assigned curve: secp256k1
    const ec = new EC(CURVES[curveCode]);

    // Load Private Key from PEM file converted to DER.
    const key = ec.keyFromPrivate(ec_pk.privateKey, 'der');

    // Assemble Payload
    const payload = await buildPayload(payloadValueArray);

    // Converts to UTF-8 -> WorldArray -> SHA256 Hash 
    const payloadSHA256 = SHA256(payload).toString();
    
    // Signs, gets a DER
    const signatureDER = key.sign(payloadSHA256).toDER();

    // Converts DER to Base32 and remove padding. 
    const signature = await rmPad(base32.encode(signatureDER));

    return ["CRED", type.toUpperCase(), version.toUpperCase(), signature, pubKeyLink.toUpperCase(), payload];
}

async function unpack(uri) {
  //[schema, type, version, signatureBase32NoPad, pubKeyLink, payload] = 
    return uri.split(':');
}

async function pack(array) {
    return array.join(":");
}

async function downloadKeyVerify(keyID, payload, signatureBase32NoPad) {
  let key = await resolver.getKeyId(keyID);
  if (key !== null) {
      let publicKeyPEM = key.key;
      try{
          let verified = await verify(publicKeyPEM, payload, signatureBase32NoPad);
          return verified;
      } catch(err) {
          return false;
          console.error(err);
      }
  } else {
      return null;
  }
}

async function signAndPack(type, version, priKeyPEM, pubKeyLink, payloadValueArray) {
    return await pack(await sign(type, version, priKeyPEM, pubKeyLink, payloadValueArray));
}

async function unpackAndVerify(uri) {
    const [schema, type, version, signatureBase32NoPad, pubKeyLink, payload] = await unpack(uri);  
    const verified = await downloadKeyVerify(pubKeyLink, payload, signatureBase32NoPad);
    if (verified) {
        return await parsePayload(payload);
    } else {
        return undefined;
    }
}

async function resolveKey(keyID) {
    return await resolver.getKeyId(keyID);
}

async function hashPayload(fields) {
  const hashedPassKey = await buildHashPayload(fields);
  const digest = SHA256(hashedPassKey).toString();
  const hashPassKeyBase32 = await rmPad(base32.encode(digest));
  return hashPassKeyBase32;
}

async function mapHeaders(decodedFields, type, version){
    let headers = await resolver.getPayloadHeader(type, version);  

    if (headers == null || headers.length === 0) {
        headers = new Array(decodedFields.length).fill("undefined");
    }

    let fields = {};
    decodedFields.forEach(function(field, index) {
        fields[headers[index]] = field;
    });
    return fields;
}

module.exports = {
    sign, verify, pack, unpack, signAndPack, unpackAndVerify, resolveKey, hashPayload, mapHeaders
};
