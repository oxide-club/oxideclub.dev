import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import {
  appendFile,
  lstat,
  mkdir,
  mkdtemp,
  rename,
  rm,
} from 'node:fs/promises';
import { join, resolve } from 'node:path';

const exec = promisify(execFile);
async function git(directory, ...args) {
  try {
    const { stdout } = await exec('git', ['-C', directory, ...args], {
      encoding: 'utf8',
      timeout: 60000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    });
    return stdout.trim();
  } catch {
    // Git errors can echo credential-bearing remote URLs.
    throw new Error(
      `Content Git ${args[0]} failed; check repository access and connectivity.`,
    );
  }
}

async function inspectCheckout(directory, repository, name) {
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
      `Content checkout is modified: ${directory}. Keep edits in the ${name} repository.`,
    );
  }
  return git(directory, 'rev-parse', 'HEAD');
}

/** Fetch current main, or reuse the snapshot selected earlier in this CI job. */
export async function syncRepository({
  name,
  branch,
  validate,
  snapshotVariable,
  root = process.cwd(),
  repository,
  expectedRevision,
  githubEnv,
} = {}) {
  const cache = resolve(root, '.content');
  const destination = join(cache, name);
  const existingRevision = await inspectCheckout(destination, repository, name);
  if (expectedRevision) {
    if (
      !/^[0-9a-f]{40}$/.test(expectedRevision) ||
      existingRevision !== expectedRevision
    ) {
      throw new Error(
        'Content snapshot missing or mismatched; run content:sync at the start of the job.',
      );
    }
    await validate(destination);
    return existingRevision;
  }

  await mkdir(cache, { recursive: true });
  const staging = await mkdtemp(join(cache, `${name}-fetch-`));
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
      branch,
      '--',
      repository,
      checkout,
    );
    await validate(checkout);
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
      await appendFile(githubEnv, `${snapshotVariable}=${revision}\n`);
    return revision;
  } finally {
    if (!preserveStaging) await rm(staging, { recursive: true, force: true });
  }
}
