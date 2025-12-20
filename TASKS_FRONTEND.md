# DataGuard — Frontend Transformation Blueprint

> **Mission:** Replace the current Streamlit dashboard with a stunning, production-grade web application that's SEO-friendly, lightning-fast, and showcases DataGuard as a world-class data quality platform.

---

## Vision & Design Philosophy

### Why Replace Streamlit?

| Limitation | Impact | Solution |
|------------|--------|----------|
| No SEO | Cannot be discovered by search engines | Next.js with SSR/SSG |
| Basic Aesthetics | Looks like a prototype, not production | Premium glassmorphism design |
| No PWA Support | Cannot be installed on devices | Service workers + manifest |
| Limited Branding | Generic Streamlit chrome everywhere | Full custom design language |
| Poor Performance | Re-renders entire page on interaction | React + optimized rendering |
| No Deep Linking | Cannot share specific views | Next.js file-based routing |

### Design Pillars

1. **Premium SaaS Aesthetic** — Think Linear, Vercel, or Raycast dashboards
2. **Dark Mode First** — Sophisticated dark theme with subtle gradients
3. **Motion & Delight** — Framer Motion micro-interactions everywhere
4. **Data-Dense Yet Clear** — Information-rich without feeling cluttered
5. **Zero-Config Demo** — DuckDB-WASM for instant browser-based analysis
6. **Accessibility** — WCAG 2.1 AA compliance from day one

---

## Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Next.js 14+ (App Router) | SEO, SSR, file-based routing, excellent DX |
| **Language** | TypeScript | Type safety, better tooling |
| **Styling** | CSS Variables + Vanilla CSS | Maximum control, no framework lock-in |
| **Animations** | Framer Motion | Buttery smooth, declarative animations |
| **Charts** | Recharts + react-chartjs-2 | Beautiful, customizable data viz |
| **Icons** | Phosphor Icons | Premium, cohesive icon set |
| **State** | Zustand | Simple, performant global state |
| **Data Engine** | DuckDB-WASM | In-browser SQL, no server required |
| **Diagrams** | React Flow / Mermaid | Interactive lineage visualization |
| **Forms** | React Hook Form + Zod | Type-safe forms with validation |
| **Toasts** | Sonner | Beautiful notification system |
| **Tables** | TanStack Table | Powerful, headless data tables |
| **Hosting** | GitHub Pages / Vercel | Free, instant deployment |

---

## Phase 1: Foundation & Design System

### Task 1.1: Project Scaffolding
**Time Estimate:** 1 hour

- [ ] Initialize Next.js 14+ with App Router
  ```bash
  npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir
  ```
- [ ] Remove Tailwind (we're going vanilla CSS for this project)
- [ ] Create folder structure:
  ```
  web/
  ├── src/
  │   ├── app/              # Next.js App Router pages
  │   │   ├── layout.tsx
  │   │   ├── page.tsx      # Landing page
  │   │   ├── dashboard/
  │   │   ├── schemas/
  │   │   ├── validations/
  │   │   ├── lineage/
  │   │   └── contracts/
  │   ├── components/
  │   │   ├── ui/           # Primitive components
  │   │   ├── layout/       # Header, Sidebar, Footer
  │   │   ├── charts/       # Data visualization
  │   │   └── features/     # Feature-specific components
  │   ├── hooks/            # Custom React hooks
  │   ├── lib/              # Utilities, DuckDB setup
  │   ├── stores/           # Zustand stores
  │   └── styles/           # CSS files
  │       ├── globals.css
  │       ├── variables.css
  │       └── animations.css
  └── public/
      ├── fonts/
      └── icons/
  ```
- [ ] Install core dependencies:
  ```bash
  npm install framer-motion zustand @duckdb/duckdb-wasm
  npm install recharts @tanstack/react-table sonner
  npm install @phosphor-icons/react
  npm install react-hook-form zod @hookform/resolvers
  ```

**Acceptance Criteria:** `npm run dev` starts clean Next.js app

---

### Task 1.2: Design Tokens & CSS Variables
**Time Estimate:** 1.5 hours

**File:** `web/src/styles/variables.css`

- [ ] Define comprehensive color palette:
  ```css
  :root {
    /* Brand Colors */
    --color-primary-50: #eef2ff;
    --color-primary-100: #e0e7ff;
    --color-primary-200: #c7d2fe;
    --color-primary-300: #a5b4fc;
    --color-primary-400: #818cf8;
    --color-primary-500: #6366f1;  /* Main brand */
    --color-primary-600: #4f46e5;
    --color-primary-700: #4338ca;
    --color-primary-800: #3730a3;
    --color-primary-900: #312e81;
    
    /* Semantic Colors */
    --color-success: #10b981;
    --color-warning: #f59e0b;
    --color-error: #ef4444;
    --color-info: #3b82f6;
    
    /* Dark Theme (Default) */
    --bg-primary: #0a0a0f;
    --bg-secondary: #12121a;
    --bg-tertiary: #1a1a24;
    --bg-elevated: #22222e;
    --bg-glass: rgba(255, 255, 255, 0.03);
    
    --text-primary: #fafafa;
    --text-secondary: #a1a1aa;
    --text-tertiary: #71717a;
    
    --border-subtle: rgba(255, 255, 255, 0.06);
    --border-default: rgba(255, 255, 255, 0.1);
    --border-strong: rgba(255, 255, 255, 0.15);
    
    /* Gradients */
    --gradient-primary: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    --gradient-glow: radial-gradient(ellipse at center, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
    --gradient-mesh: 
      radial-gradient(at 40% 20%, rgba(99, 102, 241, 0.1) 0px, transparent 50%),
      radial-gradient(at 80% 0%, rgba(139, 92, 246, 0.1) 0px, transparent 50%),
      radial-gradient(at 0% 50%, rgba(236, 72, 153, 0.05) 0px, transparent 50%);
    
    /* Shadows */
    --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
    --shadow-glow: 0 0 40px rgba(99, 102, 241, 0.3);
    
    /* Typography */
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
    
    /* Spacing Scale */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
    --space-12: 3rem;
    --space-16: 4rem;
    
    /* Border Radius */
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;
    --radius-2xl: 1.5rem;
    --radius-full: 9999px;
    
    /* Transitions */
    --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-spring: 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  [data-theme="light"] {
    --bg-primary: #ffffff;
    --bg-secondary: #f8fafc;
    --bg-tertiary: #f1f5f9;
    --bg-elevated: #ffffff;
    --bg-glass: rgba(0, 0, 0, 0.02);
    
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-tertiary: #94a3b8;
    
    --border-subtle: rgba(0, 0, 0, 0.04);
    --border-default: rgba(0, 0, 0, 0.08);
    --border-strong: rgba(0, 0, 0, 0.12);
  }
  ```

- [ ] Define animation keyframes in `animations.css`
- [ ] Set up global resets and base styles in `globals.css`

**Acceptance Criteria:** All design tokens accessible via CSS variables

---

### Task 1.3: Core UI Components
**Time Estimate:** 3 hours

Build foundational components with premium aesthetics:

#### Button Component
**File:** `web/src/components/ui/Button.tsx`

- [ ] Multiple variants: primary, secondary, ghost, danger
- [ ] Size variants: sm, md, lg
- [ ] Loading state with spinner
- [ ] Hover animations with scale and glow
- [ ] Disabled state styling
- [ ] Icon support (leading/trailing)

#### Card Component
**File:** `web/src/components/ui/Card.tsx`

- [ ] Glassmorphism effect with backdrop blur
- [ ] Subtle border glow on hover
- [ ] Header/body/footer slots
- [ ] Collapsible variant
- [ ] Interactive variant with click handling

#### Input Components
**File:** `web/src/components/ui/Input.tsx`

- [ ] Text input with floating label
- [ ] Select dropdown with custom styling
- [ ] Checkbox and radio with animations
- [ ] File upload with drag-and-drop zone
- [ ] Search input with icon

#### Data Display Components
- [ ] `Badge` — Status indicators with color variants
- [ ] `Metric` — Large number with label and trend indicator
- [ ] `ProgressBar` — Animated progress with gradient
- [ ] `Skeleton` — Loading placeholders with shimmer
- [ ] `Table` — Sortable, filterable data table

**Acceptance Criteria:** All components render correctly with proper styling

---

### Task 1.4: Layout Components
**Time Estimate:** 2 hours

#### Header
**File:** `web/src/components/layout/Header.tsx`

- [ ] Logo with brand gradient
- [ ] Navigation links with active state
- [ ] Theme toggle (dark/light)
- [ ] GitHub star button
- [ ] "Try Demo" CTA button
- [ ] Mobile responsive with hamburger menu

#### Sidebar
**File:** `web/src/components/layout/Sidebar.tsx`

- [ ] Icon-based navigation
- [ ] Collapsible to icon-only mode
- [ ] Active page indicator with glow
- [ ] Tooltips on collapsed state
- [ ] Section dividers
- [ ] User/workspace selector at bottom

#### Footer
**File:** `web/src/components/layout/Footer.tsx`

- [ ] Minimal footer for landing pages
- [ ] Links to GitHub, docs, portfolio
- [ ] "Built with" credits

**Acceptance Criteria:** Fully responsive layout system

---

## Phase 2: Landing Page & Marketing

### Task 2.1: Hero Section
**Time Estimate:** 2 hours

**File:** `web/src/app/page.tsx`

- [ ] Animated mesh gradient background
- [ ] Bold headline with gradient text:
  > "Data Quality, Redefined"
- [ ] Subheadline explaining value prop
- [ ] CTA buttons: "Launch Dashboard" + "View on GitHub"
- [ ] Animated illustration/mockup of dashboard
- [ ] Floating stats: "10+ Rule Types", "Zero Cost", "In-Browser Demo"
- [ ] Subtle particle or grid animation in background

**Design Reference:** Linear.app, Vercel.com landing pages

---

### Task 2.2: Feature Showcase
**Time Estimate:** 2 hours

- [ ] **Schema Drift Detection** feature block
  - Interactive animation showing schema change
  - Code snippet example
- [ ] **Validation Engine** feature block
  - Rule types visualization
  - Sample YAML config
- [ ] **Lineage Tracking** feature block
  - Animated DAG/flow diagram
  - Upstream/downstream example
- [ ] **Data Contracts** feature block
  - Contract generation animation
  - JSON export preview

Each block should have:
- Icon with gradient background
- Heading and description
- Visual demo/animation
- "Learn More" link

---

### Task 2.3: How It Works Section
**Time Estimate:** 1.5 hours

- [ ] Step-by-step flow with numbered circles
- [ ] Horizontal timeline on desktop, vertical on mobile
- [ ] Animated code snippets showing CLI usage:
  1. `dataguard schema infer data.csv --name mydata`
  2. `dataguard validate mydata --rules rules.yaml`
  3. `dataguard lineage show report --format mermaid`
- [ ] Each step reveals with scroll animation

---

### Task 2.4: Technology Stack Section
**Time Estimate:** 1 hour

- [ ] Logo grid showing: DuckDB, SQLite, Python, React
- [ ] Hover cards with descriptions
- [ ] "Why DuckDB?" expandable explanation
- [ ] Performance comparison chart (optional)

---

### Task 2.5: CTA & Footer
**Time Estimate:** 1 hour

- [ ] Large CTA section:
  > "Start Improving Your Data Quality Today"
- [ ] Email capture for updates (optional, can be GitHub star)
- [ ] Quick links: Docs, GitHub, Examples
- [ ] Copyright and credits

---

## Phase 3: Dashboard Application

### Task 3.1: Dashboard Layout
**Time Estimate:** 2 hours

**File:** `web/src/app/dashboard/layout.tsx`

- [ ] Collapsible sidebar with navigation
- [ ] Top bar with breadcrumbs and quick actions
- [ ] Main content area with padding and max-width
- [ ] Command palette (Cmd+K) for quick navigation
- [ ] Toast notification area
- [ ] Mobile: Bottom tab navigation

---

### Task 3.2: Dashboard Home
**Time Estimate:** 2 hours

**File:** `web/src/app/dashboard/page.tsx`

- [ ] Welcome message with user/workspace name
- [ ] **Metrics row:**
  - Total Datasets monitored
  - Validation Success Rate (gauge chart)
  - Schema Drift Alerts (last 7 days)
  - Lines of Lineage tracked
- [ ] **Recent Activity feed:**
  - Schema changes
  - Failed validations
  - New contracts generated
- [ ] **Quick Actions cards:**
  - Upload New Dataset
  - Create Validation Rules
  - View Lineage Graph
- [ ] **System Health indicators**

---

### Task 3.3: Schema Browser
**Time Estimate:** 3 hours

**File:** `web/src/app/dashboard/schemas/page.tsx`

- [ ] Dataset list in sidebar/left panel
- [ ] Search and filter datasets
- [ ] Selected dataset shows:
  - Column table with: Name, Type, Nullable, Stats
  - Type distribution pie chart
  - Row count and file info
  - "View History" button
- [ ] **Schema version timeline:**
  - Vertical timeline showing snapshots
  - Click to view historical schema
  - Diff view between versions
- [ ] **Drift detection UI:**
  - Side-by-side comparison
  - Red/green highlighting for changes
  - Alert badges for breaking changes

---

### Task 3.4: Validation Center
**Time Estimate:** 3 hours

**File:** `web/src/app/dashboard/validations/page.tsx`

- [ ] **Rule Builder:**
  - Drag-and-drop rule configuration
  - YAML preview panel
  - Test against sample data
  - Save as contract
- [ ] **Validation History:**
  - Timeline of runs
  - Pass/fail trend chart
  - Click run to see details
- [ ] **Run Details:**
  - Rule-by-rule results
  - Failed row samples with data
  - Export failures to CSV
- [ ] **Alerts Configuration:**
  - Set thresholds for notifications
  - Email/webhook integration (placeholder)

---

### Task 3.5: Lineage Explorer
**Time Estimate:** 4 hours

**File:** `web/src/app/dashboard/lineage/page.tsx`

- [ ] **Interactive DAG visualization:**
  - React Flow or custom canvas
  - Zoom and pan controls
  - Minimap for large graphs
- [ ] **Node styling:**
  - Tables as rectangles
  - Columns as pills inside
  - Color by dataset
  - Glow for selected
- [ ] **Edge styling:**
  - Animated flow lines
  - Label with transformation type
- [ ] **Inspector panel:**
  - Click node to see details
  - Upstream/downstream lists
  - Transformation SQL preview
- [ ] **Filters:**
  - Focus on specific column
  - Hide/show by dataset
  - Search nodes

---

### Task 3.6: Contract Manager
**Time Estimate:** 2.5 hours

**File:** `web/src/app/dashboard/contracts/page.tsx`

- [ ] **Contract list:**
  - Card grid with status badges
  - Last verified timestamp
  - Schema + rules summary
- [ ] **Contract builder:**
  - Select dataset
  - Choose columns to include
  - Add validation rules per column
  - Set metadata (owner, version, freshness SLA)
  - Preview JSON/YAML
  - Export/download
- [ ] **Contract verification:**
  - Upload data file
  - Run all checks
  - Visual report with pass/fail
  - Suggest fixes for failures

---

## Phase 4: Browser-Based Data Engine

### Task 4.1: DuckDB-WASM Integration
**Time Estimate:** 3 hours

**File:** `web/src/lib/duckdb.ts`

- [ ] Initialize DuckDB-WASM singleton
- [ ] File upload handler (CSV, Parquet)
- [ ] In-memory table management
- [ ] Query executor with error handling
- [ ] Result set to JavaScript object converter
- [ ] Performance optimizations:
  - Web Worker for queries
  - Streaming for large results
  - Caching layer

---

### Task 4.2: File Upload Experience
**Time Estimate:** 2 hours

**File:** `web/src/components/features/FileUpload.tsx`

- [ ] Drag-and-drop zone with visual feedback
- [ ] File type detection and icon
- [ ] Upload progress indicator
- [ ] Preview first N rows on upload
- [ ] Error handling with helpful messages
- [ ] Multiple file support (for FK relationships)
- [ ] Sample data sets for demo

---

### Task 4.3: Schema Inference in Browser
**Time Estimate:** 2 hours

- [ ] Infer types from uploaded file
- [ ] Generate SchemaSnapshot JSON
- [ ] Compare against previous (if exists)
- [ ] Store snapshots in IndexedDB for persistence
- [ ] Export schema as JSON

---

### Task 4.4: Validation in Browser
**Time Estimate:** 2.5 hours

- [ ] Parse YAML rules file (or use builder)
- [ ] Generate DuckDB validation queries
- [ ] Execute and collect results
- [ ] Display report with failed samples
- [ ] Export report as JSON

---

## Phase 5: Polish & Production

### Task 5.1: SEO Optimization
**Time Estimate:** 1.5 hours

- [ ] Meta tags for all pages
- [ ] Open Graph images
- [ ] Twitter card metadata
- [ ] JSON-LD structured data
- [ ] Sitemap generation
- [ ] Robots.txt configuration
- [ ] Page titles and descriptions

---

### Task 5.2: Performance Optimization
**Time Estimate:** 2 hours

- [ ] Code splitting by route
- [ ] Image optimization (Next/Image)
- [ ] Font subsetting
- [ ] Lazy load heavy components
- [ ] Lighthouse score > 90 on all metrics
- [ ] Bundle analysis and optimization

---

### Task 5.3: PWA Features
**Time Estimate:** 1.5 hours

- [ ] Web app manifest
- [ ] Service worker for offline
- [ ] Install prompt
- [ ] Splash screen
- [ ] App icons at all sizes

---

### Task 5.4: Accessibility Audit
**Time Estimate:** 1.5 hours

- [ ] Keyboard navigation for all actions
- [ ] Screen reader testing
- [ ] Color contrast checks
- [ ] Focus indicators
- [ ] ARIA labels
- [ ] Skip links

---

### Task 5.5: Documentation & Help
**Time Estimate:** 1.5 hours

- [ ] In-app tooltips with explanations
- [ ] "?" help buttons with modals
- [ ] Quick start tour/onboarding
- [ ] Keyboard shortcuts reference
- [ ] Link to full documentation

---

### Task 5.6: Deployment
**Time Estimate:** 1 hour

- [ ] GitHub Actions for CI/CD
- [ ] Static export for GitHub Pages
- [ ] Custom domain setup (optional)
- [ ] Environment variables for config
- [ ] Error tracking setup (Sentry)
- [ ] Analytics (privacy-respecting)

---

## Phase 6: Advanced Features (Future)

### Task 6.1: API Integration
- [ ] Connect to Python backend via REST
- [ ] WebSocket for real-time updates
- [ ] Auth integration (if needed)

### Task 6.2: Collaboration Features
- [ ] Comment on validations
- [ ] Share contracts via URL
- [ ] Export/import configurations

### Task 6.3: Advanced Visualizations
- [ ] Data profiling histograms
- [ ] Anomaly detection charts
- [ ] Custom dashboard builder

---

## Progress Tracker

| Phase | Description | Tasks | Status |
|-------|-------------|-------|--------|
| Phase 1 | Foundation & Design System | 4 | ⏳ |
| Phase 2 | Landing Page & Marketing | 5 | ⏳ |
| Phase 3 | Dashboard Application | 6 | ⏳ |
| Phase 4 | Browser Data Engine | 4 | ⏳ |
| Phase 5 | Polish & Production | 6 | ⏳ |
| Phase 6 | Advanced Features | 3 | 📅 |

**Legend:** ✅ Complete | 🔄 In Progress | ⏳ Not Started | 📅 Future

---

## Design Inspiration

### Websites to Study:
- [Linear](https://linear.app) — Master class in dark UI
- [Vercel](https://vercel.com) — Gradient text, mesh backgrounds
- [Raycast](https://raycast.com) — Command palette, keyboard-first
- [Supabase](https://supabase.com) — Dashboard aesthetics
- [Stripe](https://stripe.com) — Data visualization polish
- [Planetscale](https://planetscale.com) — Database dashboard UX

### Key Visual Elements:
- Frosted glass cards with subtle borders
- Gradient text for headings
- Subtle mesh gradient backgrounds
- Animated numbers and counters
- Smooth page transitions
- Skeleton loading states
- Micro-interactions on hover
- Keyboard shortcuts for power users

---

## Acceptance Criteria (Definition of Done)

For the frontend to be considered complete:

1. **SEO Ready** — First page render includes all metadata, Lighthouse SEO > 95
2. **Performant** — Lighthouse Performance > 90, FCP < 1.5s
3. **Accessible** — WCAG 2.1 AA compliant, Lighthouse Accessibility > 95
4. **Responsive** — Works flawlessly on mobile, tablet, and desktop
5. **Functional** — All dashboard features work with DuckDB-WASM
6. **Impressive** — First impression is "wow, this looks professional"
7. **Deployed** — Live on GitHub Pages with CI/CD

---

> *This frontend should make DataGuard look like a $10M funded startup product, not a side project.*
