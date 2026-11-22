// Builds the Next.js content files from the final HTML version of the site (the export of the
// ENGISOFT WordPress theme). Every page keeps its URL, body content, SEO tags and JSON-LD.
//
//   node scripts/extract-content.mjs [path-to-html-site]   (default: ../engisoft-site-final)
//
// Output:
//   content/pages/<route>.json   one file per page (home = index.json), mirroring the URL folders
//   content/routes.json          every public route (for generateStaticParams and sitemap.xml)
//   content/site.json            header menu (with dropdowns), footer, SVG sprite, redirects
//   public/assets/               css, js, fonts, images, films (copied once)
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(ROOT, '..', 'engisoft-site-final'));
const OUT = path.join(ROOT, 'content');
if (!fs.existsSync(path.join(SRC, 'index.html'))) throw new Error('No index.html in ' + SRC);

const dec = (s) => s.replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#8211;/g, '–').replace(/&#8217;/g, '’');
const pick = (html, re) => { const m = html.match(re); return m ? m[1] : ''; };
const between = (html, start, end) => { const i = html.indexOf(start); if (i < 0) return ''; const j = html.indexOf(end, i + start.length); return j < 0 ? '' : html.slice(i + start.length, j); };

/** relative link of an exported page -> root URL used by Next.js ("/bim-staffing/onsite/", "/assets/...") */
function normUrl(u, route) {
  if (!u || /^(https?:|mailto:|tel:|#|data:|javascript:|\/\/)/i.test(u)) return u;
  const abs = new URL(u, 'http://x' + route);
  let p = abs.pathname;
  if (p.endsWith('/index.html')) p = p.slice(0, -'index.html'.length);
  else if (p === '/index.html') p = '/';
  return p + abs.search + abs.hash;
}
function normHtml(html, route) {
  html = html.replace(/\s(href|src|poster|data-src)="([^"]*)"/g, (m, a, v) => ` ${a}="${normUrl(v, route)}"`);
  html = html.replace(/\ssrcset="([^"]*)"/g, (m, v) => ` srcset="${v.split(',').map((part) => { const [u, ...rest] = part.trim().split(/\s+/); return [normUrl(u, route), ...rest].join(' '); }).join(', ')}"`);
  html = html.replace(/url\((&quot;|'|")?([^)'"&]+)(&quot;|'|")?\)/g, (m, q1, v, q2) => `url(${q1 || ''}${normUrl(v, route)}${q2 || ''})`);
  // forms post to the Next.js API route (the HTML version opened the email app instead)
  html = html.replace(/action="mailto:[^"]*"(\s+enctype="text\/plain")?/g, 'action="/api/enquiry/"');
  return html;
}

function pageFiles(dir, base = '') {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (e.name !== 'assets') out.push(...pageFiles(path.join(dir, e.name), base + '/' + e.name)); }
    else if (e.name === 'index.html') out.push({ file: path.join(dir, e.name), route: (base || '') + '/' });
  }
  return out;
}

function extractPage(html, route) {
  const head = html.slice(0, html.indexOf('</head>'));
  const metas = {};
  for (const m of head.matchAll(/<meta\s+(?:property|name)=["']([^"']+)["']\s+content=["']([^"']*)["']/g)) metas[m[1]] = dec(m[2]);
  const jsonld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
  const bodyClass = pick(html, /<body class="([^"]*)"/);
  return {
    route,
    title: dec(pick(head, /<title>([\s\S]*?)<\/title>/)),
    description: metas.description || '',
    robots: metas.robots || '',
    canonical: pick(head, /<link rel="canonical" href="([^"]*)"/),
    og: { type: metas['og:type'], title: metas['og:title'], description: metas['og:description'], url: metas['og:url'], image: metas['og:image'], siteName: metas['og:site_name'], locale: metas['og:locale'] },
    twitter: metas['twitter:card'] || 'summary_large_image',
    jsonld,
    caseStudy: /\bsingle-project\b/.test(bodyClass),
    main: normHtml(between(html, '<main id="main">', '</main>'), route),
    cta: normHtml(between(html, '<div class="foot-cta">', '\n  </div>\n  <div class="foot-grid">'), route),
  };
}

/** header menu (with dropdown columns) from the home page header */
function extractMenu(html) {
  const nav = between(html, '<nav class="links" aria-label="Primary">', '</nav>\n');
  const items = [];
  const re = /<div class="dd"><a href="([^"]*)">([^<]*)<\/a>[\s\S]*?<div class="dd-in">([\s\S]*?<\/div>)<\/div><\/div><\/div>|<a href="([^"]*)">([^<]*)<\/a>/g;
  let m;
  while ((m = re.exec(nav))) {
    if (m[1]) {
      const columns = [...m[3].matchAll(/<div class="dd-col"><p class="lab"[^>]*>([\s\S]*?)<\/p>([\s\S]*?)<\/div>/g)].map((c) => ({
        heading: dec(c[1]).replace(/&nbsp;/g, '').trim(),
        links: [...c[2].matchAll(/<a href="([^"]*)">([^<]*)<\/a>/g)].map((l) => ({ label: dec(l[2]), href: normUrl(l[1], '/') })),
      }));
      items.push({ label: dec(m[2]), href: normUrl(m[1], '/'), columns });
    } else items.push({ label: dec(m[5]), href: normUrl(m[4], '/') });
  }
  return items;
}

/** 301 redirects from .htaccess (RedirectMatch 301 ^/old/?$ /new/) -> Next.js redirects() */
function extractRedirects() {
  const f = path.join(SRC, '.htaccess');
  if (!fs.existsSync(f)) return [];
  const out = [];
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^RedirectMatch 301 \^(\S+)\s+(\S+)$/);
    if (!m) continue;
    let [, src, dest] = m;
    src = src.replace(/\\(.)/g, '$1');
    let s;
    const exact = src.match(/^(\/[^()?*$]+?)\/\?\$$/);
    if (exact) s = exact[1];
    else if (/^\/category\/([^/(]+)\(\/\.\*\)\?\$$/.test(src)) s = src.replace(/^\/category\/([^/(]+)\(\/\.\*\)\?\$$/, '/category/$1/:rest*');
    else if (src === '/category/.*$') s = '/category/:rest*';
    else if (/^\/\(\?:([a-z|-]+)\)\/\?\$$/.test(src)) { for (const w of src.match(/^\/\(\?:([a-z|-]+)\)/)[1].split('|')) out.push({ source: '/' + w, destination: dest, statusCode: 301 }); continue; }
    else if (src.startsWith('/(?:works|projects|bim-projects)/?$')) { for (const w of ['works', 'projects', 'bim-projects']) out.push({ source: '/' + w, destination: dest, statusCode: 301 }); continue; }
    else if (src.startsWith('/(?:works|projects)/([^/]+)')) { for (const w of ['works', 'projects']) out.push({ source: `/${w}/:slug`, destination: dest.replace('$1', ':slug'), statusCode: 301 }); continue; }
    else if (src.startsWith('/(?:services|bim-digital-engineering)/([^/]+)')) { for (const w of ['services', 'bim-digital-engineering']) out.push({ source: `/${w}/:slug`, destination: dest.replace('$1', ':slug'), statusCode: 301 }); continue; }
    else if (src.startsWith('/workforce-solutions')) s = '/workforce-solutions/:rest*';
    else if (/^\/[a-z0-9-]+\/\?\$$/.test(src)) s = src.replace('/?$', '');
    else if (/^\/([a-z0-9-]+)\/\(\[\^\/\]\+\)\/\?\$$/.test(src)) s = src.replace(/^\/([a-z0-9-]+)\/.*$/, '/$1/:slug'), dest = dest.replace('$1', ':slug').replace('/projects/', '/case-studies/');
    else { console.warn('redirect not converted:', line); continue; }
    out.push({ source: s, destination: dest, statusCode: 301 });
  }
  return out;
}

// ---------------------------------------------------------------- run
const files = pageFiles(SRC);
fs.rmSync(path.join(OUT, 'pages'), { recursive: true, force: true });
const routes = [];
for (const { file, route } of files) {
  const data = extractPage(fs.readFileSync(file, 'utf8'), route);
  const rel = route === '/' ? 'index' : route.replace(/^\/|\/$/g, '');
  const target = path.join(OUT, 'pages', rel + '.json');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(data));
  routes.push({ route, lastmod: fs.statSync(file).mtime.toISOString().slice(0, 10) });
}
routes.sort((a, b) => a.route.localeCompare(b.route));
fs.writeFileSync(path.join(OUT, 'routes.json'), JSON.stringify(routes, null, 1));

const home = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');
const notFound = fs.readFileSync(path.join(SRC, '404.html'), 'utf8');
const site = {
  menu: extractMenu(home),
  sprite: pick(home, /(<svg width="0" height="0" style="position:absolute" aria-hidden="true">[\s\S]*?<\/svg>)/),
  footGrid: normHtml(between(home, '<footer class="foot">', '<svg class="giant"').replace(/^[\s\S]*?(<div class="foot-grid">)/, '$1').trim(), '/'),
  legal: between(home, '<div class="legal">', '</div>\n</footer>'),
  ctaButtons: normHtml(between(home, '<div class="btns">', '</div>'), '/'),
  eswp: JSON.parse(pick(home, /var ESWP = (\{[^\n]*\});/) || '{}'),
  notFound: { title: dec(pick(notFound, /<title>([\s\S]*?)<\/title>/)), main: normHtml(between(notFound, '<main id="main">', '</main>'), '/'), cta: normHtml(between(notFound, '<div class="foot-cta">', '\n  </div>\n  <div class="foot-grid">'), '/') },
  redirects: extractRedirects(),
};
fs.writeFileSync(path.join(OUT, 'site.json'), JSON.stringify(site, null, 1));

// assets (css, js, fonts, images, films) -> public/assets
const assets = path.join(ROOT, 'public', 'assets');
if (!fs.existsSync(path.join(assets, 'css', 'style.css')) || process.argv.includes('--assets')) {
  fs.cpSync(path.join(SRC, 'assets'), assets, { recursive: true });
  console.log('assets copied to public/assets');
}
console.log(`${routes.length} pages, ${site.menu.length} menu items (${site.menu.filter((m) => m.columns).length} with dropdowns), ${site.redirects.length} redirects`);
