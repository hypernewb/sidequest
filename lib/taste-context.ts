import {z} from 'zod';
export const ACTIVITIES={any:'A bit of everything',collect:'Games & collectibles',music:'Records & live music',art:'Art & exhibitions',cafe:'Cafés & places to unwind'} as const;
export type Activity=keyof typeof ACTIVITIES;
export const safeTasteTag=z.object({id:z.string().regex(/^urn:tag:(genre|subgenre|style|art_style|emotional_tone|gameplay_type|music)(:|_)[a-z0-9_:.-]+$/i).max(180),name:z.string().trim().min(1).max(100)});
export const tasteContextSchema=z.object({ids:z.array(z.string().uuid()).min(1).max(8),tags:z.array(safeTasteTag).max(2),activity:z.enum(['any','collect','music','art','cafe'])});
export type TasteContext=z.infer<typeof tasteContextSchema>;
export const PLACE_TAGS:Record<Exclude<Activity,'any'>,string[]>={collect:['urn:tag:category:place:toy_store','urn:tag:category:place:video_game_store','urn:tag:category:place:comic_book_store'],music:['urn:tag:genre:place:record_store','urn:tag:genre:place:live_music_venue'],art:['urn:tag:genre:place:art_museum','urn:tag:genre:place:art_gallery'],cafe:['urn:tag:category:place:cafe']};
export function activityFits(category:string,activity:Activity){
 const groups={collect:/toy|hobby|video game|comic|collectible|model shop|game store|arcade|amusement center/i,music:/record|music|jazz|concert/i,art:/museum|gallery|art center/i,cafe:/cafe|coffee|tea house|tea room/i};
 return activity==='any'?Object.values(groups).some(r=>r.test(category))||/book|arcade|amusement|cultural|bar/i.test(category):groups[activity].test(category);
}

