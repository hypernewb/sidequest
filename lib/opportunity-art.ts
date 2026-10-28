import {publicLink,decodeText} from './announcements.ts';
export function announcementArt(html:string,base:string){
 for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){
 const attrs=Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)].map(m=>[m[1].toLowerCase(),decodeText(m[3])]));
 if(!/^(og:image(?::secure_url)?|twitter:image(?::src)?)$/i.test(attrs.property||attrs.name||''))continue;
 try{const u=new URL(attrs.content,base);if(u.protocol==='https:'&&publicLink.safeParse(u.href).success)return u.href;}catch{}
 }return null;
}
