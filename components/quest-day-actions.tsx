'use client';
import {useEffect,useState} from 'react';
import {appendBrowserReaction,readBrowserTaste,writeBrowserTasteProfile} from '@/lib/browser-taste';
import {replacePlanReactions} from '@/lib/taste-profile';
import {JOURNEY_KEY,VISITS_KEY,journeyItem,readJourney,readVisits,type JourneyItem,type Visit} from '@/lib/journey';
import type {Opportunity} from '@/lib/opportunities';
import type {Quest} from '@/lib/quests';
import {VisitRating} from './visit-rating';
import '@/app/journey.css';

export function QuestDayActions({quest}:{quest:Quest}){
 const [notice,setNotice]=useState(''),[hasPlan,setHasPlan]=useState(false);
 useEffect(()=>{try{setHasPlan(readJourney(localStorage,quest.date).entries.length>0);}catch{}},[quest.date]);
 function useDay(){let planSaved=false;try{
  const previous=readJourney(localStorage,quest.date),profile=readBrowserTaste(localStorage)||{seeds:[],avoid:[]};
  const entries=quest.stops.map(s=>({item:journeyItem(s.item),time:s.arrival}));
  localStorage.setItem(JOURNEY_KEY,JSON.stringify({date:quest.date,entries}));
  planSaved=true;
  setHasPlan(true);
  const context=replacePlanReactions(profile.context||{tags:[],reactions:[]},previous.entries.map(e=>e.item.id),entries.map(e=>e.item.id));
  writeBrowserTasteProfile(localStorage,{...profile,context});
  setNotice('These stops are now in My day. This replaces your previous day plan.');
 }catch{setNotice(planSaved?'Your day was saved, but its preference signals could not be updated.':'Could not keep this day in browser storage. Your quest and map are still available.');}}
 return <div className="quest-day-actions"><button onClick={useDay}>{hasPlan?'Replace My day with these stops':'Use these stops in My day'}</button>{notice&&<p role="status">{notice} <a href="/">Review my day</a></p>}</div>;
}
export function QuestStopRating({item}:{item:Opportunity}){
 const [visits,setVisits]=useState<Visit[]>([]),[notice,setNotice]=useState('');
 useEffect(()=>{const read=()=>{try{setVisits(readVisits(localStorage));}catch{}};read();window.addEventListener('sidequest-visit-updated',read);return()=>window.removeEventListener('sidequest-visit-updated',read);},[]);
 function rate(snapshot:JourneyItem,rating:number){
  const at=new Date().toISOString(),next=[{item:snapshot,rating,at},...visits.filter(v=>v.item.id!==snapshot.id)].slice(0,100);setVisits(next);
  try{localStorage.setItem(VISITS_KEY,JSON.stringify(next));appendBrowserReaction(localStorage,{id:snapshot.id,action:'visit',rating,at});window.dispatchEvent(new Event('sidequest-visit-updated'));setNotice('Enjoyment saved. Your next finds will use this rating.');}catch{setNotice('Rating kept for this session. Browser storage is unavailable.');}
 }
 return <><VisitRating item={journeyItem(item)} rating={visits.find(v=>v.item.id===item.id)?.rating} onRate={rate}/>{notice&&<p role="status" className="journey-note">{notice}</p>}</>;
}
