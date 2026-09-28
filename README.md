# 🇮🇳 SarkariTracker

A genuine Indian government recruitment portal and candidate application tracking platform. Zero fake data, 100% verified commission dates.

## Architecture

This repository is organized into two primary applications:

### 1. `web-public/` — Next.js 14 Public SEO & Information Portal
- **Framework**: Next.js 14 (App Router, TypeScript, Tailwind CSS)
- **Features**:
  - High-performance Server-Side Rendering (SSR) & Incremental Static Regeneration (ISR)
  - Search engine optimization with dynamic JSON-LD structured schema (`JobPosting`), Canonical tags, and Open Graph previews
  - All 88+ Karnataka (KEA, KPSC) and Central (UPSC, SSC, Banking, Railways) exams directory
  - Dedicated SEO landing pages (`/exams/[slug]`, `/blog/[slug]`, `/sitemap.xml`, `/robots.txt`)
  - Direct integration linking to the candidate dashboard

### 2. `sarkari-tracker/` — Authenticated Candidate Application Workspace & API
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: Node.js & Express API (`server/`)
- **Features**:
  - Personal application pipeline tracker (`/tracker`) with custom job entries
  - Document checklist management (hall tickets, caste certificates, scorecards)
  - Interactive personal examination calendar (`/calendar`)
  - Real-time deadline countdown timers with push alerts
  - Candidate community self-upload and contribution module (instant publishing of official notifications, cutoffs, syllabus, and dates)
  - Automated web crawler for education news and official commission press notes

---

## Getting Started Locally

### 1. Start the Express Backend API
```bash
cd sarkari-tracker
npm install
node server/index.js
# Runs on http://localhost:3001
```

### 2. Start the React Candidate Dashboard
```bash
cd sarkari-tracker
npm run dev
# Runs on http://localhost:5173
```

### 3. Start the Next.js Public SEO Portal
```bash
cd web-public
npm install
npm run dev
# Runs on http://localhost:3000
```

---

## Deploying to Vercel

### Web Public (Next.js)
1. In Vercel, import this repository and set the **Root Directory** to `web-public`.
2. Framework Preset: **Next.js**.
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL`: Your live API URL
   - `NEXT_PUBLIC_REACT_APP_URL`: Your live dashboard URL

### Candidate Dashboard (React Vite)
1. In Vercel, import this repository and set the **Root Directory** to `sarkari-tracker`.
2. Framework Preset: **Vite** (uses included `vercel.json` for SPA rewrites).

---

## Contact & Support
- **Editorial & Advisory Desk**: techtherapy1818@gmail.com
- **Author**: [Ashrithhn](https://github.com/Ashrithhn)
- **License**: MIT
