import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  announce,
  initialize,
  verifyPublished,
  findRenames,
  reconcileDelivery,
  verifyDeploymentRun,
} from '../scripts/discord/announcements.mjs';
import { createManifest } from '../src/lib/publication-manifest.mjs';
import { memoryClient } from './helpers/discord-api.mjs';
const repository = 'oxide-club/oxideclub.dev';
const revisions = {
  challenges: 'a'.repeat(40),
  notes: 'b'.repeat(40),
  labs: 'e'.repeat(40),
};
const manifest = (ids = ['memoria']) =>
  createManifest({
    notes: ids.map((id) => ({
      id,
      data: { title: `Nota ${id}`, summary: 'Uma explicação.' },
    })),
    revisions,
    production: true,
  });
const published = (data) => async (url) =>
  new Response(
    JSON.stringify(url.includes('publication-manifest.json') ? data : {}),
    { status: 200 },
  );
const args = (api, data) => ({
  client: api.client,
  repository,
  manifest: data,
  fetchPublished: published(data),
  sleep: async () => {},
});
test('explicit baseline records existing catalogue silently and refuses repeated initialization', async () => {
  const api = memoryClient({ initialized: false });
  const data = manifest();
  await initialize(args(api, data));
  assert.equal(api.messages.length, 0);
  assert.equal(api.state().records['note:memoria'].baseline, true);
  await assert.rejects(initialize(args(api, data)), /already initialized/);
});
test('new publications point to the website and unchanged or restored IDs remain silent', async () => {
  const api = memoryClient({ revisions });
  const data = manifest();
  await announce(args(api, data));
  await announce(args(api, data));
  assert.equal(api.messages.length, 1);
  assert.equal(
    api.messages[0].embeds[0].url,
    'https://oxideclub.dev/notas/memoria',
  );
  assert.match(
    api.messages[0].content,
    /https:\/\/oxideclub.dev\/notas\/memoria/,
  );
  assert.equal(api.state().records['note:memoria'].messageId, '101');
  await announce(args(api, manifest([])));
  await announce(args(api, data));
  assert.equal(api.messages.length, 1);
});
test('missing baseline and pending partial delivery prevent automatic duplicates', async () => {
  const fresh = memoryClient({ initialized: false });
  await assert.rejects(announce(args(fresh, manifest())), /baseline/);
  const api = memoryClient({
    revisions,
    sendError: new Error('Lost confirmation'),
  });
  await assert.rejects(announce(args(api, manifest(['alpha', 'beta']))));
  assert.equal(api.state().records['note:alpha'].pending, true);
  await assert.rejects(
    announce(args(api, manifest(['alpha', 'beta']))),
    /Pending/,
  );
  assert.equal(api.messages.length, 1);
  await reconcileDelivery({
    client: api.client,
    repository,
    key: 'note:alpha',
    messageId: '101',
  });
  assert.equal(api.state().records['note:alpha'].pending, undefined);
});
test('manual release only clears a pending attempt; confirmed records cannot be erased', async () => {
  const api = memoryClient({
    records: {
      'note:memoria': {
        url: 'https://oxideclub.dev/notas/memoria',
        pending: true,
      },
    },
  });
  await reconcileDelivery({
    client: api.client,
    repository,
    key: 'note:memoria',
    release: true,
  });
  assert.equal(api.state().records['note:memoria'], undefined);
  await assert.rejects(
    reconcileDelivery({
      client: api.client,
      repository,
      key: 'note:missing',
      messageId: '12',
    }),
    /pending/,
  );
});
test('renames alias a published ID and do not send another announcement', async () => {
  const api = memoryClient({
    revisions,
    records: {
      'note:old': { baseline: true, url: 'https://oxideclub.dev/notas/old' },
    },
  });
  await announce({
    ...args(api, manifest(['new'])),
    renames: [{ type: 'note', from: 'old', to: 'new' }],
  });
  assert.equal(api.messages.length, 0);
  assert.equal(api.state().records['note:new'].aliasOf, 'note:old');
});
test('stale manifest and inaccessible pages block sending, bounded propagation can recover', async () => {
  const data = manifest();
  let calls = 0;
  const waits = [];
  await verifyPublished(data, {
    fetchPublished: async (url) => {
      calls++;
      return calls === 1 ? new Response('{}') : published(data)(url);
    },
    sleep: async (ms) => waits.push(ms),
  });
  assert.deepEqual(waits, [10000]);
  for (const fetchPublished of [
    async () => new Response('{}'),
    async (url) =>
      url.includes('manifest')
        ? published(data)(url)
        : new Response('', { status: 404 }),
    async (url) =>
      url.includes('manifest')
        ? published(data)(url)
        : new Response('', {
            status: 302,
            headers: { location: 'https://evil.test/' },
          }),
  ]) {
    const api = memoryClient({ revisions });
    let attempts = 0;
    await assert.rejects(
      announce({
        ...args(api, data),
        fetchPublished: async (...a) => {
          attempts++;
          return fetchPublished(...a);
        },
      }),
      /production/,
    );
    assert.equal(api.messages.length, 0);
    assert.ok(attempts <= 12);
  }
});
test('GitHub compare detects canonical renames and rejects incomplete or stale history', async () => {
  const rename = {
    filename: 'new/index.md',
    previous_filename: 'old/index.md',
    status: 'renamed',
  };
  const common = {
    repository: 'oxide-club/notes',
    before: 'a'.repeat(40),
    after: 'b'.repeat(40),
  };
  assert.deepEqual(
    await findRenames({
      ...common,
      github: async () => ({ status: 'ahead', files: [rename] }),
    }),
    [{ type: 'note', from: 'old', to: 'new' }],
  );
  for (const data of [
    { status: 'behind', files: [] },
    { status: 'ahead', files: Array(300).fill(rename) },
  ])
    await assert.rejects(
      findRenames({ ...common, github: async () => data }),
      /history/,
    );
});
test('manual recovery only accepts a trusted completed production deploy job', async () => {
  const run = {
    id: 123,
    head_branch: 'main',
    path: '.github/workflows/deploy.yml',
    status: 'completed',
    conclusion: 'failure',
    repository: { full_name: repository },
  };
  const client = {
    github: async () => run,
    paginate: async () => [{ name: 'deploy', conclusion: 'success' }],
  };
  await verifyDeploymentRun(client, '123');
  await assert.rejects(
    verifyDeploymentRun(
      { ...client, github: async () => ({ ...run, head_branch: 'evil' }) },
      '123',
    ),
  );
  await assert.rejects(
    verifyDeploymentRun(
      {
        ...client,
        paginate: async () => [{ name: 'deploy', conclusion: 'failure' }],
      },
      '123',
    ),
  );
});
test('partial send followed by a later rename preserves the verified snapshot and never repeats a confirmed publication', async () => {
  const initial = {
    challenges: 'a'.repeat(40),
    notes: 'b'.repeat(40),
    labs: 'e'.repeat(40),
  };
  const second = {
    challenges: 'a'.repeat(40),
    notes: 'c'.repeat(40),
    labs: 'e'.repeat(40),
  };
  const third = {
    challenges: 'a'.repeat(40),
    notes: 'd'.repeat(40),
    labs: 'e'.repeat(40),
  };
  const api = memoryClient({ revisions: initial });
  const baseGithub = api.client.github;
  api.client.github = async (path, options) => {
    if (path.includes('/compare/')) {
      const wasSecond = path.includes('c'.repeat(40) + '...');
      return {
        status: 'ahead',
        files: wasSecond
          ? [
              {
                status: 'renamed',
                previous_filename: 'alpha/index.md',
                filename: 'gamma/index.md',
              },
            ]
          : [{ status: 'added', filename: 'gamma/index.md' }],
      };
    }
    return baseGithub(path, options);
  };
  const baseSend = api.client.send;
  api.client.send = async (payload) => {
    const result = await baseSend(payload);
    if (payload.embeds[0].title === 'Nota beta')
      throw new Error('Lost response after partial send');
    return result;
  };
  const b = { ...manifest(['alpha', 'beta']), revisions: second };
  await assert.rejects(announce(args(api, b)));
  await reconcileDelivery({
    client: api.client,
    repository,
    key: 'note:beta',
    messageId: '102',
  });
  api.client.send = baseSend;
  const c = { ...manifest(['beta', 'gamma']), revisions: third };
  await announce(args(api, c));
  assert.equal(
    api.messages.length,
    2,
    'gamma must alias the confirmed alpha announcement',
  );
  assert.equal(api.state().records['note:gamma'].aliasOf, 'note:alpha');
});
