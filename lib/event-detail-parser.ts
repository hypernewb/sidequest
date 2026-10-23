import {plainText,htmlAnnouncement} from './announcements.ts';
export type EventDetails={original:string;english?:string;translation?:'translated'|'partial'|'unavailable'|'not_needed';artists:string[];genres:{name:string;evidence:string}[];times:string[];prices:string[];priceCeiling:number|null;status:'unknown'|'cancelled'|'sold_out';checkedAt:string;url:string};
export function officialPageContent(url:string,html:string){
 const host=new URL(url).hostname;let body='';
 if(host==='www-shibuya.jp')body=html.match(/<section id="scheduleDetail"[^>]*>([\s\S]*?)<\/div><!-- END mainArea -->/)?.[1]||'';
 else if(host.endsWith('fever-popo.com'))body=html.split(/<div class="asset-content entry-content">/)[1]?.split(/<div class="asset-footer/)[0]||'';
 else if(host.endsWith('cottonclubjapan.co.jp'))body=html.match(/<article id="article"[^>]*>([\s\S]*?)<\/article>/)?.[1]||'';
 if(!body)return htmlAnnouncement(html);
 if(host.endsWith('fever-popo.com'))body=body.replace(/<h3[^>]*>/i,'<h3>LINE UP<br>');
 // WWW's event fields are inside a header; preserve these, but exclude related shows outside mainArea.
 body=body.replace(/<\/?header\b[^>]*>/gi,'').replace(/<\/dt>/gi,':\n').replace(/<\/dd>/gi,'\n').replace(/<\/dl>/gi,'\n');
 const title=htmlAnnouncement(html).title;return {title,text:(title+'\n'+plainText(body)).slice(0,12000)};
}
const genreRules:[string,RegExp][]=[['jazz',/\bjazz\b|ジャズ/i],['blues',/\bblues\b|ブルース/i],['metal',/\b(?:heavy metal|death metal|metalcore|metal)\b|メタル/i],['punk',/\b(?:punk|hardcore|grindcore)\b|パンク|ハードコア/i],['electronic',/\b(?:electronic|electronica|techno|ambient)\b|テクノ|エレクトロニ|アンビエント/i],['experimental',/\bexperimental\b|実験音楽|実験的/i],['hip-hop',/\bhip.?hop\b|ヒップホップ/i],['soul',/\bsoul\b|ソウル/i],['rock',/\brock\b|ロック/i],['pop',/\bpop\b(?![ -]?up)|ポップス/i]];
export function extractEventDetails(text:string,url:string,checkedAt=new Date().toISOString()):EventDetails{
 const original=text.slice(0,12000),lines=original.split(/\n/).map(s=>s.trim()).filter(Boolean);
 for(let i=0;i<lines.length-1;i++)if(/^(?:OPEN.?START|OPEN|START|開場.?開演)\s*[:：]?$/i.test(lines[i]))lines[i]+=' '+lines[i+1];
 const artists:string[]=[];
 for(let i=0;i<lines.length;i++)if(/^(?:LINE\s*UP|MEMBER|出演(?:者)?|出演アーティスト|ACT)\s*[:：]?$/i.test(lines[i])){for(let j=i+1;j<Math.min(i+9,lines.length);j++){if(/^(?:TICKET|INFORMATION|CHARGE|DATE|OPEN|START|＜|【|\[|予約)/i.test(lines[j]))break;artists.push(...lines[j].split(/\s+\/\s+|、/).filter(s=>s.length<120));}break;}
 const genres=genreRules.flatMap(([name,re])=>{const evidence=lines.find(line=>re.test(line)&&!/(?:not |no |without )jazz|ジャズではない/i.test(line));return evidence?[{name,evidence:evidence.slice(0,300)}]:[];});
 const times=lines.filter(l=>/(?:OPEN|START|開場|開演|営業時間|終演|show).*\d{1,2}[:：]\d{2}/i.test(l)).slice(0,6);
 const prices=lines.filter(l=>/[¥￥]\s*[\d,]+|\d[\d,]*\s*円|入場無料|入場料.*無料/i.test(l)).slice(0,10);
 const feeText=prices.join('\n');const amounts=[...feeText.matchAll(/[¥￥]\s*([\d,]+)|([\d,]+)\s*円/g)].map(m=>Number((m[1]||m[2]).replaceAll(',',''))).filter(n=>n>=0&&n<1000000);
 const extraDrink=/drink|ドリンク|飲食|一品/i.test(original),drink=prices.find(l=>/^(?:※\s*)?(?:1\s*drink|ドリンク代)\s*[¥￥]\s*[\d,]+/i.test(l));const drinkAmount=drink?Number(drink.match(/[¥￥]\s*([\d,]+)/)?.[1].replaceAll(',','')):null;
 // Never use a child/advance/starting fare as an all-in budget guarantee. Unknown compulsory extras stay unknown.
 let priceCeiling=amounts.length?Math.max(...amounts):/入場無料|入場料.*無料/.test(original)?0:null;
 if(extraDrink){if(drinkAmount!=null&&priceCeiling!=null)priceCeiling+=drinkAmount;else priceCeiling=null;}
 if(/送料|手数料|fees? extra|別途.*料金/i.test(original))priceCeiling=null;
 const status=/^(?:【|\[)(?:公演中止|開催中止|CANCELLED|CANCELED)(?:】|\])|^(?:公演中止|開催中止|CANCELLED|CANCELED)\s*[!！。]?\s*$/im.test(original)?'cancelled':/^(?:【|\[)?(?:SOLD\s*OUT|完売|売り切れ)(?:】|\])?\s*[!！。]*\s*$/im.test(original)?'sold_out':'unknown';
 return {original,artists:[...new Set(artists)].slice(0,12),genres,times,prices,priceCeiling,status,checkedAt,url};
}



