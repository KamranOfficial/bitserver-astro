# BitsServer IT Lab

The BitsServer marketing site, migrated from static HTML to Astro.

## Commands

- `npm run dev` — run a local development server.
- `npm run build` — regenerate the Astro pages from `legacy/` and build the production site.
- `npm run preview` — build and preview the production output.

## Editing content

The original pages are retained in `legacy/` as the editable source of truth. `npm run build` converts them into `src/pages/` before Astro builds the site. Shared navigation and footer markup is stored in `legacy/includes/` and is compiled into every page, so it no longer depends on the browser-side include loader.

Static files such as CSS, JavaScript, favicons, robots.txt, sitemap.xml, and deployment headers live in `public/`.
