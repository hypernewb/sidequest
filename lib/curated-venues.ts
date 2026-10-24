import data from './curated-venues.json' with {type:'json'};
export type VenueRole='coffee'|'books'|'dig'|'art'|'listen'|'play';
export type Venue={name:string;source:string;area:string;role:VenueRole;tags:string[];mission:string;reviewedAt:string;qlooId:string|null;doorNotes:string[];eventOnly:boolean};
export const VENUES=data as Venue[];
export const venueById=new Map(VENUES.filter(v=>v.qlooId).map(v=>[v.qlooId!,v]));
export type Curation={role:VenueRole;area:string;mission:string;tags:string[];doorNotes:string[];source:string;reviewedAt:string;sourceReadAt?:string;hoursBasis?:string;matchBasis:'entity'|'album_tags'|'genre_bridge';matchedTags?:string[];matchStrength?:'anchor'|'adjacent'|'stopover';tasteScore?:number};
export const roleLabels:Record<VenueRole,string>={coffee:'Coffee break',books:'Off the shelf',dig:'In the racks',art:'Look closer',listen:'Stay for the selection',play:'Take a turn'};
