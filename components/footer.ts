import { site } from '@/lib/content';

/** Footer: the page's call to action, the link columns, the giant wordmark and the legal line. */
export function buildFooter(cta: string): string {
  return `<footer class="foot">
  <div class="foot-cta">${cta}
  </div>
  ${site.footGrid}
  <svg class="giant" id="giant" aria-hidden="true"><use href="#wm"/></svg>
  <div class="legal">${site.legal}</div>
</footer>`;
}