import { test } from 'node:test';
import assert from 'node:assert/strict';
import { labUrl, labAssetUrl } from '../src/lib/lab-urls.mjs';
test('lab URLs preserve canonical accented route and reject unsafe identifiers', () => {
  assert.equal(labUrl('005-cache'), '/laboratórios/005-cache/');
  assert.equal(
    labAssetUrl('005-cache', 'materials/trace.txt'),
    '/laboratórios/005-cache/assets/materials/trace.txt',
  );
  assert.throws(() => labUrl('../escape'));
  assert.throws(() => labAssetUrl('005-cache', '%2fetc'));
});
