import type {Quest} from './quests.ts';
const clean=(v:string)=>v.replace(/[\u0000-\u0008\u000b-\u001f]/g,'').trim();
export function questShareText(q:Quest){
 const lines=[q.title,`${q.date} · Tokyo · Inspired by ${q.seed.name}`,q.invitation,''];
 q.stops.forEach((s,i)=>{lines.push(`${i+1}. ${s.arrival}–${s.departure} JST · ${s.item.title}`,s.item.location);if(s.travelMinutes)lines.push(s.transit?`Allow ${s.travelMinutes} minutes from the previous stop. Train: ${s.transit}.`:`Allow ${s.travelMinutes} minutes walking from the previous stop.`);if(s.programme)lines.push(`Programme: ${s.programme.title} · ${s.programme.url}`);for(const f of s.guide?.practical||[])lines.push('Before you go: '+f.text,'Source: '+f.url+' (read '+f.checkedAt+')');lines.push('SideQuest suggestion: '+(s.guide?.appreciation.text||s.mission),'Venue: '+s.item.url,'');});
 if(q.walkingMinutes)lines.push(`Allow about ${q.walkingMinutes} minutes ${q.returnTransit||q.stops.some(s=>s.transit)?'of walking and train':'walking'}, including the return to the start.`);
 if(q.map)lines.push('Google Maps: '+q.map);
 lines.push('Opening times are published schedules. Check special closures before heading out.');
 return lines.map(clean).join('\n');
}
