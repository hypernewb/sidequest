'use client';
import {useState} from 'react';
import {catalogPreview,hasJapanese} from '@/lib/catalog-preview';
import type {Opportunity} from '@/lib/opportunities';
export function CatalogDescription({item,onUpdate}:{item:Opportunity;onUpdate:(item:Opportunity)=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');const preview=catalogPreview(item);
 async function translate(){setBusy(true);setError('');try{const r=await fetch('/api/catalog',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'translate_preview',id:item.id})});const b=await r.json() as {englishDescription?:string};if(!r.ok||typeof b.englishDescription!=='string')throw Error('Translation is unavailable right now. Key details and the Japanese source are still available.');onUpdate({...item,englishDescription:b.englishDescription});}catch(e){setError(e instanceof Error?e.message:'Translation unavailable.');}finally{setBusy(false);}}
 return <><p>{preview.label&&<small>{preview.label}<br/></small>}{preview.text}</p>{preview.original&&<details><summary>Original Japanese description</summary><p>{item.description}</p></details>}{!item.englishDescription&&hasJapanese(item.description)&&<button disabled={busy} onClick={()=>void translate()}>{busy?'Translating description…':'Translate description'}</button>}{error&&<p role="status">{error}</p>}</>;
}
