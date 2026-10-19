import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
const fixtures = [
  ['Hello, world!\n', [1, 2, 14]],
  ['Hello world\nC is fun\n', [2, 5, 21]],
  ['', [0, 0, 0]],
  ['hello', [0, 1, 5]],
  ['hello\n', [1, 1, 6]],
  ['a b\n', [1, 2, 4]],
  ['a\nb', [1, 2, 3]],
  ['one   two\n', [1, 2, 10]],
  ['a\tb\n', [1, 2, 4]],
  ['ola mundo\n', [1, 2, 10]],
  [' \t\n\r\v\f', [1, 0, 6]],
  ['\r\n', [1, 0, 2]],
];
for (const [input, expected] of fixtures)
  test(`wc oracle: ${JSON.stringify(input)}`, () => {
    const result = spawnSync('wc', ['-l', '-w', '-c'], {
      input,
      timeout: 5000,
      env: { ...process.env, LC_ALL: 'C' },
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(result.stdout.trim().split(/\s+/).map(Number), expected);
  });
