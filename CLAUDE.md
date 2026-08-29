# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Simon Nyssen's personal website: an Astro site (blog + résumé) using the Preact integration for
interactive islands, Tailwind CSS v4, and MDX content. Deployed as a standalone Node server
(`@astrojs/node`, mode `standalone`), built as a container both via a standard Docker build and via
Nix (see "Nix / container build" below).

## Commands

Standard npm scripts (run from repo root):

- `npm run dev` / `npm start` — start the Astro dev server (`localhost:4321`).
- `npm run build` — production build to `./dist/` (server output, not static).
- `npm run build:ci` — full CI build: `astro build` → pagefind indexing → résumé PDF generation.
  This is the sequence to run if you need to fully reproduce what CI/Nix produces.
- `npm run preview` — serve the built output locally with `astro preview --host`.
- `npm run pagefind` — index `dist/client` for the pagefind search widget (must run after build,
  before the site can be search-tested).
- `npm run generate-pdf` — run `scripts/generate-pdf.js` directly (requires the preview/dev server
  already running at `localhost:4321`, since it navigates to `/resume` with Playwright).
- `npm run generate-pdf:ci` — starts the preview server, waits for it, generates the PDF, then
  tears the server down (`start-server-and-test`).
- `npm run astro -- <args>` — passthrough to the Astro CLI (e.g. `npm run astro -- check`).

There is no lint/test script and no test suite in this repo. `astro check` is the closest thing to
static verification beyond `tsc`'s strict settings.

### Nix / devshell

The repo ships a Nix flake (`flake.nix`, `nix/`) via `numtide/blueprint`, with `direnv` support
(`.envrc`). `just` is the task runner inside the devshell:

- `just setup` — installs pre-commit hooks (`pre-commit install`).
- `just dev` (alias `just start`) — same as `npm run dev`.
- `just build` — same as `npm run build:ci`.
- `just package` — builds the Docker image (`docker build .`).

`nix/packages/personal-website` builds the app with `buildNpmPackage` (using
`importNpmLock` against `package.json`/`package-lock.json` only, so unrelated source
changes don't invalidate the dependency derivation) and runs the same
build → pagefind → generate-pdf:ci sequence as CI, using a nixpkgs-provided Chromium for
Playwright instead of downloading one. `nix/packages/container` layers that output into a
`dockerTools` image whose entrypoint is `node ./dist/server/entry.mjs`.

### Pre-commit

`.pre-commit-config.yaml` enforces conventional commit messages (`conventional-pre-commit`) plus
standard hygiene hooks (trailing whitespace, EOF fixer, merge-conflict markers, large files). Run
`just setup` once per clone to install the git hooks.

## Architecture

### Content and routing

- Blog posts are Markdown files in `src/content/blog/*.md`, validated by a Zod schema in
  `src/content.config.ts` (uses the `glob` loader, not the legacy content collections API).
  Frontmatter requires `title`, `pubDate`, `description`, an `image` (`{ src, alt }`, `src` resolved
  through Astro's `image()` schema helper), and `tags` (`{ name, colorClass }[]` — `colorClass` is a
  literal Tailwind class name, e.g. for a background color, applied directly to the tag pill).
- `BlogUtils.getPostsOrderedByDateDesc()` (`src/utils/blog-utils.astro`) is the single place posts
  are fetched/sorted — use it rather than calling `getCollection('blog')` ad hoc.
- Routing is file-based under `src/pages/`: `index.astro`, `blog.astro` (listing),
  `blog/[...slug].astro` (post detail, drives `BlogPostLayout`), `resume.mdx` (uses
  `ResumeLayout` via frontmatter `layout:`), `rss.xml.js`, and `.well-known/webfinger.ts`.
- `src/pages/.well-known/webfinger.ts` is a server-rendered endpoint (`export const prerender =
  false`) implementing a WebFinger proxy: it forwards `acct:` lookups to a hardcoded list of
  `searchDomains` (currently `social.snyssen.be`) and injects OIDC issuer links for
  `authIssuers` allow-listed domains. Both lists are hardcoded in this file — update them there
  when adding a new Mastodon/auth domain. Upstream fetches are wrapped in a 5s `AbortController`
  timeout.

### Layouts (composition order)

`BaseLayout` (loads global CSS + `BaseHead`, sets `<html>`/`<body>` shell) →
`LayoutWithHeaderAndFooter` (adds `Header`/`Footer` around the slot) → page-specific layout
(`BlogPostLayout`, `ResumeLayout`). Most pages should go through
`LayoutWithHeaderAndFooter`, not `BaseLayout` directly.

- `BlogPostLayout` renders the post header (image, tags, dates), a `BlogPostToc` table of
  contents built from `MarkdownHeading[]` (structured into a tree via the `HeadingsTreeNode` model),
  and embeds a `giscus` (GitHub Discussions-backed) comment widget that is synced to the
  site's dark/light theme via `localStorage["color-theme"]` and the `#theme-toggle` button —
  see the inline scripts at the bottom of the file if touching theming or comments.
- Résumé content (`src/pages/resume.mdx`) is composed from small MDX components
  (`ResumeSection`, `TextWithIcon`, `LinkWithIcon`, `TwoColumnsLayout`, `PageBreak`) designed to
  render sensibly both on-screen and in the PDF export produced by `scripts/generate-pdf.js`
  (which hides the header/download-button/footer before printing).

### Markdown pipeline

`astro.config.mjs` sets `markdown.processor` to a `unified()` instance (from
`@astrojs/markdown-remark`, a direct dependency) rather than the deprecated
`markdown.remarkPlugins`/`rehypePlugins` fields: `remark-capitalize-headings`, then
`rehypeHeadingIds` → `rehype-external-links` (appends an external-link icon) →
`rehype-autolink-headings` (wraps headings in anchor links with an icon). The `mdx` integration is
configured with `extendMarkdownConfig: false` so MDX pages do **not** inherit this processor —
these rehype plugins inject raw HTML nodes that MDX's hast-to-JSX compiler cannot handle
(`Cannot handle unknown node 'raw'`), so MDX pages (e.g. `resume.mdx`) intentionally don't get
auto-linked headings or external-link icons; components like `LinkWithIcon`/`MarkdownLink` add
icons explicitly instead where needed. `astro-expressive-code` handles code block syntax
highlighting/copy buttons.

### Styling

Tailwind v4 via the Vite plugin (`@tailwindcss/vite`), not the classic Astro integration — config
lives in `tailwind.config.cjs` (dark mode via `.dark` class, custom fonts, gradient-animation
utilities, `@tailwindcss/typography` for the `prose` classes used in blog posts). Global CSS
(fonts, Line Awesome icon font, global styles) is imported once in `BaseLayout.astro`.

### Path aliases

`@components/*` → `src/components/*`, `@assets/*` → `src/assets/*` (defined in `tsconfig.json`).
Note `vite.resolve.tsconfigPaths: false` in `astro.config.mjs` — these aliases work through
Astro/TypeScript's own resolution, not vite-tsconfig-paths.

### Security headers

`src/middleware.ts` sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and
`Permissions-Policy` on every response. There is currently no Content-Security-Policy.

### CI/CD

- GitHub Actions (`.github/workflows/build-release.yaml`) runs on push to `main` and on PRs:
  `release-please` for versioning, then builds the container via `nix build .#container` and
  pushes to `ghcr.io`, tagging by branch/PR ref or by semver on release.
  `.github/workflows/shai-hulud-check.yml` runs a supply-chain compromise scanner on every push/PR
  to `main`/`master`.
- `renovate.json` drives automated dependency updates (most commits on `main` are
  Renovate-authored dependency bumps).
