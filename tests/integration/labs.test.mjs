import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  cp,
  mkdir,
  writeFile,
  readFile,
  access,
  rm,
  symlink,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { unzipSync, strFromU8 } from 'fflate';
import { labSections } from '../../src/lib/lab-structure.mjs';
const fixture = (draft = false) =>
  `---\ntitle: Laboratório de Teste\nslug: 001-teste\nsummary: Evidências do experimento\nquestion: O que muda?\ndraft: ${draft}\npublishedAt: 2026-10-21\ntopics: [Cache]\nprerequisites: [C]\ntools: [cc]\nenvironment: Linux\ndifficulty: intermediate\n---\n\n` +
  labSections
    .map(
      (s) =>
        `## ${s}\n\n${s === 'Materiais' ? '[Trace](materials/trace.txt)' : 'Texto do roteiro.'}`,
    )
    .join('\n\n');
test('labs publish independently, distribute matching files and remove drafts on rebuild', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'oxide-labs-integration-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const path of [
    'src',
    'public',
    '.content/challenges',
    '.content/notes',
    '.content/meetings',
    '.content/solutions',
    'astro.config.mjs',
    'tsconfig.json',
    'package.json',
  ])
    await cp(path, join(root, path), { recursive: true });
  await symlink(resolve('node_modules'), join(root, 'node_modules'), 'dir');
  const source = join(root, 'lab-source');
  await mkdir(join(source, 'licenses'), { recursive: true });
  await mkdir(join(source, 'templates'));
  await writeFile(
    join(source, 'templates/index.md'),
    '# Template, não uma atividade',
  );
  await writeFile(join(source, 'LICENSING.md'), 'Licenças');
  for (const name of ['MIT', 'CC-BY-4.0', 'CC0-1.0'])
    await writeFile(join(source, 'licenses', name + '.txt'), name);
  const env = { ...process.env, CI: '', SITE_RELEASE: '', LABS_SOURCE: source };
  const build = () =>
    execFileSync(
      process.execPath,
      [resolve('node_modules/astro/bin/astro.mjs'), 'build'],
      { cwd: root, env, encoding: 'utf8', timeout: 60000, stdio: 'pipe' },
    );
  build();
  const publicationManifest = async () =>
    JSON.parse(
      await readFile(join(root, 'dist/publication-manifest.json'), 'utf8'),
    );
  const labEntries = async () =>
    (await publicationManifest()).entries.filter(
      (entry) => entry.type === 'lab',
    );
  assert.deepEqual(await labEntries(), []);
  const catalog = join(root, 'dist/labs/index.html');
  assert.match(
    await readFile(catalog, 'utf8'),
    /Ainda não há laboratórios publicados/,
  );
  const lab = join(source, '001-teste');
  await mkdir(join(lab, 'materials'), { recursive: true });
  await writeFile(join(lab, 'index.md'), fixture());
  await writeFile(join(lab, 'materials/trace.txt'), 'L 0x00\n');
  build();
  const html = await readFile(
    join(root, 'dist/labs/001-teste/index.html'),
    'utf8',
  );
  assert.deepEqual(await labEntries(), [
    {
      type: 'lab',
      id: '001-teste',
      title: 'Laboratório de Teste',
      summary: 'Evidências do experimento',
      url: 'https://oxideclub.dev/labs/001-teste',
    },
  ]);
  assert.match(html, /Laboratório de Teste/);
  assert.match(html, /Baixar materiais/);
  assert.match(decodeURI(html), /https:\/\/oxideclub.dev\/labs\/001-teste\//);
  assert.equal(
    await readFile(
      join(root, 'dist/labs/001-teste/assets/materials/trace.txt'),
      'utf8',
    ),
    'L 0x00\n',
  );
  const archive = unzipSync(
    await readFile(join(root, 'dist/labs/001-teste/materiais.zip')),
  );
  assert.equal(strFromU8(archive['001-teste/materials/trace.txt']), 'L 0x00\n');
  assert.ok(archive['001-teste/licenses/MIT.txt']);
  assert.match(
    decodeURI(await readFile(join(root, 'dist/sitemap-0.xml'), 'utf8')),
    /labs\/001-teste/,
  );
  await rm(join(lab, 'materials/trace.txt'));
  assert.throws(build, /trace\.txt/);
  await writeFile(join(lab, 'materials/trace.txt'), 'L 0x00\n');
  build();
  const alternate = join(root, 'alternate-source');
  await mkdir(alternate);
  env.LABS_SOURCE = alternate;
  build();
  assert.match(
    await readFile(catalog, 'utf8'),
    /Ainda não há laboratórios publicados/,
  );
  await assert.rejects(access(join(root, 'dist/labs/001-teste/materiais.zip')));
  env.LABS_SOURCE = source;
  build();
  await access(join(root, 'dist/labs/001-teste/index.html'));
  await writeFile(join(lab, 'index.md'), fixture(true));
  build();
  await assert.rejects(access(join(root, 'dist/labs/001-teste/index.html')));
  await assert.rejects(access(join(root, 'dist/labs/001-teste/materiais.zip')));
  await assert.rejects(
    access(join(root, 'dist/labs/001-teste/assets/materials/trace.txt')),
  );
  assert.doesNotMatch(
    await readFile(join(root, 'dist/sitemap-0.xml'), 'utf8'),
    /001-teste/,
  );
  assert.deepEqual(await labEntries(), []);
  // Exercise the production endpoint against a synchronized snapshot, without local overrides.
  await writeFile(join(lab, 'index.md'), fixture());
  await cp(source, join(root, '.content/labs'), { recursive: true });
  const snapshot = join(root, '.content/labs');
  const git = (...args) =>
    execFileSync('git', ['-C', snapshot, ...args], {
      encoding: 'utf8',
      stdio: 'pipe',
    }).trim();
  git('init', '-b', 'main');
  git('add', '.');
  git(
    '-c',
    'user.name=Fixture',
    '-c',
    'user.email=fixture@example.test',
    'commit',
    '-m',
    'Published lab fixture',
  );
  const labRevision = git('rev-parse', 'HEAD');
  delete env.LABS_SOURCE;
  env.SITE_RELEASE = 'production';
  env.CHALLENGES_COMMIT = 'a'.repeat(40);
  env.NOTES_COMMIT = 'b'.repeat(40);
  env.LABS_COMMIT = labRevision;
  build();
  const production = await publicationManifest();
  assert.equal(production.production, true);
  assert.equal(production.revisions.labs, labRevision);
  assert.equal(
    (await labEntries())[0].url,
    'https://oxideclub.dev/labs/001-teste',
  );
  await access(join(root, 'dist/labs/001-teste/index.html'));
});
