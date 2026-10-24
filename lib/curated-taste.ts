// Editorial vocabulary is deliberately small. A genre link is distinct from a direct venue affinity.
const vocabulary:Record<string,RegExp>={hiphop:/\bhip[\s_-]*hop\b|\bbeats\b|\brap\b/i,jazz:/jazz/i,soul:/\b(?:soul|soulful|r.?n.?b)\b/i,funk:/funk/i,electronic:/\b(?:electronic|electronica|techno|house|idm|synthwave|glitch)\b/i,ambient:/ambient|chill|downtempo|trip.?hop/i,experimental:/experimental|avant.garde|noise/i,punk:/\b(?:punk|hardcore|garage|postpunk)\b/i,metal:/\b(?:metal|metalcore|grindcore)\b/i,rock:/\b(?:rock|postrock)\b/i,indie:/indie/i,anime:/\b(?:anime|animation|manga)\b/i,games:/\b(?:game|games|chiptune|8.?bit)\b/i,design:/\b(?:design|minimal|minimalism|minimalist|typography|modernism)\b/i,architecture:/architecture|architectural/i,photography:/photograph/i,film:/cinema|film/i,craft:/\b(?:craft|crafts|ceramic|ceramics|artisan)\b/i,books:/literature|literary|books/i,nostalgia:/nostalgi|retro|vintage/i};
export function tasteThreads(tags:{name:string;weight?:number}[]){const result=new Map<string,number>();for(const t of tags)for(const [name,re] of Object.entries(vocabulary))if(re.test(t.name))result.set(name,Math.max(result.get(name)||0,t.weight??1));return result;}
export function culturalOverlap(venueTags:string[],threads:Map<string,number>){return venueTags.filter(t=>threads.has(t)).map(name=>({name,weight:threads.get(name)!})).sort((a,b)=>b.weight-a.weight).slice(0,3);}
// One strong connection beats a pile of weak associations. Affinity breaks ties;
// it cannot turn a genre conflict into an explained match.
export function culturalFit(tags:string[],threads:Map<string,number>,affinity=0){
 const overlap=culturalOverlap(tags,threads),strongest=overlap[0]?.weight||0;
 const strength=strongest>=.75?'anchor':strongest>0?'adjacent':'stopover';
 const score=strongest*70+overlap.slice(1).reduce((n,t)=>n+t.weight,0)*5+Math.max(0,Math.min(1,affinity))*(strongest?10:3);
 return {overlap,strength,score} as const;
}
