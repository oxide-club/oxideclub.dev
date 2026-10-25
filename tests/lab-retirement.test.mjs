import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as catalogue from '../src/lib/lab-catalogue.mjs';
import { validateLabRelations } from '../src/lib/lab-structure.mjs';
const retired = {
  id: '004-arena',
  data: { draft: false, supersededBy: '017-arena' },
};
const active = {
  id: '001-cache',
  data: { draft: false, relatedLabs: ['004-arena'] },
};
const challenge = { id: '017-arena', data: { draft: false } };
test('active catalogue omits retired labs and drafts without mutating archival entries', () => {
  const entries = [retired, active, { id: '002-draft', data: { draft: true } }];
  assert.deepEqual(catalogue.activeLabs(entries), [active]);
  assert.equal(entries.length, 3);
});
test('retirement requires a published challenge while old lab references remain valid', () => {
  assert.doesNotThrow(() =>
    validateLabRelations([active, retired], [challenge]),
  );
  for (const challenges of [[], [{ ...challenge, data: { draft: true } }]])
    assert.throws(
      () => validateLabRelations([retired], challenges),
      /supersededBy/,
    );
  assert.throws(
    () => validateLabRelations([retired], [retired]),
    /supersededBy/,
  );
});
