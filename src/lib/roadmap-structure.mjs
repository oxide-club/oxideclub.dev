import { labUrl } from './lab-urls.mjs';
const materialRef =
  /^(?:(?:challenges|labs):\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*|notes:(?!(?:templates|docs|scripts|tests)$)[a-z0-9]+(?:-[a-z0-9]+)*)$/;
export function validateRoadmapGraph(data) {
  const refs = new Set(data.nodes.map((n) => n.ref));
  if (
    refs.size !== data.nodes.length ||
    [...refs].some((ref) => !materialRef.test(ref))
  )
    throw new Error('Referência de nó inválida ou repetida');
  const pairs = new Set(),
    adjacency = new Map([...refs].map((ref) => [ref, []]));
  for (const edge of data.edges) {
    if (!refs.has(edge.from) || !refs.has(edge.to) || edge.from === edge.to)
      throw new Error('Aresta inválida');
    const pair = `${edge.from}>${edge.to}`;
    if (pairs.has(pair)) throw new Error('Aresta repetida');
    pairs.add(pair);
    adjacency.get(edge.from).push(edge.to);
  }
  const visited = new Set(),
    active = new Set();
  function visit(ref) {
    if (active.has(ref)) throw new Error('Ciclo nas relações');
    if (visited.has(ref)) return;
    active.add(ref);
    for (const next of adjacency.get(ref)) visit(next);
    active.delete(ref);
    visited.add(ref);
  }
  for (const ref of refs) visit(ref);
  const listed = (items) => {
    if (
      new Set(items).size !== items.length ||
      items.some((ref) => !refs.has(ref))
    )
      throw new Error('Orientação editorial com referência inválida');
  };
  for (const items of Object.values(data.layout ?? {})) listed(items);
  for (const group of data.groups ?? []) listed(group.nodes);
  const primary = data.layout?.primaryPath ?? [];
  for (let i = 1; i < primary.length; i++)
    if (
      !data.edges.some(
        (e) =>
          e.from === primary[i - 1] &&
          e.to === primary[i] &&
          e.type !== 'suggested_preparation',
      )
    )
      throw new Error('Percurso principal sem progressão');
  return data;
}
/** @param {import('./roadmap-types').RoadmapData} data @returns {import('./roadmap-types').RoadmapNode[]} */
function resolveNodes(data, sources) {
  return data.nodes.map((node) => {
    const [type, id] = node.ref.split(':');
    const entry = sources[type]?.find((e) => e.id === id);
    if (!entry || entry.data.draft || entry.data.supersededBy)
      throw new Error(
        `Material inexistente, em rascunho ou substituído: ${node.ref}`,
      );
    if (
      node.relatedRoadmap &&
      !sources.roadmaps?.some(
        (e) => e.id === node.relatedRoadmap && !e.data.draft,
      )
    )
      throw new Error(
        `Trilha relacionada indisponível: ${node.relatedRoadmap}`,
      );
    const url =
      type === 'labs'
        ? labUrl(id)
        : type === 'notes'
          ? `/notas/${id}/`
          : `/desafios/${entry.data.slug ?? id}`;
    return {
      ...node,
      id,
      type,
      title: entry.data.title,
      summary: entry.data.summary,
      url,
      ...(entry.data.difficulty ? { difficulty: entry.data.difficulty } : {}),
    };
  });
}
/** @param {import('./roadmap-types').RoadmapData} data */
export function resolveRoadmap(data, sources) {
  validateRoadmapGraph(data);
  return { ...data, nodes: resolveNodes(data, sources) };
}
export { relationNames } from './roadmap-relations.mjs';
