// Run against localhost, or the existing private Site with its credential on
// hidden stdin. This never changes a visitor's browser taste or saved finds.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const publicHosted=process.argv.includes('--public');
const hosted=process.argv.includes('--hosted')||publicHosted;
const base=hosted?'https://sidequest-tokyo-ckx.ckx-1994.chatgpt.site':'http://127.0.0.1:5173';
let token='';
if(hosted&&!publicHosted){
 console.log('Ready for private Site credential on hidden stdin.');
 if(!process.stdin.isTTY)throw Error('Use an interactive terminal for the private Site check.');
 process.stdin.setRawMode(true);process.stdin.resume();
 token=await new Promise(resolve=>{let text='';const read=data=>{for(const c of data.toString()){if(c==='\n'||c==='\r'){process.stdin.off('data',read);process.stdin.setRawMode(false);process.stdin.pause();resolve(text);return;}text+=c;}};process.stdin.on('data',read);});
}
const headers={...(hosted&&!publicHosted?{'OAI-Sites-Authorization':'Bearer '+token}:{}),'Content-Type':'application/json',Origin:base};
const report={checkedAt:new Date().toISOString(),environment:publicHosted?'anonymous public production':hosted?'private production':'local Workers preview',scope:'Functional final check with live provider evidence and current persisted official inventory. No visitor profile edits, satisfaction scores or quality-lift claim.',pages:[],filters:[],profiles:[],checks:[]};
async function request(path,body,options={}){
 const start=Date.now(),r=await fetch(base+path,{headers,...(body===undefined?{}:{method:'POST',body:JSON.stringify(body)}),signal:AbortSignal.timeout(options.timeout||45000),...options});
 const result=await r.json();assert.equal(r.status,200,path+' '+(result.error||r.status));return {...result,milliseconds:Date.now()-start};
}
function summary(b){return {total:b.total,milliseconds:b.milliseconds,qloo:b.qloo?{status:b.qloo.status,mappedItems:b.qloo.mappedItems,scoredEntities:b.qloo.scoredEntities,positiveSignals:b.qloo.positiveSignals}:null,top:b.items.slice(0,6).map(o=>({id:o.id,title:o.englishTitle||o.title,source:o.source,kind:o.kind,discovery:o.discovery,score:o.score,reasons:o.reasons?.filter(r=>/Qloo|genre|connection|favourite|interest you like/i.test(r)).slice(0,3)}))};}
for(const [path,marker]of [['/','moment-page'],['/taste','taste-lore'],['/stumble','stumble-page'],['/quests','quest-page'],['/classic','SideQuest']]){
 const r=await fetch(base+path,{headers,signal:AbortSignal.timeout(20000)}),html=await r.text();assert.equal(r.status,200,path);assert.ok(html.includes(marker),path+' surface missing');report.pages.push({path,status:r.status});
}
if(publicHosted){const denied=await fetch(base+'/api/catalog',{method:'POST',headers,body:JSON.stringify({action:'import',items:[]})});assert.equal(denied.status,403);report.checks.push({name:'Anonymous catalog edit denied',passed:true});}
console.log('Pages passed.');
const all=await request('/api/moments',{cachedOnly:true});assert.ok(all.items.length>0,'Catalog is empty');assert.ok(all.items.every(o=>o.kind!=='place'&&(!o.endsAt||Date.parse(o.endsAt)>Date.now())),'Place or expired cutoff leaked into feed');report.catalog={total:all.total,sources:new Set(all.items.map(o=>o.source)).size,kinds:Object.fromEntries([...new Set(all.items.map(o=>o.kind))].map(kind=>[kind,all.items.filter(o=>o.kind===kind).length]))};
for(const [access,category]of [['online','all'],['tokyo','events'],['all','drops']]){
 const b=await request('/api/moments',{cachedOnly:true,access,category});assert.ok(b.items.every(o=>(access!=='online'||o.online)&&(category!=='drops'||o.kind==='release')&&(category!=='events'||o.kind!=='release')),access+' '+category+' filter leaked');report.filters.push({access,category,total:b.total});
}
console.log('Catalog and filters passed.',JSON.stringify(report.catalog));
const identities=[];
for(const [name,type]of [['Nujabes','artist'],['Iron Maiden','artist'],['Nintendo','brand'],['Pokemon FireRed Version','videogame']]){
 const s=await request('/api/search?q='+encodeURIComponent(name));const seed=s.interests?.find(i=>i.name.toLowerCase()===name.toLowerCase()&&i.type===type);assert.ok(seed,'Exact identity unavailable for '+name);identities.push(seed);
 const b=await request('/api/moments',{seeds:[{...seed,weight:1,feeling:'love'}]});assert.ok(b.items.length);if(type==='videogame')assert.ok(!b.items.some(o=>/listening party/i.test(o.title)&&o.reasons?.some(r=>/Broad art connection|Shared genre evidence:.*art/i.test(r))),'Game visual style leaked into music genre evidence');report.profiles.push({name,...summary(b)});console.log('Taste passed.',name,b.total,b.qloo?.status,b.milliseconds+'ms');
}
const inactive=await request('/api/moments',{seeds:[{...identities[0],weight:0,feeling:'love'},{...identities[1],weight:-1,feeling:'love'}]});assert.equal(inactive.seeds[0].weight,0);assert.equal(inactive.seeds[1].weight,-1);assert.deepEqual(inactive.qloo?.positiveSignals||[],[]);report.checks.push({name:'Zero and negative weights remain excluded from positive graph inputs',passed:true});
const dates=await request('/api/moments',{cachedOnly:true,sort:'ending'});const cutoff=o=>Date.parse(o.endsAt||o.startsAt||(o.end||o.start)+'T23:59:59+09:00');assert.ok(dates.items.every((o,i)=>i===0||cutoff(dates.items[i-1])<=cutoff(o)));report.checks.push({name:'Soonest dates and deadlines are chronological',passed:true});
const invalid=await fetch(base+'/api/moments',{method:'POST',headers,body:JSON.stringify({seeds:[{...identities[0],weight:7}]})});assert.equal(invalid.status,400);report.checks.push({name:'Invalid preference strength rejected',passed:true});
console.log('Preference and deadline controls passed.');
const start=Date.now(),r=await fetch(base+'/api/quests',{method:'POST',headers:{...headers,Accept:'application/x-ndjson'},body:JSON.stringify({seed:'Nujabes',choice:identities[0].id,focus:'sound'}),signal:AbortSignal.timeout(90000)});
assert.equal(r.status,200);const messages=(await r.text()).trim().split('\n').map(line=>JSON.parse(line)),quest=messages.find(m=>m.type==='result')?.data.quest;assert.ok(quest,'Agent did not return a quest');assert.ok(quest.stops.length>0,'No supported route in this run');
report.agent={milliseconds:Date.now()-start,stages:[...new Set(messages.filter(m=>m.type==='stage').map(m=>m.stage))],date:quest.date,stops:quest.stops.map(s=>({id:s.item.id,name:s.item.title,arrival:s.arrival,hours:s.hours})),title:quest.title};
console.log('Agent route passed.',report.agent.stops.map(s=>s.name).join(' -> '));
const first=quest.stops[0],replan=await request('/api/quests',{seed:'Nujabes',choice:identities[0].id,focus:'sound',reportedClosed:[first.item.id]},{timeout:90000});assert.ok(replan.quest,'Reported-closure replan returned no quest');assert.ok(!replan.quest.stops.some(s=>s.item.id===first.item.id),'Reported closed stop returned again');
report.agent.replan={basis:'Visitor-reported closure, simulated for this check. Not an organiser closure announcement.',excluded:first.item.title,date:replan.quest.date,stops:replan.quest.stops.map(s=>s.item.title),changes:replan.quest.plan?.changes||replan.quest.changes||[],milliseconds:replan.milliseconds};
assert.ok(!replan.quest.stops.some(s=>s.item.title==='Pianola Records')||new Date(replan.quest.date+'T12:00:00+09:00').getUTCDay()!==4,'Thursday closure leaked into route');
console.log('Reported-closure replan passed.',report.agent.replan.stops.join(' -> '));
report.overlap=report.profiles.flatMap((a,i)=>report.profiles.slice(i+1).map(b=>({profiles:[a.name,b.name],sharedTopSix:a.top.filter(o=>b.top.some(v=>v.id===o.id)).length})));
await mkdir(hosted?'outputs':'evaluation',{recursive:true});const path=publicHosted?'outputs/final-public-check.json':hosted?'outputs/final-hosted-check.json':'evaluation/FINAL-LOCAL.json';await writeFile(path,JSON.stringify(report,null,2)+'\n');console.log('Passed. Saved '+path);
