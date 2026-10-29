import type {QuestFocus} from './quest-focus.ts';
import type {RunHooks} from './quest-run.ts';
import type {Opportunity,Preferences} from './opportunities.ts';
import type {ScoutPlan} from './scout.ts';
import type {QuestSeed} from './quest-seeds.ts';
import {applyQuestLearning} from './visit-learning.ts';
import {learningReactions,type MomentTasteContext} from './taste-profile.ts';
import {reportRun} from './quest-run.ts';
import {
 curatedOpportunity,
 checkVenuePage,
 verifiedHours,
 toolExpandTasteGraph,
 toolScheduleVerify,
 toolSpatialCluster
} from './agent-tools.ts';

export {curatedOpportunity, checkVenuePage, verifiedHours};
export type {Curation} from './curated-venues.ts';

export async function rankedCurated(p:Preferences,key:string,seed:QuestSeed,now=new Date(),hooks?:RunHooks,focus:QuestFocus='any'){
 const {candidates}=await toolExpandTasteGraph({seed,preferences:p,apiKey:key,now,hooks,focus});
 return candidates;
}

export async function scoutCurated(p:Preferences,key:string,seed:QuestSeed,now=new Date(),flexibleDate=false,hooks?:RunHooks,context:{focus?:QuestFocus;records?:Opportunity[];reportedClosed?:string[];taste?:MomentTasteContext}={}):Promise<ScoutPlan>{
 const items=applyQuestLearning(await rankedCurated(p,key,seed,now,hooks,context.focus),context.taste);
 const visits=learningReactions(context.taste).filter(r=>r.action==='visit'&&r.rating!==3&&items.some(o=>o.id.toUpperCase()===r.id.toUpperCase()));
 if(visits.length)reportRun(hooks,'taste','running',`Applied ${visits.length} of your enjoyment ratings to the curated venue ranking. Hours and cultural fit still apply.`);
 const schedule=await toolScheduleVerify({items,preferences:p,seed,records:context.records,focus:context.focus,now,hooks});
 const cluster=await toolSpatialCluster({items,preferences:schedule.preferences,seed,records:context.records,focus:context.focus,reportedClosed:context.reportedClosed,now,flexibleDate,hooks});
 return cluster.plan;
}
