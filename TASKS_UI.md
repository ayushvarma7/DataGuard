# DataGuard Frontend — Complete Task Breakdown

> A modern, SEO-friendly, impressive web application for DataGuard

---

## 🎯 Frontend Goals

| Goal | How We Achieve It |
|------|-------------------|
| **SEO-Friendly** | Next.js with SSG/SSR, meta tags, structured data, sitemap |
| **Impressive** | Modern glassmorphism UI, smooth animations, dark mode, interactive visualizations |
| **Utilitarian** | Actually works—upload files, see results, export reports, share via URL |
| **Free Hosting** | Vercel (free tier), no backend costs (DuckDB-WASM runs in browser) |

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Framework | **Next.js 14** (App Router) | SSR/SSG for SEO, React Server Components |
| Styling | **Tailwind CSS** | Utility-first, fast iteration |
| Components | **shadcn/ui** | Beautiful, accessible, customizable |
| Animations | **Framer Motion** | Smooth, performant animations |
| SQL Engine | **DuckDB-WASM** | Full SQL in browser, no server needed |
| Graphs | **React Flow** | Interactive lineage DAG visualization |
| Charts | **Recharts** | Data quality visualizations |
| Icons | **Lucide React** | Clean, consistent iconography |
| Deployment | **Vercel** | Free, fast, automatic HTTPS |

---

## 📐 Site Architecture

```
dataguard.dev/
├── / (Landing Page)                    ← SEO optimized, converts visitors
├── /app (Main Application)             ← File upload, analysis, results
├── /docs (Documentation)               ← How to use, rule types, API
├── /blog (Optional)                    ← SEO content, tutorials
└── /share/[id] (Shareable Results)     ← Public result links
```

---

## 🎨 Design System

### Theme: "Dark Mode Data Observatory"

**Color Palette:**
```
Background:     #0a0a0f (near black)
Surface:        #12121a (cards, panels)
Border:         #1e1e2e (subtle borders)
Primary:        #10b981 (emerald green)
Secondary:      #6366f1 (indigo)
Accent:         #f59e0b (amber for warnings)
Error:          #ef4444 (red)
Text:           #f4f4f5 (zinc-100)
Text Muted:     #a1a1aa (zinc-400)
```

**Design Elements:**
- Glassmorphism cards with subtle backdrop blur
- Gradient borders on hover
- Micro-interactions on all clickable elements
- Data visualization as hero elements
- Terminal/code aesthetic for technical credibility

---

## 📋 Task Breakdown

### Phase F0: Project Setup

#### Task F0.1: Initialize Next.js Project
**Time:** 30 mins

```bash
# Create Next.js app
npx create-next-app@latest dataguard-web --typescript --tailwind --eslint --app --src-dir

# Navigate and install dependencies
cd dataguard-web
npm install @duckdb/duckdb-wasm framer-motion recharts reactflow lucide-react
npm install @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-tooltip
npm install class-variance-authority clsx tailwind-merge
npm install -D @types/node
```

**Acceptance:** `npm run dev` shows Next.js app at localhost:3000

---

#### Task F0.2: Setup shadcn/ui
**Time:** 20 mins

```bash
npx shadcn-ui@latest init
# Choose: New York style, Zinc color, CSS variables: yes

# Add components we'll use
npx shadcn-ui@latest add button card tabs badge table alert dialog dropdown-menu
```

**Acceptance:** Can import and render `<Button>` component

---

#### Task F0.3: Configure Dark Theme & Fonts
**Time:** 30 mins

- [ ] Update `tailwind.config.ts` with custom colors
- [ ] Add Inter + JetBrains Mono fonts
- [ ] Create `globals.css` with dark theme variables
- [ ] Setup CSS for glassmorphism utilities

**File: `tailwind.config.ts`**
```typescript
const config = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        surface: "#12121a",
        border: "#1e1e2e",
        primary: "#10b981",
        secondary: "#6366f1",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backdropBlur: {
        glass: "12px",
      },
    },
  },
};
```

**Acceptance:** Dark theme renders correctly, fonts load

---

#### Task F0.4: Create Base Layout & Components
**Time:** 1 hour

- [ ] Create `src/components/ui/` structure
- [ ] Create `GlassCard` component
- [ ] Create `GradientBorder` component
- [ ] Create `AnimatedCounter` component
- [ ] Setup Framer Motion defaults

**Acceptance:** Reusable glass card renders with blur effect

---

### Phase F1: Landing Page (SEO Focus)

#### Task F1.1: Hero Section
**Time:** 2 hours

**Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] DataGuard                         [Docs] [GitHub]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     Data Quality You Can Actually Trust                     │
│     ─────────────────────────────────────                   │
│     Schema drift detection, validation rules,               │
│     and lineage tracking — all in your browser.             │
│                                                             │
│     [Try It Now - No Signup] [View on GitHub]               │
│                                                             │
│     ┌─────────────────────────────────────────┐             │
│     │  ▼ Drop a CSV to see it in action       │             │
│     │    (Your data never leaves your browser) │             │
│     └─────────────────────────────────────────┘             │
│                                                             │
│     Trusted by engineers at companies like...               │
│     [Oracle] [Stripe] [Databricks] [dbt]                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- [ ] Animated gradient text for headline
- [ ] Floating code snippets in background
- [ ] Interactive file drop zone (works immediately)
- [ ] Trust badges (fake logos for portfolio, or "Built with" logos)
- [ ] Smooth scroll indicator

**SEO:**
- [ ] `<title>DataGuard - Open Source Data Quality Framework</title>`
- [ ] Meta description, OG tags, Twitter cards
- [ ] JSON-LD structured data

**Acceptance:** Hero renders, file drop triggers animation

---

#### Task F1.2: Features Section
**Time:** 1.5 hours

**Design:** Three feature cards with icons and mini-demos

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ 🔍 Schema Drift  │ │ ✅ Validation    │ │ 🔗 Lineage       │
│                  │ │                  │ │                  │
│ [Mini animation  │ │ [Mini animation  │ │ [Mini animation  │
│  showing drift]  │ │  showing checks] │ │  showing DAG]    │
│                  │ │                  │ │                  │
│ Detect when your │ │ Define rules in  │ │ Track data flow  │
│ data structure   │ │ YAML, get clear  │ │ from source to   │
│ changes          │ │ failure reports  │ │ output           │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

**Features:**
- [ ] Animated icons on hover
- [ ] Mini interactive demos in each card
- [ ] Staggered entrance animation on scroll

**Acceptance:** Cards animate on scroll into view

---

#### Task F1.3: How It Works Section
**Time:** 1 hour

**Design:** 4-step horizontal flow

```
[1. Upload] ──▶ [2. Analyze] ──▶ [3. Validate] ──▶ [4. Export]
   📄              🔍                ✅               📊
 Drop any        Schema auto-      Rules run        Get JSON
 CSV/Parquet     inferred          in browser       report
```

**Features:**
- [ ] Animated connecting lines
- [ ] Step highlights as user scrolls
- [ ] Code snippets showing CLI equivalent

**Acceptance:** Steps animate sequentially on scroll

---

#### Task F1.4: Live Demo Section
**Time:** 2 hours

**Design:** Embedded mini-app right on landing page

```
┌─────────────────────────────────────────────────────────────┐
│  Try It Now — No Signup Required                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │                                                     │    │
│  │   [Actual working file upload + results preview]   │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  [Open Full App →]                                          │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- [ ] Sample data button ("Use Example Data")
- [ ] Shows schema + 2-3 validation results
- [ ] "See full analysis" CTA to /app

**Acceptance:** Can upload CSV on landing page and see results

---

#### Task F1.5: Footer & SEO Elements
**Time:** 45 mins

- [ ] Footer with links (GitHub, Docs, Twitter)
- [ ] "Built by [Your Name]" with links
- [ ] Generate `sitemap.xml`
- [ ] Add `robots.txt`
- [ ] Add canonical URLs
- [ ] Test with Lighthouse (aim for 95+ SEO score)

**Acceptance:** Lighthouse SEO score ≥ 95

---

### Phase F2: Main Application (/app)

#### Task F2.1: App Layout & Navigation
**Time:** 1 hour

**Design:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]  DataGuard App                    [Theme] [GitHub]  │
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│  DATASETS  │   [Main Content Area]                          │
│  ─────────│                                                │
│  + Upload  │                                                │
│            │                                                │
│  📄 matches│                                                │
│  📄 leagues│                                                │
│            │                                                │
│  ─────────│                                                │
│  RECENT    │                                                │
│  ─────────│                                                │
│  Today     │                                                │
│  Yesterday │                                                │
│            │                                                │
└────────────┴────────────────────────────────────────────────┘
```

**Features:**
- [ ] Collapsible sidebar
- [ ] Dataset list with status indicators
- [ ] Upload button always visible
- [ ] Persist datasets in localStorage

**Acceptance:** Sidebar renders, can collapse/expand

---

#### Task F2.2: File Upload Component
**Time:** 1.5 hours

**Design:**
```
┌─────────────────────────────────────────┐
│                                         │
│         📄                              │
│    Drop files here                      │
│    or click to browse                   │
│                                         │
│    Supports: CSV, Parquet, JSON, Excel  │
│    Max size: 100MB                      │
│                                         │
└─────────────────────────────────────────┘

[Uploading...]
┌─────────────────────────────────────────┐
│  matches.csv                            │
│  ████████████░░░░░░░░  58%              │
│  Processing with DuckDB...              │
└─────────────────────────────────────────┘
```

**Features:**
- [ ] Drag & drop with visual feedback
- [ ] File type validation
- [ ] Progress indicator
- [ ] Error states (wrong format, too large)
- [ ] Multiple file upload

**Acceptance:** Can upload CSV, see progress, files appear in sidebar

---

#### Task F2.3: DuckDB-WASM Integration
**Time:** 2 hours

**File: `src/lib/duckdb.ts`**

```typescript
// Singleton DuckDB instance
// Load WASM bundle
// Execute queries
// Handle file registration
```

**Features:**
- [ ] Lazy load DuckDB (don't block initial render)
- [ ] Register uploaded files as tables
- [ ] Execute SQL queries
- [ ] Handle errors gracefully
- [ ] Show loading state while WASM initializes

**Key Functions:**
```typescript
initDuckDB(): Promise<void>
loadFile(file: File, tableName: string): Promise<number>
query<T>(sql: string): Promise<T[]>
getSchema(tableName: string): Promise<ColumnSchema[]>
```

**Acceptance:** Can load CSV and run `SELECT * FROM table LIMIT 5`

---

#### Task F2.4: Schema View Component
**Time:** 1.5 hours

**Design:**
```
Schema: matches                              [Compare] [Export]
────────────────────────────────────────────────────────────────
Column          Type        Nullable    Unique    Stats
────────────────────────────────────────────────────────────────
match_id        INTEGER     No          Yes       min: 1, max: 8
home_team       VARCHAR     No          No        8 unique
away_team       VARCHAR     No          No        8 unique
broadcast_date  DATE        No          No        range: Dec 15-22
viewer_count    INTEGER     Yes ⚠️      No        1 null, min: -50k
league_id       INTEGER     No          No        2 unique values
────────────────────────────────────────────────────────────────
8 rows × 6 columns                              Inferred 0.3s ago
```

**Features:**
- [ ] Sortable columns
- [ ] Warning indicators for potential issues
- [ ] Column statistics (min, max, nulls, unique)
- [ ] Click column for detailed view
- [ ] Export schema as JSON/YAML

**Acceptance:** Schema renders with all columns and stats

---

#### Task F2.5: Data Preview Component
**Time:** 1 hour

**Design:**
```
Data Preview                                    [Show 10 ▼] rows
────────────────────────────────────────────────────────────────
│ match_id │ home_team     │ away_team   │ viewer_count │ ... │
├──────────┼───────────────┼─────────────┼──────────────┼─────┤
│ 1        │ Bayern Munich │ Dortmund    │ 2,450,000    │     │
│ 2        │ Leipzig       │ Frankfurt   │ 1,820,000    │     │
│ 3        │ Stuttgart     │ Wolfsburg   │ NULL ⚠️      │     │
│ 4        │ Mainz         │ Freiburg    │ -50,000 🔴   │     │
────────────────────────────────────────────────────────────────
Showing 4 of 8 rows                            [← Prev] [Next →]
```

**Features:**
- [ ] Paginated data view
- [ ] Highlight null values
- [ ] Highlight anomalies (negative numbers, etc.)
- [ ] Resizable columns
- [ ] Copy cell on click

**Acceptance:** Data table renders with pagination and highlighting

---

#### Task F2.6: Validation Panel
**Time:** 2 hours

**Design:**
```
Validation Results                              [Run All] [Edit Rules]
────────────────────────────────────────────────────────────────────────

Summary:  ✅ 4 passed   ❌ 3 failed   ⚠️ 1 warning

────────────────────────────────────────────────────────────────────────
❌ FAILED  viewer_count → not_null
   1 null value found
   [View Failing Rows]
   
   Row 3: viewer_count = NULL
────────────────────────────────────────────────────────────────────────
❌ FAILED  viewer_count → in_range (min: 0)
   1 value below minimum
   [View Failing Rows]
   
   Row 4: viewer_count = -50,000 (expected ≥ 0)
────────────────────────────────────────────────────────────────────────
✅ PASSED  match_id → not_null
   All 8 rows have values
────────────────────────────────────────────────────────────────────────
```

**Features:**
- [ ] Expandable result cards
- [ ] Show failing rows inline
- [ ] Quick filters (Show: All / Failed / Passed)
- [ ] Re-run individual validations
- [ ] Edit rules inline (YAML editor)

**Acceptance:** Validations run and display with expand/collapse

---

#### Task F2.7: Lineage Visualization
**Time:** 2.5 hours

**Using React Flow for interactive DAG:**

```
┌─────────────────────────────────────────────────────────────┐
│  Lineage: revenue_report.total_revenue      [Zoom] [Fit]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────┐                              ┌─────────────┐  │
│   │ matches │─────┐                   ┌───▶│ revenue_    │  │
│   │─────────│     │   ┌───────────┐   │    │ report      │  │
│   │viewer_  │─────┼──▶│ transform │───┤    └─────────────┘  │
│   │count    │     │   │───────────│   │                     │
│   └─────────┘     │   │ JOIN +    │   │    ┌─────────────┐  │
│                   │   │ aggregate │   └───▶│ viewer_     │  │
│   ┌─────────┐     │   └───────────┘        │ analytics   │  │
│   │ leagues │─────┘                        └─────────────┘  │
│   │─────────│                                               │
│   │ name    │                                               │
│   └─────────┘                                               │
│                                                             │
│  [Click any node for details]                               │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- [ ] Interactive pan and zoom
- [ ] Click node to see column details
- [ ] Highlight upstream/downstream on hover
- [ ] Different node colors by type (source/transform/output)
- [ ] Add lineage via UI (not just decorator)
- [ ] Export as PNG/SVG

**Acceptance:** Lineage DAG renders, can click nodes, can zoom/pan

---

#### Task F2.8: Results Export & Sharing
**Time:** 1.5 hours

**Features:**
- [ ] Export validation report as JSON
- [ ] Export validation report as PDF (use browser print)
- [ ] Generate shareable URL (`/share/[id]`)
- [ ] Copy results to clipboard
- [ ] Download schema as YAML

**Sharing Flow:**
1. User clicks "Share Results"
2. Results encoded to URL (or saved to localStorage with ID)
3. URL like `dataguard.dev/share/abc123`
4. Anyone with link sees read-only results

**Acceptance:** Can export JSON report, share link works

---

### Phase F3: Documentation Pages

#### Task F3.1: Docs Layout
**Time:** 1 hour

```
/docs
├── /getting-started
├── /validation-rules
├── /schema-inference
├── /lineage-tracking
├── /cli-reference
└── /api (if applicable)
```

**Features:**
- [ ] Sidebar navigation
- [ ] Search (optional, can use Algolia free tier)
- [ ] Code blocks with syntax highlighting
- [ ] Copy code button
- [ ] Mobile responsive

---

#### Task F3.2: Documentation Content
**Time:** 2 hours

- [ ] Getting Started guide
- [ ] Validation Rules reference (all rule types with examples)
- [ ] CLI command reference
- [ ] FAQ

---

### Phase F4: Polish & Performance

#### Task F4.1: Loading States & Skeletons
**Time:** 1 hour

- [ ] Skeleton loaders for all async content
- [ ] Loading spinners with context ("Initializing DuckDB...", "Running validations...")
- [ ] Progress indicators for long operations

---

#### Task F4.2: Error Handling & Empty States
**Time:** 1 hour

- [ ] Error boundaries
- [ ] Friendly error messages
- [ ] Empty state illustrations
- [ ] Retry buttons

---

#### Task F4.3: Animations & Micro-interactions
**Time:** 1.5 hours

- [ ] Page transitions
- [ ] Button hover effects
- [ ] Success/error animations
- [ ] Number count-up animations
- [ ] Smooth accordion expand/collapse

---

#### Task F4.4: Performance Optimization
**Time:** 1 hour

- [ ] Lazy load DuckDB-WASM
- [ ] Code split routes
- [ ] Optimize images (if any)
- [ ] Add `loading="lazy"` to below-fold content
- [ ] Test Core Web Vitals

**Target Scores:**
- Lighthouse Performance: ≥ 90
- Lighthouse Accessibility: ≥ 95
- Lighthouse SEO: ≥ 95

---

#### Task F4.5: Mobile Responsiveness
**Time:** 1.5 hours

- [ ] Test all pages on mobile
- [ ] Collapsible sidebar on mobile
- [ ] Touch-friendly file upload
- [ ] Responsive data tables (horizontal scroll)

---

### Phase F5: Deployment

#### Task F5.1: Environment Setup
**Time:** 30 mins

- [ ] Create `.env.example`
- [ ] Setup Vercel project
- [ ] Configure domain (if custom)

---

#### Task F5.2: Deploy to Vercel
**Time:** 30 mins

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

- [ ] Connect GitHub repo
- [ ] Setup automatic deployments on push
- [ ] Verify production build works

---

#### Task F5.3: Analytics & Monitoring (Optional)
**Time:** 30 mins

- [ ] Add Vercel Analytics (free)
- [ ] Add Plausible or Umami for privacy-friendly analytics
- [ ] Setup error tracking (Sentry free tier)

---

## 📁 Final Project Structure

```
dataguard-web/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Landing page
│   │   ├── layout.tsx               # Root layout
│   │   ├── app/
│   │   │   ├── page.tsx             # Main app
│   │   │   └── layout.tsx           # App layout with sidebar
│   │   ├── docs/
│   │   │   └── [[...slug]]/page.tsx # Docs pages
│   │   └── share/
│   │       └── [id]/page.tsx        # Shareable results
│   ├── components/
│   │   ├── ui/                      # shadcn components
│   │   ├── landing/                 # Landing page sections
│   │   │   ├── Hero.tsx
│   │   │   ├── Features.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── LiveDemo.tsx
│   │   │   └── Footer.tsx
│   │   ├── app/                     # App components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   ├── SchemaView.tsx
│   │   │   ├── DataPreview.tsx
│   │   │   ├── ValidationPanel.tsx
│   │   │   ├── LineageGraph.tsx
│   │   │   └── ExportMenu.tsx
│   │   └── shared/                  # Shared components
│   │       ├── GlassCard.tsx
│   │       ├── AnimatedCounter.tsx
│   │       └── CodeBlock.tsx
│   ├── lib/
│   │   ├── duckdb.ts               # DuckDB-WASM wrapper
│   │   ├── validation.ts           # Validation logic
│   │   ├── schema.ts               # Schema inference
│   │   └── utils.ts                # Utilities
│   ├── hooks/
│   │   ├── useDuckDB.ts
│   │   ├── useDataset.ts
│   │   └── useValidation.ts
│   └── styles/
│       └── globals.css
├── public/
│   ├── og-image.png                # Social share image
│   └── favicon.ico
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 📊 Progress Tracker

| Phase | Status | Tasks | Est. Time |
|-------|--------|-------|-----------|
| F0: Setup | ⏳ | 4 | 2 hours |
| F1: Landing | ⏳ | 5 | 7 hours |
| F2: App | ⏳ | 8 | 13 hours |
| F3: Docs | ⏳ | 2 | 3 hours |
| F4: Polish | ⏳ | 5 | 6 hours |
| F5: Deploy | ⏳ | 3 | 1.5 hours |

**Total Estimated Time:** ~32 hours (4 weekends)

---

## 🎯 What Makes This Impressive

1. **Real utility** — Actually processes files, not a mockup
2. **Privacy-first** — "Your data never leaves your browser" is a great selling point
3. **Modern stack** — Next.js 14, App Router, Server Components
4. **Polished UX** — Animations, loading states, error handling
5. **SEO optimized** — Will rank for "data quality tool", "schema drift detection"
6. **Open source** — GitHub stars = social proof
7. **Shareable results** — Viral potential

---

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/yourusername/dataguard-web
cd dataguard-web
npm install
npm run dev

# Open http://localhost:3000
```