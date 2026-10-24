import {parseMograg} from './official-events.ts';
import {plainText} from './announcements.ts';
import type {Opportunity} from './opportunities.ts';
// Only source-specific programme adapters can override hours. Unrelated date mentions are not closures.
export function datedVenueHours(item:Opportunity,html:string,date:string):Opportunity{
 if(item.title!=='Mograg Gallery')return item;
 const shows=parseMograg(html,new Date().toISOString()),show=shows.find(s=>date>=s.start&&date<=s.end);
 const day=new Date(date+'T12:00:00Z').getUTCDay();
 if(!show||show.closedDays.includes(day))return {...item,hours:{...item.hours,[date]:[{closed:true}]}};
 const match=plainText(html).match(/OPEN\s*\/?\s*(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})/i);
 return match?{...item,hours:{...item.hours,[date]:[{opens:match[1],closes:match[2]}]},curation:{...item.curation!,hoursBasis:'Official exhibition schedule'}}:item;
}
