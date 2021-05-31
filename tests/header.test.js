const {parseHeader} = require('../lib/index');

test('Headers Badge', async () => {
  const mapOfHeadersAndFields = await parseHeader("date/manuf/product/lot/boosts/passkey/route/site/dose/name/dob");
  expect(mapOfHeadersAndFields).toStrictEqual(["date", "manuf", "product", "lot", "boosts", "passkey", "route", "site", "dose", "name", "dob"])
});

test('Headers Badge w new Line', async () => {
  const mapOfHeadersAndFields = await parseHeader("date/manuf/product/lot/boosts/passkey/route/site/dose/name/dob\n");
  expect(mapOfHeadersAndFields).toStrictEqual(["date", "manuf", "product", "lot", "boosts", "passkey", "route", "site", "dose", "name", "dob"])
});

test('Headers Array', async () => {
  const mapOfHeadersAndFields = await parseHeader(`nam.fn/nam.gn/nam.fnt/nam.gnt/dob/vax/test/recov
vax:v.tg/v.vp/v.mp/v.ma/v.dn/v.sd/v.dt/v.co/v.is/v.ci
test:t.tg/t.tt/t.nm/t.ma/t.sc/t.dr/t.tr/t.tc/t.co/t.is/t.ci
recov:r.tg/r.fr/r.df/r.du/r.co/r.is/r.ci`);
  
  expect(mapOfHeadersAndFields).toStrictEqual([
    "nam.fn","nam.gn","nam.fnt","nam.gnt","dob",
      {label: "vax", data: ["v.tg","v.vp","v.mp","v.ma","v.dn","v.sd","v.dt","v.co","v.is","v.ci"]},
      {label: "test", data: ["t.tg","t.tt","t.nm","t.ma","t.sc","t.dr","t.tr","t.tc","t.co","t.is","t.ci"]},
      {label: "recov", data: ["r.tg","r.fr","r.df","r.du","r.co","r.is","r.ci"]}
  ]);
});

test('Headers Array with new Lines', async () => {
  const mapOfHeadersAndFields = await parseHeader(`nam.fn/nam.gn/nam.fnt/nam.gnt/dob/vax/test/recov

vax:v.tg/v.vp/v.mp/v.ma/v.dn/v.sd/v.dt/v.co/v.is/v.ci

test:t.tg/t.tt/t.nm/t.ma/t.sc/t.dr/t.tr/t.tc/t.co/t.is/t.ci

recov:r.tg/r.fr/r.df/r.du/r.co/r.is/r.ci

`);
  
  expect(mapOfHeadersAndFields).toStrictEqual([
    "nam.fn","nam.gn","nam.fnt","nam.gnt","dob",
      {label: "vax", data: ["v.tg","v.vp","v.mp","v.ma","v.dn","v.sd","v.dt","v.co","v.is","v.ci"]},
      {label: "test", data: ["t.tg","t.tt","t.nm","t.ma","t.sc","t.dr","t.tr","t.tc","t.co","t.is","t.ci"]},
      {label: "recov", data: ["r.tg","r.fr","r.df","r.du","r.co","r.is","r.ci"]}
  ]);
});