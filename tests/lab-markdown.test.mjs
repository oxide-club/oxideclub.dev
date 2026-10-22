import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markdownToHtml } from 'satteri';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import markdownLabs from '../src/lib/markdown-labs.mjs';
import {
  labSections,
  validateLabRelations,
} from '../src/lib/lab-structure.mjs';
const document = () =>
  labSections.map((s) => '## ' + s + '\n\nTexto.').join('\n\n');
const compile = async (source) =>
  markdownToHtml(source, {
    fileURL: pathToFileURL(resolve('.content/labs/005-cache/index.md')),
    mdastPlugins: [markdownLabs],
  });
test('lab structure is read from Markdown nodes, not code examples', async () => {
  await compile(document() + '\n\n```md\n## Fake\n```');
  await assert.rejects(
    compile(document().replace('## Materiais', '### Materiais')),
    /sections/,
  );
  await assert.rejects(compile(document() + '\n\n## Materiais'), /sections/);
  await assert.rejects(
    compile(document() + '\n\n<script>alert(1)</script>'),
    /HTML/,
  );
  await compile(
    document() +
      '\n\n<details>\n<summary>Conferir</summary>\n\nResultado\n\n</details>',
  );
  await assert.rejects(
    compile(document() + '\n\n<details><summary></summary></details>'),
    /summary/,
  );
  await assert.rejects(
    compile(document() + '\n\n[escape](materials/%2e%2e/secret.txt)'),
    /Unsafe/,
  );
});
test('relations cannot link to missing or unpublished activities', () => {
  const lab = {
    id: '005-cache',
    data: { relatedLabs: ['006-other'], relatedChallenges: [] },
  };
  assert.throws(() => validateLabRelations([lab], []), /006-other/);
  assert.doesNotThrow(() =>
    validateLabRelations(
      [
        lab,
        { id: '006-other', data: { relatedLabs: [], relatedChallenges: [] } },
      ],
      [],
    ),
  );
});
