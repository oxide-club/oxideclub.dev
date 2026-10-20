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
  const referenceBase = `https://github.com/oxide-club/solutions/tree/main/${identifier}/`;
  if (
    data.referenceUrl !== undefined &&
    (typeof data.referenceUrl !== 'string' ||
      !data.referenceUrl.startsWith(referenceBase) ||
      !/^[a-z][a-z0-9-]*$/.test(data.referenceUrl.slice(referenceBase.length)))
  ) {
    throw new Error(
      `Reference URL must point to a language directory for ${identifier}`,
    );
  }
  return identifier;
}
