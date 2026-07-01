# AGENTS.md

## Project Overview

This project is a Vite + React site for exploring Chinese words, idioms, cultural terms, emotional nuance, and multilingual context. It is deployed under the `/chinese/` base path and also generates static HTML routes for word and emotion pages for SEO/social previews.

The Vite app source root is `src/`, while GitHub Pages deployment files are synced to the repository root after build.

## Project Structure

- `src/index.html` - Vite HTML template, SEO defaults, favicon, OG/Twitter metadata, JSON-LD, and Umami script.
- `src/main.jsx` - React entry point.
- `src/App.jsx` - main app state, route detection, search, pagination, locale/theme controls, daily words, and analytics events.
- `src/index.css`, `src/styles.css`, `src/App.css` - global styling and Tailwind CSS output/source styles.
- `src/components/` - UI components:
  - `Header.jsx` - top navigation and anchor links.
  - `Hero.jsx` - first screen and primary search entry.
  - `SearchPanel.jsx` - search, autocomplete, prompt/popular word actions.
  - `ExpressionCard.jsx` - result card.
  - `WordPage.jsx` - individual word detail page.
  - `EmotionPage.jsx` - emotion/category listing page.
  - `DailyWord.jsx` - daily/random word section.
  - `Pagination.jsx` - result pagination.
  - `ThemeToggle.jsx` - light/dark toggle.
- `src/data/` - source data and parser:
  - `Chinese-teaching.txt` - primary content source.
  - `teachingDatabase.js` - parses the text file into app entries.
- `src/lib/` - app helpers:
  - `routes.js` - `/chinese/`, word, and emotion route helpers.
  - `dailyWord.js` - Taipei-date daily word selection.
  - `analytics/umami.js` - pageview and event tracking wrapper.
- `src/i18n.js` - localized UI copy.
- `scripts/` - build-time static generation:
  - `generate-sitemap.mjs` - builds `public/sitemap.xml`.
  - `generate-static-pages.mjs` - builds static `word/*/index.html`, `emotion/*/index.html`, `404.html`, and per-word SEO metadata from `dist/index.html`.
  - `sync-dist-to-root.mjs` - copies deployable `dist` output back to repository root for GitHub Pages.
- `public/` - static assets copied into `dist`.
- `dist/` - generated Vite build output.
- Root `index.html`, `404.html`, `assets/`, `word/`, `emotion/`, `sitemap.xml`, `robots.txt`, `favicon.svg`, `icons.svg`, `logo.png`, `ogimage.jpg` - generated/synced deploy files used by GitHub Pages.

## Tech Stack

- Frontend: React 19, Vite 8.
- Styling: Tailwind CSS 4 via `@tailwindcss/vite`, plus project CSS.
- Motion: `framer-motion`.
- Icons: `lucide-react`.
- Analytics: Umami.
- Linting: ESLint 10 with React Hooks and React Refresh rules.
- Deployment model: static GitHub Pages site served from `/chinese/`.

## Environment Variables

- `VITE_UMAMI_SCRIPT_SRC` - Umami script URL used by the HTML template if wired in future changes.
- `VITE_UMAMI_WEBSITE_ID` - Umami website ID. The app currently falls back to `955da1bd-cc90-4cee-88ee-1ac182d6cb42`.
- `VITE_UMAMI_HOST_URL` - optional Umami host URL.

The app should continue rendering if Umami is unavailable. Tracking helpers return `false` instead of throwing.

## Change Guidelines

- Keep `vite.config.js` `base: '/chinese/'` and `src/lib/routes.js` `siteBase = '/chinese'` in sync.
- Remember that Vite `root` is `src/`. Paths in scripts generally use repository root, while Vite assets resolve from `src/` and `public/`.
- Do not hand-edit generated root deploy files unless fixing an immediate deployment issue. Prefer changing source files/scripts, then running `npm run build`.
- Be careful with `npm run build`: it uses a timestamped asset hash and `sync-dist-to-root.mjs`, so it will rewrite root `assets/`, `index.html`, `404.html`, `word/`, `emotion/`, and sitemap files.
- If `index.html` changes its asset hashes, make sure the matching root `assets/` files are committed too. A mismatch causes GitHub Pages to show a blank white page.
- Preserve static SEO behavior in `scripts/generate-static-pages.mjs` when changing routes, metadata, or word page content.
- Keep per-word metadata customized:
  - title: `${entry.term}｜${entry.category} - 中文語境`
  - description: `「${entry.term}」是什麼意思？了解這個${entry.category}的文化脈絡與情感意涵。`
- When changing parsing rules, update both runtime parsing in `src/data/teachingDatabase.js` and build-time parsing in `scripts/generate-static-pages.mjs` / `scripts/generate-sitemap.mjs` if the route set or SEO pages depend on the same logic.
- Keep route slugs encoded with `encodeURIComponent`; use `routeSegment()` logic for static directory names that may contain `/`.
- Use Traditional Chinese for user-facing site copy unless the surrounding content intentionally uses another language.
- Keep analytics event names stable unless intentionally migrating dashboards.
- Avoid adding heavy client dependencies; the app ships one main bundle and build output size matters.

## Content And Routing Notes

- Main content lives in `src/data/Chinese-teaching.txt`.
- Entries are separated by lines of at least eight underscores.
- `teachingDatabase.js` infers term, category, emotions, Chinese/English/French descriptions, examples, and searchable text.
- Routes supported by the SPA and static pages:
  - `/chinese/`
  - `/chinese/word/<encoded-term>/`
  - `/chinese/emotion/<encoded-emotion>/`
- `404.html` is generated from the app shell so GitHub Pages can fall back to the SPA.

## Local Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Preview the production build after building:

```bash
npm run preview
```

## Acceptance Commands

For source code changes:

```bash
npm run lint
npm run build
```

For content, route, SEO, or static-generation changes:

```bash
npm run lint
npm run build
```

Then inspect the generated diff carefully, especially:

```bash
git status --short
git diff --stat
```

For documentation-only changes:

```bash
npm run lint
```

`npm run build` is still the full validation command, but it rewrites generated deploy assets because of the timestamped build stamp.

## Manual QA Checklist

- Open `/chinese/` and confirm the page is not blank.
- Confirm the JS and CSS files referenced by root `index.html` exist under root `assets/`.
- Search for a Chinese term and confirm results, autocomplete, pagination, and cards work.
- Open a word route such as `/chinese/word/<term>/` and confirm detail content renders.
- Open an emotion/category route and confirm filtered entries render.
- Toggle language and theme.
- Confirm Daily Word / popular word refresh works.
- Confirm Umami failures do not break the app.
- For SEO changes, inspect at least one generated `word/*/index.html` and confirm `<title>`, meta description, `og:title`, `og:description`, canonical URL, and JSON-LD fields are customized.

## Git And Deployment Notes

- The repository root contains deploy artifacts. Generated diff churn is expected after `npm run build`.
- Commit generated deploy files together with source changes when the site is meant to update GitHub Pages.
- If the live site is white, first check whether `/chinese/assets/*.js` and `/chinese/assets/*.css` referenced by the live `index.html` return HTTP 200.
- Network-dependent actions such as GitHub push or remote URL checks may need sandbox escalation.
