import { lstat, readdir } from 'node:fs/promises';
import { resolve, join, extname, parse, relative } from 'node:path';
const extensions = new Set(['.md', '.txt', '.c', '.h', '.py', '.json', '.csv', '.rs', '.S', '.s', '.cu', '.toml', '.go']);
export async function assertRegularPath(path, directory = false) {
  const absolute = resolve(path);
  let current = parse(absolute).root;
  for (const part of relative(current, absolute).split('/')) {
    current = join(current, part);
    const stat = await lstat(current);
    if (stat.isSymbolicLink())
      throw new Error(`Unsafe symbolic link: ${current}`);
  }
  const stat = await lstat(absolute);
  if (directory ? !stat.isDirectory() : !stat.isFile())
    throw new Error(`Unsafe file type: ${absolute}`);
  return absolute;
}
export async function labFiles(directory) {
  await assertRegularPath(directory, true);
  const files = [];
  async function visit(path, prefix = '') {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const name = prefix + entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Unsafe lab file: ${name}`);
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(entry.name)) continue;
      if (entry.isDirectory()) {
        if (
          (!prefix && ['materials', 'checks', 'experiments'].includes(entry.name)) ||
          (prefix && !['node_modules', '__pycache__', 'target', 'build', 'dist', 'solutions'].includes(entry.name))
        )
          await visit(join(path, entry.name), name + '/');
      } else if (
        entry.isFile() &&
        (extensions.has(extname(name)) || ['Makefile', 'go.mod'].includes(entry.name)) &&
        (prefix || ['index.md', 'README.md', 'references.md', 'report-template.md'].includes(name))
      ) {
        files.push({
          path: name,
          absolutePath: join(path, entry.name),
          type: 'text/plain; charset=utf-8',
        });
      }
    }
  }
  await visit(directory);
  return files.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}
export async function resolveLabFile(directory, path) {
  if (!path.split('/').every((p) => /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(p)))
    throw new Error(`Unsafe lab path: ${path}`);
  const file = (await labFiles(directory)).find((f) => f.path === path);
  if (!file)
    throw new Error(`Missing or unsupported lab file: ${directory}/${path}`);
  return file.absolutePath;
}
