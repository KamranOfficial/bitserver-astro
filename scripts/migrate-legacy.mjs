import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const legacy = join(root, 'legacy');
const pages = join(root, 'src', 'pages');
const header = await readFile(join(legacy, 'includes', 'header.html'), 'utf8');
const footer = await readFile(join(legacy, 'includes', 'footer.html'), 'utf8');

const sourcePages = [
  'index.html',
  'about.html',
  'contact.html',
  '404.html',
  'tools/index.html',
  'legal/index.html',
  'legal/accessibility.html',
  'legal/cookie-policy.html',
  'legal/disclaimer.html',
  'legal/dmca.html',
  'legal/privacy-policy.html',
  'legal/refund-policy.html',
  'legal/terms-and-conditions.html',
];

await rm(pages, { recursive: true, force: true });

for (const sourcePage of sourcePages) {
  const source = await readFile(join(legacy, sourcePage), 'utf8');
  const astro = source
    .replace(/<div\s+data-include="\/includes\/header\.html"\s*><\/div>/g, header)
    .replace(/<div\s+data-include="\/includes\/footer\.html"\s*><\/div>/g, footer)
    .replace(/<script\s+src="\/js\/include\.js"[^>]*><\/script>/g, '<script is:inline src="/js/main.js"></script>');
  const destination = join(pages, sourcePage.replace(/\.html$/, '.astro'));
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, astro);
  console.log(`Migrated ${relative(root, destination)}`);
}
