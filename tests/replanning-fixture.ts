import {VENUES} from '../lib/curated-venues.ts';
import type {Opportunity,Preferences} from '../lib/opportunities.ts';
import type {QuestSeed} from '../lib/quest-seeds.ts';

// Synthetic hours/coordinates exercise the real planner. This is not a claim
// that these shops form this route or that Mograg is actually closed today.
export const replanNow=new Date('2026-10-26T03:00:00Z');
export const replanSeed:QuestSeed={id:'E11125AF-936B-4935-B607-F2DA2E6A6B92',name:'Experimental art fixture',type:'artist',tags:[],description:'Controlled test'};
export const replanPreferences:Preferences={intent:'mix',direction:'any',format:'places',date:'2026-10-26',days:1,budget:'any',unknownPrice:true,seeds:[{...replanSeed,feeling:'love'}],exclude:[]};
export function replanItems():Opportunity[]{return ['Mograg Gallery','KOTARO NUKAGA','Fuglen Tokyo','SHIBUYA PUBLISHING & BOOKSELLERS'].map((name,i)=>{
 const v=VENUES.find(v=>v.name===name)!;
 return {id:v.qlooId!,title:v.name,kind:'place',source:'Controlled fixture',url:v.source.replace(/^http:/,'https:'),description:'Synthetic route fixture',location:'Synthetic coordinates, Tokyo',checkedAt:replanNow.toISOString(),price:null,priceLabel:'Unknown',availability:'',category:v.role,lat:35.67+i*.0004,lon:139.70,hours:{monday:[{opens:'12:00',closes:'20:00'}]},curation:{...v,matchBasis:'genre_bridge',matchStrength:i<2?'anchor':'stopover',tasteScore:i===0?100:i===1?70:3,matchedTags:i<2?['experimental']:[]}};
});}
export const replanHtml='<html><body><div class="ex_info"><p class="ttl">Controlled exhibition fixture</p><p class="day">2026.10.3.sat - 31.sat</p><p class="txt">OPEN /13:00-20:00<br>CLOSE /月曜日・火曜日<br>This controlled fixture supplies an explicit Monday closure for the regression check.</p></div></body></html>';
export const replanFetcher:typeof fetch=async input=>new Response(String(input).includes('mograg')?replanHtml:'<html><body>Controlled fixture. Published information for this venue, including access and opening schedules. This content is synthetic test evidence, not a live official page.</body></html>',{headers:{'Content-Type':'text/html'}});
