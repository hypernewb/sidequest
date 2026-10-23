import {publicLink,plainText} from './announcements.ts';
export type ReaderConfig={PULLMD_URL?:string;PULLMD_BEARER_TOKEN?:string};
// This is a server-configured service, never a visitor-supplied proxy target.
export async function pullmdRead(target:string,config:ReaderConfig,fetcher:typeof fetch=fetch){
 publicLink.parse(target);
 if(!config.PULLMD_URL)throw Error('No optional reader configured.');
 const base=new URL(config.PULLMD_URL);
 if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)throw Error('Reader configuration is invalid.');
 const url=new URL('api',base.href.endsWith('/')?base.href:base.href+'/');url.searchParams.set('url',target);url.searchParams.set('format','text');url.searchParams.set('frontmatter','false');url.searchParams.set('render','skip');url.searchParams.set('comments','false');
 const r=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Accept:'text/plain',...(config.PULLMD_BEARER_TOKEN?{Authorization:'Bearer '+config.PULLMD_BEARER_TOKEN}:{})}});
 if(!r.ok)throw Error('The optional reader could not read this page.');
 if(!/text\/(plain|markdown)/i.test(r.headers.get('content-type')||''))throw Error('The optional reader returned an unexpected format.');
 const reader=r.body?.getReader();if(!reader)throw Error('The optional reader returned no text.');let size=0,value='';const decoder=new TextDecoder();try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>150000)throw Error('The optional reader returned too much text.');value+=decoder.decode(part.value,{stream:true});}value+=decoder.decode();}finally{await reader.cancel();}
 const cleaned=plainText(value);if(cleaned.length<30)throw Error('The optional reader did not find enough announcement text.');
 return {url:target,title:cleaned.split('\n').find(Boolean)!.replace(/^#+\s*/, '').slice(0,240),text:cleaned.slice(0,12000),source:'official_page' as const,sourceNote:'Extracted through the configured PullMD reader. Some page content may be omitted; check dates and conditions against the original announcement.'};
}
