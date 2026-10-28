import type {ScoutPlan,ScoutStop} from './scout.ts';
import type {RunEvent} from './quest-run.ts';

export function routeDistance(plan:Pick<ScoutPlan,'walkingMetres'>){
 const metres=plan.walkingMetres;
 return typeof metres==='number'&&Number.isFinite(metres)&&metres>=0?`${(metres/1000).toFixed(1)} km`:'Not available';
}
export function nextLeg(stop:Pick<ScoutStop,'travelMinutes'|'distanceMetres'|'transit'>){
 const minutes=Number.isFinite(stop.travelMinutes)&&stop.travelMinutes>0?`about ${stop.travelMinutes} min`:'';
 if(stop.transit)return `${stop.transit}${minutes?' · '+minutes+' including station walks':''}`;
 const distance=Number.isFinite(stop.distanceMetres)&&stop.distanceMetres>0?`${Math.round(stop.distanceMetres)} m`:'';
 return [distance,minutes].filter(Boolean).join(' · ')+' walk to the next stop';
}
export function runSummary(events:RunEvent[],busy:boolean){
 const last=events.at(-1);
 if(last?.status==='cancelled')return 'Stopped. Your interest is kept.';
 if(last?.status==='failed')return 'The route could not be completed.';
 if(last?.status==='blocked')return 'Choose an option to continue.';
 if(busy)return last?.detail||'Starting your quest…';
 if(last?.stage==='synthesis'&&last.status==='complete')return 'Route planning finished. See the stops and source notes below.';
 return 'This run has ended. No completed route is confirmed.';
}
