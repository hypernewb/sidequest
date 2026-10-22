import {z} from 'zod';
import {feverClient} from './fever-client.ts';
import type {EventQuery,FeverReply} from './fever-data.ts';

export type OAuthConfig={FEVER_OAUTH_CLIENT_ID?:string;FEVER_OAUTH_CLIENT_SECRET?:string;FEVER_OAUTH_REDIRECT_URI?:string;FEVER_SESSION_KEY?:string};
const ISSUER='https://data-search.apigw.feverup.com';
const RESOURCE=ISSUER+'/mcp';
const STATE_COOKIE='__Host-sq_fever_state';
const SESSION_COOKIES=['__Host-sq_fever_0','__Host-sq_fever_1','__Host-sq_fever_2'];
const MAX_AGE=30*86400;
const FLOW_SECONDS=30*60;
const sessionSchema=z.object({uid:z.string().min(1).max(300),accessToken:z.string().min(1).max(16000),refreshToken:z.string().min(1).max(16000).optional(),expiresAt:z.number().finite(),reauthAt:z.number().finite()});
export type FeverSession=z.infer<typeof sessionSchema>;
const flowSchema=z.object({uid:z.string().min(1),state:z.string(),verifier:z.string(),expires:z.number()});
function b64(data:Uint8Array){let s='';for(const b of data)s+=String.fromCharCode(b);return btoa(s).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
function un64(value:string){if(!/^[A-Za-z0-9_-]+$/.test(value))throw Error('Invalid encoding');const s=atob(value.replaceAll('-','+').replaceAll('_','/'));return Uint8Array.from(s,c=>c.charCodeAt(0));}
function random(){return b64(crypto.getRandomValues(new Uint8Array(32)));}
async function key(secret:string){const raw=un64(secret);if(raw.length!==32)throw Error('Invalid session configuration');return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);}
export async function seal(value:unknown,secret:string,purpose:string){const iv=crypto.getRandomValues(new Uint8Array(12));const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(purpose)},await key(secret),new TextEncoder().encode(JSON.stringify(value)));return b64(iv)+'.'+b64(new Uint8Array(encrypted));}
export async function unseal(value:string,secret:string,purpose:string):Promise<unknown>{if(value.length>10500)throw Error('Session too large');const [a,b,...extra]=value.split('.');if(extra.length||!a||!b)throw Error('Invalid session');const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:un64(a),additionalData:new TextEncoder().encode(purpose)},await key(secret),un64(b));return JSON.parse(new TextDecoder().decode(plain));}
function cookie(name:string,value:string,maxAge:number){return `${name}=${value}; Path=/; Max-Age=${Math.max(0,Math.floor(maxAge))}; Secure; HttpOnly; SameSite=Lax`;}
function cookies(req:Request){const result:Record<string,string>={};for(const entry of (req.headers.get('cookie')||'').split(';')){const i=entry.indexOf('=');if(i>0){const name=entry.slice(0,i).trim();if(name!==STATE_COOKIE&&!SESSION_COOKIES.includes(name))continue;if(result[name]!==undefined)throw Error('Duplicate cookie');result[name]=entry.slice(i+1).trim();}}return result;}
export function clearSession(){return SESSION_COOKIES.map(name=>cookie(name,'',0));}
export function personalConfigured(c:OAuthConfig):c is Required<OAuthConfig>{return !!(c.FEVER_OAUTH_CLIENT_ID&&c.FEVER_OAUTH_CLIENT_SECRET&&c.FEVER_OAUTH_REDIRECT_URI&&c.FEVER_SESSION_KEY);}
function purpose(c:Required<OAuthConfig>,kind:string){return new URL(c.FEVER_OAUTH_REDIRECT_URI).origin+':fever:'+kind;}
function uid(req:Request){return req.headers.get('oai-authenticated-user-id');}
export async function sessionCookies(value:FeverSession,c:Required<OAuthConfig>){const encoded=await seal(value,c.FEVER_SESSION_KEY,purpose(c,'session'));if(encoded.length>10500)throw Error('Session exceeds safe cookie size');const age=Math.min(MAX_AGE,(value.reauthAt-Date.now())/1000);return SESSION_COOKIES.map((name,i)=>cookie(name,encoded.slice(i*3500,(i+1)*3500),encoded.slice(i*3500,(i+1)*3500)?age:0));}
export async function readSession(req:Request,c:OAuthConfig):Promise<FeverSession|null>{
 if(!personalConfigured(c)||!uid(req))return null;
 try{const jar=cookies(req),encoded=SESSION_COOKIES.map(n=>jar[n]||'').join('');if(!encoded)return null;const s=sessionSchema.parse(await unseal(encoded,c.FEVER_SESSION_KEY,purpose(c,'session')));return s.uid===uid(req)&&s.reauthAt>Date.now()?s:null;}catch{return null;}
}
function redirect(c:Required<OAuthConfig>,status:string,setCookies:string[]=[]){const response=new Response(null,{status:303,headers:{Location:new URL('/?fever='+status,c.FEVER_OAUTH_REDIRECT_URI).href,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});for(const value of setCookies)response.headers.append('Set-Cookie',value);return response;}
class TokenFailure extends Error{reauth:boolean;constructor(reauth:boolean){super('Fever token exchange failed');this.reauth=reauth;}}
async function exchange(c:Required<OAuthConfig>,params:Record<string,string>,fetcher:typeof fetch){
 const r=await fetcher(ISSUER+'/token',{method:'POST',redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'},body:new URLSearchParams({...params,client_id:c.FEVER_OAUTH_CLIENT_ID,client_secret:c.FEVER_OAUTH_CLIENT_SECRET,resource:RESOURCE}),signal:AbortSignal.timeout(15000)});
 if(!r.ok){const text=await r.text();let code='';try{code=JSON.parse(text.slice(0,50000)).error;}catch{}throw new TokenFailure(r.status===401||code==='invalid_grant'||code==='invalid_client');}
 if(Number(r.headers.get('content-length'))>50000)throw Error('Invalid token response');
 const text=await r.text();if(text.length>50000)throw Error('Invalid token response');
 return z.object({access_token:z.string().min(1).max(16000),refresh_token:z.string().min(1).max(16000).optional(),expires_in:z.number().positive().finite().max(2678400),token_type:z.string().refine(t=>t.toLowerCase()==='bearer')}).parse(JSON.parse(text));
}
export async function startPersonalFever(req:Request,c:OAuthConfig){
 if(!personalConfigured(c))return Response.json({error:'Personal Fever sign-in is not configured.'},{status:503});
 const origin=new URL(c.FEVER_OAUTH_REDIRECT_URI).origin;
 if(new URL(req.url).origin!==origin)return Response.json({error:'Open the private SideQuest site to connect Fever.'},{status:400});
 const user=uid(req);if(!user)return new Response(null,{status:303,headers:{Location:origin+'/signin-with-chatgpt?return_to=%2Fapi%2Ffever%2Fstart','Cache-Control':'private, no-store'}});
 const state=random(),verifier=random(),challenge=b64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
 const flow=await seal({uid:user,state,verifier,expires:Date.now()+FLOW_SECONDS*1000},c.FEVER_SESSION_KEY,purpose(c,'flow'));
 const url=new URL(ISSUER+'/authorize');url.search=new URLSearchParams({client_id:c.FEVER_OAUTH_CLIENT_ID,redirect_uri:c.FEVER_OAUTH_REDIRECT_URI,response_type:'code',scope:'openid offline_access',state,code_challenge:challenge,code_challenge_method:'S256',resource:RESOURCE}).toString();
 return new Response(null,{status:303,headers:{Location:url.href,'Set-Cookie':cookie(STATE_COOKIE,flow,FLOW_SECONDS),'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
}
export async function completePersonalFever(req:Request,c:OAuthConfig,fetcher:typeof fetch=fetch){
 if(!personalConfigured(c))return Response.json({error:'Personal Fever sign-in is not configured.'},{status:503});
 const clear=[cookie(STATE_COOKIE,'',0)];
 let phase='state';
 try{
  if(new URL(req.url).origin!==new URL(c.FEVER_OAUTH_REDIRECT_URI).origin)throw Error('Wrong origin');
  const query=new URL(req.url).searchParams;
  phase='cookie';const stored=cookies(req)[STATE_COOKIE];if(!stored)throw Error('Missing flow cookie');
  phase='decrypt';const flow=flowSchema.parse(await unseal(stored,c.FEVER_SESSION_KEY,purpose(c,'flow')));
  phase='identity';if(!uid(req)||flow.uid!==uid(req))throw Error('Invalid visitor');
  phase='state';if(flow.state!==query.get('state'))throw Error('Invalid sign-in state');
  if(flow.expires<Date.now())return redirect(c,'expired',clear);
  if(query.has('error'))return redirect(c,'cancelled',clear);
  const code=query.get('code');if(!code||code.length>4096)throw Error('Missing sign-in code');
  phase='exchange';
  const token=await exchange(c,{grant_type:'authorization_code',code,redirect_uri:c.FEVER_OAUTH_REDIRECT_URI,code_verifier:flow.verifier},fetcher);
  phase='session';
  const now=Date.now();const s:FeverSession={uid:flow.uid,accessToken:token.access_token,refreshToken:token.refresh_token,expiresAt:now+token.expires_in*1000,reauthAt:now+MAX_AGE*1000};
  return redirect(c,'connected',[...clear,...await sessionCookies(s,c)]);
 }catch(e){
  // Only static stage/schema information: never log codes, cookies, IDs or tokens.
  console.warn('Fever OAuth callback failed',{phase,issue:e instanceof z.ZodError?e.issues.map(i=>({path:i.path.join('.'),code:i.code})):e instanceof TokenFailure?'token_rejected':'invalid_flow'});
  return redirect(c,'failed_'+phase,clear);
 }
}
export async function connectionStatus(req:Request,c:OAuthConfig){const s=await readSession(req,c);return {configured:personalConfigured(c),connected:!!s&&!!(s.expiresAt>Date.now()||s.refreshToken),requiresSiteSignIn:!uid(req)};}
export async function personalFeverSearch(req:Request,c:OAuthConfig,query:EventQuery,fetcher:typeof fetch=fetch,client=feverClient):Promise<{reply:FeverReply;cookies:string[]}>{
 const required=():FeverReply=>({status:'authentication_required',events:[],message:'Connect your Fever account to include live events. Your Qloo place discoveries still work.'});
 if(!personalConfigured(c))return {reply:{status:'not_configured',events:[],message:'Open the private SideQuest site to connect your Fever account.'},cookies:[]};
 let s=await readSession(req,c);if(!s)return {reply:required(),cookies:clearSession()};
 let changed=false;
 async function refresh(){if(!s?.refreshToken)throw Error('Sign in again');const t=await exchange(c as Required<OAuthConfig>,{grant_type:'refresh_token',refresh_token:s.refreshToken},fetcher);s={...s,accessToken:t.access_token,refreshToken:t.refresh_token||s.refreshToken,expiresAt:Date.now()+t.expires_in*1000};changed=true;}
 try{
  if(s.expiresAt<Date.now()+90000)await refresh();
  let reply=await client.search({},query,s!.accessToken);
  if(reply.reauthenticationRequired&&!changed&&s!.refreshToken){await refresh();reply=await client.search({},query,s!.accessToken);}
  if(reply.reauthenticationRequired)return {reply:required(),cookies:clearSession()};
  return {reply,cookies:changed?await sessionCookies(s!,c):[]};
 }catch(e){return e instanceof TokenFailure&&e.reauth?{reply:required(),cookies:clearSession()}:{reply:{status:'error',events:[],message:'Fever could not renew your connection right now. Please try again.'},cookies:[]};}
}
export async function disconnectPersonalFever(req:Request,c:OAuthConfig,fetcher:typeof fetch=fetch){
 if(req.headers.get('origin')!==new URL(req.url).origin||!uid(req))return Response.json({error:'Sign in to disconnect Fever.'},{status:403});
 const s=await readSession(req,c);
 if(s&&personalConfigured(c)){try{const r=await fetcher(ISSUER+'/revoke',{method:'POST',redirect:'error',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:c.FEVER_OAUTH_CLIENT_ID,client_secret:c.FEVER_OAUTH_CLIENT_SECRET,token:s.refreshToken||s.accessToken,token_type_hint:s.refreshToken?'refresh_token':'access_token'}),signal:AbortSignal.timeout(5000)});await r.body?.cancel();}catch{}}
 const response=Response.json({connected:false},{headers:{'Cache-Control':'private, no-store'}});for(const value of [...clearSession(),cookie(STATE_COOKIE,'',0)])response.headers.append('Set-Cookie',value);return response;
}
