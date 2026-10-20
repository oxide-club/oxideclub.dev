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

test('accepted languages and localized difficulty feed the real search transformation', async () => {
  const { challengeSearchText } =
    await import('../src/lib/challenge-catalogue.mjs');
  const { challengeLanguages, challengeLanguageSchema } =
    await import('../src/lib/challenge-languages.mjs');
  const data = {
    title: 'Compressor RLE',
    summary: 'Recupere bytes originais',
    topics: ['Streams', 'Codificação'],
    cardTopics: ['Validação'],
    difficulty: 'advanced',
    categories: ['build'],
    ...challengeLanguageSchema.parse({
      recommendedLanguage: 'C',
      acceptedLanguages: ['C', 'Rust'],
    }),
  };
  const text = challengeSearchText({ id: '003-rle', data });
  assert.deepEqual(challengeLanguages(data), ['C', 'Rust']);
  for (const query of [
    'Rust',
    'avançado Rust',
    'avancado rust',
    'advanced',
    'CODIFICACAO',
    'validacao',
  ])
    assert.equal(matchesChallenge(text, data.topics, query, ''), true, query);
  assert.equal(matchesChallenge(text, data.topics, 'rust', 'Streams'), true);
  assert.equal(
    matchesChallenge(text, data.topics, 'rust', 'Pixels RGB'),
    false,
  );
  assert.equal(matchesChallenge(text, data.topics, 'inexistente', ''), false);
  assert.equal(matchesChallenge(text, data.topics, '', ''), true);
  const legacy = {
    ...data,
    acceptedLanguages: undefined,
    recommendedLanguage: 'C',
  };
  assert.deepEqual(challengeLanguages(legacy), ['C']);
  assert.equal(
    matchesChallenge(
      challengeSearchText({ id: '001-legacy', data: legacy }),
      legacy.topics,
      'avancado c',
      '',
    ),
    true,
  );
  assert.equal(
    matchesChallenge(
      challengeSearchText({ id: '001-legacy', data: legacy }),
      legacy.topics,
      'rust',
      '',
    ),
    false,
  );
});

test('language metadata preserves old entries and rejects inconsistent declarations', async () => {
  const { challengeLanguageSchema } =
    await import('../src/lib/challenge-languages.mjs');
  assert.equal(
    challengeLanguageSchema.safeParse({ recommendedLanguage: 'C' }).success,
    true,
  );
  for (const declaration of [[], ['C', 'C'], ['']])
    assert.equal(
      challengeLanguageSchema.safeParse({ acceptedLanguages: declaration })
        .success,
      false,
    );
  assert.equal(
    challengeLanguageSchema.safeParse({
      recommendedLanguage: 'C',
      acceptedLanguages: ['Rust'],
    }).success,
    false,
  );
});
