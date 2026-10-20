import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as content from '../src/lib/content.mjs';
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

test('featured selection handles empty and single-item catalogues', () => {
  assert.equal(content.selectFeatured([]), undefined);
  const only = { featured: false };
  assert.equal(content.selectFeatured([only]), only);
});
test('editorial highlights take priority and all eligible items can be selected', () => {
  const ordinary = { featured: false };
  const first = { featured: true };
  const second = { featured: true };
  assert.equal(
    content.selectFeatured([ordinary, first, second], () => 0),
    first,
  );
  assert.equal(
    content.selectFeatured([ordinary, first, second], () => 0.999),
    second,
  );
  assert.equal(
    content.selectFeatured([ordinary, { featured: false }], () => 0),
    ordinary,
  );
  const last = { featured: false };
  assert.equal(
    content.selectFeatured([ordinary, last], () => 0.999),
    last,
  );
  assert.deepEqual(
    selectPublished([
      { data: { slug: 'one', draft: false, featured: true } },
      { data: { slug: 'two', draft: false, featured: true } },
    ]).map((entry) => entry.data.slug),
    ['one', 'two'],
  );
});
