# Verifiable QR SDK for PathCheck's URI DataModels

JavaScript Implementation of [PaperCreds](https://github.com/Path-Check/paper-cred), a URI-based Verifiable QR Credentials. 

# Install
```sh
npm install @pathcheck/cred-sdk --save
```

# Setting up the Keys and Key ID Resolver via DNS

## Create a Private/Public Elliptic Curve Key Pair

Private Key: 
```sh
openssl ecparam -name secp256k1 -genkey -out private.pem
```

It will generate something like:

```
-----BEGIN EC PARAMETERS-----
BgUrgQQACg==
-----END EC PARAMETERS-----
-----BEGIN EC PRIVATE KEY-----
MHQCAQEEIPWKbSezZMY1gCpvN42yaVv76Lo47FvSsVZpQl0a5lWRoAcGBSuBBAAK
oUQDQgAE6DeIun4EgMBLUmbtjQw7DilMJ82YIvOR2jz/IK0R/F7/zXY1z+gqvFXf
DcJqR5clbAYlO9lHmvb4lsPLZHjugQ==
-----END EC PRIVATE KEY-----
```

Public Key:
```sh
openssl ec -in private.pem -pubout -out public.pem
```

Resulting in: 

```
-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE6DeIun4EgMBLUmbtjQw7DilMJ82YIvOR
2jz/IK0R/F7/zXY1z+gqvFXfDcJqR5clbAYlO9lHmvb4lsPLZHjugQ==
-----END PUBLIC KEY-----
```

## Publish the Public Key in the DNS

Separate the Base64 component of the public key and replace the new line with `\\n`: 

```
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE6DeIun4EgMBLUmbtjQw7DilMJ82YIvOR\\n2jz/IK0R/F7/zXY1z+gqvFXfDcJqR5clbAYlO9lHmvb4lsPLZHjugQ==
```

Insert a new DNS TXT Record with the base64 Segment. 

You can test the DNS Lookup with: 

```sh
dig -t txt <YOUR DOMAIN>
```

Example: 

```sh
dig -t txt keys.pathcheck.org
```

# Usage

With the keys: 

```js
const PRIVATE_KEY = `
-----BEGIN EC PARAMETERS-----
BgUrgQQACg==
-----END EC PARAMETERS-----
-----BEGIN EC PRIVATE KEY-----
MHQCAQEEIPWKbSezZMY1gCpvN42yaVv76Lo47FvSsVZpQl0a5lWRoAcGBSuBBAAK
oUQDQgAE6DeIun4EgMBLUmbtjQw7DilMJ82YIvOR2jz/IK0R/F7/zXY1z+gqvFXf
DcJqR5clbAYlO9lHmvb4lsPLZHjugQ==
-----END EC PRIVATE KEY-----
`;

const PUB_KEY_ID = "KEYS.PATHCHECK.ORG"
```

And a Payload 

```js
const BADGE_PAYLOAD = ["20210511", "MODERNA", "COVID19", "012L20A", "28", "", "C28161", "RA", "500", "JANE DOE", "19820321"];
```

Call the signAndPack to create the URI for the QR Code: 

```js
const qrUri = await signAndPack("BADGE", "2", PRIVATE_KEY, PUB_KEY_ID, BADGE_PAYLOAD);
```

And call the unpack and verify to convert the URI into the payload: 

```js
const payloadArray = await unpackAndVerify(qrUri);
```

# Development

```sh
npm install
``` 

# Test

```sh
npm test
```
