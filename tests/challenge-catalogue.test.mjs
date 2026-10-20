import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ascendingChallenges,
  matchesChallenge,
} from '../src/lib/challenge-catalogue.mjs';

const entries = [
  {
    id: '001-wc',
    data: {
      title: 'Construa seu wc',
      summary: 'Conte palavras',
      topics: ['Streams', 'Entrada e saída'],
      categories: ['build'],
      recommendedLanguage: 'C',
    },
  },
  {
    id: '010-shell',
    data: {
      title: 'Um shell',
      summary: 'Investigação de processos',
      topics: ['Processos'],
      categories: ['investigate'],
      recommendedLanguage: 'Rust',
    },
  },
  {
    id: '002-ppm',
    data: {
      title: 'Gere uma imagem',
      summary: 'Pixels e cores',
      topics: ['Entrada e saída'],
      categories: ['build'],
    },
  },
];
test('catalogue orders canonical numbers ascending without mutating input', () => {
  assert.deepEqual(
    ascendingChallenges(entries).map((e) => e.id),
    ['001-wc', '002-ppm', '010-shell'],
  );
  assert.equal(entries[0].id, '001-wc');
});
test('text search ignores accents/case and combines words with an exact topic filter', () => {
  assert.equal(
    matchesChallenge(
      '001-wc Construa seu wc Conte palavras Streams Entrada e saída Construir C',
      entries[0].data.topics,
      ' WC SAIDA ',
      'Entrada e saída',
    ),
    true,
  );
  assert.equal(
    matchesChallenge(
      '001-wc Construa seu wc Conte palavras Streams Entrada e saída Construir C',
      entries[0].data.topics,
      'construir',
      '',
    ),
    true,
  );
  assert.equal(
    matchesChallenge(
      'Um shell Investigação de processos Rust',
      entries[1].data.topics,
      'rust investigacao',
      '',
    ),
    true,
  );
  assert.equal(
    matchesChallenge(
      '001-wc Construa seu wc Conte palavras Streams Entrada e saída Construir C',
      entries[0].data.topics,
      'wc',
      'Processos',
    ),
    false,
  );
  assert.equal(
    matchesChallenge(
      '001-wc Construa seu wc Conte palavras Streams Entrada e saída Construir C',
      entries[0].data.topics,
      'not-present',
      '',
    ),
    false,
  );
  assert.equal(
    matchesChallenge(
      '001-wc Construa seu wc Conte palavras Streams Entrada e saída Construir C',
      entries[0].data.topics,
      '',
      '',
    ),
    true,
  );
});
