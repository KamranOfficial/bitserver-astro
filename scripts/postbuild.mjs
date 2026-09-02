/**
 * Post-build: emit /legal/index.html alongside /legal.html so the URLs in the
 * existing bitsserver.com sitemap keep resolving exactly as published.
 */
import { copyFile, mkdir } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url).pathname;

await mkdir(`${dist}legal`, { recursive: true });
await copyFile(`${dist}legal.html`, `${dist}legal/index.html`);
console.log('emitted legal/index.html');
