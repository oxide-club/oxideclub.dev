import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import markdownNotes from '../src/lib/markdown-notes.mjs';
import { pathToFileURL } from 'node:url';

function processNode(node) {
  const plugin = markdownNotes({
    fileURL: pathToFileURL(resolve('.content/notes/example/index.md')),
  });
  plugin[node.type](node, {
    setProperty(target, key, value) {
      target[key] = value;
    },
  });
  return node;
}
test('note Markdown rejects active content and unsafe URL schemes', () => {
  assert.throws(
    () => processNode({ type: 'html', value: '<script>alert(1)</script>' }),
    /raw HTML/,
  );
  for (const url of [
    'javascript:alert(1)',
    'data:text/html,bad',
    '//example.org/file',
    './assets/../secret.txt',
  ]) {
    assert.throws(() => processNode({ type: 'link', url }));
  }
  assert.throws(
    () =>
      processNode({ type: 'image', url: 'https://example.org/a.png', alt: '' }),
    /alternative text/,
  );
  assert.equal(
    processNode({ type: 'link', url: '../another-note/index.md#section' }).url,
    '/notas/another-note/#section',
  );
});
