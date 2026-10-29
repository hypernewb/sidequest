import {plainText,htmlAnnouncement} from './announcements.ts';
export type EventDetails={original:string;level?:'calendar'|'full';english?:string;translation?:'translated'|'partial'|'unavailable'|'not_needed';artists:string[];genres:{name:string;evidence:string}[];times:string[];prices:string[];priceCeiling:number|null;status:'unknown'|'cancelled'|'sold_out';checkedAt:string;url:string};
export function officialPageContent(url:string,html:string){
 const host=new URL(url).hostname;let body='';
 if(host==='www-shibuya.jp')body=html.match(/<section id="scheduleDetail"[^>]*>([\s\S]*?)<\/div><!-- END mainArea -->/)?.[1]||'';
 else if(host.endsWith('fever-popo.com'))body=html.split(/<div class="asset-content entry-content">/)[1]?.split(/<div class="asset-footer/)[0]||'';
 else if(host.endsWith('cottonclubjapan.co.jp'))body=html.match(/<article id="article"[^>]*>([\s\S]*?)<\/article>/)?.[1]||'';
 else if(host.endsWith('unit-tokyo.com'))body=html.split('<div id="content" class="p-detail">')[1]?.split('<section class="c-section c-section--white">')[0]||'';
 else if(host.endsWith('liquidroom.net'))body=html.split('<div class="main_column">')[1]?.match(/<article[^>]*>([\s\S]*?)<\/article>/)?.[1]||'';
 if(!body)return htmlAnnouncement(html);
 if(host.endsWith('fever-popo.com'))body=body.replace(/<h3[^>]*>/i,'<h3>LINE UP<br>');
 // WWW's event fields are inside a header; preserve these, but exclude related shows outside mainArea.
 body=body.replace(/<\/?header\b[^>]*>/gi,'').replace(/<\/dt>/gi,':\n').replace(/<\/dd>/gi,'\n').replace(/<\/dl>/gi,'\n');
 const title=host.endsWith('fever-popo.com')?plainText(html.match(/class="eventtitle">([\s\S]*?)<\/h[1-6]>/)?.[1]||'')||htmlAnnouncement(html).title:htmlAnnouncement(html).title;return {title,text:(title+'\n'+plainText(body)).slice(0,12000)};
}
const genreRules:[string,RegExp][]=[['jazz',/\bjazz\b|ジャズ/i],['blues',/\bblues\b|ブルース/i],['metal',/\b(?:heavy metal|death metal|metalcore|deathcore|metal)\b|メタル/i],['punk',/\b(?:punk|hardcore|grindcore)\b|パンク|ハードコア/i],['electronic',/\b(?:electronic|electronica|techno|house music|drum and bass|idm)\b|テクノ|エレクトロニ|電子音楽/i],['ambient',/\b(?:ambient|downtempo|trip.?hop)\b|アンビエント/i],['experimental',/\bexperimental\b|実験音楽|実験的/i],['hip-hop',/\bhip.?hop\b|ヒップホップ/i],['soul',/\bsoul\b|ソウル/i],['R&B',/\bR\s*(?:&|and|n)\s*B\b|リズム.?アンド.?ブルース/i],['funk',/\bfunk\b|ファンク/i],['rock',/\brock\b|ロック(?!フォール)/i],['indie',/\bindie\b|インディー/i],['pop',/\bpop\b(?![ -]?up)|ポップス/i]];
export function performerHeading(name:string){return /^(?:出演(?:者|アーティスト)?|line\s*up|(?:all\s+)?mixing|sound engineer|lighting|照明|音響)\s*[:：]?$/i.test(name.trim());}
export function lineupNames(text:string){
 return text.replace(/[【〈<\[](?:Special Guests?|GUEST|LIVE|DJ|出演)[】〉>\]]/gi,'\n').split(/\n|\s*[/／、]\s*|\s+[×]\s+/).map(s=>s.replace(/^[・●■◆]\s*|^(?:GUEST LIVE|FEATURED ARTIST|LIVE|DJ|GUEST|ACT|出演(?:者)?)\s*[:：]\s*/gi,'').trim()).filter(s=>!performerHeading(s)&&s.length>1&&s.length<100&&!/^[-<〈【\[]*(?:live|djs?|guest|special guests?|line\s*up|shop|vjs?|food|www\s*[xβ]?|and more\.?|[.…]+|tba|未定)[->〉】\]]*$/i.test(s)&&!/(?:https?:|[^\s]+@[^\s]+|\bbookings\b|^INFO$|tickets?|問合|予約|開場|開演|税込|[¥￥]|円|^OPEN|^START|^ADV|^DOOR)/i.test(s)).slice(0,32);
}
export function explicitSoulGenre(text:string){return /\bsoul(?:ful)?[ -](?:music|jazz|singer|vocalist|band|groove|records?|albums?|sound)\b|\b(?:jazz|funk|r&b)[, /&+-]+soul\b|\b(?:genre|style)\s*[:：]\s*soul\b|^\s*(?:neo[ -]?)?soul\s*$|ソウル(?:ミュージック|シンガー|音楽|ジャズ)|(?:ジャズ|ファンク)[・、と/]ソウル/i.test(text);}
export function extractEventDetails(text:string,url:string,checkedAt=new Date().toISOString()):EventDetails{
 const original=text.slice(0,12000),lines=original.normalize('NFKC').split(/\n/).map(s=>s.trim()).filter(Boolean);
 for(let i=0;i<lines.length-1;i++)if(/^(?:OPEN.?START|OPEN|START|開場.?開演)\s*[:：]?$/i.test(lines[i]))lines[i]+=' '+lines[i+1];
 const artists:string[]=[];
 for(let i=0;i<lines.length;i++){
  const heading=lines[i].match(/^(?:LINE\s*UP|MEMBER|出演(?:者)?|出演アーティスト|ACT)(?:\s*[:：]\s*(.*)|\s*)$/i);if(!heading)continue;
  artists.push(...lineupNames(heading[1]||''));
  for(let j=i+1;j<Math.min(i+40,lines.length);j++){
   if(/^(?:TICKET|INFO(?:RMATION)?|CHARGE|DATE|OPEN|START|ADV|DOOR|ATTENTION|UPCOMING|SHOP|FOOD|VJ|予約|※|＜|〈HAIR|【HAIR)/i.test(lines[j]))break;
   if(/^(?:【|\[)/.test(lines[j])&&!/Special Guests?|LIVE|DJ|GUEST|出演/i.test(lines[j]))break;
   artists.push(...lineupNames(lines[j]));
  }break;
 }
 const genres=genreRules.flatMap(([name,re])=>{const evidence=lines.find(line=>{
  const wording=line.replace(/FUJI ROCK(?: FESTIVAL)?|RISING SUN ROCK(?: FESTIVAL)?|PENTAPORT ROCK FESTIVAL|ROCK IN JAPAN/gi,'').replace(/ソウル(?:を拠点|在住|出身|市|に拠点)/g,'');
  if(name==='soul'&&!explicitSoulGenre(wording))return false;
  return re.test(wording)&&!/(?:not |no |without )jazz|ジャズではない/i.test(line);
 });return evidence&&!(name==='blues'&&/トーキングブルース|talking blues/i.test(evidence))?[{name,evidence:evidence.slice(0,300)}]:[];});
 const times=lines.filter(l=>/(?:OPEN|START|開場|開演|営業時間|終演|show).*\d{1,2}[:：]\d{2}/i.test(l)).slice(0,6);
 const prices=lines.filter(l=>/[¥￥]\s*[\d,]+|\d[\d,]*\s*円|入場無料|入場料.*無料/i.test(l)).slice(0,10);
 const feeText=prices.join('\n');const amounts=[...feeText.matchAll(/[¥￥]\s*([\d,]+)|([\d,]+)\s*円/g)].map(m=>Number((m[1]||m[2]).replaceAll(',',''))).filter(n=>n>=0&&n<1000000);
 const extraDrink=/drink|ドリンク|飲食|一品|\+\s*1D\b|要1D/i.test(original),drink=prices.find(l=>/^(?:※\s*)?(?:1\s*drink|ドリンク代)\s*[¥￥]\s*[\d,]+/i.test(l));const drinkAmount=drink?Number(drink.match(/[¥￥]\s*([\d,]+)/)?.[1].replaceAll(',','')):null;
 // Never use a child/advance/starting fare as an all-in budget guarantee. Unknown compulsory extras stay unknown.
 let priceCeiling=amounts.length?Math.max(...amounts):/入場無料|入場料.*無料/.test(original)?0:null;
 if(extraDrink){if(drinkAmount!=null&&priceCeiling!=null)priceCeiling+=drinkAmount;else priceCeiling=null;}
 if(/送料|手数料|fees? extra|別途.*料金/i.test(original))priceCeiling=null;
 const ticketSoldOut=lines.some((line,i)=>/SOLD\s*OUT|完売|売り切れ/i.test(line)&&!/場合|if |when |VIP|先行|先着|early.?bird|物販|グッズ/i.test(line)&&(/^(?:THANK YOU\s*)?SOLD\s*OUT[!！\s]*$/i.test(line)||prices.includes(line)||/^(?:ADV|TICKET|チケット|一般)$/i.test(lines[i-1]||'')));
 const status=/^(?:【|\[)(?:公演中止|開催中止|CANCELLED|CANCELED)(?:】|\])|^(?:公演中止|開催中止|CANCELLED|CANCELED)\s*[!！。]?\s*$/im.test(original)?'cancelled':ticketSoldOut||/^(?:【|\[)?(?:SOLD\s*OUT|完売|売り切れ)(?:】|\])?\s*[!！。]*\s*$/im.test(original)?'sold_out':'unknown';
 return {original,artists:[...new Set(artists)].filter(a=>! /^(?:live|dj|shop|band members|【バンドメンバー】)$/i.test(a)).slice(0,32),genres,times,prices,priceCeiling,status,checkedAt,url};
}



