import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectPublished, validateLinks } from '../src/lib/content.mjs';

test('drafts are excluded without requiring an editorial highlight', () => {
  const live = { data: { slug: 'wc', draft: false, featured: true } };
  assert.deepEqual(
    selectPublished([
      live,
      { data: { slug: 'secret', draft: true, featured: true } },
    ]),
    [live],
  );
  assert.deepEqual(selectPublished([]), []);
  assert.deepEqual(
    selectPublished([{ data: { slug: 'other', draft: false } }]),
    [{ data: { slug: 'other', draft: false } }],
  );
  assert.throws(() => selectPublished([live, live]), /slug|featured/);
});
test('external destinations reject unsafe protocols and unrelated Discord hosts', () => {
  assert.throws(() => validateLinks({ discord: 'javascript:alert(1)' }));
  assert.throws(() =>
    validateLinks({ discord: 'https://discord.gg.evil.test/test' }),
  );
  assert.doesNotThrow(() =>
    validateLinks({ discord: null, github: null, reporting: null }),
  );
  assert.doesNotThrow(() =>
    validateLinks({
      discord: 'https://discord.gg/example',
      github: 'https://github.com/example',
      reporting: 'mailto:moderation@example.org',
    }),
  );
});
