// Default branches verified against the public repositories on 2026-10-20.
export const github = {
  organization: 'oxide-club',
  repositories: {
    challenges: { name: 'challenges', branch: 'main' },
    solutions: { name: 'solutions', branch: 'main' },
    notes: { name: 'notes', branch: 'main' },
    meetings: { name: 'meetings', branch: 'main' },
  },
  communityIndex: 'COMMUNITY.md',
};

/** @param {keyof typeof github.repositories} repository */
export function repositoryUrl(repository) {
  return `https://github.com/${github.organization}/${github.repositories[repository].name}`;
}

/**
 * @param {keyof typeof github.repositories} repository
 * @param {string} path
 * @param {'tree' | 'blob'} [kind]
 */
export function githubUrl(repository, path, kind = 'tree') {
  return `${repositoryUrl(repository)}/${kind}/${github.repositories[repository].branch}/${path}`;
}
