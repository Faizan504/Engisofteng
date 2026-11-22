# ENGISOFT Engineering — Next.js website

The ENGISOFT website as a Next.js 16 (App Router) app. Same 171 pages, URLs, design, animations,
content and SEO strategy as the WordPress theme and the static HTML version.

## Run it

```bash
npm install          # first time only
npm run build        # prerenders all 171 pages as static HTML
npm start            # http://localhost:3000
```

On this computer you can also double-click `start-site.cmd` (it builds on first run, then starts).
For development with live reload: `npm run dev`.

## Folder structure (mirrors the URLs)

```
app/
  layout.tsx                    html/head, fonts, stylesheet, SVG sprite, animation scripts
  page.tsx                      /
  [page]/page.tsx               /about/ /why-engisoft/ /expertise/ /contact/ /careers/ ... (top-level pages)
  bim-staffing/                 /bim-staffing/        + [slug]/  10 staffing models
  engineering-staffing/         /engineering-staffing/ + [slug]/ 18 disciplines
  talent-pool/                  /talent-pool/         + [slug]/  6 categories
  verified-talent/              /verified-talent/     + [slug]/  technical assessment, competency passport
  bim-services/                 /bim-services/        + [slug]/  16 services
  digital-engineering/          /digital-engineering/ + [slug]/  5 capabilities
  industries/                   /industries/          + [slug]/  12 industries
  locations/                    /locations/           + [slug]/  15 locations
  case-studies/                 /case-studies/        + [slug]/  45 case studies
  insights/                     /insights/ + [category]/ + [category]/[slug]/  categories and articles
  api/enquiry/route.ts          form endpoint (all forms)
  sitemap.ts  robots.ts  not-found.tsx
components/   header.ts (menu + BIM Staffing / BIM Services dropdowns), footer.ts, SiteShell.tsx
lib/          content.ts (content loader), seo.ts (Metadata API), render.tsx
content/      pages/<url>.json (one file per page), routes.json, site.json (menu, footer, redirects)
public/assets css, js (GSAP, Lenis, BIM canvas, main.js), fonts, images, films
scripts/      extract-content.mjs (rebuilds content/ from the HTML version)
```

## SEO (same strategy as the WordPress / HTML versions)

- Unique title, meta description, canonical (https://engisoftengineering.com/...), robots, Open Graph
  and Twitter tags on every page, through the Next.js Metadata API.
- JSON-LD on every page (Organization/ProfessionalService, WebSite, Service, CollectionPage,
  AboutPage, ContactPage, FAQPage, BreadcrumbList, Article, BlogPosting).
- `/sitemap.xml` (171 URLs) and `/robots.txt`.
- 386 permanent (301) redirects from the old site's URLs in `next.config.ts` (from content/site.json).
- Trailing-slash URLs, identical to the WordPress site.
- Custom 404 page (noindex).

## Forms

Contact, Request BIM Professionals, Book a Consultation and Careers post to `/api/enquiry/`. Each
enquiry is validated, spam-checked (honeypot + rate limit) and saved to `data/enquiries.jsonl`. To
also email them, copy `.env.example` to `.env.local` and fill in the SMTP settings.

## Updating content

Content files are generated from the HTML version (which is exported from the WordPress theme):

```bash
npm run extract -- ../engisoft-site-final   # regenerate content/ from the HTML version
npm run build
```

## Deploying

Any Node.js host (Vercel, a VPS with `npm run build && npm start`, Hostinger Node.js hosting).
The enquiry endpoint needs a Node.js server; everything else is prerendered static HTML.
