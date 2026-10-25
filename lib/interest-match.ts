import type {Opportunity} from './opportunities.ts';
import {tasteThreads,culturalOverlap} from './curated-taste.ts';
export const SUBJECTS:[string,RegExp][]=[
 ['Pokémon',/pok[eé]mon|ポケモン|ポケットモンスター/i],['Digimon',/digimon|デジモン|デジタルモンスター/i],['Tamagotchi',/tamagotchi|たまごっち/i],['Gundam',/gundam|gunpla|ガンダム|ガンプラ/i],['Sanrio',/sanrio|サンリオ|hello kitty|ハローキティ|シナモロール|ポムポムプリン|クロミ|マイメロディ/i],['Studio Ghibli',/ghibli|spirited away|my neighbor totoro|ジブリ|千と千尋|となりのトトロ/i],['Attack on Titan',/attack on titan|進撃の巨人/i],['The Legend of Zelda',/legend of zelda|ゼルダの伝説/i],['Super Mario',/super mario|スーパーマリオ/i],['Final Fantasy',/final fantasy|ファイナルファンタジー/i],['Dragon Ball',/dragon ball|ドラゴンボール/i],['One Piece',/\bone piece\b|ワンピース/i],['BE@RBRICK',/be@rbrick|bearbrick|ベアブリック/i],['Batman',/\bbatman\b|バットマン/i],['Basquiat',/basquiat|バスキア/i]
];
export function subjectNames(o:Pick<Opportunity,'title'>){return SUBJECTS.filter(([,r])=>r.test(o.title)).map(([n])=>n);}
export function programmeGenres(o:Opportunity){
 // The programme's own genre evidence takes precedence over a potentially ambiguous artist identity.
 return o.details?.genres.length?o.details.genres:(o.artists||[]).flatMap(a=>a.genres.map(name=>({name})));
}
export function namedMention(text:string,name:string){const n=name.normalize('NFKC').trim().toLocaleLowerCase();if(n.length<2)return false;return new RegExp('(?<![\\p{L}\\p{N}])'+n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![\\p{L}\\p{N}])','u').test(text.normalize('NFKC').toLocaleLowerCase());}
export function interestMatch(o:Opportunity,seed:{id:string;name:string;type:string;taste?:{name:string;weight?:number}[]}){
 if(o.kind==='gig'&&!['artist','album'].includes(seed.type))return null;
 const artist=seed.type==='artist',subject=[o.title,...(artist?o.details?.artists||[]:[]),...(artist?(o.artists||[]).map(a=>a.name):[])];
 if(artist&&(o.artists||[]).some(a=>a.id.toLowerCase()===seed.id.toLowerCase())||subject.some(t=>namedMention(t,seed.name)))return {strength:12,reason:'Names '+seed.name,kind:'direct' as const};
 if(!artist){const same=SUBJECTS.find(([,r])=>r.test(seed.name)&&r.test(o.title));if(same)return {strength:10,reason:'Same franchise or creator: '+same[0],kind:'subject' as const};}
 const threads=tasteThreads(seed.taste||[]),evidence=programmeGenres(o);
 // Music genre metadata only qualifies performances or music places, not merchandise named after a band.
 if(artist&&!['gig','place','event'].includes(o.kind))return null;
 const overlap=culturalOverlap([...tasteThreads(evidence).keys()],threads).filter(t=>t.weight>=.75);
 if(overlap.length)return {strength:6,reason:'Published genre or resolved artist matches '+overlap.map(t=>t.name).join(', '),kind:'genre' as const};
 return null;
}
