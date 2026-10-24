import fs from 'node:fs/promises';
const dir='.local/quest-benchmark',snapshot=JSON.parse(await fs.readFile(dir+'/before.json','utf8'));
try{await fs.access(dir+'/before-engine.mjs');}catch{await fs.copyFile(dir+'/engine.mjs',dir+'/before-engine.mjs');}
const {planScout}=await import('../'+dir+'/before-engine.mjs');
for(const p of snapshot.profiles.filter(p=>p.all)){
 const file=dir+'/baseline-'+p.seed.id+'.json';let scores;
 try{scores=JSON.parse(await fs.readFile(file,'utf8'));}catch{
 const venues=p.all.map((o,index)=>({index,name:o.title,role:o.curation.role,tags:o.curation.tags,activity:o.curation.mission}));
 const r=await fetch('http://localhost:1234/v1/chat/completions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'bionic qwen3.5-text-9b-nsfw-rp-roleplay-i1',temperature:0,max_tokens:1200,reasoning_effort:'none',chat_template_kwargs:{enable_thinking:false},response_format:{type:'json_schema',json_schema:{name:'venue_scores',strict:true,schema:{type:'object',properties:{scores:{type:'array',items:{type:'integer',minimum:0,maximum:100},minItems:venues.length,maxItems:venues.length}},required:['scores'],additionalProperties:false}}},messages:[{role:'system',content:'Rank Tokyo venues for a person who loves the supplied seed. Use your knowledge of the seed and supplied venue facts only. Score each venue 0..100. 0 unrelated, 25 generic break, 50 adjacent culture, 75 strong cultural connection, 100 explicit subject match. Genre conflicts score low. Do not assume current stock or shows. Return only JSON with a scores array of integers, one per venue in input order. No explanations. /no_think'},{role:'user',content:JSON.stringify({seed:{name:p.seed.name,type:p.seed.type},venues})}]})});
 if(!r.ok)throw Error('Local baseline unavailable '+r.status);const b=await r.json();await fs.writeFile(dir+'/raw-'+p.seed.id+'.json',JSON.stringify(b));const raw=b.choices[0].message.content.replace(/<think>[\s\S]*?<\/think>/g,'').trim();const values=JSON.parse(raw.slice(raw.indexOf('{'),raw.lastIndexOf('}')+1)).scores;scores=values.map((score,index)=>({score,index}));
 if(!Array.isArray(scores)||scores.length!==venues.length||new Set(scores.map(s=>s.index)).size!==venues.length||scores.some(s=>!Number.isInteger(s.index)||s.index<0||s.index>=venues.length||!Number.isFinite(s.score)||s.score<0||s.score>100))throw Error('Invalid baseline scores for '+p.name);
 await fs.writeFile(file,JSON.stringify(scores));}
 p.baselineItems=p.all.map((o,index)=>({...o,curation:{...o.curation,tasteScore:scores.find(s=>s.index===index).score}}));
 p.baseline=planScout(p.baselineItems,p.p,new Date(snapshot.now));console.log(p.name,p.baseline.stops.map(s=>s.item.title).join(' -> ')||'NO ROUTE');
 await fs.writeFile(dir+'/baseline.json',JSON.stringify(snapshot,null,2));
}
