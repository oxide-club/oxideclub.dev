import { resolve, isAbsolute } from 'node:path';

export function challengesDirectory() {
  const source = process.env.CHALLENGES_SOURCE;
  if (source !== undefined && !isAbsolute(source))
    throw new Error('CHALLENGES_SOURCE must be an absolute path');
  if (
    source !== undefined &&
    ((process.env.CI && process.env.CI !== 'false') ||
      process.env.SITE_RELEASE === 'production')
  )
    throw new Error(
      'Local challenges source overrides are forbidden in CI and production',
    );
  return resolve(source || '.content/challenges');
}

export const challengeIdentifier =
  /^(?!000-)[0-9]{3}-[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** @param {{entry: string, data: Record<string, unknown>}} input */
export function challengeId({ entry, data }) {
  const [identifier, filename, extra] = entry.split('/');
  if (
    !challengeIdentifier.test(identifier) ||
    filename !== 'index.md' ||
    extra
  ) {
    throw new Error(`Invalid challenge identifier/path: ${entry}`);
  }
  if (data.slug !== identifier) {
    throw new Error(`Challenge slug must match directory ${identifier}`);
  }
  return identifier;
}
