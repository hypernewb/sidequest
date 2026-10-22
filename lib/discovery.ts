export type Interest = { id: string; name: string; type: string };
export type Mode = 'familiar' | 'explore' | 'surprise';
export type Place = {
  id: string; name: string; category: string; family: string; area: string; address: string;
  description: string; website: string | null; map: string; image: string | null;
  lat: number; lon: number; affinity: number; signals: {name: string; contribution: number}[];
  hours: Record<string, {opens?: string; closes?: string; closed?: boolean}[]>;
  price: null; retrievedAt: string; reason: string;
};
export const DEFAULT_INTERESTS: Interest[] = [
 {id:'E11125AF-936B-4935-B607-F2DA2E6A6B92',name:'Nujabes',type:'artist'},
 {id:'E12201A5-CC50-40AF-97AE-C54A2CA303F7',name:'MUJI',type:'brand'},
 {id:'9B33A620-68CA-49B3-BFCF-F09CCF8AD595',name:'Spirited Away',type:'movie'},
];
export const AREAS = {
 tokyo: {name:'Across Tokyo',lat:35.6762,lon:139.7006,radius:25000},
 shibuya:{name:'Around Shibuya',lat:35.658,lon:139.7016,radius:3500},
 shinjuku:{name:'Around Shinjuku',lat:35.6909,lon:139.7003,radius:3500},
 roppongi:{name:'Around Roppongi',lat:35.6628,lon:139.7315,radius:3500},
 ueno:{name:'Around Ueno',lat:35.7141,lon:139.7774,radius:3500},
} as const;
export function safeUrl(value: unknown): string | null {
 try {const u=new URL(String(value)); return ['https:','http:'].includes(u.protocol) ? u.href : null;} catch {return null;}
}
export function distance(lat:number,lon:number,a:number,b:number) {
 const r=Math.PI/180, dLat=(a-lat)*r,dLon=(b-lon)*r;
 return 6371000*2*Math.asin(Math.sqrt(Math.sin(dLat/2)**2+Math.cos(lat*r)*Math.cos(a*r)*Math.sin(dLon/2)**2));
}
export function familyFor(category: string) {
 if (/museum|gallery|art center/i.test(category)) return 'Art & culture';
 if (/music|jazz|live|record|concert/i.test(category)) return 'Music & nightlife';
 if (/cafe|coffee|tea|bar/i.test(category)) return 'Cafés & listening';
 if (/book|shop|design/i.test(category)) return 'Books & design';
 return 'Culture & discovery';
}
export function eligible(p:Place,area:keyof typeof AREAS,budget:string,rejected:string[]) {
 const a=AREAS[area];
 return !rejected.includes(p.id) && Number.isFinite(p.lat) && Number.isFinite(p.lon)
   && distance(p.lat,p.lon,a.lat,a.lon)<=a.radius && budget==='flexible';
}
export function rankPlaces(places:Place[],mode:Mode,savedFamilies:string[]=[]) {
 const max=Math.max(...places.map(p=>p.affinity),0.00001);
 // Keep a relevance floor in every mode. Exploration changes diversity, not geographic/budget eligibility.
 const pool=places.filter(p=>p.affinity>=max*.18).sort((a,b)=>b.affinity-a.affinity || a.id.localeCompare(b.id));
 const chosen:Place[]=[], counts:Record<string,number>={};
 const penalty={familiar:.015,explore:.22,surprise:.48}[mode];
 while(pool.length && chosen.length<8) {
  let best=0,score=-Infinity;
  pool.forEach((p,i)=>{
   const saved=savedFamilies.includes(p.family) ? (mode==='surprise' ? .01:.07) : 0;
   const value=p.affinity/max+saved-(counts[p.family]||0)*penalty;
   if(value>score){score=value;best=i;}
  });
  const p=pool.splice(best,1)[0]; chosen.push(p); counts[p.family]=(counts[p.family]||0)+1;
 }
 return chosen;
}
export function tokyoDate(date=new Date()) {return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function validVisitDate(value:string) {
 const date=new Date(value+'T12:00:00+09:00');
 return !Number.isNaN(date.getTime()) && tokyoDate(date)===value && value>=tokyoDate();
}
export function visitDates(which:string,custom:string,now=new Date()) {
 const today=tokyoDate(now); if(which==='custom')return [custom];
 if(which==='today')return [today];
 const d=new Date(today+'T12:00:00+09:00'), day=d.getUTCDay();
 const offset=day===0 ? -1 : (6-day+7)%7;
 d.setUTCDate(d.getUTCDate()+offset);const sat=tokyoDate(d); d.setUTCDate(d.getUTCDate()+1);
 return [sat,tokyoDate(d)].filter(x=>x>=today);
}
export function publishedHours(p:Place,date:string) {
 const day=new Intl.DateTimeFormat('en-US',{weekday:'long',timeZone:'Asia/Tokyo'}).format(new Date(date+'T12:00:00+09:00')).toLowerCase();
 const h=p.hours[day];if(!h?.length)return 'Hours not supplied';
 if(h.every(x=>x.closed))return 'Listed as closed';
 return h.filter(x=>!x.closed).map(x=>x.opens&&x.closes ? x.opens.replace(/^T/,'').slice(0,5)+'–'+x.closes.replace(/^T/,'').slice(0,5) : 'Hours not supplied').join(', ');
}
