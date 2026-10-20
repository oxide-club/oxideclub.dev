import { lstat, readdir, readFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { parseDocument } from 'yaml';
import { z } from 'astro/zod';
import { challengeIdentifier } from './challenge-source.mjs';

export interface CommunityImplementation {
  author: string;
  authorUrl?: string;
  language: string;
  url: string;
  status: 'completed' | 'partial';
  notes?: string;
}

export function solutionsDirectory() {
  const source = process.env.SOLUTIONS_SOURCE;
  if (source !== undefined) {
    if (!isAbsolute(source))
      throw new Error('SOLUTIONS_SOURCE must be an absolute path');
    if (
      (process.env.CI && process.env.CI !== 'false') ||
      process.env.SITE_RELEASE === 'production'
    )
      throw new Error(
        'Local solutions source overrides are forbidden in CI and production',
      );
  }
  return resolve(source ?? '.content/solutions');
}

async function regularFile(path: string) {
  const stat = await lstat(path).catch(() => null);
  if (!stat?.isFile() || stat.isSymbolicLink())
    throw new Error(`${path}: arquivo regular obrigatório ausente`);
  return readFile(path, 'utf8');
}

function httpsUrl(value: string) {
  try {
    const url = new URL(value);
    if (
      /[\u200c\u200d]/u.test(
        decodeURIComponent(value.slice(8).split(/[/?#]/u)[0]),
      )
    )
      return false;
    return (
      value.startsWith('https://') &&
      /^https:\/\/[^/?#]+/.test(value) &&
      url.protocol === 'https:' &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password &&
      !/[\s\\\x00-\x1f\x7f]/u.test(value) &&
      url.port !== '0'
    );
  } catch {
    return false;
  }
}

// Compare Unicode code points, independent of locale and JS UTF-16 surrogate order.
function compareText(a: string, b: string) {
  const left = Array.from(a, (c) => c.codePointAt(0)!);
  const right = Array.from(b, (c) => c.codePointAt(0)!);
  for (let i = 0; i < Math.min(left.length, right.length); i++) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return left.length - right.length;
}

export async function loadCommunity(directory = solutionsDirectory()) {
  const stat = await lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink())
    throw new Error(
      `${directory}: solutions source must be a regular directory`,
    );
  const schemaPath = join(directory, 'community.schema.json');
  const contract = JSON.parse(await regularFile(schemaPath));
  const schema = z.fromJSONSchema(contract);
  const catalogues = new Map<string, CommunityImplementation[]>();
  const expected = new Set<string>();
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (
      !/^\d/.test(entry.name) ||
      (!entry.isDirectory() && !entry.isSymbolicLink())
    )
      continue;
    if (!challengeIdentifier.test(entry.name) || entry.isSymbolicLink())
      throw new Error(`${entry.name}: diretório de desafio inválido`);
    const path = join(directory, entry.name, 'community.yaml');
    expected.add(path);
    const document = parseDocument(await regularFile(path), {
      version: '1.2',
      uniqueKeys: true,
      merge: true,
    });
    const problem = document.errors[0] ?? document.warnings[0];
    if (problem) throw new Error(`${path}: ${problem.message}`);
    let data: unknown;
    try {
      data = document.toJS({ maxAliasCount: 100 });
    } catch (error) {
      throw new Error(
        `${path}: ${error instanceof Error ? error.message : error}`,
      );
    }
    const result = schema.safeParse(data);
    if (!result.success) {
      const detail = result.error.issues
        .map(
          (issue) =>
            `${issue.path.map((p) => (typeof p === 'number' ? `[${p + 1}]` : p)).join('.')}: ${issue.message}`,
        )
        .join('; ');
      throw new Error(`${path}: ${detail}`);
    }
    const implementations = (
      result.data as { implementations: CommunityImplementation[] }
    ).implementations;
    const seen = new Set<string>();
    for (let i = 0; i < implementations.length; i++) {
      const item = implementations[i];
      const prefix = `${path}: implementations[${i + 1}]`;
      for (const field of ['url', 'authorUrl'] as const) {
        if (item[field] !== undefined && !httpsUrl(item[field]))
          throw new Error(`${prefix}.${field}: URL HTTPS inválida`);
      }
      if (seen.has(item.url)) throw new Error(`${prefix}.url: URL duplicada`);
      seen.add(item.url);
      const previous = implementations[i - 1];
      if (
        previous &&
        (compareText(previous.author, item.author) > 0 ||
          (previous.author === item.author &&
            compareText(previous.language, item.language) > 0))
      )
        throw new Error(
          `${prefix}: fora de ordem por autor e linguagem (Unicode)`,
        );
    }
    catalogues.set(entry.name, implementations);
  }
  // Detect misplaced/nested catalogues without opening or running any reference code.
  async function checkPaths(root: string): Promise<void> {
    for (const entry of await readdir(root, { withFileTypes: true })) {
      if (entry.name === '.git') continue;
      const path = join(root, entry.name);
      if (entry.name === 'community.yaml' && !expected.has(path))
        throw new Error(
          `${path}: catálogo fora de um diretório canônico de desafio`,
        );
      if (entry.isDirectory()) await checkPaths(path);
    }
  }
  await checkPaths(directory);
  return catalogues;
}
