import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import {
  validateManifest,
  publicationUrl,
} from '../../src/lib/publication-manifest.mjs';
import { createClient } from './client.mjs';
import {
  readState,
  updateState,
  deliver,
  reconcileDelivery,
} from './state.mjs';
export { reconcileDelivery } from './state.mjs';
const website = 'oxide-club/oxideclub.dev';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function verifyPublished(
  manifest,
  { fetchPublished = globalThis.fetch, sleep = wait } = {},
) {
  validateManifest(manifest);
  const request = (url) =>
    fetchPublished(url, {
      redirect: 'manual',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
      signal: AbortSignal.timeout(20000),
    });
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const response = await request(
        'https://oxideclub.dev/publication-manifest.json',
      );
      if (
        response.status !== 200 ||
        JSON.stringify(await response.json()) !== JSON.stringify(manifest)
      )
        throw new Error();
      for (const entry of manifest.entries) {
        let page = await request(entry.url);
        if ([301, 302, 307, 308].includes(page.status)) {
          const target = new URL(page.headers.get('location'), entry.url);
          if (target.href !== `${entry.url}/`) throw new Error();
          page = await request(target.href);
        }
        if (page.status !== 200) throw new Error();
      }
      return;
    } catch {
      if (attempt < 5) await sleep(10000);
    }
  }
  throw new Error(
    'Expected production manifest/pages are not available; no announcements sent.',
  );
}
export async function findRenames({ repository, before, after, github }) {
  if (
    !['oxide-club/challenges', 'oxide-club/notes'].includes(repository) ||
    !/^[a-f0-9]{40}$/.test(before) ||
    !/^[a-f0-9]{40}$/.test(after)
  )
    throw new Error('Invalid comparison history revisions');
  if (before === after) return [];
  const comparison = await github(
    `/repos/${repository}/compare/${before}...${after}?per_page=100&page=1`,
  );
  // GitHub returns files only on page one, capped at 300 even when commits are paginated.
  if (
    !['ahead', 'identical'].includes(comparison.status) ||
    !Array.isArray(comparison.files) ||
    comparison.files.length >= 300
  )
    throw new Error(
      'Incomplete or stale comparison history; reconcile manually before proceeding.',
    );
  const type = repository.endsWith('/notes') ? 'note' : 'challenge';
  const renames = [];
  for (const file of comparison.files) {
    if (
      file.status !== 'renamed' ||
      !/^[^/]+\/index\.md$/.test(file.filename) ||
      !/^[^/]+\/index\.md$/.test(file.previous_filename)
    )
      continue;
    const from = file.previous_filename.split('/')[0],
      to = file.filename.split('/')[0];
    try {
      publicationUrl(type, from);
      publicationUrl(type, to);
    } catch {
      continue;
    }
    renames.push({ type, from, to });
  }
  return renames;
}
export async function initialize({
  client,
  repository,
  manifest,
  fetchPublished,
  sleep,
}) {
  if (repository !== website)
    throw new Error('Unsupported announcements repository');
  validateManifest(manifest);
  if ((await readState(client, repository)).state.initialized)
    throw new Error('Discord baseline already initialized');
  await verifyPublished(manifest, { fetchPublished, sleep });
  await updateState(client, repository, (state) => {
    if (state.initialized || Object.keys(state.records).length)
      throw new Error(
        'Discord baseline already initialized or contains delivery history',
      );
    state.initialized = true;
    for (const entry of manifest.entries)
      state.records[`${entry.type}:${entry.id}`] = {
        url: entry.url,
        baseline: true,
      };
    state.revisions = manifest.revisions;
  });
}
export async function announce({
  client,
  repository,
  manifest,
  fetchPublished,
  sleep,
  renames,
}) {
  if (repository !== website)
    throw new Error('Unsupported announcements repository');
  validateManifest(manifest);
  const { state } = await readState(client, repository);
  if (!state.initialized)
    throw new Error('Initialize the Discord baseline before announcing');
  await verifyPublished(manifest, { fetchPublished, sleep });
  if (!renames) {
    renames = [];
    for (const collection of ['challenges', 'notes'])
      renames.push(
        ...(await findRenames({
          repository: `oxide-club/${collection}`,
          before: state.revisions[collection],
          after: manifest.revisions[collection],
          github: client.github,
        })),
      );
  }
  if (renames.length)
    await updateState(client, repository, (current) => {
      for (const rename of renames) {
        const key = `${rename.type}:${rename.to}`,
          oldKey = `${rename.type}:${rename.from}`;
        if (current.records[oldKey]?.pending)
          throw new Error(
            `Pending delivery ${oldKey}; reconcile before applying rename.`,
          );
        if (current.records[oldKey] && !current.records[key])
          current.records[key] = {
            url: publicationUrl(rename.type, rename.to),
            aliasOf: oldKey,
          };
      }
    });
  for (const entry of manifest.entries)
    await deliver({
      client,
      repository,
      key: `${entry.type}:${entry.id}`,
      url: entry.url,
      payload: {
        content: `${entry.type === 'challenge' ? 'Novo desafio' : 'Nova nota'} no Oxide Club: ${entry.url}`,
        embeds: [
          {
            title: entry.title.slice(0, 256),
            url: entry.url,
            description: entry.summary.slice(0, 2000),
          },
        ],
      },
    });
  await updateState(client, repository, (current) => {
    current.revisions = manifest.revisions;
  });
}
export async function verifyDeploymentRun(client, runId) {
  if (!/^[1-9]\d*$/.test(runId)) throw new Error('Invalid production run ID');
  const run = await client.github(`/repos/${website}/actions/runs/${runId}`);
  if (
    run.repository?.full_name !== website ||
    run.head_branch !== 'main' ||
    run.path !== '.github/workflows/deploy.yml' ||
    run.status !== 'completed'
  )
    throw new Error('Run is not a completed trusted main production workflow');
  const jobs = await client.paginate(
    `/repos/${website}/actions/runs/${runId}/jobs`,
    'jobs',
  );
  if (
    !jobs.some((job) => job.name === 'deploy' && job.conclusion === 'success')
  )
    throw new Error('Production deployment did not succeed');
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const [mode, argument, messageId] = process.argv.slice(2);
    if (process.env.GITHUB_REPOSITORY !== website)
      throw new Error('Run this command in oxide-club/oxideclub.dev');
    const client = createClient({
      token: process.env.GH_TOKEN,
      webhookUrl: process.env.DISCORD_ANNOUNCEMENTS_WEBHOOK_URL,
    });
    if (mode === 'verify-run') await verifyDeploymentRun(client, argument);
    else if (mode === 'record' || mode === 'release')
      await reconcileDelivery({
        client,
        repository: website,
        key: argument,
        messageId,
        release: mode === 'release',
      });
    else if (['initialize', 'announce'].includes(mode)) {
      const manifest = JSON.parse(await readFile(argument, 'utf8'));
      await (mode === 'initialize' ? initialize : announce)({
        client,
        repository: website,
        manifest,
      });
    } else
      throw new Error(
        'Use initialize|announce <manifest.json>, verify-run <id>, record <key> <message-id>, or release <key>',
      );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
