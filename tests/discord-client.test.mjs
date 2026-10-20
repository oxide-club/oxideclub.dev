import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '../scripts/discord/client.mjs';
import { findRenames } from '../scripts/discord/announcements.mjs';
const webhookUrl = 'https://discord.com/api/webhooks/123/token-secret';
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status });
test('rename discovery accepts SHA comparisons through the real GitHub client', async () => {
  const calls = [];
  const client = createClient({
    token: 'github-secret',
    fetch: async (url, options) => {
      calls.push({ url, options });
      return json({
        status: 'ahead',
        files: [
          {
            status: 'renamed',
            previous_filename: '001-old/index.md',
            filename: '002-new/index.md',
          },
        ],
      });
    },
  });
  for (const repository of ['oxide-club/challenges', 'oxide-club/notes']) {
    assert.deepEqual(
      await findRenames({
        repository,
        before: 'a'.repeat(40),
        after: 'b'.repeat(40),
        github: client.github,
      }),
      [
        {
          type: repository.endsWith('notes') ? 'note' : 'challenge',
          from: '001-old',
          to: '002-new',
        },
      ],
    );
  }
  assert.equal(calls.length, 2);
  for (const [index, repository] of ['challenges', 'notes'].entries()) {
    assert.equal(
      calls[index].url,
      `https://api.github.com/repos/oxide-club/${repository}/compare/${'a'.repeat(40)}...${'b'.repeat(40)}?per_page=100&page=1`,
    );
    assert.equal(
      calls[index].options.headers.Authorization,
      'Bearer github-secret',
    );
    assert.equal(calls[index].options.redirect, 'error');
  }
});
test('comparison support still rejects unsafe GitHub paths before requesting', async () => {
  let requests = 0;
  const client = createClient({
    fetch: async () => {
      requests++;
      return json({});
    },
  });
  for (const path of [
    '/repos/oxide-club/notes/../secrets',
    '/repos/oxide-club/notes/compare/../../secrets',
    `/repos/oxide-club/notes/compare/${'a'.repeat(40)}...${'b'.repeat(40)}/../secrets`,
    `/repos/other/notes/compare/${'a'.repeat(40)}...${'b'.repeat(40)}`,
    '/repos/oxide-club/notes/contents/..hidden',
    '/repos/oxide-club/notes/contents/\\secrets',
    '/repos/oxide-club/notes/contents/secret\n',
  ])
    await assert.rejects(client.github(path), /Invalid GitHub path/);
  assert.equal(requests, 0);
});
test('webhook confirmation, credentials isolation and disabled mentions', async () => {
  let request;
  const client = createClient({
    token: 'github-secret',
    webhookUrl,
    fetch: async (url, options) => {
      request = { url, ...options };
      return json({ id: '456' });
    },
  });
  assert.deepEqual(
    await client.send({
      content: '@everyone',
      allowed_mentions: { parse: ['everyone'] },
    }),
    { id: '456' },
  );
  assert.equal(new URL(request.url).searchParams.get('wait'), 'true');
  assert.equal(request.headers.Authorization, undefined);
  assert.deepEqual(JSON.parse(request.body).allowed_mentions, { parse: [] });
  assert.equal(request.redirect, 'error');
});
test('paginates 101 files without trusting remote next links', async () => {
  const calls = [];
  const client = createClient({
    token: 'x',
    fetch: async (url) => {
      calls.push(url);
      return json(
        new URL(url).searchParams.get('page') === '1'
          ? Array(100).fill({ filename: 'a' })
          : [{ filename: 'last' }],
      );
    },
  });
  const files = await client.paginate('/repos/oxide-club/notes/pulls/1/files');
  assert.equal(files.length, 101);
  assert.equal(new URL(calls[1]).searchParams.get('page'), '2');
  await assert.rejects(client.github('https://evil.test/'), /GitHub path/);
});
test('rate limits wait but ambiguous POSTs never retry or expose secrets', async () => {
  const waits = [];
  let calls = 0;
  const client = createClient({
    webhookUrl,
    sleep: async (ms) => waits.push(ms),
    fetch: async () =>
      ++calls === 1 ? json({ retry_after: 0.25 }, 429) : json({ id: '7' }),
  });
  await client.send({ content: 'ok' });
  assert.deepEqual(waits, [250]);
  for (const response of [
    () => json({}, 500),
    () => {
      throw new Error(webhookUrl);
    },
    () => json({}),
  ]) {
    let attempts = 0;
    const broken = createClient({
      webhookUrl,
      fetch: async () => {
        attempts++;
        return response();
      },
    });
    await assert.rejects(
      broken.send({ content: 'x' }),
      (e) => !e.message.includes('token-secret'),
    );
    assert.equal(attempts, 1);
  }
});
test('rejects unsafe webhook destinations and bounds rate-limit retries', async () => {
  for (const url of [
    'http://discord.com/api/webhooks/1/x',
    'https://discord.com.evil.test/api/webhooks/1/x',
    'https://user:pw@discord.com/api/webhooks/1/x',
  ]) {
    await assert.rejects(createClient({ webhookUrl: url }).send({}), /webhook/);
  }
  let calls = 0;
  await assert.rejects(
    createClient({
      webhookUrl,
      sleep: async () => {},
      fetch: async () => {
        calls++;
        return json({ retry_after: 1 }, 429);
      },
    }).send({}),
    /429/,
  );
  assert.equal(calls, 3);
});
test('paginates the jobs envelope used for production recovery', async () => {
  const client = createClient({
    fetch: async () =>
      json({
        total_count: 1,
        jobs: [{ name: 'deploy', conclusion: 'success' }],
      }),
  });
  assert.deepEqual(
    await client.paginate(
      '/repos/oxide-club/oxideclub.dev/actions/runs/12/jobs',
      'jobs',
    ),
    [{ name: 'deploy', conclusion: 'success' }],
  );
});
