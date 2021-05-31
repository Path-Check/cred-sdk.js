const {getKeyId, getPayloadHeader} = require('../lib/index');

const PUB_KEY = `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE6DeIun4EgMBLUmbtjQw7DilMJ82YIvOR
2jz/IK0R/F7/zXY1z+gqvFXfDcJqR5clbAYlO9lHmvb4lsPLZHjugQ==
-----END PUBLIC KEY-----`;

const PUB_KEY_ID_DNS = "KEYS.PATHCHECK.ORG";
const PUB_KEY_ID_GITHUB = "1A9.PCF";
const PUB_KEY_ID_DOWNLOAD = "github.pathcheck.org/keys/ecdsa_pub_key";

test('Resolve DNS', async () => {
  const downloadedPubKey = await getKeyId(PUB_KEY_ID_DNS);
  expect(downloadedPubKey.key).toStrictEqual(PUB_KEY+"\n")
  expect(downloadedPubKey.debugPath).toStrictEqual("https://dns.google/resolve?name=KEYS.PATHCHECK.ORG&type=TXT")
  expect(downloadedPubKey.type).toStrictEqual("DNS")
});

test('Resolve GITDB', async () => {
  const downloadedPubKey = await getKeyId(PUB_KEY_ID_GITHUB);
  expect(downloadedPubKey.key).toStrictEqual(PUB_KEY)
  expect(downloadedPubKey.debugPath).toStrictEqual("https://github.com/Path-Check/paper-cred/tree/main/keys/PCF/1A9.pem")
  expect(downloadedPubKey.type).toStrictEqual("GITDB")
});

test('Resolve URL', async () => {
  const downloadedPubKey = await getKeyId(PUB_KEY_ID_DOWNLOAD);
  expect(downloadedPubKey.key).toStrictEqual(PUB_KEY)
  expect(downloadedPubKey.debugPath).toStrictEqual("https://github.pathcheck.org/keys/ecdsa_pub_key")
  expect(downloadedPubKey.type).toStrictEqual("URL")
});

test('Resolve Payload', async () => {
  const downloadedPubKey = await getPayloadHeader("BADGE", 2  );
  expect(downloadedPubKey).toStrictEqual("date/manuf/product/lot/boosts/passkey/route/site/dose/name/dob")
});

