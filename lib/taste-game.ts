import {z} from 'zod';
import {momentsContextSchema,type MomentTasteContext} from './taste-profile.ts';
export const TASTE_DRAFT_KEY='sidequest-taste-round-v1';
export const gameDraftSchema=z.object({step:z.number().int().min(0).max(6),context:momentsContextSchema,persona:z.string().max(60).optional()});
export type TasteGameDraft=z.infer<typeof gameDraftSchema>;
export type GameChoice={id:string;title:string;detail:string;tags?:string[]};
export const INVITATIONS:GameChoice[]=[
 {id:'music',title:'A room full of sound',detail:'A small gig, listening party or an online set.',tags:['music']},
 {id:'worlds',title:'A world to disappear into',detail:'Games, animated worlds and things you can play.',tags:['games','anime']},
 {id:'art',title:'Something I have never seen',detail:'An exhibition, strange image or independent design.',tags:['art','design']},
 {id:'objects',title:'Something worth keeping',detail:'An artist edition, unusual object or limited drop.',tags:['collectibles','design']},
];
const textures:Record<string,GameChoice[]>={
 music:[{id:'soft',title:'Low lights, warm records',detail:'Jazz, soul and unhurried listening.',tags:['jazz','soul']},{id:'electric',title:'Synths after midnight',detail:'Electronic sounds and experiments.',tags:['electronic','experimental']},{id:'loud',title:'Guitars in a small room',detail:'Punk, metal and noisy live music.',tags:['punk','metal']},{id:'new',title:'Play me something unfamiliar',detail:'Keep the music direction open.',tags:['music']}],
 worlds:[{id:'retro',title:'A pocket-sized time machine',detail:'Old games, pixels and childhood worlds.',tags:['retro','games']},{id:'fantasy',title:'An unfamiliar landscape',detail:'Fantasy worlds and independent games.',tags:['fantasy','indie games']},{id:'illustrated',title:'Characters with a story',detail:'Animation, illustration and character worlds.',tags:['anime','illustration']},{id:'social',title:'A game we can share',detail:'Playful gatherings and tabletop games.',tags:['tabletop','games']}],
 art:[{id:'experimental',title:'Make me look twice',detail:'Experimental work and unusual installations.',tags:['experimental','art']},{id:'graphic',title:'Colour, ink and printed paper',detail:'Illustration, graphic art and small editions.',tags:['illustration','design']},{id:'quiet',title:'A slower kind of looking',detail:'Photography, craft and small exhibitions.',tags:['photography','craft']},{id:'film',title:'A story on a screen',detail:'Cinema and animated worlds.',tags:['film','anime']}],
 objects:[{id:'toy',title:'Small object, strange character',detail:'Artist toys and character editions.',tags:['designer toys','characters']},{id:'print',title:'Paper I would keep',detail:'Prints, zines and independent editions.',tags:['illustration','books']},{id:'record',title:'Music I can hold',detail:'Vinyl, records and limited music releases.',tags:['vinyl','music']},{id:'craft',title:'Made with a particular eye',detail:'Craft, design and unusual everyday objects.',tags:['craft','design']}],
};
export function textureChoices(context:MomentTasteContext){return textures[context.answers?.invitation||'music']||textures.music;}
export function answerChoice(context:MomentTasteContext,round:'invitation'|'texture',choice:GameChoice):MomentTasteContext{
 const answers={...context.answers,[round]:choice.id};
 // Revisiting an earlier answer removes dependent answers rather than quietly retaining a different trail.
 if(round==='invitation')delete answers.texture;
 return {...context,direction:round==='invitation'?choice.id:context.direction,answers,tags:[...context.tags.filter(t=>t.id.startsWith('urn:tag:')),...(choice.tags||[]).map(name=>({id:'editorial:'+name.replace(/[^a-z0-9]+/gi,'-').toLowerCase(),name,weight:round==='texture'?1:.5}))].slice(-16)};
}
export function gameSummary(context:MomentTasteContext){return context.tags.map(t=>t.name).join(', ')||'An open direction';}
export function positiveQuestionAnchors(context:MomentTasteContext,seedIds:string[]=[],recipeIds:string[]=[]){const reacted=context.reactions.filter(r=>r.action==='save'||r.action==='more').flatMap(r=>r.entityIds||[]);return [...new Set([...reacted,...seedIds,...recipeIds])].filter(id=>z.string().uuid().safeParse(id).success).slice(0,8);}
export function readGameDraft(storage:Pick<Storage,'getItem'>){try{const raw=storage.getItem(TASTE_DRAFT_KEY)||'';if(raw.length>80000)return null;const p=gameDraftSchema.safeParse(JSON.parse(raw));return p.success?p.data:null;}catch{return null;}}
