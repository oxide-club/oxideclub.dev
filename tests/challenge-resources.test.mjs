import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  githubResourcesSchema,
  challengeResources,
} from '../src/lib/challenge-resources.mjs';

test('resources are opt-in and language paths use the canonical ID', () => {
  assert.deepEqual(challengeResources('001-wc'), { solutions: [] });
  const resources = challengeResources(
    '001-wc',
    githubResourcesSchema.parse({
      challenge: true,
      solutions: ['rust', 'cpp'],
    }),
  );
  assert.equal(
    resources.challenge,
    'https://github.com/oxide-club/challenges/tree/main/001-wc',
  );
  assert.deepEqual(resources.solutions, [
    {
      language: 'rust',
      label: 'Rust',
      url: 'https://github.com/oxide-club/solutions/tree/main/001-wc/rust',
    },
    {
      language: 'cpp',
      label: 'C++',
      url: 'https://github.com/oxide-club/solutions/tree/main/001-wc/cpp',
    },
  ]);
  assert.equal(resources.community, undefined);
});
test('community links follow the established root index and challenge anchor', () => {
  assert.equal(
    challengeResources('002-ppm', { community: true }).community,
    'https://github.com/oxide-club/solutions/blob/main/COMMUNITY.md#002-ppm',
  );
});
test('metadata rejects unknown languages, duplicates and path traversal', () => {
  for (const solutions of [['../c'], ['not-registered'], ['c', 'c']]) {
    assert.equal(githubResourcesSchema.safeParse({ solutions }).success, false);
  }
  assert.throws(() => challengeResources('../wc', { challenge: true }));
});
