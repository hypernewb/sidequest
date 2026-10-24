import type {Quest} from './quests.ts';
export const RUN_STAGES=[
 {id:'taste',name:'Taste graph expansion',description:'Follow Qloo associations into another cultural world.'},
 {id:'operations',name:'Operational filtering',description:'Check Tokyo time, published hours and location.'},
 {id:'cluster',name:'Cluster optimization',description:'Compare short loops and read the selected venue pages.'},
 {id:'synthesis',name:'Quest synthesis',description:'Put the route, tasks and sourced door notes into one dossier.'}
] as const;
export type RunStage=typeof RUN_STAGES[number]['id'];
export type Association={name:string;type:string;relation:'seed_tag'|'related_tag'|'related_entity';via:string};
export type RunEvent={type:'stage';stage:RunStage;status:'running'|'complete'|'blocked'|'failed'|'cancelled';detail:string;at:string;associations?:Association[]};
export type RunHooks={report?:(event:RunEvent)=>void;signal?:AbortSignal};
export function reportRun(hooks:RunHooks|undefined,stage:RunStage,status:RunEvent['status'],detail:string,associations?:Association[]){hooks?.signal?.throwIfAborted();hooks?.report?.({type:'stage',stage,status,detail,at:new Date().toISOString(),...(associations?{associations}: {})});}
export type QuestReply={quest?:Quest;choices?:{id:string;name:string;type:string;description?:string}[];message?:string;error?:string};
export type RunMessage=RunEvent|{type:'result';data:QuestReply}|{type:'error';error:string};

export async function readQuestRun(response:Response,onEvent:(event:RunEvent)=>void):Promise<QuestReply>{
 if(!response.ok||!response.headers.get('content-type')?.includes('application/x-ndjson')){const b=await response.json() as QuestReply;if(!response.ok)throw Error(b.error||'This quest could not finish.');return b;}
 const reader=response.body?.getReader();if(!reader)throw Error('The scout connection did not open.');
 const decoder=new TextDecoder();let buffer='',bytes=0,result:QuestReply|undefined;
 function line(value:string){if(!value.trim())return;const message=JSON.parse(value) as RunMessage;if(message.type==='error')throw Error(message.error);if(message.type==='result'){result=message.data;return;}if(message.type!=='stage'||!RUN_STAGES.some(s=>s.id===message.stage)||typeof message.detail!=='string')throw Error('The scout sent an unreadable update.');onEvent(message);}
 try{for(;;){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>750000)throw Error('The scout response was too large.');buffer+=decoder.decode(value,{stream:true});const lines=buffer.split('\n');buffer=lines.pop()!;for(const v of lines)line(v);}buffer+=decoder.decode();if(buffer.trim())line(buffer);if(!result)throw Error('The scout disconnected before finishing. Your seed is kept.');return result;}finally{await reader.cancel();}
}
