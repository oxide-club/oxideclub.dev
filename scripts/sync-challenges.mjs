import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  appendFile,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  rename,
  rm,
} from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { challengeIdentifier } from '../src/lib/challenge-source.mjs';

const exec = promisify(execFile);
const repositoryUrl = 'https://github.com/oxide-club/challenges.git';

async function git(directory, ...args) {
  const { stdout } = await exec('git', ['-C', directory, ...args], {
    encoding: 'utf8',
    timeout: 60000,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
  return stdout.trim();
}

async function inspectCheckout(directory, repository) {
  const stat = await lstat(directory).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (!stat) return null;
  if (
    !stat.isDirectory() ||
    stat.isSymbolicLink() ||
    (await git(directory, 'rev-parse', '--show-toplevel')) !== directory ||
    (await git(directory, 'remote', 'get-url', 'origin')) !== repository
  ) {
    throw new Error(
      `Refusing to replace an unrecognized content checkout: ${directory}`,
    );
  }
  if (await git(directory, 'status', '--porcelain', '--untracked-files=all')) {
    throw new Error(
      `Content checkout is modified: ${directory}. Keep edits in the challenges repository.`,
    );
  }
  return git(directory, 'rev-parse', 'HEAD');
}

async function validateDefinitions(directory) {
  const numbers = new Set();
  let count = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || !challengeIdentifier.test(entry.name)) continue;
    const definition = await lstat(join(directory, entry.name, 'index.md'));
    if (!definition.isFile() || definition.isSymbolicLink()) {
      throw new Error(`Missing challenge definition: ${entry.name}/index.md`);
    }
    const number = entry.name.split('-')[0];
    if (numbers.has(number))
      throw new Error(`Duplicate challenge number: ${number}`);
    numbers.add(number);
    count++;
  }
  if (!count) throw new Error('No numbered challenge definitions found');
}

/** Fetch current main, or reuse the snapshot selected earlier in this CI job. */
export async function syncChallenges({
  root = process.cwd(),
  repository = repositoryUrl,
  expectedRevision,
  githubEnv,
} = {}) {
  const cache = resolve(root, '.content');
  const destination = join(cache, 'challenges');
  const existingRevision = await inspectCheckout(destination, repository);
  if (expectedRevision) {
    if (
      !/^[0-9a-f]{40}$/.test(expectedRevision) ||
      existingRevision !== expectedRevision
    ) {
      throw new Error(
        'Content snapshot missing or mismatched; run content:sync at the start of the job.',
      );
    }
    await validateDefinitions(destination);
    return existingRevision;
  }

  await mkdir(cache, { recursive: true });
  const staging = await mkdtemp(join(cache, 'challenges-fetch-'));
  const checkout = join(staging, 'checkout');
  const previous = join(staging, 'previous');
  let preserveStaging = false;
  try {
    await git(
      staging,
      'clone',
      '--depth',
      '1',
      '--single-branch',
      '--branch',
      'main',
      '--',
      repository,
      checkout,
    );
    await validateDefinitions(checkout);
    const revision = await git(checkout, 'rev-parse', 'HEAD');
    if (existingRevision) await rename(destination, previous);
    try {
      await rename(checkout, destination);
    } catch (error) {
      if (existingRevision) {
        try {
          await rename(previous, destination);
        } catch {
          preserveStaging = true;
          throw new Error(
            `Could not restore content; previous checkout preserved at ${previous}`,
            { cause: error },
          );
        }
      }
      throw error;
    }
    if (githubEnv)
      await appendFile(githubEnv, `CHALLENGES_COMMIT=${revision}\n`);
    return revision;
  } finally {
    if (!preserveStaging) await rm(staging, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  try {
    const revision = await syncChallenges({
      expectedRevision: process.env.CHALLENGES_COMMIT,
      githubEnv: process.env.GITHUB_ENV,
    });
    console.log(`[content] oxide-club/challenges main @ ${revision}`);
  } catch (error) {
    console.error(`[content] ${error.message}`);
    process.exitCode = 1;
  }
}
