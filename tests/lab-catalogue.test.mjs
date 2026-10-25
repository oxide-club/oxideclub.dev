import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupLabsByArea } from '../src/lib/lab-catalogue.mjs';
test('labs follow editorial area order and ID order without empty groups or mutation', () => {
  const labs = [
    { id: '003-test', data: { area: 'memory' } },
    { id: '001-test', data: { area: 'systems' } },
    { id: '002-test', data: { area: 'memory' } },
  ];
  const before = structuredClone(labs);
  const groups = groupLabsByArea(labs, [
    { id: 'memory' },
    { id: 'systems' },
    { id: 'empty' },
  ]);
  assert.deepEqual(
    groups.map((g) => [g.area.id, g.labs.map((l) => l.id)]),
    [
      ['memory', ['002-test', '003-test']],
      ['systems', ['001-test']],
    ],
  );
  assert.deepEqual(labs, before);
  assert.deepEqual(groupLabsByArea([], [{ id: 'memory' }]), []);
});
