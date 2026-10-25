import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createManifest,
  publicationUrl,
  validateManifest,
} from '../src/lib/publication-manifest.mjs';
import {
  announce,
  initialize,
  reconcileDelivery,
} from '../scripts/discord/announcements.mjs';
import { memoryClient } from './helpers/discord-api.mjs';

const repository = 'oxide-club/oxideclub.dev';
const revisions = {
  challenges: 'a'.repeat(40),
  notes: 'b'.repeat(40),
  labs: 'c'.repeat(40),
};
const lab = (id = '005-cache-lab', draft = false) => ({
  id,
  data: {
    title: 'Cache e localidade',
    summary: 'Investigue os acessos à memória.',
    draft,
  },
});
const manifest = (labs = [lab()], snapshot = revisions) =>
  createManifest({
    labs,
    revisions: snapshot,
    production: true,
  });
const args = (api, data) => ({
  client: api.client,
  repository,
  manifest: data,
  fetchPublished: async (url) =>
    Response.json(url.endsWith('/publication-manifest.json') ? data : {}),
  sleep: async () => {},
});

test('lab manifest includes published labs, canonical URLs and their production revision', () => {
  const data = manifest([lab(), lab('006-draft', true)]);
  assert.deepEqual(data.entries, [
    {
      type: 'lab',
      id: '005-cache-lab',
      title: 'Cache e localidade',
      summary: 'Investigue os acessos à memória.',
      url: 'https://oxideclub.dev/labs/005-cache-lab',
    },
  ]);
  for (const id of [
    'cache',
    '05-cache',
    '0005-cache',
    '../cache',
    '005-Cache',
    'docs',
  ])
    assert.throws(() => publicationUrl('lab', id), /identifier/);
  assert.throws(() => manifest([lab(), lab()]), /Duplicate/);
  for (const labs of [undefined, '', 'bad'])
    assert.throws(
      () => validateManifest({ ...data, revisions: { ...revisions, labs } }),
      /revision/,
    );
});

test('legacy baseline announces unrecorded labs once and preserves previous history', async () => {
  const { labs, ...legacy } = revisions;
  const old = { baseline: true, url: 'https://oxideclub.dev/notas/memoria' };
  const api = memoryClient({
    revisions: legacy,
    records: { 'note:memoria': old },
  });
  const data = manifest();
  await announce(args(api, data));
  assert.equal(api.messages.length, 1);
  assert.equal(
    api.messages[0].content,
    'Novo laboratório no Oxide Club: https://oxideclub.dev/labs/005-cache-lab',
  );
  assert.equal(
    api.messages[0].embeds[0].url,
    'https://oxideclub.dev/labs/005-cache-lab',
  );
  assert.deepEqual(api.state().records['note:memoria'], old);
  assert.equal(api.state().revisions.labs, labs);
  assert.equal(api.state().records['lab:005-cache-lab'].messageId, '101');
  await announce(args(api, data));
  await announce(args(api, manifest([])));
  await announce(args(api, data));
  assert.equal(api.messages.length, 1);
});

test('explicit first baseline is silent and a draft announces only when published', async () => {
  const api = memoryClient({ initialized: false });
  await initialize(args(api, manifest([lab(), lab('006-pipes', true)])));
  assert.equal(api.messages.length, 0);
  assert.equal(api.state().records['lab:005-cache-lab'].baseline, true);
  assert.equal(api.state().records['lab:006-pipes'], undefined);
  await announce(args(api, manifest([lab(), lab('006-pipes')])));
  assert.equal(api.messages.length, 1);
  assert.equal(
    api.messages[0].embeds[0].url,
    'https://oxideclub.dev/labs/006-pipes',
  );
});

test('lab renames compare the stored snapshot and alias the original announcement', async () => {
  const api = memoryClient({
    revisions,
    records: {
      'lab:005-cache-lab': {
        messageId: '123',
        url: 'https://oxideclub.dev/labs/005-cache-lab',
      },
    },
  });
  const github = api.client.github;
  const calls = [];
  api.client.github = async (path, options) => {
    if (path.includes('/compare/')) {
      calls.push(path);
      return {
        status: 'ahead',
        files: [
          {
            status: 'renamed',
            previous_filename: '005-cache-lab/index.md',
            filename: '005-localidade/index.md',
          },
          {
            status: 'renamed',
            previous_filename: 'bad/index.md',
            filename: '006-bad/index.md',
          },
          {
            status: 'renamed',
            previous_filename: '005-cache-lab/materials/a.c',
            filename: '005-localidade/materials/a.c',
          },
        ],
      };
    }
    return github(path, options);
  };
  await announce(
    args(
      api,
      manifest([lab('005-localidade')], { ...revisions, labs: 'd'.repeat(40) }),
    ),
  );
  assert.deepEqual(calls, [
    `/repos/oxide-club/labs/compare/${'c'.repeat(40)}...${'d'.repeat(40)}?per_page=100&page=1`,
  ]);
  assert.equal(api.messages.length, 0);
  assert.equal(
    api.state().records['lab:005-localidade'].aliasOf,
    'lab:005-cache-lab',
  );
});

test('failed lab delivery stays pending until recorded or explicitly released', async () => {
  for (const release of [false, true]) {
    const api = memoryClient({
      revisions,
      sendError: new Error('Lost confirmation'),
    });
    await assert.rejects(announce(args(api, manifest())), /Lost confirmation/);
    await assert.rejects(announce(args(api, manifest())), /Pending/);
    assert.equal(api.messages.length, 1);
    await reconcileDelivery({
      client: api.client,
      repository,
      key: 'lab:005-cache-lab',
      messageId: '101',
      release,
    });
    if (release)
      assert.equal(api.state().records['lab:005-cache-lab'], undefined);
    else {
      await announce(args(api, manifest()));
      assert.equal(api.messages.length, 1);
      assert.equal(api.state().records['lab:005-cache-lab'].messageId, '101');
    }
  }
});

test('unavailable lab page blocks migration and sends no announcements', async () => {
  const { labs, ...legacy } = revisions;
  const api = memoryClient({ revisions: legacy });
  const data = manifest();
  await assert.rejects(
    announce({
      ...args(api, data),
      fetchPublished: async (url) =>
        url.includes('manifest')
          ? Response.json(data)
          : new Response('', { status: 404 }),
    }),
    /production/,
  );
  assert.equal(api.messages.length, 0);
  assert.deepEqual(api.state().revisions, legacy);
});

test('malformed or lost lab history is not treated as a legacy migration', async () => {
  for (const labs of ['', 'bad']) {
    const api = memoryClient({ revisions: { ...revisions, labs } });
    await assert.rejects(announce(args(api, manifest())), /revision/);
    assert.equal(api.messages.length, 0);
  }
  const { labs, ...legacy } = revisions;
  const api = memoryClient({
    revisions: legacy,
    records: {
      'lab:005-old': {
        url: 'https://oxideclub.dev/labs/005-old',
        messageId: '123',
      },
    },
  });
  await assert.rejects(announce(args(api, manifest())), /history/);
  assert.equal(api.messages.length, 0);
});
