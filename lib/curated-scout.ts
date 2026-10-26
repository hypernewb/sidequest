import type {QuestFocus} from './quest-focus.ts';
import type {RunHooks} from './quest-run.ts';
import type {Opportunity,Preferences} from './opportunities.ts';
import type {ScoutPlan} from './scout.ts';
import type {QuestSeed} from './quest-seeds.ts';
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

export async function scoutCurated(p:Preferences,key:string,seed:QuestSeed,now=new Date(),flexibleDate=false,hooks?:RunHooks,context:{focus?:QuestFocus;records?:Opportunity[]}={}):Promise<ScoutPlan>{
 const items=await rankedCurated(p,key,seed,now,hooks,context.focus);
 const schedule=await toolScheduleVerify({items,preferences:p,seed,records:context.records,focus:context.focus,now,hooks});
 const cluster=await toolSpatialCluster({items,preferences:schedule.preferences,seed,records:context.records,focus:context.focus,now,flexibleDate,hooks});
 return cluster.plan;
}
