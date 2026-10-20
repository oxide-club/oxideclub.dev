import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import markdownMeetings from '../src/lib/markdown-meetings.mjs';
const processNode = (node) => {
  const plugin = markdownMeetings({
    fileURL: pathToFileURL(
      resolve('.content/meetings/meetings/001-execucao.md'),
    ),
  });
  plugin[node.type](node, {
    setProperty: (target, key, value) => (target[key] = value),
  });
  return node;
};
test('meeting Markdown rejects HTML, unsafe URLs, missing alt and cross-meeting assets', () => {
  assert.throws(
    () => processNode({ type: 'html', value: '<script>bad</script>' }),
    /raw HTML/,
  );
  for (const url of [
    'javascript:alert(1)',
    '//example.org',
    '../assets/002-other/slides.pdf',
    '../assets/001-execucao/../secret.txt',
  ])
    assert.throws(() => processNode({ type: 'link', url }));
  assert.throws(
    () =>
      processNode({ type: 'image', url: 'https://example.org/a.png', alt: '' }),
    /alternative text/,
  );
  assert.equal(
    processNode({ type: 'link', url: './002-other.md#pauta' }).url,
    '/encontros/002-other/#pauta',
  );
  assert.equal(
    processNode({ type: 'link', url: 'https://example.org' }).url,
    'https://example.org',
  );
});
