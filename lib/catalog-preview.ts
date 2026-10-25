import type {Opportunity} from './opportunities.ts';
export const hasJapanese=(text:string)=>/[\u3040-\u30ff\u3400-\u9fff]/.test(text);
export function catalogPreview(o:Opportunity){
 if(o.englishDescription?.trim())return {text:o.englishDescription,label:'English description',original:hasJapanese(o.description)};
 const d=o.details;
 if(d?.english?.trim()&&['translated','partial','not_needed'].includes(d.translation||'')&&d.english!==d.original){
  return {text:d.english.slice(0,650)+(d.english.length>650?'…':''),label:d.translation==='not_needed'?'English excerpt':d.translation==='partial'?'Partly translated excerpt':'Machine-translated excerpt',original:hasJapanese(o.description)};
 }
 if(!hasJapanese(o.description))return {text:o.description,label:'',original:false};
 const parts:string[]=[];
 if(o.kind==='gig'){
  if(d?.artists.length)parts.push('Lineup: '+d.artists.slice(0,8).join(' · ')+(d.artists.length>8?' · more on the official page':'')+'.');
  if(d?.genres.length)parts.push('Published genres: '+d.genres.map(g=>g.name).join(', ')+'.');
  if(!parts.length)parts.push('Live music listing. Artist and genre details have not been extracted.');
 }else if(o.actionLabel==='Shop listing published')parts.push('A recent listing from '+o.source+'. Check the linked shop for the format, edition and current stock. The listing date is not a confirmed release or restock date.');
 else if(o.kind==='exhibition')parts.push('An exhibition announced by '+o.source+'. Check the official page for the artist, programme and any closure days.');
 else if(o.kind==='popup')parts.push('A temporary event or shop announced by '+o.source+'. The dates and location above come from the announcement. Entry and purchase conditions need checking.');
 else if(o.kind==='release')parts.push('A product announcement from '+o.source+'. Check the official page for the edition, buying conditions and current availability.');
 else parts.push('An event announced by '+o.source+'. Check the official page for the full programme.');
 return {text:parts.join(' '),label:'Key details · full translation unavailable',original:true};
}
