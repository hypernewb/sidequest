import {interestWeight,type WeightedInterest} from './interest-strength.ts';

export type LoreName={query:string;weight?:number;phrase?:string};
// This recognises explicit preference wording, not personality or motivation.
// Every suggested name and strength is reviewed before it becomes an interest.
const attitudes:{pattern:RegExp;weight:number}[]=[
 {pattern:/\b(?:don['’]?t|do not|never)\s+(?:really\s+)?(?:like|love|enjoy|listen to)\b|\b(?:not (?:really )?(?:into|interested in)|not a fan of|dislike|hate|avoid|can['’]?t stand)\b/i,weight:-1},
 {pattern:/\b(?:used to (?:love|like|listen to|be into)|grew up (?:with|on)|no longer (?:like|love|listen to|into)|over it)\b/i,weight:0},
 {pattern:/\b(?:obsessed (?:with|by)|love|adore|all[ -]time favou?rite|my favou?rite|on repeat|can['’]?t get enough of)\b/i,weight:1},
 {pattern:/\b(?:curious about|want to (?:try|explore|discover)|getting into|occasionally (?:listen to|enjoy)|sometimes (?:listen to|enjoy))\b/i,weight:.4},
 {pattern:/\b(?:like|enjoy|listen to|a fan of|into)\b/i,weight:.65}
];
export function parseTasteLore(raw:string){
 const text=raw.normalize('NFKC').replace(/[’‘]/g,"'").slice(0,2000),quoted:string[]=[];
 const protectedText=text.replace(/["“「]([^"”」\n]{2,100})["”」]/g,(_,name)=>'LOREREF'+(quoted.push(name.trim())-1));
 const clauses=protectedText.split(/[\n;.!?]+|\s+but\s+|\s+(?:and|while)\s+(?=(?:I\s+)?(?:like|love|hate|enjoy|used to|am |I'm |curious|not |don['’]?t|want to|occasionally))|,\s*(?=(?:I\s+|I'm\s+|not\s+|used to\s+|love\s+|like\s+))/i);
 const names:LoreName[]=[];
 for(let clause of clauses){
  clause=clause.trim();if(!clause)continue;
  const attitude=attitudes.find(a=>a.pattern.test(clause)),match=attitude?.pattern.exec(clause);
  let span=clause;
  if(match){
   const before=clause.slice(0,match.index).replace(/\b(?:I'm|I am|I|am|really|absolutely|still|was|is|are|it's|it is|my)\b/gi,'').trim();
   span=before&&before.length<=100?before:clause.slice(match.index+match[0].length);
  }
  span=span.replace(/^\s*(?:with|about|of)\s+/i,'').replace(/\s+(?:because|for me|these days|nowadays|when I|since I|got me|gets me|is my|was my|makes me|but|although)\b.*$/i,'').trim();
  for(let name of span.split(/,|\s+and\s+/i)){
   name=name.trim().replace(/^[-:→\s]+|[-:→\s]+$/g,'');
   const ref=/^LOREREF(\d+)$/.exec(name);
   if(ref)name=quoted[Number(ref[1])]||'';
   else if(!match){
    // In narrative without an explicit cue, only propose visible proper names.
    const proper=name.match(/\b(?:[A-Z][\p{L}\p{N}'’&-]*)(?:\s+(?:[A-Z][\p{L}\p{N}'’&-]*|of|the)){0,5}/u);
    if(proper)name=proper[0];else if(name.split(/\s+/).length>4)continue;
   }
   name=name.replace(/\s+(?:a lot|so much|most|lately|anymore|any more|back then|as a kid|growing up)\b.*$/i,'').trim();
   if(name.length<2||name.length>100||/^(?:I|I'm|I am|my|music|films?|anime|games?|art|fashion|nothing|everything|something|my childhood|these days|Japanese|Tokyo)$/i.test(name)||/^https?:|LOREREF/i.test(name))continue;
   const existing=names.find(n=>n.query.toLocaleLowerCase()===name.toLocaleLowerCase());
   if(existing){existing.weight=attitude?.weight;existing.phrase=match?.[0];}
   else if(names.length<8)names.push({query:name,weight:attitude?.weight,phrase:match?.[0]});
  }
 }
 return names;
}
export function confirmedLoreInterest(entity:{id:string;name:string;type:string},weight:number):WeightedInterest{return {...entity,weight,feeling:weight>0&&weight<.55?'curious':'love'};}
export function mergeLoreInterest(seeds:WeightedInterest[],interest:WeightedInterest){return [...seeds.filter(s=>s.id.toLowerCase()!==interest.id.toLowerCase()),interest].slice(0,8);}
export function positiveLoreInterests(seeds:WeightedInterest[]){return seeds.filter(s=>interestWeight(s)>0);}
