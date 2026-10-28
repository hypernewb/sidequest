import {z} from 'zod';

export const momentReactionSchema=z.object({
 id:z.string().min(1).max(800),
 action:z.enum(['save','more','pass','seen','too-expensive','wrong-place']),
 entityIds:z.array(z.string().uuid()).max(12).optional(),
 reason:z.enum(['taste','price','access','format','unknown','seen']).optional(),
 at:z.string().datetime().optional(),
});
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
 return {...context,reactions:[...context.reactions.filter(r=>r.id!==next.id),next].slice(-100)};
}
