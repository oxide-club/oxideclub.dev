# Oxide Club

Source for [oxideclub.dev](https://oxideclub.dev), the Oxide Club community website. The site is live and published in Brazilian Portuguese, with programming challenges, technical notes and community information built around **Explorar → Experimentar → Explicar**.

Built with Astro, TypeScript, Markdown content collections and plain CSS. Pages are generated as static files and hosted on Cloudflare Workers Static Assets; there is no runtime backend.

## Local development

Use Node.js 24, matching CI, and Git. Development, checks and builds fetch the latest public challenge definitions and technical notes before starting.

```sh
npm ci
npm run dev
```

Astro prints the local development URL. To build and preview the static output:

```sh
npm run build
npm run preview
```

Default builds are non-indexable previews. Production builds use a separate command that validates the publication requirements and enables indexing.

## Checks

```sh
npm test
npm run check
npm run build
npx playwright install chromium
npm run test:browser
npm run test:notes
```

- `npm test` checks content selection, URL validation, production gates, challenge taxonomy and fetching public challenge content. Its isolated repository fixtures require Git.
- `npm run check` runs Astro and TypeScript checks.
- `npm run test:browser` checks the built site with Playwright and axe, including navigation, internal links, keyboard behavior, reflow, enlarged text, forced colors and reduced motion.
- `npm run test:notes` builds temporary empty, published and draft note catalogues to check visibility, rendering and homepage integration. Fixtures do not enter the working content directory.

Both browser suites need Chromium. To use an existing Linux installation, prefix either command with `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium`.

To check an already-running development server, use its actual URL:

```sh
SITE_TEST_URL=http://127.0.0.1:4322 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:browser
```

Restart the development server after changing collection schemas or their imported validators, then check that URL as well as a fresh build. Astro can retain an older schema in a long-running development process.

Automated checks do not replace manual accessibility review. See [accessibility testing and outstanding reviews](docs/ACCESSIBILITY.md).

## Repository layout

| Path                                             | Purpose                                                               |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| `src/pages/`                                     | Homepage, challenge and note routes, conduct page, 404 and robots.txt |
| `src/content.config.ts`                          | Content schemas and validation                                        |
| `src/components/`, `src/layouts/`, `src/styles/` | Shared interface and styling                                          |
| `src/config/`                                    | Site metadata, community links and production review acknowledgements |
| `src/lib/`                                       | Content selection, taxonomy and production validation                 |
| `public/`                                        | Static assets, branding exports and font license notices              |
| `scripts/`, `tests/`                             | Maintenance scripts and automated checks                              |
| `.github/workflows/`                             | CI and manual production deployment                                   |

## Library

The static `/biblioteca` directory is maintained in `src/lib/library.ts`.
Each typed category owns its ordered resource list; authors and resource types
remain in the data while the page displays titles, language, availability and
occasional editorial notes. `gratuito` refers to the linked online material,
even when a printed edition or optional hardware is sold separately.

The catalogue contains 40 resources across eight categories. Link review
on 2026-10-20 retained the approved works: the GNU C and Make links use their
official `manual/html_node/` indexes because the parent directories returned 403.
*Structured Computer Organization* links to the user-selected English sixth
edition PDF hosted by St. Xavier's College, Jaipur. *Entendendo Algoritmos*
links to Novatec's Brazilian second edition. Both destinations were verified.

## Publishing content

Markdown is the canonical specification for challenges and notes. See [CONTRIBUTING.md](CONTRIBUTING.md) for the community's contribution process and editorial expectations.

Both collections require `title` and `summary`, and published entries require `publishedAt`. Challenges retain their existing `slug` and `draft` fields. Notes derive their identifier from their directory, omit `slug`, and default `draft` to false; drafts may omit the publication date. Use actual dates in `YYYY-MM-DD` format. Optional shared fields are `updatedAt` and `featured` (defaults to false). Drafts are excluded from listings, generated routes, sitemaps and homepage highlights, including preview builds.

The homepage chooses one published challenge or note at build time, randomly among entries marked `featured: true`, or among all published entries if none are featured. The selection stays fixed until the next build. An empty catalogue omits the section.

### Challenges

Definitions and public tests are maintained in [oxide-club/challenges](https://github.com/oxide-club/challenges). Submit challenge changes there, following its contribution guide. Each definition lives at `<id>/index.md`, where the directory and `slug` share a stable `NNN-name` identifier.

The website reads only these definition files from an ignored checkout at `.content/challenges/`; repository READMEs, tests and fixtures do not become pages. Do not edit the generated checkout. Metadata is validated by [the content schema](src/content.config.ts).

#### GitHub resources

The optional `github` metadata controls the compact **Recursos e implementações** section. It accepts `challenge` (boolean), `solutions` (language identifiers), and `community` (boolean); omitted fields default to false or an empty list. No metadata or an empty configuration renders no section.

Declare `github` directly in the challenge's `<canonical-id>/index.md` frontmatter in [oxide-club/challenges](https://github.com/oxide-club/challenges). The fetched Markdown is the sole source for resource availability, validated by the Astro schema. There are no website-local overrides or identifier mappings.

For a future challenge, verify its published resources, then configure only those resources in its frontmatter. For example, `001-wc/index.md` declares:

```yaml
github:
  challenge: true
  solutions: [c]
  community: true
```

Repository organization, names, default branches and community index location live in `src/config/github.mjs`. Both default branches were verified as `main` on 2026-10-20. `challengeResources()` constructs specification URLs as `<challenges>/tree/<branch>/<entry.id>` and implementation URLs as `<solutions>/tree/<branch>/<entry.id>/<language>`. It never assumes the recommended language has an implementation.

To add a published implementation, add its directory identifier to the challenge's `solutions` array. For a language not yet registered, first add its directory identifier and readable label to `languageLabels` in `src/lib/challenge-resources.mjs` (for example, `python: 'Python'`). The schema derives its allowed identifiers from that registry; the component needs no changes. Duplicate or unknown identifiers fail validation. Publish metadata changes in the challenges repository; the next website content sync picks them up. Restart a running development server after schema changes.

The actual community convention is the root `COMMUNITY.md` with canonical challenge headings. Enable `community` only after verifying the corresponding heading; links use `blob/<branch>/COMMUNITY.md#<entry.id>`. Do not enable links to a generic index without a matching challenge section.

Verification on 2026-10-20: challenges revision `ade7c127f68f8ee1730ac5b82ac5b3c06e85003e` contains `001-wc/` and public tests; solutions revision `c04d6341c28fa46c7718c7d32cb543cfb4311de1` contains `001-wc/c/` and `COMMUNITY.md#001-wc`. Rust and C++ directories are absent and disabled. The community section exists but has no participant submissions yet. Verification is manual; no GitHub requests occur when rendering these resources.

Resource availability is declared only in challenge frontmatter. The educational Markdown and canonical routes remain unchanged. Publish the challenge frontmatter migration before deploying this website change; there is no website-local fallback.

### Technical notes

[oxide-club/notes](https://github.com/oxide-club/notes) is the canonical source. Its README, contribution guide, CC BY 4.0 license and draft template describe the editorial process. Notes cover Computer Science broadly and need not relate to a challenge.

Each note lives at `<note-id>/index.md`; the lowercase kebab-case directory defines `/notas/<note-id>/`. Do not add a `slug` field. Documentation, `docs/`, and `templates/` are excluded. The schema requires a nonempty `title` and `summary`, plus `publishedAt` for published notes. `draft` defaults to false; `updatedAt`, `topics`, `authors` (nonempty when present), and `featured` are optional. Drafts never receive public pages or asset routes.

To write and preview a note before pushing it:

```sh
# In your notes checkout:
mkdir -p my-investigation
cp templates/note.md my-investigation/index.md
# Edit the template, keeping draft: true while writing.

# In the website checkout:
NOTES_SOURCE=/absolute/path/to/notes npm run dev
```

Drafts are validated but excluded from routes even in local previews. To inspect the rendered article, temporarily use `draft: false` with a valid `publishedAt` in your local checkout; restore `draft: true` before submitting unfinished work. `NOTES_SOURCE` reads directly from the checkout, including uncommitted changes, without copying or modifying it. It is forbidden in CI and production. Use the same environment variable for `npm run check` or `npm run build` when testing local notes. Production builds always use the public repository snapshot.

Use Markdown headings starting at `##`, fenced code blocks, tables, links and images with descriptive alt text. The existing article layout supplies the title, table of contents, highlighting, attribution, source link and CC BY 4.0 notice. No mathematical renderer is added; there is no current content requiring one.

Place images and supplementary files in `<note-id>/assets/`. Use `![Description](./assets/diagram.png)` and `[Data](./assets/results.csv)`. Allowed file types are PNG, JPEG, WebP, GIF, AVIF, PDF, TXT, CSV and JSON; nested asset directories are supported with simple letters, digits, dots, underscores and hyphens in filenames. Diagrams can be exported to PNG/WebP. SVG, HTML, JavaScript, symlinks and raw HTML in notes are rejected. Code fences are displayed, never executed. Relative links to `../other-note/index.md#heading` become website links; root-relative site links and HTTPS links also work. Review external sources, asset contents, licenses and technical claims before merge.

Only published notes' assets receive static routes at `/notas/<note-id>/assets/<file>`. Neither `.git` nor the full content checkout is copied into output. The notes Markdown plugin uses Astro's existing Sätteri processor, declared directly as a dependency to configure its native API.

Published notes appear newest first in `/notas/` and can appear in the homepage's existing featured-content section. An empty repository is valid and displays the existing empty state. No placeholder articles are published.

### Community links

Shared community and reporting destinations live in `src/config/links.json`. Missing destinations are omitted from the interface; add links only when the destination exists.

## Fetching canonical content

`npm run dev`, `npm run check`, `npm run build` and `npm run build:production` fetch the latest `main` from both public content repositories (`challenges` and `notes`). To fetch explicitly:

```sh
npm run content:sync
```

The shared sync script prints each exact commit used. Challenges are cached at `.content/challenges/` and notes at `.content/notes/`; both are ignored, generated checkouts, not independently maintained content copies. A fetch failure stops the command; an older cached checkout is not silently substituted. Local edits in the generated checkout also stop synchronization so work is not discarded.

CI and the deployment workflow fetch once at the start and export `CHALLENGES_COMMIT` and `NOTES_COMMIT` for subsequent steps. This is a snapshot for that workflow run, not a manually maintained pin: validation, browser tests and the production build all use the same fetched content. A new workflow run picks up the latest `main` again. Standalone local commands fetch the latest by default.

There is no cross-repository deployment trigger or new token. After a reviewed note is merged, a maintainer manually runs the existing **Deploy production** workflow in the website repository. Merging content does not deploy the website by itself; the next deployment workflow publishes it. Notes follow the same publication process as challenges. Legacy challenge URLs are redirected by Cloudflare using `public/_redirects`; Astro's local preview does not emulate those edge rules.

## Deployment

Production is hosted at **https://oxideclub.dev**. [wrangler.jsonc](wrangler.jsonc) configures the `oxideclub-dev` Worker, custom domain and static assets from `dist/`, including custom 404 handling.

To publish an update, run the **Deploy production** workflow from GitHub Actions. Deployment is manually triggered; pushes and pull requests run the **Check website** workflow. The deployment workflow runs unit tests, Astro checks, the preview build and both browser suites before building and deploying production output.

The workflow uses the GitHub `production` environment with these secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

For a production build without deploying:

```sh
npm run build:production
```

For a local deployment with Cloudflare credentials configured:

```sh
npm run deploy
```

Both commands run `scripts/release-check.mjs`, which validates required links and review acknowledgements in `src/config/release.json`. The deploy command then rebuilds indexable output and invokes Wrangler. Use the workflow or `npm run deploy` to publish so preview output is not deployed accidentally. A local deployment does not run the full test suite; run the checks above first.

Keep review acknowledgements accurate. The existing `manualAccessibilityReviewDeferred` exception allows publication while the three manual accessibility review flags remain false. The authorization and remaining work are recorded in [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md).

## Branding assets

The vector master is `oxide-club.svg`. The header and footer use `public/branding/oxide-core.svg`, with outer whitespace cropped through its viewBox while preserving the original paths and colors. Generated assets include PNG icons, an ICO and a 1200×630 social image.

To regenerate exports, install librsvg (`rsvg-convert`) and ImageMagick (`magick`), then run:

```sh
node scripts/build-branding.mjs
```

Generated assets are committed alongside the source; regeneration is a maintenance task, not a CI prerequisite. Font license notices are in `public/licenses/`.

## License

Original website code is licensed under [MIT](LICENSE). Technical note prose and documentation from `oxide-club/notes` use CC BY 4.0, subject to their source notices. Challenge specifications, other editorial copy, logos and artwork remain outside the website code’s MIT scope. See [LICENSING.md](LICENSING.md) for details and material provenance. Third-party materials retain their own licenses.
