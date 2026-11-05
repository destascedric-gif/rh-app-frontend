// Après `vite build` : écrit le HTML de chaque page publique (texte, titre,
// description, aperçu de lien) pour que les moteurs de recherche le lisent
// directement, puis le plan du site (sitemap.xml).
// Lancé par `npm run build` (voir package.json), donc aussi par Vercel.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrDir = path.join(root, 'dist-ssr');

const { render, PUBLIC_PAGES, SITE_URL } = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href);
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const escape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const replaceOnce = (html, pattern, value, name) => {
  const found = typeof pattern === 'string' ? html.includes(pattern) : pattern.test(html);
  if (!found) throw new Error(`prerender : balise introuvable dans index.html (${name})`);
  return html.replace(pattern, value);
};

for (const page of PUBLIC_PAGES) {
  const url = `${SITE_URL}${page.path === '/' ? '/' : page.path}`;
  let html = template;
  html = replaceOnce(html, /<title>[^<]*<\/title>/, `<title>${escape(page.title)}</title>`, 'title');
  html = replaceOnce(html, /<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${escape(page.description)}" />`, 'description');
  html = replaceOnce(html, /<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`, 'canonical');
  html = replaceOnce(html, /<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${escape(page.title)}" />`, 'og:title');
  html = replaceOnce(html, /<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${escape(page.description)}" />`, 'og:description');
  html = replaceOnce(html, /<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${url}" />`, 'og:url');
  if (!page.index) {
    html = html.replace('</head>', '    <meta name="robots" content="noindex, follow" />\n  </head>');
  }
  // Le site renvoie l'accueil pour toutes les adresses de l'application
  // (vercel.json) : ailleurs que sur sa propre page, ce HTML pré-rendu est
  // effacé aussitôt, pour ne pas voir l'accueil clignoter avant l'appli.
  const clearElsewhere = `<script>if(location.pathname.replace(/\\/$/,'')!==${JSON.stringify(page.path === '/' ? '' : page.path)})document.getElementById('root').innerHTML=''</script>`;
  html = replaceOnce(html, '<div id="root"></div>', `<div id="root">${render(page.path)}</div>\n    ${clearElsewhere}`, 'root');

  // « /cgu » est servi par cgu.html (cleanUrls dans vercel.json)
  const file = page.path === '/' ? 'index.html' : `${page.path.slice(1)}.html`;
  fs.writeFileSync(path.join(dist, file), html);
  console.log(`prerender : ${page.path}${page.index ? '' : ' (non affichée dans Google)'}`);
}

// Plan du site : seulement les pages à afficher dans les moteurs de recherche
const today = new Date().toISOString().slice(0, 10);
const urls = PUBLIC_PAGES.filter((p) => p.index).map((p) => [
  '  <url>',
  `    <loc>${SITE_URL}${p.path === '/' ? '/' : p.path}</loc>`,
  `    <lastmod>${today}</lastmod>`,
  ...(p.priority ? [`    <priority>${p.priority}</priority>`] : []),
  '  </url>',
].join('\n'));
fs.writeFileSync(path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
console.log(`prerender : sitemap.xml (${urls.length} page${urls.length > 1 ? 's' : ''})`);

fs.rmSync(ssrDir, { recursive: true, force: true });
