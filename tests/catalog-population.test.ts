import test from 'node:test';import assert from 'node:assert/strict';
import {parseSpirits,parseMedicomProducts,parseAnimate,parseMidtown} from '../lib/release-sources.ts';
import {catalogCurrent,overlapsWindow} from '../lib/catalog-policy.ts';
import {catalogDrop} from '../lib/drop-catalog.ts';
import {rankOpportunities,type Opportunity,type Preferences} from '../lib/opportunities.ts';
import {readBrowserTaste,writeBrowserTaste} from '../lib/browser-taste.ts';
import {enrichOne} from '../lib/event-enrichment.ts';
import {catalogTitle} from '../lib/catalog-labels.ts';
const now=new Date('2026-10-25T03:00:00Z'),at=now.toISOString();
const p:Preferences={intent:'mix',direction:'any',format:'dated',date:'2026-10-25',days:30,budget:'any',unknownPrice:true,seeds:[],exclude:[]};
const item=(id:string,patch:Partial<Opportunity>={}):Opportunity=>({id,title:id,kind:'release',source:'Official',url:'https://example.org/'+id,description:'',location:'Japan retailers',online:true,category:'character goods',start:'2026-10-24',end:'2026-10-24',checkedAt:at,price:null,priceLabel:'Unknown',availability:'Check stock',...patch});
test('product labels preserve character identity even when a cached machine translation mangles it',()=>{
 const title=catalogTitle({source:'BANDAI SPIRITS',title:'ポケットモンスター もふぐっと しっぽみてみて！ぬいぐるみ～ヒトカゲ・ライチュウ～',englishTitle:'Human Lizard'});
 assert.match(title,/Pokémon.*plush.*Charmander, Raichu/);assert.ok(!title.includes('Human Lizard'));
});
test('distinct products on one shipping calendar survive deduplication without claiming release stock',()=>{
 const a=item('Figure A',{url:'https://www.goodsmile.com/ja/releaseinfo',actionLabel:'Shipping date'}),b={...a,id:'b',title:'Figure B'};
 const rows=rankOpportunities([a,b,{...a,id:'duplicate'}],p,now);assert.equal(rows.length,2);assert.match(rows[0].reasons!.join(' '),/shipping date/);
 assert.equal(catalogDrop(a,now)?.method,'shipping');
});
test('release dates remain exact while recent releases stay browseable; ended preorders do not',()=>{
 const release=item('recent');assert.ok(catalogCurrent(release,now));assert.ok(overlapsWindow(release,['2026-10-25']));assert.equal(release.end,'2026-10-24');
 assert.equal(catalogCurrent(item('old',{start:'2026-10-01',end:'2026-10-01'}),now),false);
 assert.equal(catalogCurrent(item('closed',{start:'2026-10-01',end:'2026-10-24',actionLabel:'Preorder window'}),now),false);
 assert.equal(catalogCurrent(item('closed-single-day',{actionLabel:'Preorder window'}),now),false);
 assert.ok(catalogCurrent(item('cached',{checkedAt:'2026-10-23T00:00:00Z'}),now));
 assert.equal(catalogCurrent(item('stale',{checkedAt:'2026-10-01T00:00:00Z'}),now),false);
 assert.equal(catalogDrop(release,now)?.channel,'japan');
});
test('Bandai calendar scopes individual products to exact headings and rejects month-only estimates',()=>{
 const card='<div class="m_cardA"><a href="/products/search/detail.php?prd_id=1&amp;grp_id=2"></a><div class="m_cardA__title">ガンダム model</div><div class="m_cardA__price">3,000円</div>';
 const found=parseSpirits('<h3 class="m_titleB__title">2026年10月31日</h3>'+card+'<h3 class="m_titleB__title">2026年11月予定</h3>'+card,at);
 assert.equal(found.length,1);assert.equal(found[0].start,'2026-10-31');assert.ok(found[0].url.includes('&grp_id=2'));assert.equal(found[0].price,3000);
});
test('MEDICOM preserves per-product preorder windows and refuses to invent an open-ended deadline',()=>{
 const xml='<entry><title>限定品 受注開始のお知らせ</title><content><![CDATA[<strong>BE@RBRICK A</strong><br>頒布価格￥16,500<br>受注期間 2026年10月24日(土) 00:00 〜 2026年11月10日(火) 23:59まで<br><a href="https://store.medicomtoy.co.jp/products/a">STORE</a><strong>BE@RBRICK B</strong><br>受注期間 2026年10月24日(土) 00:00 〜 <a href="https://store.medicomtoy.co.jp/products/b">STORE</a>]]></content></entry>';
 const found=parseMedicomProducts(xml,at);assert.equal(found.length,1);assert.equal(found[0].title,'BE@RBRICK A');assert.equal(found[0].end,'2026-11-10');assert.equal(found[0].actionLabel,'Preorder window');
});
test('Animate uses the event period, not the article publication date, and requires a Tokyo store',()=>{
 const card=(place:string)=>'<div class="gr-osCard"><a class="gr-osCardLink" href="https://www.animate.co.jp/onlyshop/123/">x</a><div class="gr-osCardDate">2026.10.01</div><div class="gr-osCardTitle"><span>Pop up</span></div><div class="gr-osCardStore">'+place+'</div><div class="gr-osCardPeriod">2026.11.07（土）〜2026.11.23（祝）</div>';
 assert.equal(parseAnimate(card('アニメイト池袋本店'),at)[0].start,'2026-11-07');assert.equal(parseAnimate(card('大阪'),at).length,0);
});
test('Midtown accepts named event routes and explicit pop-up pages without including generic shop openings',()=>{
 const found=parseMidtown('<a href="/jp/event/designlive/"><dt>DESIGN LIVE<br>2026/10/16(金)〜11/4(水)</dt></a><a href="/jp/shops/info/popup/"><dt>期間限定ショップ CRAFT<br>2026/10/2(金)〜10/29(木)</dt></a>',at);
 assert.deepEqual(found.map(o=>o.kind),['exhibition','popup']);
});
test('contrasting tastes reverse the relevant shortlist across English and Japanese titles',()=>{
 const pokemon=item('pokemon',{title:'ポケットモンスター ぬいぐるみ'}),gundam=item('gundam',{title:'ガンダム フィギュア'});
 const seed=(name:string)=>({id:'11111111-1111-4111-8111-111111111111',name,type:'brand',feeling:'love' as const});
 assert.equal(rankOpportunities([gundam,pokemon],{...p,seeds:[seed('Pokémon')]},now)[0].id,'pokemon');
 assert.equal(rankOpportunities([pokemon,gundam],{...p,seeds:[seed('Gundam')]},now)[0].id,'gundam');
 assert.deepEqual(rankOpportunities([pokemon,gundam],{...p,avoid:['Pokémon']},now).map(o=>o.id),['gundam']);
 const conflict=item('metal',{title:'DEXCORE',kind:'gig',signals:['Nujabes'],artists:[{input:'DEXCORE',id:'other',name:'DEXCORE',genres:['Death metal']}],start:'2026-10-28',end:'2026-10-28'});
 assert.equal(rankOpportunities([conflict],{...p,seeds:[{...seed('Nujabes'),type:'artist',taste:[{name:'Hip hop',weight:1}]}]},now)[0].matchLevel,'activity');
});
test('a saved shared profile retains curiosity and explicit exclusions without adding persona assumptions',()=>{
 const store=new Map<string,string>(),storage={getItem:(k:string)=>store.get(k)||null,setItem:(k:string,v:string)=>{store.set(k,v);}};
 const seeds=[{id:'11111111-1111-4111-8111-111111111111',name:'Pokémon',type:'brand',feeling:'curious' as const}];
 writeBrowserTaste(storage,seeds,['Gundam']);assert.deepEqual(readBrowserTaste(storage),{seeds,avoid:['Gundam']});
});
test('source variety cannot push unrelated filler above a curious franchise match',()=>{
 const releases=Array.from({length:20},(_,i)=>item('pokemon-'+i,{title:'ポケモン '+i}));
 const other=item('other',{source:'Other publisher',kind:'gig',start:'2026-10-28',end:'2026-10-28'});
 const seeds=[{id:'11111111-1111-4111-8111-111111111111',name:'Pokémon',type:'brand',feeling:'curious' as const}];
 assert.equal(rankOpportunities([...releases,other],{...p,seeds},now).at(-1)?.id,'other');
});
test('explicit sold-out retailer notices are suppressed and source genres outrank ambiguous artist metadata',()=>{
 assert.equal(rankOpportunities([item('sold',{availability:'This retailer listed the item as sold out when checked.'})],p,now).length,0);
 const gig=item('fOUL',{kind:'gig',start:'2026-10-28',end:'2026-10-28',artists:[{id:'other',input:'fOUL',name:'fOUL',genres:['Death Metal']}],details:{original:'Punk night',genres:[{name:'punk',evidence:'Punk night'}],artists:['fOUL'],prices:[],times:[],priceCeiling:null,status:'unknown',url:'https://example.org/show',checkedAt:at}});
 const seed={id:'11111111-1111-4111-8111-111111111111',name:'Slayer',type:'artist',feeling:'love' as const,taste:[{name:'Thrash Metal',weight:1}]};
 assert.equal(rankOpportunities([gig],{...p,seeds:[seed]},now)[0].matchLevel,'activity');
});
test('a full-page refresh of an anchored gig reads only its day, never genres from other nights',async()=>{
 const html='<div class="month">2026年10月</div><tr><th>28</th><td><strong>Punk night</strong>punk OPEN 19:00</td></tr><tr><th>29</th><td><strong>Jazz night</strong>jazz OPEN 20:00</td></tr>';
 const fetcher=(async()=>new Response(html,{headers:{'Content-Type':'text/html'}})) as typeof fetch;
 const d=await enrichOne('https://ufoclub.jp/schedule/#2026-10-28',fetcher);assert.deepEqual(d.genres.map(g=>g.name),['punk']);assert.ok(!d.original.includes('Jazz night'));
});
