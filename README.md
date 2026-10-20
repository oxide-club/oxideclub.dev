# Oxide Club

Repository: `https://github.com/oxide-club/oxideclub.dev.git`. Keep it private during development; review the complete history again before public launch.

Static PT-BR community website, implementing the approved 18 October 2026 v2 brief and the subsequent educational-philosophy amendment: Explore → Experiment → Explain. Astro + TypeScript + Markdown collections + plain CSS. No runtime backend. The production site is https://oxideclub.dev. Default local builds remain non-indexable development previews; `build:production` produces the indexable release.

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
- Drafts use `draft: true` and are excluded from both lists and generated routes. `featured: true` gives editorial priority on the homepage; zero or multiple highlights are supported. `FeaturedContent.astro` selects one eligible publication at build time (randomly among highlights, or among all published entries if none are highlighted). The selection stays fixed until the next build, with no browser JavaScript or layout shift. An empty catalogue omits the section. `src/lib/publications.ts` maps existing collection metadata to a shared presentation shape; add adapters there when new collections and their real routes are published, without changing the homepage.
- Set `categories` to one or more of `build`, `investigate`, `debug`, `optimize`, `experiment`. Categories are nonexclusive and independent from `difficulty` (`beginner`, `intermediate`, `advanced`); no category implies a level. Duplicate, empty or unknown categories fail schema validation.
- Categories describe the activity: building programs/algorithms/data structures; investigating observed behavior; diagnosing bugs; measuring and optimizing implementations; or testing hypotheses. The wc challenge is one building/investigation example, not the club's entire scope.
- Define the objective, prerequisites, minimum investigation, expected outputs or evidence, verification method and optional extensions in Markdown. Outputs may be programs, measurements, explanations, fixes or technical reports. The template renders those sections without requiring code submissions or a complete program.
- `recommendedLanguage` and `environment` are optional when not applicable. If a challenge depends on a language/platform, specify them precisely. Markdown remains the canonical specification.
- Validate examples against an appropriate oracle or measurement method. Define input/output/errors for implementation tasks, and controls, observations and limits for experiments.
- Keep one canonical specification here. After deploying, moderators create the corresponding Discord forum thread with a summary and canonical URL, then add its actual `discordThreadUrl` metadata.
- Add `eventUrl` only after scheduling a real Discord event. No recording or retrospective is promised.
- For substantive corrections, set `updatedAt` and describe changes under “Esclarecimentos”. Preserve published slugs or configure redirects deliberately.
- Central community/reporting destinations live in `src/config/links.json`. Null destinations are omitted, never fabricated.
- Technical notes use the `notes` collection and `/notas` routes. Only publish real, approved writing with author permission; do not add placeholder articles to the content directory.

## Publishing technical notes

Add a `.md` file to `src/content/notes/`. Required frontmatter: `title`, `slug` (unique, lowercase words separated by hyphens), `summary`, `publishedAt` (actual publication date, `YYYY-MM-DD`) and `draft` (boolean). Optional fields: `updatedAt` (actual revision date), `authors` (nonempty list of credited names) and `featured` (defaults to false). No author is inferred when omitted. Drafts require the same metadata and are excluded from listings, routes, sitemap and homepage highlights in every build, including previews.

`/notas` lists publications newest first; ties use the slug. With no published notes, it shows an intentional empty state. Each published entry generates `/notas/<slug>` automatically. There are no placeholder article routes. Notes share the build-time highlight selection with challenges through `src/lib/publications.ts`.

Start body sections at `##`: the template supplies the title and builds the table of contents from second-level headings. Use fenced code blocks with a language identifier, Markdown blockquotes, descriptive links and a final `## Referências` section with real sources. Heading anchors preserve accents: link to `#referências`, for example. For figures, use an HTML `<figure>` with an `<img>` (meaningful `alt`, explicit `width`/`height`) and `<figcaption>`; store local assets in `public/` and use root-relative paths. Code blocks remain scrollable and keyboard-focusable. Markdown is sufficient; MDX and client-side reading features are intentionally absent.

Run `npm run test:notes` (or `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:notes`) to build an empty catalogue and synthetic published/draft notes in a temporary copy, check production visibility, homepage integration, rendering, reflow and axe accessibility, then delete the copy. Fixtures never enter `src/content/notes` in the working tree. This test needs the same Chromium installation as the browser suite.

## Production and Cloudflare

`wrangler.jsonc` serves `dist/` as Workers Static Assets with custom 404 handling. No adapter or server is required. The Worker `oxideclub-dev` and custom domain `oxideclub.dev` are configured; production deployment runs through GitHub Actions.

`npm run build:production` checks every required link and the review acknowledgements in `src/config/release.json`, then generates indexable output. Never set review flags to true without completing the corresponding review. The owner-authorized `manualAccessibilityReviewDeferred` exception is documented in docs/ACCESSIBILITY.md; it does not claim completed manual checks. `npm run deploy` invokes this gate before Wrangler. Keep deployments restricted to this command/workflow rather than directly deploying preview output.

The manual deployment workflow uses the GitHub `production` environment and `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` secrets. Protect that environment and review the generated artifact before launch. CI runs checks on pushes and pull requests. The custom domain `oxideclub.dev` is declared in wrangler.jsonc; this repository does not embed account or zone identifiers.

See [release status](docs/RELEASE.md) for outstanding inputs and verification limits. The original website code is licensed under [MIT](LICENSE). Editorial content (including challenge specifications and copy embedded in Astro files), logos and artwork are excluded; see [licensing scope](LICENSING.md). Third-party materials retain their own licenses. The full asset-permission and repository-history review remains required before launch.

## Branding assets

The supplied vector master is `oxide-club.svg`. The header/footer use `public/branding/oxide-core.svg`, with only the outer whitespace cropped through its viewBox. Original paths and colors are preserved. PNG icons (16/32/48/180/512 px), an ICO, and a 1200×630 social image are included.

To regenerate exports, install librsvg (`rsvg-convert`) and ImageMagick (`magick`), then run `node scripts/build-branding.mjs` from the repository root. This is a maintenance command, not a CI prerequisite: generated assets are committed alongside the source. Font license notices are shipped under `public/licenses/`.
