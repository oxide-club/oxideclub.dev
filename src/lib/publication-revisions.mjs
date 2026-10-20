import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
const exec = promisify(execFile);
/** @param {{root?: string, revisions?: {challenges?: string, notes?: string}}} [options] */
export async function publicationRevisions({
  root = process.cwd(),
  revisions = {},
} = {}) {
  const selected = {};
  for (const name of ['challenges', 'notes']) {
    let revision = revisions[name];
    if (revision === undefined) {
      try {
        const result = await exec(
          'git',
          ['-C', resolve(root, '.content', name), 'rev-parse', 'HEAD'],
          { encoding: 'utf8', timeout: 10000 },
        );
        revision = result.stdout.trim();
      } catch {
        throw new Error(
          `Missing synchronized ${name} revision; run content:sync before production build`,
        );
      }
    }
    if (!/^[a-f0-9]{40}$/.test(revision))
      throw new Error(`Invalid ${name} publication revision`);
    selected[name] = revision;
  }
  return selected;
}
