import test from 'node:test';
import assert from 'node:assert/strict';
import {englishPrice} from '../lib/event-english.ts';
test('remaining official price labels translate without changing amounts or eligibility',()=>{
 assert.equal(englishPrice('頒布価格¥16,500(税込)'),'Selling price ¥16,500(tax included)');
 assert.equal(englishPrice('一般/インバウンド ¥4,500(税込・ドリンク代別) 18歳以下チケット ¥1,000(税込・ドリンク代別)'),'General / international ¥4,500(tax included・drink charge extra) Age 18 and under ticket ¥1,000(tax included・drink charge extra)');
});
