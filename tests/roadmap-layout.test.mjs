import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutRoadmap, readingOrder } from '../src/lib/roadmap-layout.mjs';
const nodes = ['a', 'b', 'c', 'd'].map((ref) => ({ ref }));
const edge = (from, to, type = 'recommended_next') => ({ from, to, type });
test('reading order places preparation before its target while keeping independent roots', () => {
  assert.deepEqual(
    readingOrder(
      [{ ref: 'target' }, { ref: 'entry' }, { ref: 'note' }],
      [edge('note', 'target', 'suggested_preparation')],
    ).map((n) => n.ref),
    ['entry', 'note', 'target'],
  );
});
for (const [name, edges] of [
  ['chain', [edge('a', 'b'), edge('b', 'c'), edge('c', 'd')]],
  [
    'branch and convergence',
    [
      edge('a', 'b', 'branch'),
      edge('a', 'c', 'branch'),
      edge('b', 'd', 'convergence'),
      edge('c', 'd', 'convergence'),
    ],
  ],
  [
    'distant preparation',
    [
      edge('a', 'b'),
      edge('b', 'c'),
      edge('c', 'd'),
      edge('a', 'd', 'suggested_preparation'),
    ],
  ],
  ['parallel paths', [edge('a', 'b'), edge('c', 'd')]],
]) {
  test(`lays out ${name} without losing relationships or crossing node interiors`, async () => {
    const sizes = {
      a: { width: 280, height: 110 },
      b: { width: 310, height: 190 },
      c: { width: 280, height: 100 },
      d: { width: 280, height: 160 },
    };
    const result = await layoutRoadmap({
      nodes,
      edges,
      sizes,
      layout: { primaryPath: ['a', 'b'] },
    });
    assert.deepEqual(
      new Set(result.nodes.map((n) => n.ref)),
      new Set(['a', 'b', 'c', 'd']),
    );
    assert.equal(result.edges.length, edges.length);
    for (const a of result.nodes)
      for (const b of result.nodes)
        if (a.ref !== b.ref)
          assert.equal(
            a.x < b.x + b.width &&
              a.x + a.width > b.x &&
              a.y < b.y + b.height &&
              a.y + a.height > b.y,
            false,
            `overlap ${a.ref}/${b.ref}`,
          );
    for (const e of result.edges) {
      const a = result.nodes.find((n) => n.ref === e.from),
        b = result.nodes.find((n) => n.ref === e.to);
      assert.ok(b.y > a.y);
      for (const section of e.sections) {
        const points = [
          section.startPoint,
          ...(section.bendPoints ?? []),
          section.endPoint,
        ];
        for (let i = 1; i < points.length; i++) {
          const p = points[i - 1],
            q = points[i];
          for (const n of result.nodes.filter(
            (n) => n.ref !== e.from && n.ref !== e.to,
          )) {
            const vertical =
              p.x === q.x &&
              p.x > n.x &&
              p.x < n.x + n.width &&
              Math.max(p.y, q.y) > n.y &&
              Math.min(p.y, q.y) < n.y + n.height;
            const horizontal =
              p.y === q.y &&
              p.y > n.y &&
              p.y < n.y + n.height &&
              Math.max(p.x, q.x) > n.x &&
              Math.min(p.x, q.x) < n.x + n.width;
            assert.equal(
              vertical || horizontal,
              false,
              `edge crosses ${n.ref}`,
            );
          }
        }
      }
    }
  });
}
test('a roadmap with only one note is drawable', async () => {
  const r = await layoutRoadmap({
    nodes: [{ ref: 'notes:bytes' }],
    edges: [],
    sizes: { 'notes:bytes': { width: 300, height: 180 } },
  });
  assert.equal(r.nodes.length, 1);
  assert.ok(r.width >= 300);
});
test('default relationship labels receive real positions without overlapping each other', async () => {
  const result = await layoutRoadmap({
    nodes: [{ ref: 'a' }, { ref: 'b' }, { ref: 'c' }],
    edges: [edge('a', 'b', 'branch'), edge('a', 'c', 'convergence')],
    sizes: {
      a: { width: 280, height: 120 },
      b: { width: 280, height: 120 },
      c: { width: 280, height: 120 },
    },
    labelSizes: {
      'edge-0': { width: 180, height: 24 },
      'edge-1': { width: 120, height: 24 },
    },
  });
  const labels = result.edges.flatMap((e) => e.labels);
  assert.equal(labels.length, 2);
  assert.equal(labels[0].text, 'Aprofundamento opcional');
  assert.equal(labels[1].text, 'Convergência');
  for (const a of labels)
    for (const b of labels)
      if (a !== b)
        assert.equal(
          a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y,
          false,
        );
  for (const a of labels)
    for (const b of result.nodes)
      assert.equal(
        a.x < b.x + b.width &&
          a.x + a.width > b.x &&
          a.y < b.y + b.height &&
          a.y + a.height > b.y,
        false,
      );
});
