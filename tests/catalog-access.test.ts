import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogWriteAllowed} from '../lib/catalog-access.ts';

test('public catalog maintenance fails closed while source-generated translations remain available', () => {
  const anonymous = new Request('https://sidequest.example/api/catalog');
  for (const action of ['import', 'translate', 'refresh', 'expand', 'enrich', 'enrich_music', 'refresh_independent']) {
    assert.equal(catalogWriteAllowed(anonymous, action, 'secret'), false);
    assert.equal(catalogWriteAllowed(new Request(anonymous, {headers: {'X-SideQuest-Catalog-Key': 'wrong!'}}), action, 'secret'), false);
  }
  assert.equal(catalogWriteAllowed(anonymous, 'translate_titles'), true);
  assert.equal(catalogWriteAllowed(anonymous, 'translate_preview'), true);
  const service = new Request(anonymous, {headers: {'X-SideQuest-Catalog-Key': 'secret'}});
  assert.equal(catalogWriteAllowed(service, 'refresh', 'secret'), true);
  assert.equal(catalogWriteAllowed(service, 'import'), false);
});
