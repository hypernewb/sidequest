import type {Opportunity} from './opportunities.ts';
export function translationInput(o:Opportunity){return 'TITLE\n'+o.title+'\n\nDESCRIPTION\n'+o.description+'\n\nDETAILS\n'+(o.details?.original||'');}
export function translationFields(o:Opportunity,original:string,english:string){if(original===translationInput(o)){const m=english.match(/^TITLE\s*\n([\s\S]*?)\n\s*DESCRIPTION\s*\n([\s\S]*?)\n\s*DETAILS\s*\n?([\s\S]*)$/);return m?{englishTitle:m[1].trim(),englishDescription:m[2].trim(),english:m[3].trim()}:null;}return original===(o.details?.original||'')?{english}:null;}
