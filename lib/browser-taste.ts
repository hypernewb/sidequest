import {z} from 'zod';
import {preferenceSchema,type Preferences} from './opportunities.ts';
const schema=z.object({seeds:preferenceSchema.innerType().shape.seeds,avoid:z.array(z.string().max(60)).max(20).optional()});
export const TASTE_KEY='sidequest-shared-taste-v1';
export function readBrowserTaste(storage:Pick<Storage,'getItem'>){try{const result=schema.safeParse(JSON.parse(storage.getItem(TASTE_KEY)||'null'));return result.success?result.data:null;}catch{return null;}}
export function writeBrowserTaste(storage:Pick<Storage,'setItem'>,seeds:Preferences['seeds'],avoid:string[]=[]){storage.setItem(TASTE_KEY,JSON.stringify({seeds,avoid}));}
