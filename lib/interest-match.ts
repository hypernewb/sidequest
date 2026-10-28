import type {Opportunity} from './opportunities.ts';
import {tasteThreads,culturalOverlap} from './curated-taste.ts';
export const SUBJECTS:[string,RegExp][]=[
 ['Pokémon',/pok[eé]mon|ポケモン|ポケットモンスター/i],['Digimon',/digimon|デジモン|デジタルモンスター/i],['Tamagotchi',/tamagotchi|たまごっち/i],['Gundam',/gundam|gunpla|ガンダム|ガンプラ/i],['Sanrio',/sanrio|サンリオ|hello kitty|ハローキティ|シナモロール|ポムポムプリン|クロミ|マイメロディ/i],['Studio Ghibli',/ghibli|spirited away|my neighbor totoro|ジブリ|千と千尋|となりのトトロ/i],['Attack on Titan',/attack on titan|進撃の巨人/i],['The Legend of Zelda',/legend of zelda|ゼルダの伝説/i],['Super Mario',/super mario|スーパーマリオ/i],['Final Fantasy',/final fantasy|ファイナルファンタジー/i],['Dragon Ball',/dragon ball|ドラゴンボール/i],['One Piece',/\bone piece\b|ワンピース/i],['BE@RBRICK',/be@rbrick|bearbrick|ベアブリック/i],['Batman',/\bbatman\b|バットマン/i],['Basquiat',/basquiat|バスキア/i]
];
export function subjectNames(o:Pick<Opportunity,'title'>){return SUBJECTS.filter(([,r])=>r.test(o.title)).map(([n])=>n);}
export function programmeGenres(o:Opportunity){
 // The programme's own genre evidence takes precedence over a potentially ambiguous artist identity.
 return o.details?.genres.length?o.details.genres:(o.artists||[]).filter(a=>{
  // Short aliases need programme corroboration. TRiDENT's Japanese rock act
  // was reconciled to a record carrying black/death-metal genres in the live audit.
  const n=a.input.replace(/\s*\([^)]*\)$/,'');
  if(n.length<=4||n.length<=6&&!namedMention(o.title,n))return false;
  if(a.input==='TRiDENT'&&a.genres.some(g=>/blackened|black metal|death metal/i.test(g)))return false;
  return true;
 }).flatMap(a=>a.genres.map(name=>({name})));
}
export function namedMention(text:string,name:string){const n=name.normalize('NFKC').trim().toLocaleLowerCase();if(n.length<2)return false;return new RegExp('(?<![\\p{L}\\p{N}])'+n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?![\\p{L}\\p{N}])','u').test(text.normalize('NFKC').toLocaleLowerCase());}
export function interestMatch(o:Opportunity,seed:{id:string;name:string;type:string;taste?:{name:string;weight?:number}[]}){
 if(o.kind==='gig'&&!['artist','album'].includes(seed.type))return null;
 const artist=seed.type==='artist',subject=[o.title,...(artist?o.details?.artists||[]:[]),...(artist?(o.artists||[]).map(a=>a.name):[])];
 if(artist&&(o.artists||[]).some(a=>a.id.toLowerCase()===seed.id.toLowerCase())||subject.some(t=>namedMention(t,seed.name)))return {strength:12,reason:'Names '+seed.name,kind:'direct' as const};
 if(!artist){const same=SUBJECTS.find(([,r])=>r.test(seed.name)&&r.test(o.title));if(same)return {strength:10,reason:'Same franchise or creator: '+same[0],kind:'subject' as const};}
 const threads=tasteThreads(seed.taste||[]),evidence=programmeGenres(o);
 // Music genre metadata only qualifies performances or music places, not merchandise named after a band.
 if(artist&&!['gig','place','event'].includes(o.kind)&&!(o.kind==='release'&&/\bvinyl\b|\brecord\b/i.test(o.category)))return null;
 const overlap=culturalOverlap([...tasteThreads(evidence).keys()],threads).filter(t=>t.weight>=.75);
 const specific=overlap.filter(t=>!['rock','indie'].includes(t.name));
 if(artist&&!specific.length&&[...threads.keys()].some(t=>['metal','jazz','hiphop','soul','ambient','electronic'].includes(t)))return null;
 if(overlap.length){
  const normalize=(name:string)=>name.toLowerCase().replace(/[^a-z0-9]/g,'');
  const broad=new Set(['metal','heavymetal','rock','hardrock','alternativerock','jazz','hiphop','rap','soul','funk','electronic','ambient','indie','punk','music']);
  const target=(seed.taste||[]).filter(t=>(t.weight??1)>=.75&&tasteThreads([t]).size&&!broad.has(normalize(t.name)));
  const exact=target.filter(t=>evidence.some(e=>normalize(e.name)===normalize(t.name)));
  const adjacent=target.length>0&&!exact.length;
  return {strength:exact.length?9:adjacent?4:Math.min(8,(specific.length?5:3)+(overlap.length-1)*1.5),reason:exact.length?'Shared genre evidence: '+exact.map(t=>t.name).join(', '):adjacent?'Broad '+overlap.map(t=>t.name).join(', ')+' connection; no exact subgenre overlap established.':(o.details?.genres.length?'Official programme mentions ':'Performer genre overlaps ')+overlap.map(t=>t.name).join(', '),kind:'genre' as const};
 }
 return null;
}
