import {plainText} from './announcements.ts';
import {tasteThreads} from './curated-taste.ts';
import type {Opportunity} from './opportunities.ts';
import type {QuestSeed} from './quest-seeds.ts';

export type DoorFact={kind:'access'|'hours'|'entry'|'payment'|'photography';text:string;evidence:string;url:string;checkedAt:string};
export type StopGuide={practical:DoorFact[];appreciation:{text:string;basis:string}};
const tidy=(v:string)=>v.replace(/\s+/g,' ').trim();

// Deliberately scoped to a venue and its official URL. A price or rule in an
// unrelated event, shop policy or another branch must never become a door rule.
export function officialDoorFacts(item:Opportunity,html:string,checkedAt:string):DoorFact[]{
 const url=item.curation?.source||item.url;
 if(!/^https:\/\//.test(url))return [];
 const host=new URL(url).hostname.replace(/^www\./,'');
 const text=plainText(html),facts:DoorFact[]=[];
 function add(kind:DoorFact['kind'],pattern:RegExp,description:string|((m:RegExpMatchArray)=>string)){
  const m=text.match(pattern);if(m)facts.push({kind,text:typeof description==='string'?description:description(m),evidence:tidy(m[0]).slice(0,240),url,checkedAt});
 }
 if(item.title==='Little Soul Cafe'&&host==='littlesoulcafe.com'){
  add('access',/2F Taisei Bldg,?\s*3-20-2 Kitazawa/i,'Second floor, Taisei Building, 3-20-2 Kitazawa.');
  add('hours',/7pm[–-]2am Open Every Night/i,'Published hours 19:00–02:00, every night.');
 }
 if(item.title==='Bar Music'&&host==='barmusic-coffee.blogspot.com'){
  add('access',/東京都渋谷区道玄坂1-6-7-5F/,'Fifth floor, 1-6-7 Dogenzaka, Shibuya.');
  add('hours',/Open\s*\/\s*18:30[~〜～]Midnight\s*[（(]\s*金曜は翌早朝まで、\s*土\s*曜\s*・日曜は18:00 Open\s*[）)]/i,'Opens 18:30 on weekdays and 18:00 on weekends. Friday service runs into early morning.');
 }
 if(item.title==='Pianola Records'&&host==='pianola-records.com'){
  add('access',/東京都世田谷区代田2丁目36-13\s*BONUS TRACK 内/,'Inside BONUS TRACK, 2-36-13 Daita, Setagaya.');
  add('hours',/14:00[〜～~–-]21:00[（(]定休日[：:]木[）)]/,'Published hours 14:00–21:00. Closed Thursdays.');
 }
 if(item.title==='HMV record shop Shibuya'&&host==='hmv.co.jp'&&new URL(url).pathname==='/store/SHU/'){
  add('access',/東京都渋谷区宇田川町36-2\s*ノア渋谷\s*1F\/2F/,'First and second floors, Noa Shibuya, 36-2 Udagawacho.');
  add('hours',/営業時間[：:]?\s*11:00-21:00/,'Published hours 11:00–21:00.');
 }
 if(item.title==='BIG LOVE RECORDS'&&host==='bigloverecords.jp'&&new URL(url).pathname==='/en/pages/about'){
  add('access',/3F-A,?\s*2-31-3 Jingumae/i,'Third floor, unit A, 2-31-3 Jingumae.');
  add('entry',/We do not allow customers who do not intend to purchase to enter the store, or use the bar space or restrooms only\./i,'The shop asks that visitors intend to purchase. Entry just to use the bar or restroom is not allowed.');
  add('entry',/We do not accept inquiries regarding stock\./i,'The shop does not accept stock inquiries.');
  add('hours',/Tuesday[–-]Sunday,\s*2:00[–-]8:30 pm\. Closed on Mondays\./i,'Published hours Tuesday–Sunday, 14:00–20:30. Closed Mondays.');
 }
 if(item.title==='UTRECHT'&&host==='utrecht.jp'){
  add('access',/Utrecht\s*\/\s*5-36-6 Jingumae 2C, Shibuya, Tokyo/i,'Second floor, unit 2C, 5-36-6 Jingumae, Shibuya.');
 }
 if(item.title==='Kanda Brazil'&&host==='k-brazil.jp'){
  add('access',/小宮山書店の脇道を入って右の地下/,'Enter the side street beside Komiyama Bookstore. The cafe is downstairs on the right.');
  add('hours',/11:00[〜～~]21:00\(日祝[〜～~]19:00\)/,'Published hours 11:00–21:00, closing at 19:00 on Sundays and public holidays.');
 }
 if(item.title==='Komiyama Tokyo'&&host==='book-komiyama.co.jp'){
  add('access',/1-7 Jimbocho Kanda Chiyoda-ku Tokyo Japan/i,'1-7 Kanda Jimbocho, Chiyoda, Tokyo.');
 }
 if(item.title==="Bohemian's Guild"&&host==='bohemiansguild.com'&&new URL(url).pathname==='/about/'){
  add('access',/東京都千代田区神田神保町1[−-]1\s*木下ビル１F・２F/,'First and second floors, Kinoshita Building, 1-1 Kanda Jimbocho. This is the bookshop, not the separate CAGE gallery.');
  add('entry',/please contact us in advance as some of them are available in our warehouse/i,'Contact the shop in advance to see a particular artwork. Some works are kept in storage.');
 }
 if(item.title==='21_21 DESIGN SIGHT'&&host==='2121designsight.jp'){
  add('entry',/入場は18:30まで/,'Last admission is 18:30.');
  add('entry',/入場料[：:]\s*企画展、プログラムによって異なります/,'Admission prices vary by exhibition or programme. Check the programme before buying a ticket.');
  add('access',/東京都港区赤坂9-7-6\s*東京ミッドタウン\s*ミッドタウン・ガーデン/,'Tokyo Midtown Garden, 9-7-6 Akasaka, Minato.');
 }
 // JSON-LD address only when the entity name matches this exact venue.
 // Never infer payment, accessibility or booking from generic site metadata.
 if(!facts.some(f=>f.kind==='access'))for(const script of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  try{
   const data=JSON.parse(script[1]);
   const rows=Array.isArray(data)?data:[data,...(Array.isArray(data['@graph'])?data['@graph']:[])];
   const norm=(v:string)=>v.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
   for(const row of rows){
    if(typeof row?.name!=='string'||norm(row.name)!==norm(item.title))continue;
    const a=row.address;
    if(typeof a?.streetAddress!=='string'||!a.streetAddress.trim()||a.streetAddress.length>180)continue;
    facts.push({kind:'access',text:tidy([a.streetAddress,typeof a.addressLocality==='string'?a.addressLocality:''].filter(Boolean).join(', ')),evidence:tidy(a.streetAddress),url,checkedAt});break;
   }
  }catch{/* Malformed structured data contributes no facts. */}
 }
 return facts.filter((f,i)=>facts.findIndex(other=>other.kind===f.kind&&other.text===f.text)===i).slice(0,6);
}

const actions:Record<string,string>={
 hiphop:'Try tracing a drum break or sampled phrase. If you browse records, compare a familiar hip-hop name with a soul or jazz record you have never heard.',
 jazz:'Follow one instrument through a whole passage. If you browse records or books, look for the players and collaborators behind a familiar name.',
 soul:'Listen for how the voice and rhythm section answer each other. Keep one unfamiliar artist or label name to explore later.',
 funk:'Follow the bass line, then notice where the drums leave space. Choose one unfamiliar name to take into your next listening session.',
 electronic:'Notice how a repeated pattern changes through texture or timing. Choose one sound you would want to hear again.',
 ambient:'Give a quiet detail a minute of attention. Notice whether texture, space or repetition draws you in.',
 experimental:'Pick one unfamiliar sound or form and follow what changes. You do not need to decide whether you like it straight away.',
 metal:'Notice what draws you in first, the riff, the drumming or the voice. Look for an unfamiliar band connected to that detail.',
 punk:'Look for the small-label credits and handmade artwork. Choose one unfamiliar band to explore beyond the name on the sleeve.',
 rock:'Look beyond the headline name to the players or label behind it. Keep one unfamiliar connection for your next listen.',
 photography:'Choose one image before reading its caption. Notice the crop and what it leaves outside the frame.',
 film:'Treat one image like a film still. Notice the framing, colour and what seems to sit outside the scene before reading its description.',
 design:'Pick one object or page and notice how its spacing, materials and lettering work together.',
 architecture:'Notice how an entrance, a threshold or a change of light alters your view. Compare it with the space you just left.',
 art:'Stay with one work before reading its label. Name the detail that kept you there, then see whether the description changes your reading.',
 books:'Read the opening page of something outside your usual shelf. Keep the author or publisher name if it makes you want another page.',
 games:'Watch a round of an unfamiliar game, if one is running. Notice the decision you want to try yourself before spending.',
 anime:'Compare two interpretations of a familiar character or visual style. Notice what the artist changed rather than looking only for the name.',
 nostalgia:'Compare one familiar object with one you do not recognise. What attracts you besides the memory?'
};
const defaults:Record<string,string>={
 coffee:'Take ten minutes over a drink you want. Notice one detail you would normally miss, then decide what to look for at the next stop.',
 books:actions.books,dig:'Choose an unfamiliar sleeve and read the credits. Leave with one new artist or label to explore.',
 art:actions.art,listen:'If music is playing, follow a whole track and keep one unfamiliar artist name. There is no need to recognise everything.',
 play:actions.games
};

export function appreciationFor(item:Opportunity,seed:Pick<QuestSeed,'name'>,index=0):StopGuide['appreciation']{
 const c=item.curation,role=c?.role||item.category;
 const tags=c?.matchedTags||[];
 const threads=tasteThreads(tags.map(name=>({name})));
 const musicRoles=['dig','listen'],visualRoles=['art','books'];
 const allowed=musicRoles.includes(role)?['hiphop','metal','punk','electronic','jazz','soul','funk','rock','ambient','experimental','nostalgia','film']:
  visualRoles.includes(role)?['photography','design','architecture','art','books','anime','nostalgia','film']:role==='play'?['games','anime','nostalgia']:[];
 const thread=[...threads.keys()].find(t=>allowed.includes(t));
 if(c?.matchStrength!=='stopover'&&thread){
  const label=thread==='hiphop'?'hip-hop':thread;
  let task=actions[thread];
  if(role==='dig'){
   if(thread==='film')task='Look for a soundtrack, if there is a section for it. Read its composer credits and choose one unfamiliar name to explore beyond the film.';
   else if(thread==='hiphop')task=index%2?'Compare a familiar hip-hop sleeve with a soul or jazz record you have never heard. Look for a producer or label you could follow next.':'Look at the production credits on a hip-hop sleeve. Pick one unfamiliar producer to explore, then listen for a drum break or sampled phrase later.';
   else if(thread==='jazz')task=index%2?'Compare two unfamiliar jazz sleeves. Look at the instrument lineups and label credits, then choose which you would explore first.':'Choose an unfamiliar jazz sleeve and read the personnel credits. Follow one player beyond the name on the cover.';
   else task=index%2?`Compare two unfamiliar ${label} sleeves. Look for differences in the artwork, label and credits, then choose one name to explore later.`:`Use the ${label} section, if there is one, as a starting point. Read the credits on an unfamiliar sleeve and keep one artist or label name.`;
  }else if(role==='listen'&&thread==='film')task='If music is playing, imagine the scene it could accompany. Notice how tempo or texture changes that scene, then keep the track name if it stays with you.';
  else if(role==='books'&&thread==='film')task='Look for a film or image-led book, if available. Notice how the sequence of pages builds a scene differently from a moving image.';
  else if(role==='listen'&&thread==='jazz')task='If music is playing, follow one instrument through a whole passage, then shift your attention to another. Keep one track or player name to explore later.';
  else if(role==='books'&&thread==='photography'&&index%2)task='Compare two photobooks, if available. Notice how the sequence of images changes the story, then keep one photographer or publisher name.';
  else if(role==='books'&&thread==='books'&&index%2)task="Compare the opening pages of two unfamiliar books. Notice which voice makes you want to keep reading, then keep that author's name.";
  else if(role==='books'&&index%2)task=`Compare two unfamiliar books connected to ${label}, if available. Read a page from each before deciding which one you would follow further.`;
  return {text:`Starting from ${seed.name}, try this. ${task}`,basis:`${c?.matchStrength==='adjacent'?'Lateral':'Shared'} ${label} connection from the Qloo taste expansion and reviewed venue tags. SideQuest suggestion.`};
 }
 return {text:defaults[role]||'Choose one thing that catches your attention and give it a little time. Keep one name or question for later.',basis:c?.matchStrength==='stopover'||!tags.length?'SideQuest suggestion for this stop. No specific cultural connection is claimed.':'SideQuest suggestion for this activity. The taste connection is explained below.'};
}

export function guideFor(item:Opportunity,seed:Pick<QuestSeed,'name'>,index=0):StopGuide{
 return {practical:item.curation?.doorFacts||[],appreciation:appreciationFor(item,seed,index)};
}

export function applyDoorFacts(item:Opportunity,html:string,checkedAt:string):Opportunity{
 const facts=officialDoorFacts(item,html,checkedAt);
 if(!item.curation)return item;
 let hours=item.hours,hoursBasis=item.curation.hoursBasis;
 const currentHours=facts.some(f=>f.kind==='hours');
 const weekly=(open:string,close:string)=>Object.fromEntries(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day=>[day,[{opens:open,closes:close}]]));
 if(currentHours){
  if(item.title==='Bar Music')hours={...item.hours,...weekly('18:30','24:00'),saturday:[{opens:'18:00',closes:'24:00'}],sunday:[{opens:'18:00',closes:'24:00'}]};
  if(item.title==='Little Soul Cafe')hours={...item.hours,...weekly('19:00','02:00')};
  if(item.title==='Pianola Records')hours={...item.hours,...weekly('14:00','21:00'),thursday:[{closed:true}]};
  if(item.title==='HMV record shop Shibuya')hours={...item.hours,...weekly('11:00','21:00')};
  if(item.title==='BIG LOVE RECORDS')hours={...item.hours,...weekly('14:00','20:30'),monday:[{closed:true}]};
  if(item.title==='Kanda Brazil')hours={...item.hours,...weekly('11:00','21:00'),sunday:[{opens:'11:00',closes:'19:00'}]};
  hoursBasis='Official weekly hours read at dispatch';
 }
 return {...item,hours,curation:{...item.curation,sourceReadAt:checkedAt,doorFacts:facts,hoursBasis}};
}
