import {ec as EC} from 'elliptic';
import ASN1 from 'asn1.js';
import sha256 from 'hash.js/lib/hash/sha/256';

import { encode, decode } from 'base32url';
import { getKeyId, getPayloadHeader } from './resolver';
import { parseHeader } from './header';

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
const CURVES = {
                "1.3.132.0.10":"secp256k1",
                "1.3.132.0.33":"p224",
                "1.2.840.10045.3.1.1":"p192",
                "1.2.840.10045.3.1.7":"p256",
                "1.3.132.0.34":"p384",
                "1.3.132.0.35":"p521"
                };

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

export async function verify(pubkey, payload, signatureBase32NoPad) {
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
    const payloadSHA256 = sha256().update(payload).digest('hex');

    // Gets the Base32 enconded, add padding and convert to DER.
    const signatureDER = decode(signatureBase32NoPad);

    // Verifies Signature. 
    return key.verify(payloadSHA256, signatureDER);
}

export async function sign(type, version, priKeyPEM, keyID, payloadValueArray) {
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
    const payloadSHA256 = sha256().update(payload).digest('hex');
    
    // Signs, gets a DER
    const signatureDER = key.sign(payloadSHA256).toDER();

    // Converts DER to Base32 and remove padding. 
    const signature = encode(signatureDER);

    return ["CRED", type.toUpperCase(), version.toUpperCase(), signature, keyID.toUpperCase(), payload];
}

export async function unpack(uri) {
    return uri.split(':');
}

export async function pack(array) {
    return array.join(":");
}

async function downloadKeyVerify(keyID, payload, signatureBase32NoPad) {
  let key = await getKeyId(keyID);
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

export async function signAndPack(type, version, priKeyPEM, keyID, payloadValueArray) {
    return await pack(await sign(type, version, priKeyPEM, keyID, payloadValueArray));
}

export async function unpackAndVerify(uri) {
    const [schema, type, version, signature, keyID, payload] = await unpack(uri);  
    const verified = await downloadKeyVerify(keyID, payload, signature);
    if (verified) {
        return await parsePayload(payload);
    } else {
        return undefined;
    }
}

export async function resolveKey(keyID) {
    return await getKeyId(keyID);
}

export async function hashPayload(fields) {
  const hashedPassKey = await buildHashPayload(fields);
  const digest = sha256().update(hashedPassKey).digest();
  const hashPassKeyBase32 = encode(digest);
  return hashPassKeyBase32;
}

async function mapHeadersByType(decodedFieldStack, headers) {
    let fields = {};
    let index = 0;
    while (decodedFieldStack.length > 0 && index < headers.length) {
        let payloadElement = decodedFieldStack.shift();

        // if field is null.
        if (payloadElement == null ||  payloadElement == undefined  ||  payloadElement === "") {
            index++;
            continue;
        }

        if (headers[index].label) { // if it is a sub component. 
            fields[headers[index].label] = []; // starts arrays
            for (let i=0; i<parseInt(payloadElement); i++) { // payloadElement contains the number of elements to read. 
                fields[headers[index].label].push(await mapHeadersByType(decodedFieldStack, headers[index].data)); 
            }
        } else {
            fields[headers[index]] = payloadElement;
        }
        index++;
    }

    return fields;
}

function lpad(str, padString, length) {
    while (str.length < length)
        str = padString + str;
    return str;
}

export async function mapHeaders(decodedFields, type, version){
    let headers = await parseHeader(await getPayloadHeader(type, version));  

    if (headers == null || headers.length === 0) {
        let fields = {}
        for (let i=0; i<decodedFields.length; i++) {
            fields["Undefined "+lpad(`${i}`, "0",2)] = decodedFields[i];
        }
        return fields;
    }

    return await mapHeadersByType([...decodedFields], [...headers]);
}