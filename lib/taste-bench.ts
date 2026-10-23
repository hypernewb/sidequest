import type {Interest,Place} from './discovery.ts';
import type {Activity} from './taste-context.ts';
export type SampleTaste={id:string;name:string;seeds:{name:string;type:string}[];activity:Activity;pair:string};
// Fictional test inputs, not personality categories or inferred user preferences.
export const SAMPLE_TASTES:SampleTaste[]=[
 {id:'jazz',name:'Jazz & instrumental hip-hop',seeds:[{name:'Nujabes',type:'artist'},{name:'John Coltrane',type:'artist'}],activity:'music',pair:'metal'},
 {id:'metal',name:'Metal & loud guitars',seeds:[{name:'BABYMETAL',type:'artist'},{name:'Metallica',type:'artist'}],activity:'music',pair:'jazz'},
 {id:'electronic',name:'Experimental electronics',seeds:[{name:'Aphex Twin',type:'artist'},{name:'Björk',type:'artist'}],activity:'music',pair:'pop'},
 {id:'pop',name:'Chart pop',seeds:[{name:'Taylor Swift',type:'artist'},{name:'Dua Lipa',type:'artist'}],activity:'music',pair:'electronic'},
 {id:'retro-games',name:'Nintendo & classic games',seeds:[{name:'Nintendo',type:'brand'},{name:'The Legend of Zelda: Breath of the Wild',type:'videogame'}],activity:'collect',pair:'anime'},
 {id:'anime',name:'Digimon & Evangelion',seeds:[{name:'Digimon Adventure',type:'tv_show'},{name:'Neon Genesis Evangelion',type:'tv_show'}],activity:'collect',pair:'retro-games'},
 {id:'pokemon',name:'Pokémon collecting',seeds:[{name:'Pokémon',type:'brand'},{name:'Nintendo',type:'brand'}],activity:'collect',pair:'comic-cinema'},
 {id:'comic-cinema',name:'Superhero cinema',seeds:[{name:'The Dark Knight',type:'movie'},{name:'Spider-Man: Into the Spider-Verse',type:'movie'}],activity:'collect',pair:'pokemon'},
 {id:'arthouse',name:'Quiet, romantic cinema',seeds:[{name:'In the Mood for Love',type:'movie'},{name:'Before Sunrise',type:'movie'}],activity:'art',pair:'surreal'},
 {id:'surreal',name:'Strange, surreal cinema',seeds:[{name:'Eraserhead',type:'movie'},{name:'Paprika',type:'movie'}],activity:'art',pair:'arthouse'},
 {id:'quiet-design',name:'MUJI & Ghibli',seeds:[{name:'MUJI',type:'brand'},{name:'Spirited Away',type:'movie'}],activity:'cafe',pair:'familiar-coffee'},
 {id:'familiar-coffee',name:'Coffee & mainstream pop',seeds:[{name:'Starbucks',type:'brand'},{name:'Taylor Swift',type:'artist'}],activity:'cafe',pair:'quiet-design'},
];
export const normalizeName=(s:string)=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
export function exactSeed(seed:SampleTaste['seeds'][number],candidates:Interest[]){return candidates.find(c=>c.type===seed.type&&normalizeName(c.name)===normalizeName(seed.name));}
export type TasteMetrics={count:number;unique:number;families:number;lowerPopularity:number;popularityKnown:number;individualExplanations:number;missingHours:number;needsHumanReview:true};
export function tasteMetrics(places:Place[]):TasteMetrics{return {count:places.length,unique:new Set(places.map(p=>p.id)).size,families:new Set(places.map(p=>p.family)).size,lowerPopularity:places.filter(p=>p.popularity!=null&&p.popularity<.8).length,popularityKnown:places.filter(p=>p.popularity!=null).length,individualExplanations:places.filter(p=>p.signals.length>0).length,missingHours:places.filter(p=>!Object.keys(p.hours).length).length,needsHumanReview:true};}
export function compareShortlists(a:Place[],b:Place[]){const left=new Set(a.map(p=>p.id)),right=new Set(b.map(p=>p.id)),shared=[...left].filter(id=>right.has(id));return {shared:shared.length,left:left.size,right:right.size,jaccard:left.size+right.size-shared.length?shared.length/(left.size+right.size-shared.length):null,sharedIds:shared};}
export type SampleResult={profile:SampleTaste;interests:Interest[];places:Place[];metrics:TasteMetrics;retrievedAt:string;notice?:string;examined:number;unresolved:string[]};
