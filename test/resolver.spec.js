const {getKeyId, getPayloadHeader} = require('../lib/index');
const expect = require('chai').expect; 

const PUB_KEY = `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE6DeIun4EgMBLUmbtjQw7DilMJ82YIvOR
2jz/IK0R/F7/zXY1z+gqvFXfDcJqR5clbAYlO9lHmvb4lsPLZHjugQ==
-----END PUBLIC KEY-----`;

const PUB_KEY_ID_DNS = "KEYS.PATHCHECK.ORG";
const PUB_KEY_ID_GITHUB = "1A9.PCF";
const PUB_KEY_ID_DOWNLOAD = "github.pathcheck.org/keys/ecdsa_pub_key";

describe('Resolver', function() {
  it('should resolve DNS', async () => {
    const downloadedPubKey = await getKeyId(PUB_KEY_ID_DNS);
    expect(downloadedPubKey.key).to.eql(PUB_KEY+"\n")
    expect(downloadedPubKey.debugPath).to.eql("https://dns.google/resolve?name=KEYS.PATHCHECK.ORG&type=TXT")
    expect(downloadedPubKey.type).to.eql("DNS")
  });

  it('should resolve GITDB', async () => {
    const downloadedPubKey = await getKeyId(PUB_KEY_ID_GITHUB);
    expect(downloadedPubKey.key).to.eql(PUB_KEY)
    expect(downloadedPubKey.debugPath).to.eql("https://github.com/Path-Check/paper-cred/tree/main/keys/PCF/1A9.pem")
    expect(downloadedPubKey.type).to.eql("GITDB")
  });

  it('should resolve URL', async () => {
    const downloadedPubKey = await getKeyId(PUB_KEY_ID_DOWNLOAD);
    expect(downloadedPubKey.key).to.eql(PUB_KEY)
    expect(downloadedPubKey.debugPath).to.eql("https://github.pathcheck.org/keys/ecdsa_pub_key")
    expect(downloadedPubKey.type).to.eql("URL")
  });

  it('should resolve Payload', async () => {
    const downloadedPubKey = await getPayloadHeader("BADGE", 2  );
    expect(downloadedPubKey).to.eql("date/manuf/product/lot/boosts/passkey/route/site/dose/name/dob")
  });

});