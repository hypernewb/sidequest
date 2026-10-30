import fs from 'node:fs/promises';
const hosted=process.argv.includes('--hosted'),base=hosted?'https://sidequest-tokyo-ckx.ckx-1994.chatgpt.site':'http://127.0.0.1:5173';
const headers={'Content-Type':'application/json'};
if(hosted){console.log('Ready for service credential on hidden stdin.');process.stdin.setRawMode(true);process.stdin.resume();const token=await new Promise(resolve=>{let input='';const f=chunk=>{for(const c of chunk.toString()){if(c==='\r'||c==='\n'){process.stdin.off('data',f);process.stdin.setRawMode(false);process.stdin.pause();resolve(input);return;}input+=c;}};process.stdin.on('data',f);});headers['OAI-Sites-Authorization']='Bearer '+token;headers['X-SideQuest-Catalog-Key']=token;}
const call=async(path,body)=>{const r=await fetch(base+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(240000)});if(!r.ok)throw Error(path+' '+r.status);return r.json();};
const before=await call('/api/catalog');await fs.mkdir('.local/independent',{recursive:true});await fs.writeFile('.local/independent/before-'+(hosted?'hosted':'local')+'.json',JSON.stringify(before));console.log('Before',JSON.stringify(before.music||before.inventory));
if(process.argv.includes('--refresh'))for(const action of ['refresh','expand']){const r=await call('/api/catalog',{action});console.log(action,JSON.stringify({records:r.records,health:r.health}));}
if(process.argv.includes('--enrich'))for(let i=0;i<10;i++){const r=await call('/api/catalog',{action:'enrich_music'});console.log('music',JSON.stringify(r));if(!r.remaining||!r.read)break;}
const after=await call('/api/catalog');await fs.writeFile('.local/independent/after-'+(hosted?'hosted':'local')+'.json',JSON.stringify(after));console.log('After',JSON.stringify({music:after.music,inventory:after.inventory}));
const cases=[['Nujabes','artist','music','any'],['Slayer','artist','music','heavy'],['Aphex Twin','artist','music','any'],['Bill Evans','artist','music','jazz'],['Fontaines D.C.','artist','mix','any'],['Pokémon',null,'mix','any'],['Small galleries',null,'art','independent']];
const results=[];
if(!process.argv.includes('--catalog-only'))for(const [name,type,intent,direction] of cases){let seed;
 if(name!=='Small galleries'){const s=await call('/api/search?q='+encodeURIComponent(name));seed=s.interests?.find(s=>s.name.toLowerCase()===name.toLowerCase()&&(!type||s.type===type));if(!seed){console.log('Unresolved test seed',name);continue;}}
 const b=await call('/api/opportunities',{intent,direction,format:'dated',date:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Tokyo'}),days:30,budget:'any',unknownPrice:true,seeds:seed?[{id:seed.id,name:seed.name,type:seed.type,feeling:'love'}]:[],exclude:[]});
 const row={seed:name,returned:b.items.length,personal:b.items.filter(o=>o.matchLevel==='taste').length,first:b.items.slice(0,8).map(o=>({title:o.englishTitle||o.title,kind:o.kind,source:o.source,start:o.start,match:o.matchLevel,artists:o.details?.artists,resolved:o.artists?.map(a=>({name:a.name,genres:a.genres})),genres:o.details?.genres,reasons:o.reasons}))};results.push(row);console.log(name,row.personal,JSON.stringify(row.first.slice(0,2)));
 if(name==='Aphex Twin'&&row.first.some(o=>/Been Stellar|@onefive|^IQ99$/i.test(o.title)&&o.match==='taste'))throw Error('Broad genre or ambiguous supporting artist promoted');
 if(name==='Nujabes'&&row.first.some(o=>/DEXCORE|Mark Boals/i.test(o.title)&&o.match==='taste'))throw Error('Metal conflict promoted to Nujabes');
}
const report={at:new Date().toISOString(),environment:hosted?'published':'local',before:before.music||before.inventory,after:after.music,inventory:after.inventory,health:after.expanded?.health,results,interpretation:'Live functional check against official source records. Not a blinded human quality score or proof of winning.'};
await fs.writeFile('evaluation/independent-'+(hosted?'published':'local')+'.json',JSON.stringify(report,null,2)+'\n');
