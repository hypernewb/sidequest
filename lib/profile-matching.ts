import {qloo} from './qloo';
import {questSeed} from './quest-seeds';
import type {Preferences} from './opportunities';
export async function hydrateInterests(seeds:Preferences['seeds'],key:string,read:(id:string)=>Promise<any>,write:(id:string,value:unknown)=>Promise<void>){
 const result:Preferences['seeds']=[],missing:Preferences['seeds']=[];
 for(const s of seeds){const cached=await read('taste-entity:'+s.id.toUpperCase());if(cached&&cached.genreSchema===2&&Date.now()-cached.at<7*86400000)result.push({...s,...cached.seed,feeling:s.feeling,weight:s.weight});else missing.push(s);}
 if(missing.length)try{const b=await qloo('/entities',{entity_ids:missing.map(s=>s.id).join(',')},key);for(const s of missing){const entity=(Array.isArray(b.results)?b.results:[]).find((e:any)=>String(e.entity_id).toUpperCase()===s.id.toUpperCase());const seed=entity&&questSeed(entity as any);if(seed){const clean={id:seed.id,name:seed.name,type:seed.type,taste:seed.taste};result.push({...clean,feeling:s.feeling,weight:s.weight});await write('taste-entity:'+s.id.toUpperCase(),{at:Date.now(),seed:clean,genreSchema:2});}else result.push({...s,taste:[]});}}catch{result.push(...missing.map(s=>({...s,taste:[]})));}
 return seeds.map(s=>result.find(r=>r.id.toUpperCase()===s.id.toUpperCase())||{...s,taste:[]});
}
