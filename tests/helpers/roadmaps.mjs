import { mkdir, writeFile, cp } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// Cada suíte mantém seu catálogo sintético. Uma fonte vazia de trilhas evita
// que referências curriculares dependam dos materiais de outro cenário.
export async function emptyRoadmaps(root) {
  const source = join(root, '.content/roadmaps');
  await mkdir(join(source, 'templates'), { recursive: true });
  for (const file of [
    'README.md',
    'CONTRIBUTING.md',
    'LICENSING.md',
    'templates/index.md',
  ])
    await writeFile(join(source, file), 'Fixture de fonte vazia.\n');
  await cp(
    join(
      resolve(process.env.ROADMAPS_SOURCE ?? '.content/roadmaps'),
      'roadmap.schema.json',
    ),
    join(source, 'roadmap.schema.json'),
  );
  return source;
}
