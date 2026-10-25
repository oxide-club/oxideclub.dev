import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

async function deploymentChecks(dist, log) {
  const manifest = JSON.parse(
    await readFile(join(dist, 'publication-manifest.json'), 'utf8'),
  );
  if (manifest.production !== true)
    throw new Error('A verificação exige um build de produção em dist/.');
  const files = [
    'index.html',
    'publication-manifest.json',
    'desafios/index.html',
    'labs/index.html',
  ];
  const sitemaps = (await readdir(dist))
    .filter((name) => /^sitemap.*\.xml$/.test(name))
    .sort();
  if (!sitemaps.includes('sitemap-index.xml') || sitemaps.length < 2)
    throw new Error('Sitemap de produção ausente ou incompleto.');
  files.push(...sitemaps);
  for (const collection of ['desafios', 'labs']) {
    const ids = (await readdir(join(dist, collection), { withFileTypes: true }))
      .filter((entry) => entry.isDirectory() && /^\d{3}-/.test(entry.name))
      .map((entry) => entry.name)
      .sort();
    if (!ids.length) {
      log(
        `[postdeploy] ${collection}: nenhum item publicado; catálogo será verificado.`,
      );
      continue;
    }
    files.push(`${collection}/${ids[0]}/index.html`);
    if (collection === 'labs')
      files.push(`${collection}/${ids[0]}/materiais.zip`);
  }
  const checks = await Promise.all(
    files.map(async (file) => ({
      path:
        '/' +
        file
          .split('/')
          .map(encodeURIComponent)
          .join('/')
          .replace(/index\.html$/, ''),
      status: 200,
      expected: await readFile(join(dist, file)),
    })),
  );
  checks.push({
    path: `/__oxide-postdeploy-${randomUUID()}/`,
    status: 404,
    expected: await readFile(join(dist, '404.html')),
  });
  return checks;
}

async function checkResponse(origin, check, timeoutMs) {
  const response = await fetch(new URL(check.path, origin), {
    redirect: 'manual',
    headers: {
      'Cache-Control': 'no-cache',
      'User-Agent': 'OxideClub-Postdeploy/1.0',
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (response.status !== check.status) {
    await response.body?.cancel();
    throw new Error(`HTTP ${response.status}; esperado ${check.status}`);
  }
  // Bound response memory and compare decoded HTTP bytes, including ZIP content.
  let offset = 0;
  if (response.body)
    for await (const part of response.body) {
      const chunk = Buffer.from(part);
      if (!chunk.equals(check.expected.subarray(offset, offset + chunk.length)))
        throw new Error('Conteúdo diferente do build publicado');
      offset += chunk.length;
    }
  if (offset !== check.expected.length) throw new Error('Resposta incompleta');
}

export async function verifyDeployment({
  dist = resolve('dist'),
  origin = 'https://oxideclub.dev',
  attempts = 4,
  retryDelayMs = 5000,
  timeoutMs = 10000,
  sleep = delay,
  log = console.log,
} = {}) {
  if (!Number.isInteger(attempts) || attempts < 1)
    throw new Error('Número de tentativas inválido');
  let pending = await deploymentChecks(dist, log);
  const total = pending.length;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const results = await Promise.all(
      pending.map(async (check) => {
        try {
          await checkResponse(origin, check, timeoutMs);
          log(`[postdeploy] OK ${check.path}`);
          return null;
        } catch (error) {
          log(
            `[postdeploy] tentativa ${attempt}/${attempts}: ${check.path}: ${error.message}`,
          );
          return check;
        }
      }),
    );
    pending = results.filter(Boolean);
    if (!pending.length) {
      log(`[postdeploy] ${total} verificações aprovadas.`);
      return;
    }
    if (attempt < attempts) await sleep(retryDelayMs);
  }
  throw new Error(
    `Verificação pós-deploy falhou: ${pending.map((check) => check.path).join(', ')}`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    await verifyDeployment({ dist: resolve(process.argv[2] || 'dist') });
  } catch (error) {
    console.error(`[postdeploy] ${error.message}`);
    process.exitCode = 1;
  }
}
