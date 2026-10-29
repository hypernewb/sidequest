'use client';
import {useEffect,useState} from 'react';
import {AnnouncementInbox,SavedAnnouncements} from '@/components/announcement-inbox';
import {announcementSchema,type Announcement} from '@/lib/announcements';
import {readBrowserTaste} from '@/lib/browser-taste';
import {EMPTY_TASTE} from '@/lib/taste';
import type {Interest} from '@/lib/discovery';

export default function AnnouncementsPage(){
 const [interests,setInterests]=useState<Interest[]>([]),[saved,setSaved]=useState<Announcement[]>([]);
 useEffect(()=>{const taste=readBrowserTaste(localStorage);setInterests((taste?.seeds||[]).filter(s=>(s.weight??1)>0));try{const rows=JSON.parse(localStorage.getItem('sidequest-announcements-v1')||'[]');if(Array.isArray(rows))setSaved(rows.flatMap(row=>{const p=announcementSchema.safeParse(row);return p.success?[p.data]:[];}));}catch{}},[]);
 function save(item:Announcement){const next=[item,...saved.filter(a=>a.url!==item.url)].slice(0,100);try{localStorage.setItem('sidequest-announcements-v1',JSON.stringify(next));}catch{return false;}setSaved(next);return true;}
 return <main className="sidequest" style={{maxWidth:1000,margin:'0 auto',padding:'32px 24px'}}><header><a href="/">SideQuest.</a> · <a href="/taste">Your taste</a></header><AnnouncementInbox profile={EMPTY_TASTE} interests={interests} saved={saved} onSave={save} onBack={()=>{window.location.href='/';}}/><SavedAnnouncements items={saved} onRemove={url=>{const next=saved.filter(a=>a.url!==url);localStorage.setItem('sidequest-announcements-v1',JSON.stringify(next));setSaved(next);}}/></main>;
}
