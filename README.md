# BitsServer IT Lab — Astro + Three.js

Immersive 3D marketing site for [bitsserver.com](https://bitsserver.com), built with **Astro 5** (static output) and **Three.js**, tuned for **Cloudflare** deployment.

## What's inside

| Piece                       | Detail                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Hero WebGL scene            | Instanced data-centre rack field (breathing rack heights, glowing wireframe overlay, status LEDs), orbiting compute core, rising data-stream particles, UnrealBloom post-processing, mouse parallax + scroll-driven camera dolly |
| Infrastructure WebGL scene  | Point-cloud globe, atmospheric rim shader, 14 network regions, pulsing markers and animated arc traffic between hubs   |
| Services                    | 8 capability cards with real 3D `rotateX/rotateY` tilt and cursor-tracked glow                                          |
| Sections                    | Hero, Services, Infrastructure, Process, Free Tools, Testimonials, Contact, Footer, custom 404                          |
| Performance                 | Lazy `import()` for the globe, `IntersectionObserver` pause when off-screen, DPR clamped, mobile-reduced geometry, full `prefers-reduced-motion` fallback |
| Contact page (`/contact`)   | Dedicated 3D "signal beacon" scene (broadcast rings, uplink beams, drifting motes), WhatsApp / email / phone channel cards, dual-submit form (API + WhatsApp), offices and socials |
| Legal Center (`/legal/`)    | Hub plus 7 policy pages — Privacy, Cookies, Terms, Disclaimer, DMCA, Refund, Accessibility — with a sticky document sidebar; copy mirrors the published bitsserver.com policies |
| URL format                  | `build.format: 'file'` so routes emit as `/contact.html` and `/legal/privacy-policy.html`, matching the existing sitemap; `scripts/postbuild.mjs` also emits `/legal/index.html` |
| Accessibility               | Skip link, focus-visible rings, ARIA labels, semantic landmarks, reduced-motion support                                 |

## Local development

Requires **Node 22.12+**.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
```

`npm run build:preview` additionally rewrites `/_astro/...` asset URLs to relative paths — only needed when serving the bundle from a nested path. Use plain `npm run build` for production.

## Deploying to Cloudflare

### Option A — Cloudflare Pages (recommended, includes the contact API)

1. Push this repository to GitHub/GitLab.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node version: `22`
4. The `functions/` directory is picked up automatically and serves `POST /api/contact`.
5. Optional environment variables for email delivery via Resend:
   - `RESEND_API_KEY`
   - `CONTACT_TO` (e.g. `hello@bitsserver.com`)
   - `CONTACT_FROM` (verified sender)

Without those variables the endpoint still validates and accepts submissions, and the front-end falls back to a `mailto:` compose if the API is unreachable.

### Option B — Wrangler / Cloudflare Workers static assets

```bash
npm run build
npx wrangler deploy      # uses wrangler.jsonc
```

`wrangler.jsonc` serves `./dist` with `not_found_handling: "404-page"` so the custom 404 renders.

### Headers & caching

`public/_headers` ships security headers plus immutable one-year caching for `/_astro/*` — Cloudflare Pages applies it automatically.

## Design system

Defined in `src/styles/global.css`.

- Surfaces: `#04070d` → `#111a2d`
- Signal (accent): `#3ce7c4` · Compute glow: `#8b6cff`
- Display: Cabinet Grotesk · Body: Satoshi (Fontshare) · Mono: JetBrains Mono
- Custom SVG logo and inline SVG favicon — no raster assets, no external image requests

## Content source

Copy, statistics, services, process phases and testimonials are adapted from the live [bitsserver.com](https://bitsserver.com) site.
