# BikeLabs Project Status & Summary

> **UPDATE — July 2026:** AdSense review returned **"Low value content"**. In response, the site received a full UI/UX revamp (v5 "Telemetry Editorial") plus AdSense-alignment fixes:
> - All manual/empty ad units, ad rails and dashed placeholders removed site-wide (Auto Ads script in `base.njk` head retained for verification). To restore manual units after approval, see `src/_includes/partials/ad-slot.njk`.
> - `/shop/` rebuilt: fake `B09example` Amazon links and mismatched Unsplash photos removed; now links to internal reviews.
> - New `/how-we-test/` editorial-policy page; About page expanded (E-E-A-T).
> - New design: slim sticky header w/ text wordmark, ticker, bento homepage, single-column articles w/ byline box + reading progress, unified listing heroes, "The Lab" tools grid. Fonts: Archivo / Inter / JetBrains Mono.
> - Fixed broken schema logo path, missing apple-touch-icon (generated), default OG image now the logo.
> - After deploy: re-request AdSense review ("I confirm I have fixed the issues" → Request review).

**Date:** June 2026  
**Domain:** bikelabs.com (17-year-old .com)  
**Stack:** 11ty v2.0.1 (Nunjucks), GitHub Pages (deployed), Railway (admin backend), SQLite DB  
**Git Branch:** `claude/zen-pasteur-uegroc`

---

## ✅ COMPLETED TASKS

### 1. **Frontend Layout & Design**
- ✅ 3-column article layout (180px sidebar | 860px content | 180px sidebar) with responsive collapse at 1100px
- ✅ Updated tagline: "DATA DRIVEN. RIDER PROVEN."
- ✅ Updated logo to new BikeLabs image
- ✅ Centered privacy policy content
- ✅ About page with updated contact email (info@bikelabs.com)
- ✅ Favicon.png deployed
- ✅ Web manifest (manifest.json) with BikeLabs branding

### 2. **SEO & Metadata**
- ✅ Comprehensive SEO metadata in base.njk (robots, theme-color, author)
- ✅ JSON-LD schemas: WebSite, Organization, Article, BreadcrumbList, FAQPage (conditional)
- ✅ Open Graph tags with dynamic og:image fallback
- ✅ `absoluteUrl` filter for canonical URLs
- ✅ robots.txt configured
- ✅ ads.txt for AdSense publisher verification

### 3. **Admin Backend (Railway)**
- ✅ Express server at `/admin/dashboard` with article/shop management
- ✅ SQLite database (ephemeral, resets on Railway redeploy)
- ✅ Articles-seed.json (34 articles) bundled in `admin-backend/` for import on startup
- ✅ Admin credentials: `xglobalx:123qwe123QWE` (hardcoded in auth.js)
- ✅ `/admin/sync` endpoint to manually import articles
- ✅ Debug endpoints: `/admin/debug-seed`, `/admin/debug-sync`
- ✅ Node 20 pinned + nixpacks.toml for build stability
- ✅ Better-sqlite3 prebuilt binary installs without compilation errors

### 4. **Backend to Frontend Integration**
- ✅ All 34 articles imported from seed into admin DB on startup
- ✅ Admin dashboard shows correct counts: 10 reviews, 8 bikes, 8 culture, 8 how-to
- ✅ Articles push to GitHub via `gitPush()` when published from admin
- ✅ `ARTICLES_ROOT` correctly points to `src/articles/` in routes

### 5. **DNS & Domains**
- ✅ bikelabs.com custom domain on GitHub Pages (pathPrefix: `/`)
- ✅ ImprovMX email forwarding (→ xglobalx@gmail.com)
  - MX records: mx1.improvmx.com, mx2.improvmx.com (Priority 10, 20)
  - SPF record: v=spf1 include:spf.improvmx.com ~all
- ✅ **admin.bikelabs.com** subdomain → Railway
  - CNAME: `admin` → `fwxxuhvs.up.railway.app`
  - TXT: `_railway-verify.admin` for ownership verification
  - Auto SSL via Let's Encrypt

### 6. **Google AdSense Setup**
- ✅ AdSense account created (pub-7510624548793689)
- ✅ Global AdSense script in base.njk (applies to all pages)
- ✅ Auto ads enabled (placement: mobile + desktop)
- ✅ Manual sidebar ad units on all article/culture pages (180px responsive)
- ✅ In-content ad units activated on articles, culture, and home (728px responsive)
- ✅ All 4 section listing pages (Reviews, Bikes, Culture, How-To) have left/right sidebars
- ✅ ads.txt created with AdSense publisher ID
- ✅ Privacy Policy updated (no Singapore mention, GDPR/CCPA compliant)
- ✅ Review requested (status: "Getting your site ready to show ads")

---

## 🔄 CURRENT STATE

### Frontend (GitHub Pages)
- **Live at:** https://bikelabs.com/
- **Latest commit:** `df6aee7` "Consistent ad placement across all section listing pages and activate in-content ad slot"
- **Ad structure:**
  - Desktop: 3-column (sidebar ads on articles/listings)
  - Mobile: Single column with Auto ads (Google handles placement)
  - In-content ads between article body and related articles
- **Responsive:** ✅ All pages collapse correctly at 1100px breakpoint

### Admin Backend (Railway)
- **URL:** https://bikelabs-production.up.railway.app/admin/
- **Access:** admin.bikelabs.com/admin/ (once DNS propagates, ~30 min from setup)
- **Database:** SQLite (admin.db) with 34 seeded articles
- **Status:** ✅ All 6 articles sync correctly, 0 articles was due to Node version mismatch (FIXED)

### Email
- **Admin:** info@bikelabs.com (forwards to xglobalx@gmail.com)
- **Public contact:** info@bikelabs.com (on About page, Privacy Policy, etc.)

### AdSense
- **Account:** Active, awaiting Google approval
- **Timeline:** 1–14 days review, email notification on decision
- **Implementation:** All ad units live, waiting for approval to serve real ads

---

## 📋 PENDING / NOT YET DONE

### 1. **AdSense Review Completion**
- ⏳ Google review (1–14 days) — not in user's control, waiting for email decision
- 🟡 Once approved: real ads appear automatically (Auto ads + manual units)

### 2. **Optional Enhancements** (not yet requested)
- Tool calculator sidebar ads (placeholder `.ad-slot` divs exist but no ad units)
- Mobile sticky bottom ad (placeholder exists in base.njk, can be activated)
- Default OG image (fallback for social sharing)
- Apple touch icon (512×512)
- Google Search Console submission (after approval, for sitemap)

### 3. **Affiliate Program Setup** (user mentioned but not implemented)
- Amazon Associates re-enable (articles have `affiliate: true` frontmatter but links not active)
- Other affiliate programs (AliExpress, dropshipping platforms) — user asked for guidance, not implemented

### 4. **Future Content Strategy** (user mentioned)
- Upload 1 article every 2 days per section (user's goal)
- Admin UI ready for this workflow

---

## 🔧 KEY FILES & STRUCTURE

### Frontend (11ty)
```
src/
├── _includes/
│   ├── base.njk (global head, AdSense script, footer)
│   ├── article.njk (3-col layout, sidebar ads, in-content ads)
│   ├── culture.njk (same as article.njk)
│   ├── partials/
│   │   ├── header.njk (logo, nav)
│   │   └── ad-slot.njk (in-content ad unit — LIVE)
│   └── ...
├── articles/ (MD files by section: reviews, bikes, culture, how-to)
├── css/style.css (layout, .article-page grid, .ad-column, responsive)
├── index.njk (home page, includes ad-slot.njk)
├── reviews/index.njk (listing, 3-col with sidebar ads)
├── bikes/index.njk (listing, 3-col with sidebar ads)
├── culture/index.njk (listing, 3-col with sidebar ads)
├── how-to/index.njk (listing, 3-col with sidebar ads)
├── about.njk (About page, contact: info@bikelabs.com)
├── privacy-policy.njk (centered, location-neutral legal)
├── ads.txt (AdSense publisher ID)
└── manifest.json (web app manifest)

.eleventy.js (config, pathPrefix: /, passthrough copy for ads.txt)
.github/workflows/deploy-pages.yml (PATHPREFIX: /)
src/_data/site.js (tagline, description)
```

### Admin Backend (Railway)
```
admin-backend/
├── server.js (Express, AdSense script in GET /admin/dashboard)
├── db.js (SQLite schema: articles, shop tables)
├── importer.js (reads articles-seed.json, upsert into DB)
├── articles-seed.json (34 articles, bundled)
├── gen-seed.js (script to regenerate seed from MD files)
├── routes/
│   ├── auth.js (hardcoded credentials)
│   ├── articles.js (CRUD, gitPush on publish)
│   └── shop.js (affiliate products)
├── views/dashboard.html (counts display)
├── package.json (Node 20.x pinned)
├── .nvmrc (Node 20 version)
├── nixpacks.toml (build-essential, python3)
├── railway.json (startCommand)
└── ...
```

---

## 📊 CURRENT ARTICLE COUNTS
- **Reviews:** 10
- **Bikes:** 8
- **Culture:** 8
- **How-To:** 8
- **Total:** 34 articles (all in database and seeded)

---

## 🎯 QUICK REFERENCE: NEXT STEPS (FOR NEW CHAT)

1. **AdSense Approval:** Wait for Google's email (1–14 days). No action needed unless rejected — if rejected, check for policy violations in Privacy Policy, About, or ad placement.

2. **New Content:** Use `/admin/dashboard` → New Article to add content. Articles auto-sync to GitHub and display on site ~1 min after GitHub Actions deploy.

3. **DNS for Admin:** Test admin.bikelabs.com/admin/login once DNS propagates (~30 min). If it fails, check GoDaddy CNAME record: `admin` → `fwxxuhvs.up.railway.app`.

4. **Email:** All outbound still goes to info@bikelabs.com (ImprovMX forwards to xglobalx@gmail.com). Set up Gmail filter to auto-reply if needed.

5. **Future Improvements:**
   - Tool sidebar ads (add ad units to /tools/*)
   - Mobile sticky ad (uncomment in base.njk, add unit)
   - Affiliate program re-enable
   - Google Search Console submission

---

## 🔐 CREDENTIALS & SENSITIVE INFO

**Admin Login:**
- URL: `https://admin.bikelabs.com/admin/login` (or `bikelabs-production.up.railway.app/admin/login` while DNS settles)
- Username: `xglobalx`
- Password: `123qwe123QWE`

**AdSense:**
- Publisher ID: `pub-7510624548793689`
- Ad Slot ID: `7885005664` (all units)

**Email:**
- Admin: `info@bikelabs.com` → `xglobalx@gmail.com`

**Git Branch:**
- All changes on: `claude/zen-pasteur-uegroc`
- Push to: `origin claude/zen-pasteur-uegroc` (no PR created yet)

---

## 📝 LAST COMMIT LOG

```
df6aee7 Consistent ad placement across all section listing pages and activate in-content ad slot
9ebdcc8 Add ads.txt for Google AdSense publisher verification
62b7192 Add Google AdSense script to site head
e6fdb90 Rewrite jurisdiction section to be location-neutral
60fce6c Fix privacy policy layout: center content, update email to info@bikelabs.com
551a3b2 Add AdSense sidebar ad units to article and culture pages
a1d5c75 Pin Node 20 so better-sqlite3 prebuilt binary installs on Railway
2c78f99 Update About page contact email to info@bikelabs.com with mailto links
```

---

## 🚀 DEPLOYMENT STATUS

| System | Status | URL |
|--------|--------|-----|
| **Frontend** | ✅ Live | https://bikelabs.com/ |
| **Admin Backend** | ✅ Live (Railway) | https://admin.bikelabs.com/admin/ |
| **Email** | ✅ Active (ImprovMX) | info@bikelabs.com |
| **DNS** | ✅ Configured | bikelabs.com → GitHub Pages, admin.bikelabs.com → Railway |
| **AdSense** | ⏳ Under Review | awaiting Google approval |
| **SSL** | ✅ Auto (Let's Encrypt) | all HTTPS |

---

**Ready to continue in a new chat — just reference this file for context!**
