import test from 'node:test';import assert from 'node:assert/strict';
import {explicitRange,parseVinylFeed,parseBeams,parseParcel,parsePianolaEvents,parseWishless} from '../lib/independent-sources.ts';
import {extractEventDetails} from '../lib/event-detail-parser.ts';
import {parseLiquid,structuredEvents} from '../lib/expanded-sources.ts';
import {rememberDetail,enrichOne} from '../lib/event-enrichment.ts';
import {selectMusicReads} from '../lib/music-enrichment.ts';
import {interestMatch} from '../lib/interest-match.ts';
import {rankOpportunities,type Opportunity,type Preferences} from '../lib/opportunities.ts';
import {build} from 'esbuild';
import {inCatalogCategory} from '../lib/catalog-categories.ts';
import {priceContext} from '../lib/price-context.ts';
// artist-matching uses runtime aliases, so exercise its export through the same bundled import used below.
const at='2026-10-25T04:00:00Z',now=new Date(at);
test('fashion pop-up product prices cannot become admission or budget constraints',()=>{const o={...gig('design','CIBONE'),kind:'popup' as const,price:462000,details:extractEventDetails('Eclipse Shelf ¥462,000','https://www.cibone.com/topics_detail.html?info_id=1')};const fixed=priceContext(o);assert.equal(fixed.price,null);assert.equal(fixed.details?.priceCeiling,null);assert.equal(fixed.details?.prices.length,1);});
test('venue menu cheese is not a rock genre',()=>{assert.deepEqual(extractEventDetails('ロックフォールのテリーヌとアカシアはちみつのアイス','https://www.cottonclubjapan.co.jp/jp/sp/show/').genres,[]);});
const gig=(id:string,source='A'):Opportunity=>({id,title:id,source,kind:'gig',url:'https://www.unit-tokyo.com/schedule/'+id+'/',description:'',location:'Tokyo',category:'music',checkedAt:at,start:'2026-11-01',end:'2026-11-01',price:null,priceLabel:'Check',availability:'Check'});
test('vinyl feed distinguishes original listing publication from an update or invented release date',()=>{
 const xml='<entry><title>Example Artist - Example Record (LP)</title><published>2026-10-20T23:00:00Z</published><updated>2026-10-25T00:00:00Z</updated><link rel="alternate" href="https://pianola-records.com/products/record"/><summary><![CDATA[<p>価格: 4800</p><p>Experimental ambient vinyl LP.</p>]]></summary></entry>';
 const o=parseVinylFeed(xml,'pianola records',at)[0];assert.equal(o.start,'2026-10-21');assert.equal(o.actionLabel,'Shop listing published');assert.deepEqual(o.details?.artists,['Example Artist']);assert.equal(o.price,null);assert.match(o.availability,/not a verified release/);
 assert.equal(parseVinylFeed(xml.replace('<published>','<unknown>').replace('</published>','</unknown>'),'pianola records',at).length,0);
});
test('fashion article dates must share a block with a Tokyo store, not the publication timestamp or another city block',()=>{
 const block=(date:string,store:string)=>'<div class="info-table"><dl><dt>開催期間</dt><dd>'+date+'</dd></dl><dl><dt>開催店舗</dt><dd>'+store+'</dd></dl></div>';
 const html='<h1 class="ttl-lg">Designer event</h1><p>2026.10.01</p>'+block('2026年10月23日（金）〜11月3日（火）','ビームス 恵比寿、ビームス 梅田')+block('2026年12月1日〜12月10日','ビームス 梅田');
 const rows=parseBeams(html,'https://www.beams.co.jp/news/1/',at);assert.equal(rows.length,1);assert.equal(rows[0].start,'2026-10-23');assert.equal(rows[0].end,'2026-11-03');assert.ok(!rows[0].location.includes('梅田'));assert.equal(explicitRange('2026年2月30日'),null);
});
test('small gallery cards use exhibition periods, preserving closures and ignoring post publication',()=>{
 const rows=parseWishless('<article><time>2026-09-01</time><h2 class="entry-title"><a href="https://wish-less.com/archives/1">Artist show</a></h2><div class="entry-content"><p>2026年10月31日（土）～11月15日（日）</p></div></article>',at);assert.equal(rows[0].start,'2026-10-31');
 const parcel='<a href="https://parceltokyo.jp/exhibition/test/"><div class="date__Area--Start"><p class="year">2026</p><p class="sday">11.04</p></div><div class="date__Area--End"><p class="sday">12.05</p></div><h2>Show</h2><p class="spec">Artist</p><p>Closed: Sun, Mon</p></a>';
 assert.deepEqual(parseParcel(parcel,at)[0].closedDays,[0,1]);
});
test('record fair keeps its announced two-day window and does not turn stock-list posts into events',()=>{
 const xml='<entry><id>https://pianola-records.com/blogs/news/fair</id><title>Fair at BONUS TRACK</title><content><![CDATA[<p>日時：2026年10月31日(土) 11:00-19:00 11/1(日) 11:00-18:00</p><p>場所：BONUS TRACK （世田谷区代田 2-36-15）</p>]]></content></entry>';
 const rows=parsePianolaEvents(xml,at);assert.equal(rows[0].end,'2026-11-01');assert.equal(parsePianolaEvents(xml.replace('日時：','Published:'),at).length,0);
});
test('November LIQUIDROOM shows cannot inherit October from the sidebar',()=>{
 const html='<aside><th>2026.10</th></aside><div class="main_column"><p><small>2026</small>11</p><article><a class="s_link" href="https://www.liquidroom.net/schedule/artist_20261101"><time>01</time><h2>Artist A / Artist B</h2></a></article></div>';
 const o=parseLiquid(html)[0];assert.equal(o.start,'2026-11-01');assert.deepEqual(o.details?.artists,['Artist A','Artist B']);
});
test('UNIT calendar reads named performers from the event card, never the generic Organization JSON field',()=>{
 const html='<script type="application/ld+json">'+JSON.stringify([{'@type':'Event',name:'Festival',url:'https://www.unit-tokyo.com/schedule/1/',startDate:'2026-11-01',performer:'Organization'}])+'</script><a href="https://www.unit-tokyo.com/schedule/1/"><p class="p-schedule__item-lineup">Artist /【Special Guests】Guest A / Guest B</p></a>';
 assert.deepEqual(structuredEvents(html,'UNIT / SALOON','www.unit-tokyo.com')[0].details?.artists,['Artist','Guest A','Guest B']);
});
test('lineups survive role labels and more than eight lines, while shops and unrelated upcoming acts stay out',()=>{
 const text='R&B singer\nLINE UP\nLIVE\nDionela\n【Special Guests】\nJROA / Rangel / FYNE\nDJ\nOne\nTwo\nThree\nFour\nSHOP\nNot an artist\nUPCOMING\nDifferent band';const d=extractEventDetails(text,'https://www.unit-tokyo.com/schedule/1/',at);
 assert.deepEqual(d.artists,['Dionela','JROA','Rangel','FYNE','One','Two','Three','Four']);assert.ok(d.genres.some(g=>g.name==='R&B'));
 assert.equal(extractEventDetails('ADV\nTHANK YOU SOLD OUT!!','https://www.unit-tokyo.com/schedule/1/').status,'sold_out');
 assert.equal(extractEventDetails('VIP SOLD OUT\nGeneral tickets available','https://www.unit-tokyo.com/schedule/1/').status,'unknown');
});
test('dedicated music queue ignores hundreds of products and rotates venues while prioritizing unread full pages',()=>{
 const items=[...Array.from({length:200},(_,i)=>({...gig('product'+i),kind:'release' as const})),...Array.from({length:8},(_,i)=>gig('a'+i)),gig('b','B'),{...gig('read'),details:{...extractEventDetails('LINE UP\nArtist','https://www.unit-tokyo.com/schedule/read/',at),level:'full' as const}}];
 const selected=selectMusicReads(items,4,+now);assert.equal(selected.length,4);assert.ok(selected.some(o=>o.source==='B'));assert.ok(selected.every(o=>o.kind==='gig'&&o.id!=='read'));
});
test('a short calendar cache cannot satisfy an explicit full-page read',async()=>{
 const url='https://www.unit-tokyo.com/schedule/test-full/';rememberDetail(url,'LINE UP\nShort artist');let fetched=0;
 const d=await enrichOne(url,async()=>{fetched++;return new Response('<main><h1>Full show</h1><p>Jazz concert</p><p>LINE UP</p><p>Full artist</p><p>TICKET</p></main>',{headers:{'Content-Type':'text/html'}});},true);
 assert.equal(fetched,1);assert.equal(d.level,'full');assert.ok(d.genres.some(g=>g.name==='jazz'));
});
test('music genre matches can surface vinyl but cannot turn a band t-shirt into a music recommendation',()=>{
 const seed={id:'00000000-0000-4000-8000-000000000001',name:'Jazz artist',type:'artist',taste:[{name:'jazz',weight:1}]};
 const o={...gig('record'),kind:'release' as const,category:'music vinyl record',details:extractEventDetails('Spiritual jazz LP','https://bigloverecords.jp/products/1',at)};
 assert.equal(interestMatch(o,seed)?.kind,'genre');assert.equal(interestMatch({...o,category:'fashion t-shirt'},seed),null);
 const p:Preferences={intent:'collect',direction:'characters',format:'drops',date:'2026-10-25',days:30,budget:'any',unknownPrice:true,seeds:[],exclude:[]};assert.equal(rankOpportunities([o],p,now).length,0);
});
test('a generic experimental tag is not a strong Radiohead-to-metal style match',()=>{
 const seed={id:'00000000-0000-4000-8000-000000000001',name:'Radiohead',type:'artist',taste:[{name:'Alternative Rock',weight:1},{name:'Experimental',weight:1}]};
 const o={...gig('Knosis'),details:extractEventDetails('Genre: experimental metal','https://www.liquidroom.net/schedule/knosis',at)};
 const match=interestMatch(o,seed);assert.equal(match?.kind,'genre');assert.ok(match!.strength<=2);assert.ok(match!.reason.includes('no shared musical style'));
});
test('Seoul and festival names cannot fabricate soul or rock genres',()=>{
 const d=extractEventDetails('KIRARAはソウルを拠点とするエレクトロニック・ミュージシャン。\nPENTAPORT ROCK FESTIVALとFUJI ROCK FESTIVALに出演。\nテクノとアンビエントを融合。','https://www.liquidroom.net/schedule/kirara',at);
 assert.ok(d.genres.some(g=>g.name==='electronic'));assert.ok(d.genres.some(g=>g.name==='ambient'));assert.ok(!d.genres.some(g=>['soul','rock'].includes(g.name)));
});
test('a record-store name does not make an anime merchandise pop-up a vinyl fair',()=>{
 const o={...gig('Tower Records anime pop-up'),kind:'popup' as const,category:'anime goods music record'};assert.equal(inCatalogCategory(o,'vinyl'),false);assert.equal(inCatalogCategory({...o,title:'Record fair',category:'music vinyl record fair'},'vinyl'),true);
});
test('Qloo genre families cannot turn a metal guitarist into soul or a post-punk band into synthpop',async()=>{
 const b=await build({stdin:{contents:"export {genreTags,artistFitsProgramme} from './lib/artist-matching.ts'",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,format:'esm',platform:'node'});const {genreTags,artistFitsProgramme}=await import('data:text/javascript;base64,'+Buffer.from(b.outputFiles[0].text).toString('base64'));
 assert.deepEqual(genreTags({tags:[{tag_id:'urn:tag:genre:hard_rock',name:'Hard Rock'},{tag_id:'urn:tag:genre:neo_classical_metal',name:'Neo-classical Metal'},{tag_id:'urn:tag:subgenre:qloo:soul',name:'Soul'}]}),['Hard Rock','Neo-classical Metal']);
 assert.equal(artistFitsProgramme({...gig('Lakeside'),details:{artists:['Lakeside'],genres:[{name:'ambient'}]}},{genres:['Funk','Soul']}),false);
 const seed={id:'00000000-0000-4000-8000-000000000001',name:'Aphex Twin',type:'artist',taste:[{name:'Electronic',weight:1}]};const o={...gig('IQ99'),artists:[{input:'Pocket',name:'Pocket',id:'00000000-0000-4000-8000-000000000002',genres:['Electronic']}]};assert.equal(interestMatch(o,seed),null);
});
