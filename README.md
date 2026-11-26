# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Analytics

This app includes Umami Analytics via a script tag in `src/index.html`.
Umami automatically tracks SPA pageviews when the script is loaded once in the root layout.

Set these environment variables before building or deploying:

- `VITE_UMAMI_SCRIPT_SRC`
- `VITE_UMAMI_WEBSITE_ID`
- `VITE_UMAMI_HOST_URL` (optional)


## Search indexing checks

`npm run build` generates crawlable HTML for the home, word and emotion pages,
then syncs it to the repository root for GitHub Pages. The static content and
client application share the teaching-data parser and encoded route helpers.

Run `npm run check:seo` after building to verify every sitemap URL has a matching
static page, self-referencing canonical, parseable JSON-LD and available assets.
The generated 404 page is `noindex` and has no homepage canonical.

Only canonical primary URLs are listed in the sitemap. Language-query switches
remain available in the app; hreflang annotations are omitted until independently
indexable localized HTML variants are generated. Sitemap lastmod is derived from
the source content file, not the build date.

After deploying, submit `https://fishpka.github.io/chinese/sitemap.xml` in Google
Search Console and inspect representative home, word and emotion URLs. Local
validation cannot determine Google's selected canonical or guarantee indexing.
