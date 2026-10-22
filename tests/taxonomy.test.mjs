import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  challengeTaxonomySchema,
  categoryLabels,
} from '../src/lib/challenge-taxonomy.mjs';

test('each category accepts every difficulty, including overlapping categories', () => {
  for (const difficulty of ['beginner', 'intermediate', 'advanced']) {
    for (const category of [
      'build',
      'investigate',
      'debug',
      'optimize',
      'experiment',
    ]) {
      assert.equal(
        challengeTaxonomySchema.safeParse({
          difficulty,
          area: 'systems',
          categories: [category],
        }).success,
        true,
      );
      assert.ok(categoryLabels[category]);
    }
    assert.equal(
      challengeTaxonomySchema.safeParse({
        difficulty,
        area: 'systems',
        categories: ['build', 'debug', 'optimize'],
      }).success,
      true,
    );
  }
});
test('taxonomy rejects missing, unknown, empty or duplicate categories and invalid difficulty', () => {
  for (const categories of [
    undefined,
    [],
    ['beginner'],
    ['unknown'],
    ['build', 'build'],
  ]) {
    assert.equal(
      challengeTaxonomySchema.safeParse({ difficulty: 'beginner', categories })
        .success,
      false,
    );
  }
  assert.equal(
    challengeTaxonomySchema.safeParse({
      difficulty: 'build',
      categories: ['build'],
    }).success,
    false,
  );
});
