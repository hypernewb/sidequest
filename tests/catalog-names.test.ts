import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogTitle} from '../lib/catalog-labels.ts';
import type {Opportunity} from '../lib/opportunities.ts';

test('a machine translation cannot turn a source-credited performer name into ordinary words',()=>{
 const item={source:'Cotton Club',title:'魚返明未 ソロピアノ',englishTitle:'Fish return bright not solo piano',details:{artists:['魚返明未 (p)']}} as Opportunity;
 assert.equal(catalogTitle(item),'魚返明未 · Solo piano');
});

test('a verified Latin-script artist name permits its English title, while unrelated lineups do not rewrite titles',()=>{
 const item={source:'Cotton Club',title:'魚返明未 ソロピアノ',englishTitle:'Akira Uogaeri solo piano',artists:[{input:'魚返明未',name:'Akira Uogaeri'}]} as Opportunity;
 assert.equal(catalogTitle(item),'Akira Uogaeri solo piano');
 assert.equal(catalogTitle({...item,title:'秋のジャズ祭',englishTitle:'Autumn jazz festival'}),'Autumn jazz festival');
});
