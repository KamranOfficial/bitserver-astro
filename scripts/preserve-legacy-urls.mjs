import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const legacyPages = [
  'about',
  'contact',
  'legal/accessibility',
  'legal/cookie-policy',
  'legal/disclaimer',
  'legal/dmca',
  'legal/privacy-policy',
  'legal/refund-policy',
  'legal/terms-and-conditions',
];

for (const page of legacyPages) {
  const source = join(dist, page, 'index.html');
  const destination = join(dist, `${page}.html`);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}
