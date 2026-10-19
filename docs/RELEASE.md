# Implementation and release status

Implemented from the approved v2 brief on 18 October 2026, with the subsequent Explore → Experiment → Explain amendment. This is a local development preview, not a public launch.

## Delivered

- Static Astro/TypeScript homepage, challenge catalogue, canonical challenge detail, conduct page, and 404.
- PT-BR copy, Modern Systems Lab dark design, responsive navigation, local Inter/IBM Plex Mono fonts, and the supplied vector Oxide Core paired with the Oxide Club wordmark.
- One `oxide-wc` challenge combining the user’s beginner-friendly text with incremental milestones, exact output rules, testing guidance, optional robustness investigations and participation before completion. Mandatory examples remain ASCII and have verified counts. No invented extra challenges, events, Zine posts or activity history.
- Source-to-execution section removed at the user’s request. Homepage section numbering updated; geographic references replaced with student origins and openness to remote participation.
- Actual user-supplied Discord and GitHub links, central validated configuration, guarded production build, preview noindex/robots, canonical and social-image metadata, sitemap.
- CI and manual Cloudflare deployment workflow; publishing and contribution documentation.

## Educational-philosophy amendment

Homepage, catalogue, challenge template, site/share metadata and contribution instructions now describe practical exploration of computing and systems programming. Reconstruction is one valid activity, not the defining method. Outcomes may include programs, experiments, measurements, bug fixes, explanations or technical reports.

Challenge categories are nonexclusive and independent of difficulty: build, investigate, debug, optimize and experiment. The schema validates category values and uniqueness; wc uses build + investigate. Language and environment are optional when not relevant to a challenge. Categories appear as simple text labels; no filters, new routes, placeholder challenges or infrastructure were added. The user-edited wc body, visual direction, navigation, C-first pilot and Discord/Oxide Live responsibilities were preserved.

## Verification evidence

- `npm test`: 16 tests passed after the philosophy amendment, covering content selection, URL validation, release-gate requirements, category/difficulty independence (all 15 combinations plus overlapping categories and invalid metadata), and ten fixtures against `LC_ALL=C wc`.
- `npm run check`: zero errors, warnings or hints.
- `npm run build`: five static HTML pages plus robots and sitemap generated.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser`: 25 tests passed after the accessibility and audience-positioning revision. Axe WCAG A/AA tags checked on home, catalogue, detail, conduct and 404; no violations in that run.
- All five pages tested for document overflow at 320, 375, 768 and 1440 CSS px. Enlarged-text stress check at 320 px passes. Code regions scroll independently when necessary.
- Keyboard checks cover skip-link activation, mobile disclosure open/Escape, focus transfer, cross-page section links, and visible focus while tabbing through all five pages at mobile and desktop widths. Automated checks are not a complete manual keyboard audit.
- Forced-colors screenshot and reduced-motion behavior checked. Desktop/mobile screenshots inspected for layout; screenshot artifacts live in ignored `test-results/`.
- Initial checks found insufficient code-comment contrast and mobile article-grid overflow; both were corrected and the suite rerun.
- Independent source review found a missing-key release bypass and wc-specific reusable-card assumptions; both corrected. `npm run build:production` was verified to refuse current incomplete release inputs.

## Still required before launch

1. Branding integration is complete: the supplied oxide-club.svg is used faithfully in header/footer; SVG/PNG/ICO icons and a 1200×630 social image are generated. Symbol exports at 16/32/48 px and the social image were visually inspected. The supplied artwork and approved direction were preserved; brandingApproved is true following integration and visual verification.
2. The user supplied report@oxideclub.dev as the private administration reporting contact; it is configured in the conduct page and footer. Community readiness was confirmed by the user on 19 October 2026. An alternate reporting person is explicitly deferred by the user and is no longer a production-gate requirement. The conduct page transparently states that reports go to the administrator and independent review is unavailable. Do not use public issues for sensitive reports.
3. Editorial approval was given on 19 October 2026, including the user-edited challenge titled “#1: Construa seu wc”; those edits were preserved and contentApproved is now true. Community onboarding readiness is confirmed; create the official moderator forum thread after publication and add its permalink. There is no event link until a real event exists.
4. Complete an actual screen-reader review, full manual keyboard/focus audit, browser text-zoom check, and manual hover/focus/forced-colors review. Automated axe success is not a WCAG conformance claim.
5. MIT was selected by the user and applied to original website code, with scope documented in LICENSING.md. Font license notices are now shipped in public/licenses/. Finish the review of author-specific prose/art permissions. License selection is complete; the combined licenses/history review remains pending.
6. The user initialized Git on 19 October 2026. The destination https://github.com/oxide-club/oxideclub.dev.git was confirmed private and empty before the initial push. The initial source files were checked for common credential patterns; local credential/configuration paths are ignored. Review the complete history and asset permissions again before making the repository public.
7. Configure Cloudflare account/secrets/domain, verify DNS, actual 404 HTTP behavior and redirects in Workers, verify sharing-card rendering in production. Discord invite API confirmed guild “Oxide Club” and GitHub organization returned HTTP 200 on 19 October 2026.
8. Record review approvals in `src/config/release.json` only after completion, then run the protected deployment workflow. No deployment or repository visibility change has occurred.

## Technical references

Implementation checked against [Astro content collections](https://docs.astro.build/en/guides/content-collections/) and [Cloudflare static generation routing](https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/). Dependencies are locked in package-lock.json; TypeScript 6 is used to satisfy Astro checker's peer range.

## Development preview correction — 19 October 2026

The long-running development process on port 4322 retained the previous content schema, so its collection entries lacked `categories` even though the Markdown and freshly built static site contained them. The failure was reproduced against that live URL before restarting the identified process. No fallback categories were fabricated and no challenge text was changed.

Playwright now accepts `SITE_TEST_URL` to verify a running development server directly, in addition to the default static-preview checks. The page-focus test stops at Astro's development-only toolbar, which is outside the published site. Schema changes require restarting and checking the actual development URL, not only the static build.

## Accessibility and audience revision — 19 October 2026

See [ACCESSIBILITY.md](ACCESSIBILITY.md) for the expanded checks and remaining manual review. Text-spacing and 200% text stress tests exposed heading/grid overflow and header wrapping problems; wrapping now preserves the content without hiding overflow. The mobile menu follows the actual header height. Actual screen-reader and browser-native zoom checks remain outstanding.

The homepage now leads with “Explore computação em profundidade.” Hero, method, Oxide Live, catalogue, participation, detail invitation, footer, SEO and social image emphasize technical investigation, evidence, engineering choices and knowledge exchange across experience levels. The wc challenge remains beginner-classified; its user-edited requirements are unchanged. C remains the initial pilot language. No additional challenges, articles, events or activities are implied to exist. Zine stays unexposed until real content exists. The existing byte illustration is preserved; the previously removed compilation section was not reintroduced in this editorial change.
