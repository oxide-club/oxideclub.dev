export const labSections = [
  'O que vamos investigar',
  'Antes de começar',
  'Materiais',
  'Etapas da investigação',
  'Critérios de conclusão',
  'Extensões opcionais',
  'Participação no clube',
  'Referências e atividades relacionadas',
];
export function validateLabHeadings(headings, file) {
  if (
    headings.length !== labSections.length ||
    headings.some((title, i) => title !== labSections[i])
  )
    throw new Error(
      `${file}: lab sections must match the eight required titles in order`,
    );
}
export function validateLabRelations(labs, challenges) {
  const labIds = new Set(labs.filter((x) => !x.data.draft).map((x) => x.id));
  const challengeIds = new Set(
    challenges.filter((x) => !x.data.draft).map((x) => x.id),
  );
  for (const lab of labs.filter((x) => !x.data.draft))
    for (const [field, ids] of [
      ['relatedLabs', labIds],
      ['relatedChallenges', challengeIds],
      ['supersededBy', challengeIds],
    ])
      for (const id of field === 'supersededBy'
        ? lab.data.supersededBy
          ? [lab.data.supersededBy]
          : []
        : (lab.data[field] ?? []))
        if (!ids.has(id))
          throw new Error(
            `${lab.id}: missing or unpublished ${field} reference ${id}`,
          );
}
