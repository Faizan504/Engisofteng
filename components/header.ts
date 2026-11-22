import { site, type MenuItem } from '@/lib/content';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ARROW = '<i aria-hidden="true">&#8599;</i>';

/** Is a top-level menu item the current section? (same rules as the WordPress theme) */
function isCurrent(item: MenuItem, route: string) {
  if (item.href === route) return true;
  return ['/bim-services/', '/case-studies/'].includes(item.href) && route.startsWith(item.href);
}

/**
 * Site header: logo, primary menu with the BIM Staffing and BIM Services dropdowns (from
 * content/site.json), the request button and the mobile menu. Same markup as the WordPress theme,
 * so the shared CSS and main.js work unchanged.
 */
export function buildHeader(route: string): string {
  const cur = (it: MenuItem) => (isCurrent(it, route) ? ' aria-current="page"' : '');
  const desktop = site.menu
    .map((it, k) => {
      const link = `<a href="${esc(it.href)}"${cur(it)}>${esc(it.label)}</a>`;
      if (!it.columns?.length) return link;
      const cols = it.columns
        .map((c) => `<div class="dd-col"><p class="lab"${c.heading ? '>' + esc(c.heading) : ' aria-hidden="true" style="visibility:hidden">&nbsp;'}</p>${c.links.map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}</div>`)
        .join('');
      return `<div class="dd">${link}<button class="dd-t" type="button" aria-expanded="false" aria-controls="dd${k}" aria-label="${esc(it.label)} menu"><i aria-hidden="true"></i></button><div class="dd-m" id="dd${k}"><div class="dd-in">${cols}</div></div></div>`;
    })
    .join('');
  const mobile = site.menu
    .map((it) => {
      if (!it.columns?.length) return `<a href="${esc(it.href)}"${cur(it)}>${esc(it.label)}</a>`;
      const links = it.columns.flatMap((c) => c.links).map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('');
      return `<details class="msub"><summary>${esc(it.label)}</summary><div><a href="${esc(it.href)}">All ${esc(it.label)}</a>${links}</div></details>`;
    })
    .join('');
  return `<a class="skip" href="#main">Skip to content</a>
<div class="curtain" id="curtain" aria-hidden="true"><svg class="mk"><use href="#mk"/></svg></div>
<header class="nav" id="nav">
  <a class="logo" href="/" aria-label="ENGISOFT Engineering home"><svg class="mk" aria-hidden="true"><use href="#mk"/></svg><svg class="wm" aria-hidden="true"><use href="#wm"/></svg></a>
  <nav class="links" aria-label="Primary">${desktop}</nav>
  <a class="btn" href="/request-talent/">Request BIM professionals ${ARROW}</a>
  <button class="burger" id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="mnav"><span></span><span></span></button>
</header>
<div class="mnav" id="mnav" hidden><a href="/"${route === '/' ? ' aria-current="page"' : ''}>Home</a>${mobile}<a href="/request-talent/" class="btn">Request BIM professionals ${ARROW}</a></div>`;
}