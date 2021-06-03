const {parseHeader} = require('../lib/index');
const expect = require('chai').expect; 

describe('Header Parser', function() {
  
  it('should parse Badge', async () => {
    const mapOfHeadersAndFields = await parseHeader("date/manuf/product/lot/boosts/passkey/route/site/dose/name/dob");
    expect(mapOfHeadersAndFields).to.eql(["date", "manuf", "product", "lot", "boosts", "passkey", "route", "site", "dose", "name", "dob"])
  });

  it('should parse Badge w new Line', async () => {
    const mapOfHeadersAndFields = await parseHeader("date/manuf/product/lot/boosts/passkey/route/site/dose/name/dob\n");
    expect(mapOfHeadersAndFields).to.eql(["date", "manuf", "product", "lot", "boosts", "passkey", "route", "site", "dose", "name", "dob"])
  });

  it('should parse headers with Array', async () => {
    const mapOfHeadersAndFields = await parseHeader(`nam.fn/nam.gn/nam.fnt/nam.gnt/dob/vax/test/recov
      vax:v.tg/v.vp/v.mp/v.ma/v.dn/v.sd/v.dt/v.co/v.is/v.ci
      test:t.tg/t.tt/t.nm/t.ma/t.sc/t.dr/t.tr/t.tc/t.co/t.is/t.ci
      recov:r.tg/r.fr/r.df/r.du/r.co/r.is/r.ci`);
    
    expect(mapOfHeadersAndFields).to.eql([
      "nam.fn","nam.gn","nam.fnt","nam.gnt","dob",
        {label: "vax", data: ["v.tg","v.vp","v.mp","v.ma","v.dn","v.sd","v.dt","v.co","v.is","v.ci"]},
        {label: "test", data: ["t.tg","t.tt","t.nm","t.ma","t.sc","t.dr","t.tr","t.tc","t.co","t.is","t.ci"]},
        {label: "recov", data: ["r.tg","r.fr","r.df","r.du","r.co","r.is","r.ci"]}
    ]);
  });

  it('should parse headers array with new Lines', async () => {
    const mapOfHeadersAndFields = await parseHeader(`nam.fn/nam.gn/nam.fnt/nam.gnt/dob/vax/test/recov

    vax:v.tg/v.vp/v.mp/v.ma/v.dn/v.sd/v.dt/v.co/v.is/v.ci

    test:t.tg/t.tt/t.nm/t.ma/t.sc/t.dr/t.tr/t.tc/t.co/t.is/t.ci

    recov:r.tg/r.fr/r.df/r.du/r.co/r.is/r.ci

    `);
  
    expect(mapOfHeadersAndFields).to.eql([
      "nam.fn","nam.gn","nam.fnt","nam.gnt","dob",
        {label: "vax", data: ["v.tg","v.vp","v.mp","v.ma","v.dn","v.sd","v.dt","v.co","v.is","v.ci"]},
        {label: "test", data: ["t.tg","t.tt","t.nm","t.ma","t.sc","t.dr","t.tr","t.tc","t.co","t.is","t.ci"]},
        {label: "recov", data: ["r.tg","r.fr","r.df","r.du","r.co","r.is","r.ci"]}
    ]);
  });

});