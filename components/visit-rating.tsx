'use client';
import {canRateVisit,type JourneyItem} from '@/lib/journey';
const labels=['Not for me','Not great','Okay','Good','Loved it'];
export function VisitRating({item,rating,onRate}:{item:JourneyItem;rating?:number;onRate:(item:JourneyItem,rating:number)=>void}){
 if(!canRateVisit(item)&&!rating)return null;
 return <details className="visit-rating"><summary>{rating?`Your enjoyment · ${rating}/5`:'Been or tried it? Rate your experience'}</summary><fieldset><legend>How much did you enjoy {item.title}?</legend><div className="rating-options">{labels.map((label,i)=><button type="button" key={label} aria-pressed={rating===i+1} aria-label={`${i+1} out of 5, ${label}`} onClick={()=>onRate(item,i+1)}><strong>{i+1}</strong><span>{label}</span></button>)}</div><p>One rating. Change it anytime. Your next finds will use it.</p></fieldset></details>;
}
