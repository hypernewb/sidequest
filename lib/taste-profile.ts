import {z} from 'zod';

export const momentReactionSchema=z.object({
 id:z.string().min(1).max(800),
 action:z.enum(['save','more','pass','seen','too-expensive','wrong-place','planned','visit']),
 rating:z.number().int().min(1).max(5).optional(),
 entityIds:z.array(z.string().uuid()).max(12).optional(),
 reason:z.enum(['taste','price','access','format','unknown','seen']).optional(),
 at:z.string().datetime().optional(),
}).refine(r=>r.rating===undefined||r.action==='visit','Only a visit can have an enjoyment rating.');
export type MomentReaction=z.infer<typeof momentReactionSchema>;
export const momentsContextSchema=z.object({
 tags:z.array(z.object({id:z.string().regex(/^(?:urn:tag:[a-z0-9_:.-]+|editorial:[a-z0-9-]+)$/i).max(180),name:z.string().trim().min(1).max(100),weight:z.number().min(.1).max(1)})).max(16).default([]),
 reactions:z.array(momentReactionSchema).max(100).default([]),
 budget:z.number().finite().int().min(0).max(1000000).optional(),
 unknownPrice:z.boolean().optional(),
 access:z.enum(['all','online','tokyo']).optional(),
 direction:z.string().max(80).optional(),
 answers:z.record(z.string().max(60),z.string().max(200)).refine(v=>Object.keys(v).length<=12).optional(),
});
export type MomentTasteContext=z.infer<typeof momentsContextSchema>;
export const EMPTY_MOMENT_CONTEXT:MomentTasteContext={tags:[],reactions:[]};
export function withReaction(context:MomentTasteContext,reaction:MomentReaction):MomentTasteContext{
 const next=momentReactionSchema.parse(reaction);
 const family=(r:MomentReaction)=>r.action==='visit'?'visit':r.action==='planned'?'planned':'discovery';
 return {...context,reactions:[...context.reactions.filter(r=>r.id!==next.id||family(r)!==family(next)),next].slice(-100)};
}
export function withoutSaveReaction(context:MomentTasteContext,id:string):MomentTasteContext{return {...context,reactions:context.reactions.filter(r=>r.id!==id||r.action!=='save')};}

// A visit supersedes intent for learning, including a neutral rating. Re-rating
// replaces the old visit instead of multiplying the same experience.
export function learningReactions(context?:MomentTasteContext):MomentReaction[]{
 const chosen=new Map<string,MomentReaction>();
 const priority=(r:MomentReaction)=>r.action==='visit'?3:['save','more','pass'].includes(r.action)?2:1;
 for(const r of context?.reactions||[]){const old=chosen.get(r.id);if(!old||priority(r)>=priority(old))chosen.set(r.id,r);}
 return [...chosen.values()];
}
export function reactionTasteWeight(r:MomentReaction){
 if(r.action==='visit')return r.rating===undefined?0:(r.rating-3)/2;
 return r.action==='planned'?.2:r.action==='save'?.8:r.action==='more'?.6:0;
}
export function replacePlanReactions(context:MomentTasteContext,previousIds:string[],nextIds:string[],at=new Date().toISOString()){
 const previous=new Set(previousIds);
 const retained={...context,reactions:context.reactions.filter(r=>r.action!=='planned'||!previous.has(r.id))};
 return nextIds.reduce((value,id)=>withReaction(value,{id,action:'planned',at}),retained);
}
