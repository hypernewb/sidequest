import test from 'node:test';import assert from 'node:assert/strict';
import {readDiscoverySession,writeDiscoverySession,DISCOVERY_SESSION_KEY} from '../lib/discovery-session.ts';
import {announcementArt} from '../lib/opportunity-art.ts';
test('session choices stay separate, survive navigation and expire with the Tokyo day',()=>{
 const rows=new Map<string,string>(),storage={getItem:(k:string)=>rows.get(k)||null,setItem:(k:string,v:string)=>{rows.set(k,v);}};
 const context={tags:[],reactions:[{id:'event:1',action:'more' as const}]};
 writeDiscoverySession(storage,context,[{leftId:'a',rightId:'b',outcome:'unknown'}]);assert.deepEqual(readDiscoverySession(storage)?.context,context);assert.equal(rows.size,1);
 const b=JSON.parse(rows.get(DISCOVERY_SESSION_KEY)!);b.day='2000-01-01';storage.setItem(DISCOVERY_SESSION_KEY,JSON.stringify(b));assert.equal(readDiscoverySession(storage),null);
});
test('announcement artwork handles attribute order, relative paths and rejects private/executable targets',()=>{
 assert.equal(announcementArt('<meta content="/art.jpg?a=1&amp;b=2" property="og:image">','https://example.com/event'),'https://example.com/art.jpg?a=1&b=2');
 assert.equal(announcementArt('<meta name="twitter:image" content="javascript:alert(1)">','https://example.com'),null);
 assert.equal(announcementArt('<meta property="og:image" content="https://127.0.0.1/x">','https://example.com'),null);
 assert.equal(announcementArt('<meta property="og:image" content="https://user:pass@example.com/x">','https://example.com'),null);
});
