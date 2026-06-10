# BikeLabs.com — Claude Code Build Handover

## What BikeLabs Is

A global motorcycle media brand and shop built on bikelabs.com — a 20-year-old .com domain.

Three things in one:
1. **Editorial** — honest gear reviews, bike reviews, how-tos
2. **Culture** — riding routes, lifestyle, moto community content
3. **Shop** — affiliate products now, physical/shipped inventory later once proven

Tone: confident, no-BS, globally relevant with a subtle Asia edge. Not a corporate review farm. Not a gear catalogue. A real brand that riders trust.

Monetisation stack:
- **Google AdSense** — passive display ad revenue across all content
- **Amazon Associates** — affiliate links on all gear/product content
- **Shop section** — affiliate-first, evolves into physical inventory (sourced from Lim Ah Boy / Regina Specialties, Singapore) shipped worldwide once traffic and demand are proven

Total running cost: **$12/year** (domain renewal only).

---

## The Brand

**Name:** BikeLabs  
**Domain:** bikelabs.com  
**Tagline:** *"Ride More. Know More."*  
**Voice:** Direct, knowledgeable, rider-to-rider. Never corporate. Never fluffy.  
**Audience:** Motorcycle riders globally — gear buyers, weekend riders, commuters, adventure tourers, moto culture fans  
**Asia edge:** Content occasionally reflects SEA riding conditions, Asian-market bikes, and gear sourced from Asia at better prices — but framed for a global audience, not just Singapore

---

## Site Structure

Five main sections:

```
bikelabs.com/
├── /reviews/        — Gear reviews (helmets, jackets, gloves, boots, tech)
├── /bikes/          — Motorcycle reviews and comparisons
├── /culture/        — Routes, lifestyle, rider stories, moto travel
├── /how-to/         — Maintenance, mods, beginner guides
└── /shop/           — Curated product picks (affiliate now, physical later)
```

Homepage: editorial magazine layout — hero story, latest reviews, latest culture pieces, featured shop picks.

---

## Shop Section — Two-Phase Plan

### Phase 1: Affiliate (launch with this)
- Shop page lists curated product picks by category (helmets, jackets, gloves, etc.)
- Each product links to Amazon via affiliate link
- Clean product cards: image, name, one-line verdict, price range, "Buy on Amazon →" button
- No inventory, no shipping, no fulfilment — 100% passive

### Phase 2: Physical (add when traffic proves demand)
- Source gear from **Lim Ah Boy / Regina Specialties** in Singapore — prices beat Western retail
- Ship worldwide via SingPost international or Shopify shipping integrations
- Add to site as a separate `/shop/physical/` route or migrate to a Shopify subdomain
- Do NOT build Phase 2 now — placeholder "Coming Soon — Asia-sourced gear shipped worldwide" banner in shop is enough

**Phase 2 is not part of this build. Build Phase 1 only.**

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Static site generator | **11ty (Eleventy)** | Fast, minimal, markdown articles |
| Image optimisation | **@11ty/eleventy-img** | Auto WebP, srcset, lazy load |
| Hosting + CDN | **Netlify** (free tier) | Global CDN, auto-deploys from GitHub |
| Repo | **GitHub** | Free, connects to Netlify |
| Styling | **Vanilla CSS** | Full control, zero bloat |
| CSS minification | **clean-css** | Build-time only, no runtime cost |
| Monetisation | AdSense + Amazon affiliate | Baked into templates |

---

## Design Direction

**Bold, editorial — motorcycle magazine meets modern media brand.**

- Background: `#0f0f0f` (near black)
- Header/nav: `#1a1a1a`
- Accent: **`#FF6B00`** (burnt orange — moto energy)
- Text: `#f0f0f0` (off-white on dark), `#1a1a1a` (dark on light cards)
- Card backgrounds: `#1e1e1e`
- Typography:
  - Headings: **Barlow Condensed** (700) — bold, punchy
  - Body: **Inter** (400/500) — clean, readable
  - Both via Google Fonts, loaded async
- Layout: card-based editorial grid, large hero images, full-bleed section headers
- Sticky dark nav: BikeLabs logo left, section links (Reviews / Bikes / Culture / How-To / Shop) right, hamburger on mobile
- Every page feels like opening a magazine, not clicking through a blog

Inspiration: The Drive, Cycle World, RideApart — but leaner and faster.

---

## Folder Structure

```
bikelabs/
├── .eleventy.js
├── package.json
├── netlify.toml
├── src/
│   ├── _includes/
│   │   ├── base.njk               # Base HTML shell (SEO, meta, scripts)
│   │   ├── article.njk            # Reviews, bikes, how-to articles
│   │   ├── culture.njk            # Culture/lifestyle articles
│   │   ├── shop.njk               # Shop section layout
│   │   └── partials/
│   │       ├── header.njk
│   │       ├── footer.njk
│   │       ├── ad-slot.njk        # AdSense partial
│   │       └── product-card.njk   # Affiliate product card component
│   ├── _data/
│   │   └── site.js                # Global site metadata
│   ├── css/
│   │   └── style.css
│   ├── img/
│   │   ├── articles/              # Hero images for articles
│   │   ├── thumbnails/            # Card thumbnails
│   │   ├── shop/                  # Product images
│   │   └── og/                    # OG images 1200x630px per article
│   ├── articles/
│   │   ├── reviews/               # Gear review markdown files
│   │   ├── bikes/                 # Bike review markdown files
│   │   ├── culture/               # Culture/lifestyle markdown files
│   │   └── how-to/                # How-to markdown files
│   ├── shop/
│   │   └── index.njk              # Shop landing page
│   ├── index.njk                  # Homepage
│   ├── about.njk
│   └── robots.txt
└── public/                        # 11ty output (gitignored)
```

---

## Build Tasks (do in order, confirm each before next)

### Task 1 — Project scaffold
- Init Node project
- Install: `@11ty/eleventy`, `@11ty/eleventy-img`, `clean-css`, `@11ty/eleventy-plugin-sitemap`
- Create `.eleventy.js` — input: `src`, output: `public`
- Register image shortcode, sitemap plugin, clean-css transform
- Create `netlify.toml` (see config below)
- Create `package.json` with `build` and `start` scripts

### Task 2 — Image shortcode
Set up in `.eleventy.js` before writing any templates:
```javascript
const Image = require("@11ty/eleventy-img");

async function imageShortcode(src, alt, sizes = "100vw") {
  let metadata = await Image(src, {
    widths: [400, 800, 1200],
    formats: ["webp", "jpeg"],
    outputDir: "./public/img/",
    urlPath: "/img/",
  });
  return Image.generateHTML(metadata, {
    alt,
    sizes,
    loading: "lazy",
    decoding: "async",
  });
}
eleventyConfig.addAsyncShortcode("image", imageShortcode);
```
Hero images override with `fetchpriority="high"` and no `loading="lazy"`.

### Task 3 — Base layout + global styles
`base.njk` must include:
- `<html lang="en">`
- `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Google Fonts preconnect + async load with `font-display: swap`
- `<title>{{ title }} | BikeLabs</title>`
- `<meta name="description" content="{{ description }}">`
- `<link rel="canonical" href="{{ page.url | absoluteUrl(site.url) }}">`
- Open Graph: `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
- Twitter card tags
- `<!-- PASTE ADSENSE AUTO-ADS SCRIPT HERE -->` comment in `<head>`
- Critical CSS inlined (nav + hero only), full stylesheet below
- All scripts deferred or at bottom of `<body>`

`header.njk`:
- Dark sticky nav
- BikeLabs wordmark (CSS text logo, no image file needed)
- Nav links: Reviews / Bikes / Culture / How-To / Shop
- Pure CSS hamburger on mobile (no JS)

`footer.njk` must include:
- Required legal: *"BikeLabs participates in the Amazon Associates Programme and other affiliate programmes. We earn from qualifying purchases at no extra cost to you."*
- *"BikeLabs is an independent publication. All reviews reflect our honest opinion."*
- Nav links repeated
- Copyright line

`style.css` — full mobile-first design system (see Mobile Requirements)

### Task 4 — Homepage
`index.njk`:
- Full-bleed hero: featured article, large image, title, category tag, read more CTA
- Tagline strip: *"Ride More. Know More."*
- **Latest Reviews** grid — 3 most recent from `/articles/reviews/`
- **Latest from Bikes** — 2 most recent from `/articles/bikes/`
- **Culture & Routes** — 2 most recent from `/articles/culture/`
- **Shop Picks** — 3 featured affiliate products (static, manually curated)
- One AdSense slot between sections (not above the fold)
- All article collections pulled dynamically from 11ty collections

### Task 5 — Article template (`article.njk`)
Used for reviews, bikes, how-to content:
- Full-width hero image (`fetchpriority="high"`, no lazy)
- Breadcrumb: Home > [Category] > [Title]
- H1 title, date, reading time, author: "BikeLabs Team"
- If `affiliate: true` → render disclosure: *"This article contains affiliate links."*
- Body content (markdown rendered)
- **AdSense slot** after paragraph 3
- **Product CTA box** component — see product-card.njk below
- **AdSense slot** at end of article
- **Related Articles** — 3 from same category
- JSON-LD: Article schema + Breadcrumb schema
- Articles with FAQ sections: FAQPage JSON-LD

### Task 6 — Culture template (`culture.njk`)
Lighter layout for routes, lifestyle, travel content:
- Full-bleed hero image
- Title, date, category tag
- Body content — wider max-width than review articles (more immersive read)
- **No product CTA boxes** on culture articles (not appropriate)
- AdSense slot mid-article and end
- Related culture pieces at bottom
- JSON-LD: Article schema

### Task 7 — Product card component (`product-card.njk`)
Reusable component used in articles AND shop page:
```html
<div class="product-card">
  <img src="{{ image }}" alt="{{ name }}">
  <div class="product-info">
    <span class="product-category">{{ category }}</span>
    <h3 class="product-name">{{ name }}</h3>
    <p class="product-verdict">{{ verdict }}</p>
    <div class="product-actions">
      <a href="{{ affiliateLink }}" class="btn-buy" target="_blank" rel="noopener nofollow">
        Check Price on Amazon →
      </a>
    </div>
  </div>
</div>
```
Styling: dark card, orange CTA button, full-width on mobile.

### Task 8 — Shop page (`shop/index.njk`)
- Header: "The BikeLabs Shop" — curated gear we'd actually ride with
- Intro copy: *"Every product here is chosen by us. No sponsorships. No paid placements. Just gear worth buying."*
- Product grid — categories:
  - Helmets
  - Jackets & Apparel
  - Gloves & Boots
  - Tech & Accessories
  - Maintenance
- Each product uses `product-card.njk`
- Bottom banner: *"Asia-sourced gear coming soon — premium brands at better prices, shipped worldwide."*
- No AdSense on shop page (conflicts with purchase intent)

### Task 9 — Category/section index pages
Auto-generated index pages for each section:
- `/reviews/` — all gear reviews, newest first
- `/bikes/` — all bike reviews and comparisons
- `/culture/` — routes, lifestyle, travel
- `/how-to/` — maintenance, mods, guides

### Task 10 — SEO infrastructure
- `sitemap.xml` — auto-generated, accessible at `/sitemap.xml`
- `robots.txt`:
  ```
  User-agent: *
  Allow: /
  Sitemap: https://bikelabs.com/sitemap.xml
  ```
- `404.njk` — custom 404 with nav and suggested articles

### Task 11 — AdSense placeholders
- `ad-slot.njk` with `<ins class="adsbygoogle">` and publisher ID comment
- Responsive units only
- No ads above the fold on first mobile load
- No ads on shop page

### Task 12 — First 10 articles
Write and publish first 10 articles from content plan below.
Each: min 1,200 words, target keyword in first 100 words, 2+ internal links.

---

## Article Frontmatter

```yaml
---
title: "Best Motorcycle Helmets 2026: Tested and Ranked"
date: 2026-06-10
section: reviews
category: helmets
tags: [helmets, safety, buying-guide]
description: "We tested 12 motorcycle helmets across every price point. Here's what's actually worth buying in 2026."
image: /img/articles/best-motorcycle-helmets-2026.jpg
affiliate: true
featured: false
layout: article.njk
---
```

Culture articles use `layout: culture.njk` and `affiliate: false`.

---

## Content Plan — First 40 Articles

### Reviews — Helmets
1. **Best Motorcycle Helmets 2026: Every Budget Tested** *(best motorcycle helmet 2026)*
2. **Best Budget Motorcycle Helmets Under $150** *(best budget motorcycle helmet)*
3. **Shoei vs Arai vs AGV: Which Premium Helmet Wins?** *(shoei vs arai vs agv)*
4. **Best Bluetooth Motorcycle Helmets 2026** *(best bluetooth motorcycle helmet 2026)*
5. **Best Adventure Motorcycle Helmets for Long Haul** *(best adventure motorcycle helmet)*
6. **MT Helmets: The Full Review** *(mt helmets review)*
7. **How to Choose a Motorcycle Helmet: Fit, Safety & Ratings Explained** *(how to choose motorcycle helmet)*

### Reviews — Gear & Apparel
8. **Best Motorcycle Jackets for Hot Weather Riding** *(best motorcycle jacket hot weather)*
9. **Best Mesh Motorcycle Jackets 2026** *(best mesh motorcycle jacket)*
10. **Alpinestars vs Dainese: Honest Comparison** *(alpinestars vs dainese)*
11. **Best Motorcycle Gloves for Every Riding Style** *(best motorcycle gloves)*
12. **Best Motorcycle Boots That Don't Look Like Boots** *(best motorcycle boots casual)*
13. **Best Affordable Riding Gear Sets Under $300** *(affordable motorcycle gear set)*
14. **Best Motorcycle Backpacks for Commuters** *(best motorcycle backpack)*

### Bikes
15. **Best Beginner Motorcycles in 2026: The Short List** *(best beginner motorcycle 2026)*
16. **Honda CB650R vs Yamaha MT-07: Which Should You Buy?** *(honda cb650r vs yamaha mt07)*
17. **Best Middleweight Adventure Bikes 2026** *(best middleweight adventure bike 2026)*
18. **Best Naked Bikes Under $10,000** *(best naked bike under 10000)*
19. **Honda Wave vs Yamaha Y15: Best Budget Commuter?** *(honda wave vs yamaha y15)*
20. **Best Scooters for City Commuting 2026** *(best scooter city commuting 2026)*
21. **Royal Enfield Himalayan Review: Worth the Hype?** *(royal enfield himalayan review)*
22. **Kawasaki Z900 vs Suzuki GSX-S750: Street Fighter Shootout** *(kawasaki z900 vs suzuki gsxs750)*

### How-To
23. **How to Maintain Your Motorcycle: Complete Beginner's Guide** *(motorcycle maintenance beginner guide)*
24. **How to Clean Your Helmet Properly** *(how to clean motorcycle helmet)*
25. **Chain vs Belt vs Shaft Drive: Which Is Best?** *(chain vs belt vs shaft drive motorcycle)*
26. **How to Set Motorcycle Tyre Pressure Correctly** *(motorcycle tyre pressure guide)*
27. **Best Motorcycle Tyres for Wet Roads** *(best motorcycle tyres wet roads)*
28. **How to Spot a Fake Motorcycle Helmet** *(how to spot fake motorcycle helmet)*
29. **What Tools Every Motorcyclist Should Own** *(motorcycle tools every rider needs)*
30. **How to Get the Best Deal on Motorcycle Gear Online** *(best place buy motorcycle gear online)*

### Culture & Routes
31. **The Best Motorcycle Roads in Southeast Asia** *(best motorcycle roads southeast asia)*
32. **Riding Through Northern Thailand: A Route Guide** *(motorcycle route northern thailand)*
33. **Best Motorcycle Roads in Europe for a Two-Week Trip** *(best motorcycle roads europe)*
34. **The BikeLabs Guide to Motorcycle Travel on a Budget** *(motorcycle travel budget guide)*
35. **Why Asian Bikes Are Taking Over the World** *(asian motorcycles global rise)*
36. **The Rise of the Small-Displacement Motorcycle** *(small displacement motorcycle trend)*
37. **What It's Really Like Riding in Vietnam** *(motorcycle riding vietnam guide)*
38. **Best Motorcycle Rallies and Events Worldwide 2026** *(motorcycle rallies events 2026)*
39. **Moto Camping: Everything You Need to Start** *(moto camping beginners guide)*
40. **The 10 Motorcycles That Defined the Decade** *(most important motorcycles 2010s)*

---

## SEO Requirements (Non-Negotiable)

### On-Page
- Title: `{{ title }} | BikeLabs` — max 60 chars
- Meta description: max 155 chars — pulled from frontmatter
- `<link rel="canonical">` on every page
- ONE `<h1>` per page — always the article title
- H2 → H3 hierarchy, never skip levels
- Slug = target keyword: `best-motorcycle-helmet-2026.md`
- Target keyword in first 100 words
- All `<img>` have descriptive `alt` text
- Min 2 internal links per article — **link between sections too** (e.g. how-to links to relevant reviews)
- Min 1,200 words per article

### Technical
- `sitemap.xml` auto-generated
- `robots.txt` pointing to sitemap
- Open Graph + Twitter Card on every page
- JSON-LD: Article, Breadcrumb, FAQPage (where applicable)
- `<html lang="en">`
- No broken internal links at build time

### Speed
- No render-blocking JS
- Google Fonts async + `font-display: swap`
- `loading="lazy"` on all below-fold images
- `fetchpriority="high"` on hero images
- CSS minified at build
- **Target: Lighthouse 90+ mobile**

### URLs
- Reviews: `bikelabs.com/reviews/best-motorcycle-helmet-2026/`
- Bikes: `bikelabs.com/bikes/honda-cb650r-review/`
- Culture: `bikelabs.com/culture/best-motorcycle-roads-southeast-asia/`
- How-to: `bikelabs.com/how-to/motorcycle-maintenance-guide/`
- Shop: `bikelabs.com/shop/`

### Backlinks (do manually post-launch)
1. **Reddit** — r/motorcycles, r/motocamping, r/advrider, r/geared — post helpful content, cite BikeLabs
2. **Quora** — answer moto questions, link to relevant articles
3. **Pinterest** — pin every article (moto gear converts well)
4. **HARO / Connectively** — respond to journalist moto queries
5. **Facebook moto groups** — share culture articles especially (high shareability)
6. **Moto forums** — ADVRider.com, VisorDown forums, local SEA forums
7. **Lim Ah Boy / Regina Specialties** — once traffic exists, ask for a link from reginaspecialties.com in exchange for featuring their products. One authoritative link worth 100 random ones.

---

## Mobile-First (Non-Negotiable)

- CSS written mobile-first — base = mobile, scale up with breakpoints
- Article grid: 1 col mobile → 2 col tablet → 3 col desktop
- Shop grid: 1 col mobile → 2 col tablet → 3 col desktop
- Hamburger nav: pure CSS, zero JS
- Body font min **16px**
- Headings: `clamp()` sizing e.g. `font-size: clamp(1.5rem, 4vw, 2.5rem)`
- Line height min **1.6**
- Article content max-width: **720px**
- Culture content max-width: **780px** (more immersive)
- All tap targets min **44x44px**
- Amazon CTA buttons full-width on mobile
- All images `max-width: 100%`
- Hero: `aspect-ratio: 16/9`, `object-fit: cover`
- Responsive AdSense units only
- No `user-scalable=no`

### Mobile Checklist
- [ ] No horizontal scroll at 375px, 390px, 414px
- [ ] Nav hamburger works
- [ ] All tap targets tappable
- [ ] Text readable without zooming
- [ ] Shop product cards stack cleanly on mobile
- [ ] PageSpeed Insights mobile 90+

---

## Image Optimisation (Non-Negotiable)

`@11ty/eleventy-img` handles everything at build time. Raw JPG in → optimised WebP out.

- Source images: min 1200px wide, max 3MB (pre-compress via **Squoosh.app** if larger)
- Hero: 16:9, 1200×675px
- Card thumbnails: 3:2, 800×533px
- Shop product images: 1:1, 800×800px
- OG images: 1200×630px (one per article, stored in `src/img/og/`)
- Build outputs: WebP + JPEG at 400w, 800w, 1200w
- No image over **150KB** in built output
- Netlify CDN serves everything from global edge automatically

### Performance Targets
| Metric | Target |
|---|---|
| Homepage total weight | < 500KB |
| Article page weight | < 800KB |
| LCP | < 2.5s |
| Lighthouse mobile | 90+ |
| Max image size (post-build) | 150KB |

---

## Netlify Config

`netlify.toml`:
```toml
[build]
  command = "npx @11ty/eleventy"
  publish = "public"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/404/index.html"
  status = 404
```

Deploy flow:
1. Push to GitHub (`workarounds81/bikelabs`)
2. Connect repo in Netlify dashboard
3. Add custom domain `bikelabs.com`
4. SSL: automatic and free

---

## Amazon Affiliate Setup

- Sign up: affiliate-program.amazon.com
- Use Amazon.com for global audience, Amazon.sg as secondary for SEA products
- Link format: `https://www.amazon.com/dp/PRODUCTID?tag=YOURTAG-20`
- All affiliate links: `rel="noopener nofollow"` and `target="_blank"`
- Orange "Check Price on Amazon →" CTA button throughout
- `affiliate: true` in frontmatter auto-renders disclosure at article top
- No AdSense on shop page — affiliate is the monetisation there

---

## AdSense Setup

- Apply at google.com/adsense once 10 articles live
- Use Auto Ads — one script tag in `<head>`, Google handles placement
- Approval: 1–2 weeks
- Until approved: placeholder comments in slots, site fully functional
- Responsive units only across the site
- Not on shop page

---

## What NOT to Build (Keep It Scrappy)

- ❌ No comments system
- ❌ No newsletter signup (add later if traffic warrants)
- ❌ No user accounts
- ❌ No database
- ❌ No physical shop functionality (Phase 2, not now)
- ❌ No fixed-size AdSense units
- ❌ No popups or interstitials
- ❌ No unnecessary JavaScript

---

## Launch Checklist

- [ ] All 5 section pages working (reviews, bikes, culture, how-to, shop)
- [ ] Homepage pulling latest articles from all sections dynamically
- [ ] 10 articles published (mix of sections), each 1,200+ words
- [ ] Shop page live with at least 10 affiliate product cards
- [ ] Phase 2 "coming soon" banner on shop
- [ ] `sitemap.xml` live at bikelabs.com/sitemap.xml
- [ ] `robots.txt` live at bikelabs.com/robots.txt
- [ ] All pages: title tag, meta description, canonical, OG tags
- [ ] JSON-LD Article schema on all articles
- [ ] AdSense placeholder slots in articles
- [ ] Affiliate disclosure rendering on all `affiliate: true` articles
- [ ] No image over 150KB in built output
- [ ] No horizontal scroll on mobile at 375px
- [ ] Hamburger nav works on mobile
- [ ] Shop product cards look clean on mobile
- [ ] Google PageSpeed Insights mobile 90+
- [ ] bikelabs.com connected and SSL green on Netlify

---

**Paste this entire document into Claude Code as your first message. Add this line at the top before sending:**

*"This is the full project brief for BikeLabs.com. Read everything before starting. Begin with Task 1 only and confirm with me before moving to the next task."*
