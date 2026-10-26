import { relationLabel } from './roadmap-relations.mjs';
let engine;
/** @template {{ref:string}} T @param {T[]} nodes @param {{from:string,to:string}[]} edges @returns {T[]} */
export function readingOrder(nodes, edges) {
  const remaining = new Set(nodes.map((n) => n.ref)),
    result = [];
  while (remaining.size) {
    const next = nodes.find(
      (n) =>
        remaining.has(n.ref) &&
        !edges.some((e) => e.to === n.ref && remaining.has(e.from)),
    );
    if (!next) throw new Error('Ciclo nas relações');
    remaining.delete(next.ref);
    result.push(next);
  }
  return result;
}
/**
 * @param {{nodes: {ref:string}[],edges: {from:string,to:string,type:string,label?:string}[],layout?:{primaryPath?:string[],branchOrder?:string[]},groups?:{title:string,nodes:string[]}[],sizes:Record<string,{width:number,height:number}>,labelSizes?:Record<string,{width:number,height:number}>}} input
 * @returns {Promise<import('./roadmap-types').RoadmapLayout>}
 */
export async function layoutRoadmap({
  nodes,
  edges,
  layout = {},
  groups = [],
  sizes,
  labelSizes = {},
}) {
  if (!engine)
    engine = import('elkjs/lib/elk.bundled.js').then(
      ({ default: ELK }) => new ELK(),
    );
  const elk = await engine;
  const preferred = [
    ...(layout.primaryPath ?? []),
    ...(layout.branchOrder ?? []),
    ...groups.flatMap((g) => g.nodes),
    ...nodes.map((n) => n.ref),
  ];
  const ordered = [...new Set(preferred)];
  const children = nodes
    .slice()
    .sort((a, b) => ordered.indexOf(a.ref) - ordered.indexOf(b.ref))
    .map((n) => ({
      id: n.ref,
      ...sizes[n.ref],
      layoutOptions: { 'elk.portConstraints': 'FIXED_SIDE' },
      ports: [
        { id: n.ref + ':in', properties: { 'port.side': 'NORTH' } },
        { id: n.ref + ':out', properties: { 'port.side': 'SOUTH' } },
      ],
    }));
  const result = await elk.layout({
    id: 'roadmap',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'DOWN',
      'elk.edgeRouting': 'ORTHOGONAL',
      'elk.padding': '[top=28,left=28,bottom=28,right=28]',
      'elk.spacing.nodeNode': '38',
      'elk.layered.spacing.nodeNodeBetweenLayers': '76',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.randomSeed': '1',
    },
    children,
    edges: edges.map((e, i) => ({
      id: `edge-${i}`,
      sources: [e.from + ':out'],
      targets: [e.to + ':in'],
      labels: labelSizes[`edge-${i}`]
        ? [
            {
              id: `label-${i}`,
              text: relationLabel(e),
              ...labelSizes[`edge-${i}`],
            },
          ]
        : [],
      layoutOptions: {
        'elk.layered.priority.direction':
          layout.primaryPath?.includes(e.from) &&
          layout.primaryPath?.includes(e.to)
            ? '10'
            : '1',
      },
    })),
  });
  return {
    width: result.width,
    height: result.height,
    nodes: result.children.map((n) => ({
      ref: n.id,
      x: n.x,
      y: n.y,
      width: n.width,
      height: n.height,
    })),
    edges: result.edges.map((e, i) => ({
      ...edges[i],
      sections: e.sections ?? [],
      labels: e.labels ?? [],
    })),
  };
}
