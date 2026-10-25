import fs from 'node:fs/promises';
const base=process.argv.includes('--hosted')?'https://sidequest-tokyo-ckx.ckx-1994.chatgpt.site':'http://127.0.0.1:5173';
let headers={'Content-Type':'application/json'};
if(process.argv.includes('--hosted')){
 console.log('Ready for service credential on hidden stdin.');
 process.stdin.setRawMode(true);process.stdin.resume();
 const token=await new Promise(resolve=>{let input='';const onData=chunk=>{for(const c of chunk.toString()){if(c==='\r'||c==='\n'){process.stdin.off('data',onData);process.stdin.setRawMode(false);process.stdin.pause();resolve(input);return;}input+=c;}};process.stdin.on('data',onData);});
 headers['OAI-Sites-Authorization']='Bearer '+token;
}
const call=async(path,body)=>{const r=await fetch(base+path,{method:body?'POST':'GET',headers,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(120000)});if(!r.ok)throw Error(path+' returned '+r.status);return r.json();};
if(process.argv.includes('--refresh'))for(const action of ['refresh','expand']){const b=await call('/api/catalog',{action});console.log(action,b.records,b.at);}
const catalog=await call('/api/catalog');
console.log('Inventory',JSON.stringify(catalog.inventory));
const cases=[['Browse',null,'mix','any'],['Pokémon','Pokémon','mix','any'],['Gundam','Gundam','mix','any'],['Nujabes','Nujabes','music','any'],['Slayer','Slayer','music','heavy'],['Art',null,'art','any']];
const results=[];
for(const [label,name,intent,direction] of cases){let seed;
 if(name){const search=await call('/api/search?q='+encodeURIComponent(name));seed=search.interests?.find(s=>s.name.toLowerCase()===name.toLowerCase()&&(intent!=='music'||s.type==='artist'));if(!seed)throw Error('Could not resolve '+name);}
 const started=Date.now();const b=await call('/api/opportunities',{intent,direction,format:'dated',date:new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Tokyo'}),days:30,budget:'any',unknownPrice:true,seeds:seed?[{id:seed.id,name:seed.name,type:seed.type,feeling:'love'}]:[],exclude:[]});
 const row={label,milliseconds:Date.now()-started,total:b.total,returned:b.items.length,personal:b.items.filter(o=>o.matchLevel==='taste').length,kinds:b.items.reduce((a,o)=>(a[o.kind]=(a[o.kind]||0)+1,a),{}),first:b.items.slice(0,6).map(o=>({title:o.englishTitle||o.title,kind:o.kind,source:o.source,start:o.start,end:o.end,match:o.matchLevel,reasons:o.reasons}))};
 results.push(row);console.log(label,row.total,row.personal,JSON.stringify(row.first.slice(0,2)));
 if(label==='Pokémon'&&!row.first.some(o=>/Pokémon|ポケ|ポケット/.test(o.title)))throw Error('Pokemon matching failed');
 if(label==='Gundam'&&!row.first.some(o=>/GUNDAM|ガンダム/i.test(o.title)))throw Error('Gundam matching failed');
 if(label==='Nujabes'&&row.first.some(o=>/DEXCORE/.test(o.title)&&o.match==='taste'))throw Error('Genre conflict was promoted');
}
const output={at:new Date().toISOString(),environment:process.argv.includes('--hosted')?'published':'local',inventory:catalog.inventory,results,interpretation:'Functional evidence from live official records. These are not independent human relevance ratings.'};
await fs.mkdir('evaluation',{recursive:true});await fs.writeFile('evaluation/catalog-population-'+output.environment+'.json',JSON.stringify(output,null,2)+'\n');
