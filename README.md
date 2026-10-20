# Oxide Club

Source for [oxideclub.dev](https://oxideclub.dev), the Oxide Club community website. The site is live and published in Brazilian Portuguese, with programming challenges, technical notes and community information built around **Explorar → Experimentar → Explicar**.

Built with Astro, TypeScript, Markdown content collections and plain CSS. Pages are generated as static files and hosted on Cloudflare Workers Static Assets; there is no runtime backend.

## Local development

Use Node.js 24, matching CI, and Git. Development, checks and builds fetch the latest public challenge definitions before starting.

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
| `src/content/`                                   | Markdown technical notes                                              |
| `src/content.config.ts`                          | Content schemas and validation                                        |
| `src/components/`, `src/layouts/`, `src/styles/` | Shared interface and styling                                          |
| `src/config/`                                    | Site metadata, community links and production review acknowledgements |
| `src/lib/`                                       | Content selection, taxonomy and production validation                 |
| `public/`                                        | Static assets, branding exports and font license notices              |
| `scripts/`, `tests/`                             | Maintenance scripts and automated checks                              |
| `.github/workflows/`                             | CI and manual production deployment                                   |

## Publishing content

Markdown is the canonical specification for challenges and notes. See [CONTRIBUTING.md](CONTRIBUTING.md) for the community's contribution process and editorial expectations.

Both collections require `title`, `slug`, `summary`, `publishedAt` and `draft`. Use stable, unique, lowercase slugs with hyphens and actual publication dates in `YYYY-MM-DD` format. Optional shared fields are `updatedAt` and `featured` (defaults to false). Drafts are excluded from listings, generated routes, sitemaps and homepage highlights, including preview builds.

The homepage chooses one published challenge or note at build time, randomly among entries marked `featured: true`, or among all published entries if none are featured. The selection stays fixed until the next build. An empty catalogue omits the section.

### Challenges

Definitions and public tests are maintained in [oxide-club/challenges](https://github.com/oxide-club/challenges). Submit challenge changes there, following its contribution guide. Each definition lives at `<id>/index.md`, where the directory and `slug` share a stable `NNN-name` identifier.

The website reads only these definition files from an ignored checkout at `.content/challenges/`; repository READMEs, tests and fixtures do not become pages. Do not edit the generated checkout. Metadata is validated by [the content schema](src/content.config.ts).

When a commented implementation has been published, its optional `referenceUrl` points to `https://github.com/oxide-club/solutions/tree/main/<id>/<language>`. The page renders the study invitation at the end of the challenge. Omit this field when no implementation is available.

### Technical notes

Add a `.md` file under `src/content/notes/`. Notes may also include `authors`, a nonempty list of credited names; no author is inferred when omitted. Publish approved writing with author permission.

Published notes appear at `/notas/<slug>` and in the `/notas` catalogue, newest first. With no published notes, the catalogue displays an empty state.

Start body sections at `##`: the template supplies the title and builds a table of contents from second-level headings. Use language identifiers on fenced code blocks, descriptive links and a final `## Referências` section with real sources. Heading anchors preserve accents, such as `#referências`.

For figures, use an HTML `<figure>` with an `<img>` and `<figcaption>`. Supply meaningful alt text and explicit image dimensions; place local assets in `public/` and use root-relative paths. Content uses Markdown, without MDX.

### Community links

Shared community and reporting destinations live in `src/config/links.json`. Missing destinations are omitted from the interface; add links only when the destination exists.

## Fetching challenge content

`npm run dev`, `npm run check`, `npm run build` and `npm run build:production` fetch the latest `main` from the public challenges repository. To fetch explicitly:

```sh
npm run content:sync
```

The fetch prints the exact commit used. A fetch failure stops the command; an older cached checkout is not silently substituted. Local edits in the generated checkout also stop synchronization so work is not discarded.

CI and the deployment workflow fetch once at the start and export `CHALLENGES_COMMIT` for subsequent steps. This is a snapshot for that workflow run, not a manually maintained pin: validation, browser tests and the production build all use the same fetched content. A new workflow run picks up the latest `main` again. Standalone local commands fetch the latest by default.

Merging content does not deploy the website by itself; the next deployment workflow publishes it. Notes remain local to this repository. Legacy challenge URLs are redirected by Cloudflare using `public/_redirects`; Astro's local preview does not emulate those edge rules.

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

Original website code is licensed under [MIT](LICENSE). Editorial content, including challenge specifications and copy embedded in Astro files, logos and artwork are outside that scope. See [LICENSING.md](LICENSING.md) for details and material provenance. Third-party materials retain their own licenses.
