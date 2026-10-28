import {z} from 'zod';
import {preferenceSchema,type Preferences} from './opportunities.ts';
import {momentsContextSchema,withReaction,type MomentReaction} from './taste-profile.ts';
export type {MomentReaction,MomentTasteContext} from './taste-profile.ts';
const schema=z.object({seeds:preferenceSchema.innerType().shape.seeds,avoid:z.array(z.string().max(60)).max(20).optional(),context:momentsContextSchema.passthrough().optional()}).passthrough();
export type BrowserTaste=z.infer<typeof schema>;
export const TASTE_KEY='sidequest-shared-taste-v1';
export function readBrowserTaste(storage:Pick<Storage,'getItem'>){try{const raw=storage.getItem(TASTE_KEY)||'null';if(raw.length>100000)return null;const result=schema.safeParse(JSON.parse(raw));return result.success?result.data:null;}catch{return null;}}
export function writeBrowserTaste(storage:Pick<Storage,'setItem'> & Partial<Pick<Storage,'getItem'>>,seeds:Preferences['seeds'],avoid?:string[]){const prior=storage.getItem?readBrowserTaste(storage as Pick<Storage,'getItem'>):null;storage.setItem(TASTE_KEY,JSON.stringify(schema.parse({...prior,seeds,avoid:avoid??prior?.avoid??[]})));}
export function writeBrowserTasteProfile(storage:Pick<Storage,'setItem'|'getItem'>,profile:BrowserTaste){const prior=readBrowserTaste(storage);storage.setItem(TASTE_KEY,JSON.stringify(schema.parse({...prior,...profile})));}
export function readBrowserReactions(storage:Pick<Storage,'getItem'>):MomentReaction[]{return readBrowserTaste(storage)?.context?.reactions||[];}
export function writeBrowserReactions(storage:Pick<Storage,'getItem'|'setItem'>,reactions:MomentReaction[]){const prior=readBrowserTaste(storage)||{seeds:[],avoid:[]};writeBrowserTasteProfile(storage,{...prior,context:momentsContextSchema.parse({...prior.context,reactions:reactions.slice(-100)})});}
export function appendBrowserReaction(storage:Pick<Storage,'getItem'|'setItem'>,reaction:MomentReaction){const prior=readBrowserTaste(storage)||{seeds:[],avoid:[]};writeBrowserTasteProfile(storage,{...prior,context:withReaction(prior.context||{tags:[],reactions:[]},reaction)});}
export function clearBrowserTasteProfile(storage:Pick<Storage,'removeItem'>){storage.removeItem(TASTE_KEY);}
