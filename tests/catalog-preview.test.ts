import test from 'node:test';import assert from 'node:assert/strict';
import {catalogPreview} from '../lib/catalog-preview.ts';
import type {Opportunity} from '../lib/opportunities.ts';
const base={kind:'gig',source:'Official venue',description:'日本語の長い告知',details:{artists:['Artist A'],genres:[{name:'jazz',evidence:'ジャズ'}],original:'Japanese source'}} as Opportunity;
test('translated descriptions take precedence without deleting the Japanese source',()=>{
 const result=catalogPreview({...base,englishDescription:'A jazz trio performs.'});assert.equal(result.text,'A jazz trio performs.');assert.equal(result.original,true);
});
test('available English details become the preview, while failed translations cannot masquerade as English',()=>{
 const result=catalogPreview({...base,details:{...base.details!,english:'A jazz concert.',translation:'translated'}});assert.equal(result.text,'A jazz concert.');
 const failed=catalogPreview({...base,details:{...base.details!,english:'翻訳できません',translation:'unavailable'}});assert.match(failed.text,/Artist A.*jazz/);assert.match(failed.label,/unavailable/);assert.ok(!failed.text.includes('翻訳できません'));
});
test('missing details stay unknown and record listings do not become releases or stock claims',()=>{
 assert.match(catalogPreview({...base,details:undefined}).text,/not been extracted/);
 const result=catalogPreview({...base,kind:'release',source:'pianola records',actionLabel:'Shop listing published'});assert.match(result.text,/not a confirmed release or restock date/);assert.match(result.text,/current stock/);
 assert.equal(catalogPreview({...base,description:'An English description.'}).text,'An English description.');
});
test('cached Japanese role headings and mixing credits are not displayed as performers',()=>{
 const result=catalogPreview({...base,details:{...base.details!,artists:['出演','CHUDAHYE CHAGIS','LITTLE TEMPO','ALL Mixing:']}});assert.ok(result.text.includes('CHUDAHYE CHAGIS · LITTLE TEMPO'));assert.ok(!result.text.includes('出演'));assert.ok(!result.text.includes('ALL Mixing'));
});
