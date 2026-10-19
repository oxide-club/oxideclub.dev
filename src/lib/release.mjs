import { validateLinks } from './content.mjs';
const requiredLinks = ['discord', 'github', 'reporting'];
const requiredReviews = [
  'brandingApproved',
  'linksVerified',
  'contentApproved',
  'keyboardReviewed',
  'screenReaderReviewed',
  'accessibilityReviewed',
  'licensesAndHistoryReviewed',
  'domainVerified',
];
const manualAccessibilityReviews = new Set([
  'keyboardReviewed',
  'screenReaderReviewed',
  'accessibilityReviewed',
]);
/** @param {Record<string, string | null>} links @param {Record<string, unknown>} reviews */
export function releaseBlockers(links, reviews) {
  validateLinks(links);
  return [
    ...requiredLinks
      .filter((key) => typeof links[key] !== 'string' || !links[key]?.trim())
      .map((key) => `link: ${key}`),
    ...requiredReviews
      .filter(
        (key) =>
          reviews[key] !== true &&
          !(
            reviews.manualAccessibilityReviewDeferred === true &&
            manualAccessibilityReviews.has(key)
          ),
      )
      .map((key) => `review: ${key}`),
  ];
}
