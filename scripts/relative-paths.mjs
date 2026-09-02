/**
 * Rewrites root-absolute URLs (/_astro/..., /contact, /legal/x.html) to
 * depth-aware relative URLs in the built HTML. Only needed when the bundle is
 * served from a nested path (e.g. the sandbox preview proxy). Cloudflare
 * Pages/Workers serves from the domain root, where the absolute form is correct.
 *
 * Usage: node scripts/relative-paths.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';

const dist = new URL('../dist/', import.meta.url).pathname;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const files = await walk(dist);

for (const p of files) {
  const depth = relative(dist, dirname(p)).split('/').filter(Boolean).length;
  const prefix = depth === 0 ? './' : '../'.repeat(depth);
  const src = await readFile(p, 'utf8');

  const out = src.replace(/(href|src)="\/([^"]*)"/g, (m, attr, path) => {
    if (path.startsWith('/')) return m; // protocol-relative
    let target = path;
    if (target === '' || target.startsWith('#')) target = `index.html${target}`;
    else if (target.endsWith('/')) target += 'index.html';
    else if (!/\.[a-z0-9]+(\?|#|$)/i.test(target)) {
      const [base, rest = ''] = target.split(/(?=[?#])/);
      target = `${base}.html${rest}`;
    }
    return `${attr}="${prefix}${target}"`;
  });

  if (out !== src) await writeFile(p, out);
  console.log(`rewrote ${relative(dist, p)}`);
}
