import {distance,tokyoDate,type Place} from './discovery.ts';
import {rankOpportunities,type Opportunity,type Preferences} from './opportunities.ts';

export type ScoutStop={item:Opportunity;arrival:string;departure:string;hours:string;travelMinutes:number;distanceMetres:number;reason:string};
export type ScoutPlan={date:string;checkedAt:string;tokyoNow:string;stops:ScoutStop[];brief:string;map:string|null;examined:number;eligible:number;notes:string[]};
const clock=(n:number)=>String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
function minutes(v:unknown){const m=String(v||'').match(/^T?(\d{2}):(\d{2})(?::\d{2})?$/);if(!m)return null;const n=+m[1]*60 + +m[2];return +m[1]<=24&&+m[2]<60&&n<=1440?n:null;}
export function openingWindows(hours:Place['hours'],date:string){
 const day=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',weekday:'long'}).format(new Date(date+'T12:00:00+09:00')).toLowerCase();
 const rows=hours?.[day];return (Array.isArray(rows)?rows:[]).flatMap(h=>{if(!h||typeof h!=='object')return [];const a=minutes(h.opens),b=minutes(h.closes);if(h.closed||a===null||b===null||a===b)return [];return [{open:a,close:b<a?1440:b}];}).sort((a,b)=>a.open-b.open);
}
export function planScout(input:Opportunity[],p:Preferences,now=new Date()):ScoutPlan{
 const today=tokyoDate(now),tokyoNow=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',dateStyle:'medium',timeStyle:'short'}).format(now);
 const current=+new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',hour:'2-digit',hourCycle:'h23'}).format(now)*60 + +new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tokyo',minute:'2-digit'}).format(now);
 let date=p.date<today?today:p.date;let start=date===today?Math.max(780,Math.ceil((current+15)/15)*15):780;
 const notes=['Weekly hours come from Qloo, checked at dispatch. Special closures, reservations, tickets and current programmes need confirmation with each venue.','Each stop allows 45 minutes. Travel estimates use straight-line distance × 1.35 at 4 km/h, plus 5 minutes per leg. They are not live walking directions.','The price limit applies per stop. Food, purchases and admission may cost extra.'];
 if(start+100>1080){date=tokyoDate(new Date(Date.parse(date+'T12:00:00+09:00')+86400000));start=780;notes.push('There is too little afternoon left in Tokyo. Planning the next afternoon instead.');}
 const ranked=rankOpportunities(input,{...p,date,days:1,format:'places'},now);
 const pool=ranked.filter(o=>o.kind==='place'&&!o.online&&Number.isFinite(o.lat)&&Number.isFinite(o.lon)&&distance(o.lat!,o.lon!,35.6762,139.7006)<=25000&&openingWindows(o.hours||{},date).length&&(!(p.seeds.length||p.direction!=='any')||o.matchLevel==='taste')).slice(0,36);
 let best:ScoutStop[]=[],bestValue=-Infinity;
 function visit(stops:ScoutStop[],time:number,value:number){
  if(stops.length>=2){const score=stops.length*1000+value;if(score>bestValue){bestValue=score;best=stops;}}
  if(stops.length===3)return;
  for(const item of pool){if(stops.some(s=>s.item.id===item.id||s.item.url===item.url))continue;const prev=stops.at(-1)?.item;
   const metres=prev?distance(prev.lat!,prev.lon!,item.lat!,item.lon!):0;if(metres>1800)continue;
   const travel=prev?Math.ceil(metres*1.35/4000*60)+5:0;
   const window=openingWindows(item.hours||{},date).find(w=>Math.max(time+travel,w.open)+45<=Math.min(1080,w.close));if(!window)continue;
   const arrival=Math.max(time+travel,window.open);if(arrival-time-travel>45)continue;
   visit([...stops,{item,arrival:clock(arrival),departure:clock(arrival+45),hours:clock(window.open)+'–'+clock(window.close),travelMinutes:travel,distanceMetres:Math.round(metres),reason:item.reasons?.filter(r=>!/overlap|Activity match only/.test(r)).join('. ')||'Matches your activity choice.'}],arrival+45,value+(item.score||0)-travel*.15-(arrival-time-travel)*.1);
  }
 }
 visit([],start,0);
 const names=p.seeds.map(s=>s.name).join(', '),brief=best.length?`For ${names||'your '+p.intent+' choice'}, I found ${best.length} nearby stops on ${date}. Start at ${best[0].item.title} at ${best[0].arrival} JST. ${best.slice(1).map(s=>`Then visit ${s.item.title} at ${s.arrival}, within its published ${s.hours} hours.`).join(' ')}`:'I could not verify two nearby, taste-matched stops with enough afternoon opening time. Try a different date or activity, or loosen the price limit. I have not filled the route with unrelated places.';
 const points=best.map(s=>s.item.lat+','+s.item.lon);const map=best.length?`https://www.google.com/maps/dir/?api=1&origin=${points[0]}&destination=${points.at(-1)}${points.length===3?'&waypoints='+points[1]:''}&travelmode=walking`:null;
 return {date,checkedAt:now.toISOString(),tokyoNow,stops:best,brief,map,examined:input.length,eligible:pool.length,notes};
}
