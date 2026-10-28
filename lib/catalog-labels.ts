import {subjectNames} from './interest-match.ts';
import type {Opportunity} from './opportunities.ts';
// A concise product label, not a replacement for the publisher's full title.
// Known names stay intact. Unmapped variant text stays Japanese rather than being guessed.
const names:Record<string,string>={'ポケットモンスター':'Pokémon','ポケモン':'Pokémon','ミュウ':'Mew','サケブシッポ':'Scream Tail','ヤドン':'Slowpoke','ガラルのすがた':'Galarian form','メタモン':'Ditto','ビクティニ':'Victini','ヒトカゲ':'Charmander','ライチュウ':'Raichu','ハクリュー':'Dragonair','タツベイ':'Bagon','ドラメシヤ':'Dreepy','アチャモ':'Torchic','ヒトモシ':'Litwick','ニャビー':'Litten','ピカチュウ':'Pikachu','びっくり':'surprised','たまファーム収穫祭':'Tama Farm harvest festival'};
export function productLabel(o:Pick<Opportunity,'source'|'title'>){
 if(o.source!=='BANDAI SPIRITS'||!/[\u3040-\u30ff\u3400-\u9fff]/.test(o.title))return null;
 const brand=subjectNames(o)[0];if(!brand)return null;
 const forms:[RegExp,string][]=[[/ぬいぐるみ/,'plush'],[/フィギュア/,'figure'],[/タンブラー/,'tumbler'],[/タオル/,'towel'],[/ショルダーバッグ/,'shoulder bag'],[/ポーチ/,'pouch'],[/クッション/,'cushion'],[/一番くじ/,'in-store lottery']];
 const form=forms.find(([re])=>re.test(o.title));if(!form)return null;
 let variant=o.title.split(/[～〜]/).slice(1).join(' · ').trim();
 for(const [jp,en] of Object.entries(names).sort((a,b)=>b[0].length-a[0].length))variant=variant.replaceAll(jp,en);
 return brand+' · '+form[1]+(variant?' · '+variant.replace(/・/g,', ').replace(/\s*·\s*$/,''):'');
}
type TitleItem=Pick<Opportunity,'title'|'source'|'englishTitle'>&Partial<Pick<Opportunity,'details'|'artists'>>;
function performerLabel(o:TitleItem){
 if(!o.englishTitle||!/[\u3040-\u30ff\u3400-\u9fff]/.test(o.title))return null;
 const clean=(v:string)=>v.replace(/\s*[(（][^()（）]*[)）]\s*$/,'').trim();
 const names=[...new Set([...(o.details?.artists||[]),...(o.artists||[]).flatMap(a=>[a.input,a.name])].map(clean))].filter(n=>n.length>=2&&/[\u3040-\u30ff\u3400-\u9fff]/.test(n)&&o.title.includes(n));
 if(!names.length||names.some(n=>o.englishTitle!.includes(n)))return null;
 // A verified Latin-script artist identity may supply the translated name.
 const latin=(o.artists||[]).map(a=>a.name).filter(n=>!/[\u3040-\u30ff\u3400-\u9fff]/.test(n));
 if(latin.some(n=>o.englishTitle!.toLocaleLowerCase().includes(n.toLocaleLowerCase())))return null;
 let programme=o.title;for(const name of names)programme=programme.replaceAll(name,'');
 programme=programme.replace(/^[\s·・:：/／-]+|[\s·・:：/／-]+$/g,'');
 const formats:Record<string,string>={'ソロピアノ':'Solo piano','ピアノソロ':'Solo piano','ソロ・ピアノ':'Solo piano','ソロライブ':'Solo performance','ソロ・ライブ':'Solo performance'};
 return names.join(' · ')+(programme?' · '+(formats[programme]||programme):'');
}
export const catalogTitle=(o:TitleItem)=>productLabel(o)||performerLabel(o)||o.englishTitle||o.title;
