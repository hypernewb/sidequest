import type {Opportunity} from './opportunities.ts';
// Venue points taken from the official access pages and their linked venue
// markers, reviewed 2026-10-30. Never use a map viewport centre as a venue pin.
const venues=[
 {host:'www.unit-tokyo.com',name:'UNIT / SALOON, Daikanyama, Tokyo',lat:35.6471251,lon:139.7022986,source:'https://www.unit-tokyo.com/access/'},
 {host:'www-shibuya.jp',name:'WWW / WWW X, Shibuya, Tokyo',lat:35.6615117,lon:139.6987557,source:'https://www-shibuya.jp/access/'},
 {host:'www.liquidroom.net',name:'LIQUIDROOM, Ebisu, Tokyo',lat:35.6490399,lon:139.710584,source:'https://www.liquidroom.net/access'},
];
// Qloo place lookups on 2026-10-30. Exact venue names, official websites and
// Tokyo addresses were checked together. Publisher identity alone is not enough.
const culturalVenues=[
 {host:'shibuya.parco.jp',location:/Shibuya PARCO|渋谷パルコ/i,lat:35.6620484,lon:139.6987767,qlooId:'AB06DBAA-702C-4960-900D-43FDC7512D7F',source:'https://shibuya.parco.jp/info/'},
 {host:'www.laforet.ne.jp',location:/Laforet|ラフォーレ/i,lat:35.6692109,lon:139.7052614,qlooId:'C1DBDF96-726B-42DB-AB61-5DC85FC9C480',source:'https://www.laforet.ne.jp/'},
 {host:'store.tsite.jp',location:/Daikanyama T.Site|代官山/i,lat:35.649059,lon:139.6996224,qlooId:'9D5E5475-EE16-49E0-8AE0-ED15D77C6E41',source:'https://store.tsite.jp/daikanyama/access/'},
 {host:'www.2121designsight.jp',location:/21.?21|DESIGN SIGHT/i,lat:35.6675248,lon:139.7305214,qlooId:'6E6F123F-29AE-4D81-AEBF-9E1D4C09C849',source:'https://www.2121designsight.jp/information/'},
 {host:'www.takaishiigallery.com',location:/Taka Ishii Gallery Roppongi|タカ.イシイ.*六本木/i,lat:35.6616289,lon:139.7312219,qlooId:'5942482A-639A-400A-AA1C-5ED7019C1FEE',source:'https://www.takaishiigallery.com/en/'},
];
export function withEventLocation(o:Opportunity):Opportunity{
 if(/PR Times/i.test(o.source)&&/see issuer venue details/i.test(o.location)){
  const title=o.title+' '+(o.englishTitle||'');
  const city=/Osaka|大阪|なんば|梅田/i.test(title)?'Osaka':/Kyoto|京都/i.test(title)?'Kyoto':/Fukuoka|福岡/i.test(title)?'Fukuoka':null;
  o={...o,location:city?city+' · see issuer venue details':'Venue not confirmed · see issuer details'};
 }
 if(o.online||typeof o.lat==='number'&&typeof o.lon==='number')return o;
 let host='';try{host=new URL(o.url).hostname;}catch{return o;}
 const normalized=(h:string)=>h.replace(/^www\./,'');
 const venue=venues.find(v=>normalized(v.host)===normalized(host));
 // These calendar adapters name a single building. Do not attach the publisher's
 // coordinates to touring announcements, brand releases or external events.
 if(venue&&o.kind==='gig')return {...o,lat:venue.lat,lon:venue.lon,location:venue.name};
 const cultural=culturalVenues.find(v=>normalized(v.host)===normalized(host)&&v.location.test(o.location+' '+(host==='www.takaishiigallery.com'?o.description:'')));
 if(cultural&&!['release','place'].includes(o.kind))return {...o,lat:cultural.lat,lon:cultural.lon};
 return o;
}
