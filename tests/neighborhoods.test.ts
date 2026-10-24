import test from 'node:test';
import assert from 'node:assert/strict';
import {neighborhood,sameNeighborhood} from '../lib/neighborhoods.ts';
test('the named districts use coordinates, not stale catalog area labels',()=>{
 assert.equal(neighborhood(35.66324,139.66926)?.id,'shimokitazawa');
 assert.equal(neighborhood(35.66661,139.69240)?.id,'shibuya');
 assert.equal(neighborhood(35.68299,139.68683)?.id,'shinjuku');
 assert.equal(neighborhood(35.72177,139.77049)?.id,'yanaka');
 assert.equal(neighborhood(NaN,139.7),null);
 assert.equal(sameNeighborhood([{lat:35.66661,lon:139.69240},{lat:35.66324,lon:139.66926}]),false);
 assert.equal(sameNeighborhood([{lat:35.6576,lon:139.6988},{lat:35.66378,lon:139.70246}]),true);
});
