# Oxide Club

Repository: `https://github.com/oxide-club/oxideclub.dev.git`. Keep it private during development; review the complete history again before public launch.

Static PT-BR community website, implementing the approved 18 October 2026 v2 brief and the subsequent educational-philosophy amendment: Explore → Experiment → Explain. Astro + TypeScript + Markdown collections + plain CSS. No runtime backend. Default builds are non-indexable development previews, not launch-ready releases.

## Work locally

Use Node 24 LTS (or a compatible newer version).

```sh
npm ci
npm run dev
npm test
npm run check
npm run build
npm run preview
```

Browser verification:

```sh
npx playwright install chromium
npm run test:browser
# Or use an existing browser on Linux:
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
```

To verify an already-running development server (including live content-collection data), point the same browser suite at its actual URL:

```sh
SITE_TEST_URL=http://127.0.0.1:4322 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
```

After changing collection schemas or their imported validators, restart the development server and verify that URL as well as the static build. A long-running Astro development process can retain an older content schema even when a fresh build passes. Do not replace required metadata with silent empty-array fallbacks to hide stale data.

`npm test` verifies publication selection, URL validation and challenge examples against Unix `wc` in the C locale. It requires a Unix environment with `wc`. Browser tests cover axe rules, reflow, enlarged text, keyboard controls, internal links, forced colors and reduced motion. They do not replace screen-reader review or a full WCAG audit.

## Content and links

- Add Markdown under `src/content/challenges/`. Copy the first challenge's metadata structure; use a stable unique slug.
- Drafts use `draft: true` and are excluded from both lists and generated routes. Exactly one published challenge must have `featured: true`.
- Set `categories` to one or more of `build`, `investigate`, `debug`, `optimize`, `experiment`. Categories are nonexclusive and independent from `difficulty` (`beginner`, `intermediate`, `advanced`); no category implies a level. Duplicate, empty or unknown categories fail schema validation.
- Categories describe the activity: building programs/algorithms/data structures; investigating observed behavior; diagnosing bugs; measuring and optimizing implementations; or testing hypotheses. The wc challenge is one building/investigation example, not the club's entire scope.
- Define the objective, prerequisites, minimum investigation, expected outputs or evidence, verification method and optional extensions in Markdown. Outputs may be programs, measurements, explanations, fixes or technical reports. The template renders those sections without requiring code submissions or a complete program.
- `recommendedLanguage` and `environment` are optional when not applicable. If a challenge depends on a language/platform, specify them precisely. Markdown remains the canonical specification.
- Validate examples against an appropriate oracle or measurement method. Define input/output/errors for implementation tasks, and controls, observations and limits for experiments.
- Keep one canonical specification here. After deploying, moderators create the corresponding Discord forum thread with a summary and canonical URL, then add its actual `discordThreadUrl` metadata.
- Add `eventUrl` only after scheduling a real Discord event. No recording or retrospective is promised.
- For substantive corrections, set `updatedAt` and describe changes under “Esclarecimentos”. Preserve published slugs or configure redirects deliberately.
- Central community/reporting destinations live in `src/config/links.json`. Null destinations are omitted, never fabricated.
- Zine is intentionally absent. When approved writing exists, add a separate collection and routes with original-language metadata and documented author permission.

## Production and Cloudflare

`wrangler.jsonc` serves `dist/` as Workers Static Assets with custom 404 handling. No adapter or server is required. Configure the actual Cloudflare account and domain before release; no remote resources have been created.

`npm run build:production` checks every required link and the review acknowledgements in `src/config/release.json`, then generates indexable output. Never set review flags to true without completing the corresponding human review. `npm run deploy` invokes this gate before Wrangler. Keep deployments restricted to this command/workflow rather than directly deploying preview output.

The manual deployment workflow uses the GitHub `production` environment and `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets. Protect that environment and review the generated artifact before launch. CI runs checks on pushes and pull requests. Set the custom domain to `oxideclub.dev` in Cloudflare after confirming ownership and DNS; this repository does not guess zone identifiers.

See [release status](docs/RELEASE.md) for outstanding inputs and verification limits. The original website code is licensed under [MIT](LICENSE). Editorial content (including challenge specifications and copy embedded in Astro files), logos and artwork are excluded; see [licensing scope](LICENSING.md). Third-party materials retain their own licenses. The full asset-permission and repository-history review remains required before launch.

## Branding assets

The supplied vector master is `oxide-club.svg`. The header/footer use `public/branding/oxide-core.svg`, with only the outer whitespace cropped through its viewBox. Original paths and colors are preserved. PNG icons (16/32/48/180/512 px), an ICO, and a 1200×630 social image are included.

To regenerate exports, install librsvg (`rsvg-convert`) and ImageMagick (`magick`), then run `node scripts/build-branding.mjs` from the repository root. This is a maintenance command, not a CI prerequisite: generated assets are committed alongside the source. Font license notices are shipped under `public/licenses/`.
