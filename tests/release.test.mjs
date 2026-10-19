import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseBlockers } from '../src/lib/release.mjs';
test('release fails closed on missing keys, empty values and non-boolean approvals', () => {
  assert.ok(releaseBlockers({}, {}).includes('link: reporting'));
  assert.ok(releaseBlockers({}, {}).includes('review: screenReaderReviewed'));
  assert.ok(
    releaseBlockers(
      { reporting: '' },
      { screenReaderReviewed: 'true' },
    ).includes('review: screenReaderReviewed'),
  );
});
test('verified release inputs permit release without the deferred alternate contact', () => {
  const links = {
    discord: 'https://discord.gg/example',
    github: 'https://github.com/example',
    reporting: 'mailto:reports@example.org',
    backupReporting: null,
  };
  const reviews = Object.fromEntries(
    [
      'brandingApproved',
      'linksVerified',
      'contentApproved',
      'keyboardReviewed',
      'screenReaderReviewed',
      'accessibilityReviewed',
      'licensesAndHistoryReviewed',
      'domainVerified',
    ].map((key) => [key, true]),
  );
  assert.deepEqual(releaseBlockers(links, reviews), []);
});
