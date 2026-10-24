import {neighborhood} from './neighborhoods.ts';
import {distance,tokyoDate,type Place} from './discovery.ts';
import {rankOpportunities,type Opportunity,type Preferences} from './opportunities.ts';
export type ScoutStop={item:Opportunity;arrival:string;departure:string;hours:string;travelMinutes:number;distanceMetres:number;reason:string};
export type ScoutPlan={date:string;checkedAt:string;tokyoNow:string;stops:ScoutStop[];brief:string;map:string|null;examined:number;eligible:number;notes:string[];neighborhood?:{id:string;name:string};trace?:string[];walkingMinutes?:number;walkingMetres?:number;returnMinutes?:number};
const clock=(n:number)=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
function minutes(v:unknown){const m=String(v||'').match(/^T?(\d{2}):(\d{2})(?::\d{2})?$/);if(!m)return null;const n=+m[1]*60 + +m[2];return +m[1]<=24&&+m[2]<60&&n<=1440?n:null;}
export function openingWindows(hours:Place['hours'],date:string){
 const day=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',weekday:'long'}).format(new Date(date+'T12:00:00+09:00')).toLowerCase();
 const rows=hours?.[date]??hours?.[day];return (Array.isArray(rows)?rows:[]).flatMap(h=>{if(!h||typeof h!=='object')return [];const a=minutes(h.opens),b=minutes(h.closes);if(h.closed||a===null||b===null||a===b)return [];return [{open:a,close:b<a?1440:b}];}).sort((a,b)=>a.open-b.open);
}
export function prepareScout(input:Opportunity[],p:Preferences,now=new Date()){
 const today=tokyoDate(now),tokyoNow=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',dateStyle:'medium',timeStyle:'short'}).format(now);
 const current=+new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',hour:'2-digit',hourCycle:'h23'}).format(now)*60 + +new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',minute:'2-digit'}).format(now);
 let date=p.date<today?today:p.date,start=date===today?Math.max(720,Math.ceil((current+15)/15)*15):720;
 const notes=['Opening windows are weekly schedules unless a dated override is available. Special closures and exhibition changeovers can affect access.','Walking distance is straight-line distance × 1.35 at 4 km/h, with five minutes per leg. Open the map for street directions.'];
 if(start>1140){date=tokyoDate(new Date(Date.parse(date+'T12:00:00+09:00')+86400000));start=720;notes.push('Planning tomorrow because there is too little time left today.');}
 const ranked=rankOpportunities(input,{...p,intent:'mix',direction:'any',date,days:1,format:'places'},now);
 const pool=ranked.filter(o=>o.kind==='place'&&!o.online&&Number.isFinite(o.lat)&&Number.isFinite(o.lon)&&distance(o.lat!,o.lon!,35.6762,139.7006)<=25000&&openingWindows(o.hours||{},date).length&&(!p.seeds.length||Number.isFinite(o.affinity)||!!o.curation?.matchedTags?.length||o.curation?.matchStrength==='stopover')).sort((a,b)=>(b.curation?.tasteScore??(b.affinity||0)*100)-(a.curation?.tasteScore??(a.affinity||0)*100)).slice(0,65);
 return {date,start,notes,tokyoNow,pool};
}
export function planScout(input:Opportunity[],p:Preferences,now=new Date()):ScoutPlan{
 const {date,start,notes,tokyoNow,pool}=prepareScout(input,p,now);
 const windows=new Map(pool.map(o=>[o.id,openingWindows(o.hours||{},date)])),role=(o:Opportunity)=>o.curation?.role||o.category;
 const legs=new Map<string,{metres:number;minutes:number}>();for(const a of pool)for(const b of pool)if(a.id!==b.id){const metres=Math.round(distance(a.lat!,a.lon!,b.lat!,b.lon!)*1.35);legs.set(a.id+'|'+b.id,{metres,minutes:Math.ceil(metres/4000*60)+5});}
 let best:ScoutStop[]=[],bestValue=-Infinity,bestWalk=0,bestMetres=0,returnMinutes=0;
 for(const a of pool)for(const b of pool){if(a.id===b.id||role(b)==='coffee'||role(a)==='listen')continue;const ab=legs.get(a.id+'|'+b.id)!;if(ab.metres>1500)continue;
  for(const c of pool){if(c.id===a.id||c.id===b.id||role(c)==='coffee'||new Set([role(a),role(b),role(c)]).size<2||role(b)==='listen')continue;if([a,b,c].some(o=>o.curation?.matchStrength)&&(![a,b,c].some(o=>o.curation?.matchStrength==='anchor')||[a,b,c].filter(o=>o.curation?.matchStrength==='stopover').length>1))continue;const bc=legs.get(b.id+'|'+c.id)!,ca=legs.get(c.id+'|'+a.id)!;const metres=ab.metres+bc.metres+ca.metres;if(bc.metres>1500||ca.metres>1500||metres>4000)continue;
   for(let departure=start;departure<=1140;departure+=15){let time=departure,waiting=0;const stops:ScoutStop[]=[];
    for(const [i,item] of [a,b,c].entries()){const leg=i===0?{metres:0,minutes:0}:i===1?ab:bc;const w=windows.get(item.id)!.find(w=>Math.max(time+leg.minutes,w.open)+45<=Math.min(1320,w.close));if(!w)break;const arrival=Math.max(time+leg.minutes,w.open),wait=arrival-time-leg.minutes;if(wait>30)break;waiting+=wait;stops.push({item,arrival:clock(arrival),departure:clock(arrival+45),hours:clock(w.open)+'–'+clock(w.close),travelMinutes:leg.minutes,distanceMetres:leg.metres,reason:item.curation?.matchStrength==='stopover'?'A nearby stopover for this walk, rather than a cultural match to your seed.':item.curation?.matchStrength==='adjacent'?'A lateral connection through '+item.curation.matchedTags?.join(', ')+'. This is an adjacent interest, not a direct seed match.':item.curation?.matchBasis==='genre_bridge'?'Your Qloo taste links to '+item.curation.matchedTags?.join(', ')+', which matches our source-reviewed venue tags.':item.signals?.length?'Qloo connects '+item.signals.join(', ')+' with this stop.':item.curation?.matchBasis==='album_tags'?'Ranked using the album’s Qloo genre tags.':'Qloo ranked this venue for your seed; it supplied no individual explanation.'});time=arrival+45;}
    if(stops.length!==3||time+ca.minutes>1320)continue;
    const score=[a,b,c].reduce((n,o)=>n+(o.curation?.tasteScore??(o.affinity||0)*100),0)-metres/350-waiting*.08-(departure-start)*.008+(new Set([role(a),role(b),role(c)]).size===3?8:0);
    if(score>bestValue){bestValue=score;best=stops;bestWalk=ab.minutes+bc.minutes+ca.minutes;bestMetres=metres;returnMinutes=ca.minutes;}
   }
  }
 }
 // A short, relevant walk is better than padding the dossier with a genre conflict.
 if(!best.length&&pool.some(o=>o.curation?.matchStrength))for(const a of pool)for(const b of pool){
  if(a.id===b.id||role(a)==='listen'||role(b)==='coffee'||role(a)===role(b)||![a,b].some(o=>o.curation?.matchStrength==='anchor'))continue;
  const leg=legs.get(a.id+'|'+b.id)!;if(leg.metres>1500)continue;
  for(let departure=start;departure<=1140;departure+=15){let time=departure,waiting=0;const stops:ScoutStop[]=[];
   for(const [i,item] of [a,b].entries()){const travel=i?leg:{metres:0,minutes:0},w=windows.get(item.id)!.find(w=>Math.max(time+travel.minutes,w.open)+45<=Math.min(1320,w.close));if(!w)break;const arrival=Math.max(time+travel.minutes,w.open),wait=arrival-time-travel.minutes;if(wait>30)break;waiting+=wait;stops.push({item,arrival:clock(arrival),departure:clock(arrival+45),hours:clock(w.open)+'–'+clock(w.close),travelMinutes:travel.minutes,distanceMetres:travel.metres,reason:item.curation?.matchStrength==='anchor'?'The cultural anchor for this walk: '+item.curation.matchedTags?.join(', ')+'.':item.curation?.matchStrength==='adjacent'?'An adjacent interest through '+item.curation.matchedTags?.join(', ')+'.':'A nearby stopover, rather than a cultural match to your seed.'});time=arrival+45;}
   if(stops.length!==2||time+leg.minutes>1320)continue;
   const value=[a,b].reduce((n,o)=>n+(o.curation?.tasteScore||0),0)-leg.metres*2/350-waiting*.08-(departure-start)*.008;
   if(value>bestValue){bestValue=value;best=stops;bestWalk=leg.minutes*2;bestMetres=leg.metres*2;returnMinutes=leg.minutes;}
  }
 }
 if(best.length===2)notes.push('Two stops fit this taste and the published hours. A third would weaken the route, so this is a shorter quest.');
 const points=best.map(s=>s.item.lat+','+s.item.lon),map=best.length?'https://www.google.com/maps/dir/?api=1&origin='+points[0]+'&destination='+points[0]+'&waypoints='+points.slice(1).join('|')+'&travelmode=walking':null;
 const brief=best.length?best.length+' stops on '+date+', starting at '+best[0].arrival+' JST. Allow about '+bestWalk+' minutes walking, including the loop back.':'I could not fit a short walking quest with a supported cultural match and published hours. Try another day or another seed.';
 return {neighborhood:best.length?neighborhood(best[0].item.lat!,best[0].item.lon!)||undefined:undefined,date,checkedAt:now.toISOString(),tokyoNow,stops:best,brief,map,examined:input.length,eligible:pool.length,notes,walkingMinutes:bestWalk,walkingMetres:bestMetres,returnMinutes};
}
