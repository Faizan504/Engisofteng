import { buildHeader } from './header';
import { buildFooter } from './footer';

type Props = { route: string; main: string; cta: string; jsonld?: unknown[]; caseStudy?: boolean };

const ld = (j: unknown) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`;

/**
 * Header, page body, footer and JSON-LD for one page. Rendered as one static block: the site's
 * animation scripts (GSAP, Lenis, main.js) take over this markup after load, exactly as on the
 * WordPress site, so React does not need to re-render it.
 */
export default function SiteShell({ route, main, cta, jsonld = [], caseStudy = false }: Props) {
  const html =
    (caseStudy ? '<script>document.body.classList.add("single-project")</script>' : '') +
    buildHeader(route) +
    `<main id="main">${main}</main>` +
    buildFooter(cta) +
    jsonld.map(ld).join('');
  return <div id="es-page" style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: html }} />;
}