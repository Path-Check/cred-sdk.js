const {sign, verify, pack, unpack, signAndPack, unpackAndVerify, resolveKey, hashPayload, mapHeaders} = require('../lib/index');

                      /*  date  /   manuf  /  product /    lot   /boosts/passkey/  route  / site/ dose /   name      /   dob  */
const TEST_PAYLOAD = ["20210511", "MODERNA", "COVID19", "012L20A", "28", ""     , "C28161", "RA", "500", "JANE DOE", "19820321"];

const PRIVATE_KEY = `-----BEGIN EC PARAMETERS-----
BgUrgQQACg==
-----END EC PARAMETERS-----
-----BEGIN EC PRIVATE KEY-----
MHQCAQEEIPWKbSezZMY1gCpvN42yaVv76Lo47FvSsVZpQl0a5lWRoAcGBSuBBAAK
oUQDQgAE6DeIun4EgMBLUmbtjQw7DilMJ82YIvOR2jz/IK0R/F7/zXY1z+gqvFXf
DcJqR5clbAYlO9lHmvb4lsPLZHjugQ==
-----END EC PRIVATE KEY-----
`;

const PUB_KEY = `-----BEGIN PUBLIC KEY-----
MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE6DeIun4EgMBLUmbtjQw7DilMJ82YIvOR
2jz/IK0R/F7/zXY1z+gqvFXfDcJqR5clbAYlO9lHmvb4lsPLZHjugQ==
-----END PUBLIC KEY-----
`;

const PUB_KEY_ID = "KEYS.PATHCHECK.ORG"

test('Sign the Array', async () => {
  const signed = await sign("BADGE", "2", PRIVATE_KEY, PUB_KEY_ID, TEST_PAYLOAD);
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

test('Resolve Key', async () => {
  const downloadedPubKey = await resolveKey(PUB_KEY_ID);
  expect(downloadedPubKey.key).toStrictEqual(PUB_KEY)
  expect(downloadedPubKey.debugPath).toStrictEqual("https://dns.google/resolve?name=KEYS.PATHCHECK.ORG&type=TXT")
  expect(downloadedPubKey.type).toStrictEqual("DNS")
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

test('HashPayload', async () => {
  const hash = await hashPayload(TEST_PAYLOAD);
  expect(hash).toBe("WEZL5RF7WQUQHUAJETG7CFXTM3IXYMWJVGFBUCNGTJKFLSDVSEIA");
});

test('Map Headers', async () => {
  const mapOfHeadersAndFields = await mapHeaders(TEST_PAYLOAD, "BADGE", "2");
  expect(mapOfHeadersAndFields).toStrictEqual({"boosts": "28", "date": "20210511", "dob": "19820321", "dose": "500", "lot": "012L20A", "manuf": "MODERNA", "name": "JANE DOE", "product": "COVID19", "route": "C28161", "site": "RA"})
});

test('Map Headers Non Existent', async () => {
  const incorrectMapOfHeadersAndFields = await mapHeaders([10], "CERTA", "1");
  expect(incorrectMapOfHeadersAndFields).toStrictEqual({"Undefined 00": 10})
});

const DGC_PAYLOAD_WITH_ARRAY = [
        "D'ARSØNS - VAN HALEN",
        'FRANÇOIS-JOAN',
        'DARSONS<VAN<HALEN',
        'FRANCOIS<JOAN',
        '-4BS',
        '1GB9TP7',
        '3OC7S0',
        'NL',
        '2',
        'P1J6RU',
        '1119349007',
        'EU/1/20/1528',
        'ORG-100030215',
        '1',
        '2',
        '-R',
        'NL',
        'MINISTRY OF VWS',
        '01:NL:PLA8UWS60Z4RZXVALL6GAZ',
        'P1J6RU',
        '1119349007',
        'EU/1/20/1528',
        'ORG-100030215',
        '2',
        '2',
        '-7',
        'NL',
        'MINISTRY OF VWS',
        '01:NL:ATS342XDYS358FDFH3GTK5',
        '2',
        'P1J6RU',
        'LP217198-3',
        'COVID PCR',
        '1232',
        '-8Q5ON',
        '260415000',
        'GGD FRYSLÂN, L-HELICONWEG',
        'NL',
        'MINISTRY OF VWS',
        '01:NL:GGD/81AAH16AZ',
        'P1J6RU',
        'LP6464-4',
        'NAAT TEST',
        '1343',
        '-4K59F',
        '260373001',
        'ALPHEN A/D RIJN',
        'NL',
        'MINISTRY OF VWS',
        '01:NL:GGD/23BBS36BC',
        '1',
        'P1J6RU',
        '-19',
        '-V',
        '4E',
        'NL',
        'MINISTRY OF VWS',
        '01:NL:LSP/REC/1289821'
      ];

  const DGC_PAYLOAD_AS_OBJECT = {
  "exp": "3OC7S0",
  "iat": "1GB9TP7",
  "iss": "NL",
  "nam.fn": "D'ARSØNS - VAN HALEN",
  "nam.fnt": "DARSONS<VAN<HALEN",
  "nam.gn": "FRANÇOIS-JOAN",
  "nam.gnt": "FRANCOIS<JOAN",
  "dob": "-4BS",
  "recov": [{
      "r.ci": "01:NL:LSP/REC/1289821",
      "r.co": "NL",
      "r.df": "-V",
      "r.du": "4E",
      "r.fr": "-19",
      "r.is": "MINISTRY OF VWS",
      "r.tg": "P1J6RU",
    }],
  "test": [ {
    "t.ci": "01:NL:GGD/81AAH16AZ",
    "t.co": "NL",
    "t.is": "MINISTRY OF VWS",
    "t.ma": "1232",
    "t.nm": "COVID PCR",
    "t.sc": "-8Q5ON",
    "t.tc": "GGD FRYSLÂN, L-HELICONWEG",
    "t.tg": "P1J6RU",
    "t.tr": "260415000",
    "t.tt": "LP217198-3",
    },{
      "t.ci": "01:NL:GGD/23BBS36BC",
      "t.co": "NL",
      "t.is": "MINISTRY OF VWS",
      "t.ma": "1343",
      "t.nm": "NAAT TEST",
      "t.sc": "-4K59F",
      "t.tc": "ALPHEN A/D RIJN",
      "t.tg": "P1J6RU",
      "t.tr": "260373001",
      "t.tt": "LP6464-4",
    },
  ],
  "vax": [ {
      "v.ci": "01:NL:PLA8UWS60Z4RZXVALL6GAZ",
      "v.co": "NL",
      "v.dn": "1",
      "v.dt": "-R",
      "v.is": "MINISTRY OF VWS",
      "v.ma": "ORG-100030215",
      "v.mp": "EU/1/20/1528",
      "v.sd": "2",
      "v.tg": "P1J6RU",
      "v.vp": "1119349007",
    }, {
      "v.ci": "01:NL:ATS342XDYS358FDFH3GTK5",
      "v.co": "NL",
      "v.dn": "2",
      "v.dt": "-7",
      "v.is": "MINISTRY OF VWS",
      "v.ma": "ORG-100030215",
      "v.mp": "EU/1/20/1528",
      "v.sd": "2",
      "v.tg": "P1J6RU",
      "v.vp": "1119349007",
    },
  ],
}


test('URI with Arrays', async () => {
  const signed = "CRED:DGC:1:GBCAEIBFOUUISCLFFO6XGSS6AM7KZR7IYOSGFW7MGFFUFMHCTJRMIIWMSMBCANYGL7N5BODF3T6ADIHOHACOXJYIKXPGCIMCHY7W3G7NGV5TZ3KV:1A9.PCF.PW:D'ARS%C3%98NS%20-%20VAN%20HALEN/FRAN%C3%87OIS-JOAN/DARSONS%3CVAN%3CHALEN/FRANCOIS%3CJOAN/-4BS/1GB9TP7/3OC7S0/NL/2/P1J6RU/1119349007/EU%2F1%2F20%2F1528/ORG-100030215/1/2/-R/NL/MINISTRY%20OF%20VWS/01%3ANL%3APLA8UWS60Z4RZXVALL6GAZ/P1J6RU/1119349007/EU%2F1%2F20%2F1528/ORG-100030215/2/2/-7/NL/MINISTRY%20OF%20VWS/01%3ANL%3AATS342XDYS358FDFH3GTK5/2/P1J6RU/LP217198-3/COVID%20PCR/1232/-8Q5ON/260415000/GGD%20FRYSL%C3%82N%2C%20L-HELICONWEG/NL/MINISTRY%20OF%20VWS/01%3ANL%3AGGD%2F81AAH16AZ/P1J6RU/LP6464-4/NAAT%20TEST/1343/-4K59F/260373001/ALPHEN%20A%2FD%20RIJN/NL/MINISTRY%20OF%20VWS/01%3ANL%3AGGD%2F23BBS36BC/1/P1J6RU/-19/-V/4E/NL/MINISTRY%20OF%20VWS/01%3ANL%3ALSP%2FREC%2F1289821";
  const result = await unpackAndVerify(signed);

  expect(result).toStrictEqual(DGC_PAYLOAD_WITH_ARRAY);
}); 

test('Map Headers with Arrays', async () => {
  const incorrectMapOfHeadersAndFields = await mapHeaders(DGC_PAYLOAD_WITH_ARRAY, "DGC", "1");
  expect(incorrectMapOfHeadersAndFields).toStrictEqual(DGC_PAYLOAD_AS_OBJECT)
});

