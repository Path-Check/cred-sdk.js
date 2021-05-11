const {sign, verify, pack, unpack, signAndPack, unpackAndVerify} = require('../lib/index');

const TEST_PAYLOAD = ["20210511", "MODERNA", "COVID19", "012L20A", "28", "", "C28161", "RA", "500", "JANE DOE", "19820321"];

const PRIVATE_KEY = 
  "-----BEGIN EC PARAMETERS-----\n" +
  "BgUrgQQACg==\n" +
  "-----END EC PARAMETERS-----\n" +
  "-----BEGIN EC PRIVATE KEY-----\n" +
  "MHQCAQEEIPWKbSezZMY1gCpvN42yaVv76Lo47FvSsVZpQl0a5lWRoAcGBSuBBAAK\n" +
  "oUQDQgAE6DeIun4EgMBLUmbtjQw7DilMJ82YIvOR2jz/IK0R/F7/zXY1z+gqvFXf\n" +
  "DcJqR5clbAYlO9lHmvb4lsPLZHjugQ==\n" +
  "-----END EC PRIVATE KEY-----";

const PUB_KEY = 
  "-----BEGIN PUBLIC KEY-----\n" +
  "MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE6DeIun4EgMBLUmbtjQw7DilMJ82YIvOR\n" +
  "2jz/IK0R/F7/zXY1z+gqvFXfDcJqR5clbAYlO9lHmvb4lsPLZHjugQ==\n" +
  "-----END PUBLIC KEY-----\n";

const PUB_KEY_ID = "KEYS.PATHCHECK.ORG"

test('Sign the Array', async () => {
  const signed = await sign("BADGE", "2", PRIVATE_KEY, PUB_KEY_ID, TEST_PAYLOAD);
  console.log(signed);
  expect(signed).not.toBe(null);
});

test('Verify the Array', async () => {
  const payload = '20210511/MODERNA/COVID19/012L20A/28//C28161/RA/500/JANE%20DOE/19820321';
  const signature = 'GBCAEIB3H2YRVGFK35Z5R4ACQFFPBRPS3F7OWSA4FCFORMOWLKIO6B6ODIBCAGKHXL7NRK7RDXHXBEGGLDOSFV3ZUGU7F64ASRRD3QUYDYYY5VEW';
  const verified = await verify(PUB_KEY, payload, signature);

  expect(verified).toBe(true);
});

test('Sign and Verify a json', async () => {
  const [schema, type, version, signature, keyid, payload] = await sign("BADGE", "2", PRIVATE_KEY, PUB_KEY_ID, TEST_PAYLOAD);
  const result = await verify(PUB_KEY, payload, signature);

  expect(result).toStrictEqual(true)
});

test('Pack And Unpack', async () => {
  const data = ["CRED", "TYPE", "VER", "SIGNATURE", "KEYID", "PAYLOAD"];
  const packed = await pack(data);
  const [schema, type, version, signature, keyid, payload] = await unpack(packed);
  expect(schema).toBe("CRED");
  expect(type).toBe("TYPE");
  expect(version).toBe("VER");
  expect(signature).toBe("SIGNATURE");
  expect(keyid).toBe("KEYID");
  expect(payload).toBe("PAYLOAD");
});

test('Sign Pack And Unpack Verify JSON', async () => {
  const signed = await signAndPack("BADGE", "2", PRIVATE_KEY, PUB_KEY_ID, TEST_PAYLOAD);
  const result = await unpackAndVerify(signed);
  expect(result).toStrictEqual(TEST_PAYLOAD);
});