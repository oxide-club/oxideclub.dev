import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { verifyDeployment } from '../scripts/verify-deployment.mjs';

async function fixture(t) {
  const dist = await mkdtemp(join(tmpdir(), 'oxide-postdeploy-'));
  t.after(() => rm(dist, { recursive: true, force: true }));
  const files = {
    'index.html': '<html>Publicado</html>',
    '404.html': '<html>Não encontrado</html>',
    'publication-manifest.json': JSON.stringify({ production: true }),
    'sitemap-index.xml': '<sitemapindex>Publicado</sitemapindex>',
    'sitemap-0.xml': '<urlset>Publicado</urlset>',
    'desafios/index.html': '<html>Desafios</html>',
    'desafios/001-wc/index.html': '<html>wc</html>',
    'labs/index.html': '<html>Laboratórios</html>',
    'labs/005-cache-lab/index.html': '<html>Cache</html>',
    'labs/005-cache-lab/materiais.zip': Buffer.from([80, 75, 3, 4, 0, 255]),
  };
  const responses = new Map();
  for (const [file, body] of Object.entries(files)) {
    await mkdir(join(dist, file, '..'), { recursive: true });
    await writeFile(join(dist, file), body);
    responses.set('/' + file.replace(/index\.html$/, ''), {
      status: 200,
      body,
    });
  }
  const hits = [];
  const server = createServer((req, res) => {
    hits.push(req.url);
    const response = responses.get(req.url) ?? {
      status: 404,
      body: files['404.html'],
    };
    if (response.hang) return;
    res.writeHead(response.status);
    res.end(response.body);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => {
    server.closeAllConnections();
    return new Promise((resolve) => server.close(resolve));
  });
  return {
    dist,
    responses,
    hits,
    origin: `http://127.0.0.1:${server.address().port}`,
  };
}

const options = { attempts: 1, retryDelayMs: 0, timeoutMs: 1000, log() {} };

test('checks published bytes, sitemap children, representative pages, ZIP and a real 404', async (t) => {
  const f = await fixture(t);
  await verifyDeployment({ ...f, ...options });
  for (const path of [
    '/',
    '/sitemap-index.xml',
    '/sitemap-0.xml',
    '/publication-manifest.json',
    '/desafios/001-wc/',
    '/labs/005-cache-lab/',
    '/labs/005-cache-lab/materiais.zip',
  ])
    assert.ok(f.hits.includes(path), path);
  assert.ok(f.hits.some((path) => !f.responses.has(path)));
});

for (const [name, path, response] of [
  ['stale HTML', '/', { status: 200, body: '<html>Anterior</html>' }],
  ['stale manifest', '/publication-manifest.json', { status: 200, body: '{}' }],
  [
    'HTML fallback for ZIP',
    '/labs/005-cache-lab/materiais.zip',
    { status: 200, body: '<html>Fallback</html>' },
  ],
  ['missing sitemap', '/sitemap-0.xml', { status: 404, body: '' }],
  ['redirect', '/', { status: 302, body: '' }],
  ['oversized response', '/', { status: 200, body: 'x'.repeat(10000) }],
  ['timeout', '/', { hang: true }],
])
  test(`rejects ${name}`, async (t) => {
    const f = await fixture(t);
    f.responses.set(path, response);
    await assert.rejects(
      verifyDeployment({ ...f, ...options, timeoutMs: 100 }),
      /Verificação pós-deploy falhou/,
    );
  });

test('retries only failed requests and succeeds after propagation', async (t) => {
  const f = await fixture(t);
  const current = f.responses.get('/');
  f.responses.set('/', { status: 503, body: '' });
  await verifyDeployment({
    ...f,
    ...options,
    attempts: 2,
    sleep: async () => {
      f.responses.set('/', current);
    },
  });
  assert.equal(f.hits.filter((path) => path === '/').length, 2);
  assert.equal(f.hits.filter((path) => path === '/sitemap-0.xml').length, 1);
});

test('persistent failures exhaust the retry budget', async (t) => {
  const f = await fixture(t);
  f.responses.set('/', { status: 503, body: '' });
  await assert.rejects(
    verifyDeployment({ ...f, ...options, attempts: 2 }),
    /Verificação pós-deploy falhou/,
  );
  assert.equal(f.hits.filter((path) => path === '/').length, 2);
});

test('rejects a soft 404 even when its body is the expected error page', async (t) => {
  const f = await fixture(t);
  f.responses.get = (path) =>
    Map.prototype.get.call(f.responses, path) ?? {
      status: 200,
      body: '<html>Não encontrado</html>',
    };
  await assert.rejects(
    verifyDeployment({ ...f, ...options }),
    /Verificação pós-deploy falhou/,
  );
});

test('empty collections verify their catalogues without inventing item URLs', async (t) => {
  const f = await fixture(t);
  await rm(join(f.dist, 'desafios/001-wc'), { recursive: true });
  await rm(join(f.dist, 'labs/005-cache-lab'), { recursive: true });
  await verifyDeployment({ ...f, ...options });
  assert.ok(f.hits.includes('/labs/'));
  assert.ok(f.hits.includes('/desafios/'));
  assert.ok(!f.hits.some((path) => path.includes('/005-cache-lab/')));
});

test('rejects preview output before contacting production', async (t) => {
  const f = await fixture(t);
  await writeFile(
    join(f.dist, 'publication-manifest.json'),
    '{"production":false}',
  );
  await assert.rejects(
    verifyDeployment({ ...f, ...options }),
    /build de produção/,
  );
  assert.equal(f.hits.length, 0);
});

test('CLI exits unsuccessfully for missing build output', async () => {
  await assert.rejects(
    promisify(execFile)(process.execPath, [
      'scripts/verify-deployment.mjs',
      '/tmp/oxide-nonexistent-build-for-test',
    ]),
    (error) => error.code === 1,
  );
});
