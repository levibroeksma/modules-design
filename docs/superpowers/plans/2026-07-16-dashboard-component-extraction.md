# Dashboard Component Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract every meaningful UI block from `app/src/pages/index.astro` into `ui/` and `dashboard/` Astro components, leaving the page as composition + demo data with visual parity.

**Architecture:** Primitives live in `app/src/components/ui/`. Section wrappers live in `app/src/components/dashboard/` and compose primitives or existing chart components. Demo data stays on `index.astro` and is passed as props. Icons stay as inline SVGs via slots.

**Tech Stack:** Astro 7, Tailwind CSS v4 (tokens in `global.css`), existing `.surface` / `.btn` / `.badge` / `.nav-item` primitives.

**Spec:** `docs/superpowers/specs/2026-07-16-dashboard-component-extraction-design.md`

## Global Constraints

- Visual parity only — move markup/classes; do not redesign.
- Props pattern: `interface Props` + `Astro.props` like `GameHeader.astro`.
- No Alpine.js, no new SVG files under `src/icons/`.
- Charts stay in `components/charts/`; only wrap them in `AnalyticsSection`.
- No automated test harness — verify with `astro check` / `astro build` and manual `/` review.
- Workspace may have no git repo — skip commit steps if `git rev-parse` fails.
- Work directory for commands: `app/`.

## File Structure

| Path | Responsibility |
| --- | --- |
| `app/src/components/ui/PageIntro.astro` | Title + description block |
| `app/src/components/ui/StatCard.astro` | Single metric card |
| `app/src/components/ui/SearchField.astro` | Labeled search input |
| `app/src/components/ui/TableListItem.astro` | One table row link |
| `app/src/components/ui/NavItem.astro` | One bottom-nav link |
| `app/src/components/dashboard/DashboardHeader.astro` | App header (brand + settings) |
| `app/src/components/dashboard/StatsGrid.astro` | 2-col grid of `StatCard` |
| `app/src/components/dashboard/QuickActions.astro` | Action button row |
| `app/src/components/dashboard/AnalyticsSection.astro` | Charts block |
| `app/src/components/dashboard/TablesList.astro` | Tables header + list |
| `app/src/components/dashboard/BottomNav.astro` | Bottom nav shell |
| `app/src/pages/index.astro` | Compose + demo data only |

---

### Task 1: UI primitives — PageIntro, SearchField, StatCard

**Files:**
- Create: `app/src/components/ui/PageIntro.astro`
- Create: `app/src/components/ui/SearchField.astro`
- Create: `app/src/components/ui/StatCard.astro`

**Interfaces:**
- Consumes: none
- Produces:
  - `PageIntro`: `{ title: string; description: string }`
  - `SearchField`: `{ id: string; label: string; placeholder: string }`
  - `StatCard`: `{ label: string; value: string; hint?: string; hintAccent?: boolean }`

- [ ] **Step 1: Create `PageIntro.astro`**

```astro
---
interface Props {
  title: string;
  description: string;
}

const { title, description } = Astro.props;
---

<section class="mb-6">
  <h1 class="text-xl font-semibold tracking-tight">{title}</h1>
  <p class="mt-1 text-sm text-fg-muted">{description}</p>
</section>
```

- [ ] **Step 2: Create `SearchField.astro`**

```astro
---
interface Props {
  id: string;
  label: string;
  placeholder: string;
}

const { id, label, placeholder } = Astro.props;
---

<section class="mb-6">
  <label for={id} class="sr-only">{label}</label>
  <input id={id} type="search" class="input" placeholder={placeholder} />
</section>
```

- [ ] **Step 3: Create `StatCard.astro`**

```astro
---
interface Props {
  label: string;
  value: string;
  hint?: string;
  hintAccent?: boolean;
}

const { label, value, hint, hintAccent = false } = Astro.props;
---

<div class="surface p-4">
  <p class="text-xs font-medium text-fg-subtle">{label}</p>
  <p class="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
  {
    hint && (
      <p
        class:list={[
          "mt-1 text-xs",
          hintAccent ? "text-accent-400" : "text-fg-subtle",
        ]}
      >
        {hint}
      </p>
    )
  }
</div>
```

- [ ] **Step 4: Verify files exist**

Run: `ls app/src/components/ui/PageIntro.astro app/src/components/ui/SearchField.astro app/src/components/ui/StatCard.astro`

Expected: three paths listed.

- [ ] **Step 5: Commit (skip if no git)**

```bash
git add app/src/components/ui/PageIntro.astro app/src/components/ui/SearchField.astro app/src/components/ui/StatCard.astro
git commit -m "$(cat <<'EOF'
Add dashboard UI primitives for intro, search, and stats.

EOF
)"
```

---

### Task 2: UI primitives — TableListItem, NavItem

**Files:**
- Create: `app/src/components/ui/TableListItem.astro`
- Create: `app/src/components/ui/NavItem.astro`

**Interfaces:**
- Consumes: none
- Produces:
  - `TableListItem`: `{ name: string; rowsLabel: string; href: string; status: 'live' | 'idle' }` + default slot for icon SVG
  - `NavItem`: `{ href: string; label: string; active?: boolean }` + default slot for icon SVG

- [ ] **Step 1: Create `TableListItem.astro`**

```astro
---
interface Props {
  name: string;
  rowsLabel: string;
  href: string;
  status: "live" | "idle";
}

const { name, rowsLabel, href, status } = Astro.props;
const isLive = status === "live";
---

<li>
  <a
    href={href}
    class="surface flex items-center gap-3 p-3.5 transition-colors duration-200 hover:border-border-strong"
  >
    <div
      class:list={[
        "flex size-9 shrink-0 items-center justify-center rounded-md ring-1",
        isLive
          ? "bg-accent-950 text-accent-400 ring-accent-800/50"
          : "bg-bg-muted text-fg-muted ring-border",
      ]}
    >
      <slot />
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium">{name}</p>
      <p class="text-xs text-fg-subtle">{rowsLabel}</p>
    </div>
    {
      isLive ? (
        <span class="badge badge-accent">Live</span>
      ) : (
        <span class="badge badge-muted">Idle</span>
      )
    }
  </a>
</li>
```

- [ ] **Step 2: Create `NavItem.astro`**

```astro
---
interface Props {
  href: string;
  label: string;
  active?: boolean;
}

const { href, label, active = false } = Astro.props;
---

<a
  href={href}
  class:list={["nav-item", active && "nav-item-active"]}
  aria-current={active ? "page" : undefined}
>
  <slot />
  {label}
</a>
```

- [ ] **Step 3: Verify files exist**

Run: `ls app/src/components/ui/TableListItem.astro app/src/components/ui/NavItem.astro`

Expected: two paths listed.

- [ ] **Step 4: Commit (skip if no git)**

```bash
git add app/src/components/ui/TableListItem.astro app/src/components/ui/NavItem.astro
git commit -m "$(cat <<'EOF'
Add TableListItem and NavItem UI primitives.

EOF
)"
```

---

### Task 3: Dashboard sections — Header, StatsGrid, QuickActions

**Files:**
- Create: `app/src/components/dashboard/DashboardHeader.astro`
- Create: `app/src/components/dashboard/StatsGrid.astro`
- Create: `app/src/components/dashboard/QuickActions.astro`

**Interfaces:**
- Consumes: `StatCard` props shape from Task 1
- Produces:
  - `DashboardHeader`: `{ projectName: string; planLabel: string }` (renders with `slot="header"`)
  - `StatsGrid`: `{ items: { label: string; value: string; hint?: string; hintAccent?: boolean }[] }`
  - `QuickActions`: `{ actions: { label: string; variant: 'primary' | 'secondary' }[] }`

- [ ] **Step 1: Create `DashboardHeader.astro`**

```astro
---
interface Props {
  projectName: string;
  planLabel: string;
}

const { projectName, planLabel } = Astro.props;
---

<header
  slot="header"
  class="shrink-0 border-b border-border bg-bg/80 px-4 py-3 backdrop-blur-md"
>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2.5">
      <div
        class="flex size-8 items-center justify-center rounded-md bg-accent-500/15 ring-1 ring-accent-500/30"
      >
        <svg
          class="size-4 text-accent"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"></path>
        </svg>
      </div>
      <div>
        <p class="text-sm font-semibold leading-none">{projectName}</p>
        <p class="mt-0.5 text-xs text-fg-subtle">{planLabel}</p>
      </div>
    </div>
    <button
      class="btn btn-ghost size-11 rounded-full p-0"
      aria-label="Settings"
    >
      <svg
        class="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3"></circle><path
          d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        ></path>
      </svg>
    </button>
  </div>
</header>
```

- [ ] **Step 2: Create `StatsGrid.astro`**

```astro
---
import StatCard from "../ui/StatCard.astro";

interface StatItem {
  label: string;
  value: string;
  hint?: string;
  hintAccent?: boolean;
}

interface Props {
  items: StatItem[];
}

const { items } = Astro.props;
---

<section class="mb-6 grid grid-cols-2 gap-3">
  {
    items.map((item) => (
      <StatCard
        label={item.label}
        value={item.value}
        hint={item.hint}
        hintAccent={item.hintAccent}
      />
    ))
  }
</section>
```

- [ ] **Step 3: Create `QuickActions.astro`**

```astro
---
interface Action {
  label: string;
  variant: "primary" | "secondary";
}

interface Props {
  actions: Action[];
}

const { actions } = Astro.props;
---

<section class="mb-6">
  <h2 class="mb-3 text-sm font-medium text-fg-muted">Quick actions</h2>
  <div class="flex gap-2">
    {
      actions.map((action) => (
        <button
          class:list={[
            "btn flex-1",
            action.variant === "primary" ? "btn-primary" : "btn-secondary",
          ]}
        >
          {action.label}
        </button>
      ))
    }
  </div>
</section>
```

- [ ] **Step 4: Verify files exist**

Run: `ls app/src/components/dashboard/DashboardHeader.astro app/src/components/dashboard/StatsGrid.astro app/src/components/dashboard/QuickActions.astro`

Expected: three paths listed.

- [ ] **Step 5: Commit (skip if no git)**

```bash
git add app/src/components/dashboard/DashboardHeader.astro app/src/components/dashboard/StatsGrid.astro app/src/components/dashboard/QuickActions.astro
git commit -m "$(cat <<'EOF'
Add dashboard header, stats grid, and quick actions sections.

EOF
)"
```

---

### Task 4: Dashboard sections — Analytics, Tables, BottomNav

**Files:**
- Create: `app/src/components/dashboard/AnalyticsSection.astro`
- Create: `app/src/components/dashboard/TablesList.astro`
- Create: `app/src/components/dashboard/BottomNav.astro`

**Interfaces:**
- Consumes: `TableListItem` from Task 2; existing chart components
- Produces:
  - `AnalyticsSection`: no props
  - `TablesList`: `{ countLabel: string; items: { name: string; rowsLabel: string; href: string; status: 'live' | 'idle' }[] }`
  - `BottomNav`: default slot of `NavItem` children; renders with `slot="nav"`

- [ ] **Step 1: Create `AnalyticsSection.astro`**

```astro
---
import DonutChart from "../charts/DonutChart.astro";
import LineChartMinimal from "../charts/LineChartMinimal.astro";
import LineChartFull from "../charts/LineChartFull.astro";
import BarChart from "../charts/BarChart.astro";
import PieChart from "../charts/PieChart.astro";
---

<section class="mb-6">
  <h2 class="mb-3 text-sm font-medium text-fg-muted">Analytics</h2>
  <div class="space-y-3">
    <LineChartMinimal />
    <div class="grid grid-cols-2 gap-3">
      <DonutChart />
      <PieChart />
    </div>
    <LineChartFull />
    <BarChart />
  </div>
</section>
```

- [ ] **Step 2: Create `TablesList.astro`**

```astro
---
import TableListItem from "../ui/TableListItem.astro";

interface TableItem {
  name: string;
  rowsLabel: string;
  href: string;
  status: "live" | "idle";
}

interface Props {
  countLabel: string;
  items: TableItem[];
}

const { countLabel, items } = Astro.props;
---

<section>
  <div class="mb-3 flex items-center justify-between">
    <h2 class="text-sm font-medium text-fg-muted">Tables</h2>
    <span class="badge badge-muted">{countLabel}</span>
  </div>
  <ul class="space-y-2">
    {
      items.map((item) => (
        <TableListItem
          name={item.name}
          rowsLabel={item.rowsLabel}
          href={item.href}
          status={item.status}
        >
          <svg
            class="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
            <path d="M3 9h18M9 21V9"></path>
          </svg>
        </TableListItem>
      ))
    }
  </ul>
</section>
```

- [ ] **Step 3: Create `BottomNav.astro`**

```astro
---
---

<nav slot="nav" class="app-nav" aria-label="Main navigation">
  <div class="mx-auto flex max-w-lg justify-around py-1">
    <slot />
  </div>
</nav>
```

- [ ] **Step 4: Verify files exist**

Run: `ls app/src/components/dashboard/AnalyticsSection.astro app/src/components/dashboard/TablesList.astro app/src/components/dashboard/BottomNav.astro`

Expected: three paths listed.

- [ ] **Step 5: Commit (skip if no git)**

```bash
git add app/src/components/dashboard/AnalyticsSection.astro app/src/components/dashboard/TablesList.astro app/src/components/dashboard/BottomNav.astro
git commit -m "$(cat <<'EOF'
Add analytics, tables list, and bottom nav dashboard sections.

EOF
)"
```

---

### Task 5: Wire `index.astro` as composition + demo data

**Files:**
- Modify: `app/src/pages/index.astro` (replace entire file)

**Interfaces:**
- Consumes: all components from Tasks 1–4
- Produces: thin page exporting the same dashboard UI

- [ ] **Step 1: Replace `index.astro` with composed page**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import AppShell from "../layouts/AppShell.astro";
import DashboardHeader from "../components/dashboard/DashboardHeader.astro";
import StatsGrid from "../components/dashboard/StatsGrid.astro";
import QuickActions from "../components/dashboard/QuickActions.astro";
import AnalyticsSection from "../components/dashboard/AnalyticsSection.astro";
import TablesList from "../components/dashboard/TablesList.astro";
import BottomNav from "../components/dashboard/BottomNav.astro";
import PageIntro from "../components/ui/PageIntro.astro";
import SearchField from "../components/ui/SearchField.astro";
import NavItem from "../components/ui/NavItem.astro";

const stats = [
  {
    label: "Database",
    value: "12.4k",
    hint: "+8.2% this week",
    hintAccent: true,
  },
  {
    label: "API requests",
    value: "847",
    hint: "last 24 hours",
  },
];

const actions = [
  { label: "New table", variant: "primary" as const },
  { label: "SQL editor", variant: "secondary" as const },
];

const tables = [
  {
    name: "users",
    rowsLabel: "4,281 rows",
    href: "#",
    status: "live" as const,
  },
  {
    name: "orders",
    rowsLabel: "1,092 rows",
    href: "#",
    status: "idle" as const,
  },
  {
    name: "products",
    rowsLabel: "328 rows",
    href: "#",
    status: "idle" as const,
  },
];
---

<BaseLayout title="Dashboard">
  <AppShell>
    <DashboardHeader projectName="my-project" planLabel="Free plan" />

    <div class="px-4 py-5">
      <PageIntro
        title="Overview"
        description="Monitor your project at a glance."
      />
      <StatsGrid items={stats} />
      <QuickActions actions={actions} />
      <SearchField
        id="search"
        label="Search tables"
        placeholder="Search tables..."
      />
      <AnalyticsSection />
      <TablesList countLabel="3 active" items={tables} />
    </div>

    <BottomNav>
      <NavItem href="#" label="Home" active>
        <svg
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          aria-hidden="true"
        >
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
          ></path><path d="M9 21V12h6v9"></path>
        </svg>
      </NavItem>
      <NavItem href="#" label="Tables">
        <svg
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          aria-hidden="true"
        >
          <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path
            d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path
            d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
        </svg>
      </NavItem>
      <NavItem href="#" label="SQL">
        <svg
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          aria-hidden="true"
        >
          <path d="M16 18l6-6-6-6"></path><path d="M8 6l-6 6 6 6"></path>
        </svg>
      </NavItem>
      <NavItem href="#" label="Settings">
        <svg
          class="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="3"></circle><path
            d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
          ></path>
        </svg>
      </NavItem>
    </BottomNav>
  </AppShell>
</BaseLayout>
```

- [ ] **Step 2: Confirm page no longer imports chart components directly**

Run: `rg "charts/" app/src/pages/index.astro`

Expected: no matches (charts only via `AnalyticsSection`).

- [ ] **Step 3: Commit (skip if no git)**

```bash
git add app/src/pages/index.astro
git commit -m "$(cat <<'EOF'
Compose dashboard page from extracted UI and section components.

EOF
)"
```

---

### Task 6: Verify build and visual parity

**Files:**
- None (verification only)
- Optional: `app/CLAUDE.md` — one-line file-map note under File map if desired

**Interfaces:**
- Consumes: full page from Task 5
- Produces: confirmation that build succeeds and UI matches

- [ ] **Step 1: Run Astro check/build from `app/`**

```bash
cd app && npx astro check
```

If `astro check` is unavailable or fails only on pre-existing issues unrelated to this work, fall back to:

```bash
cd app && npx astro build
```

Expected: exit 0; no errors in new `ui/` or `dashboard/` components.

- [ ] **Step 2: Manual visual check**

Run: `cd app && npx astro dev` (or existing `astro dev --background` per CLAUDE.md)

Open `/` and confirm:
- [ ] Header brand + settings present
- [ ] Overview copy unchanged
- [ ] Two stats cards with accent / muted hints
- [ ] Quick actions buttons
- [ ] Search field
- [ ] Analytics charts render
- [ ] Three tables (Live / Idle / Idle)
- [ ] Bottom nav four items, Home active

- [ ] **Step 3: Optional CLAUDE.md file-map note**

If updating, add under File map:

```
  components/ui/         # shared UI primitives
  components/dashboard/  # dashboard sections
```

- [ ] **Step 4: Final commit if CLAUDE.md changed (skip if no git)**

```bash
git add app/CLAUDE.md
git commit -m "$(cat <<'EOF'
Document ui and dashboard component folders in style guide.

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| `ui/` primitives (StatCard, TableListItem, NavItem, SearchField, PageIntro) | 1–2 |
| `dashboard/` sections (Header, StatsGrid, QuickActions, Analytics, Tables, BottomNav) | 3–4 |
| Demo data on page, props into components | 5 |
| Icons via slots / inline SVGs | 2, 4, 5 |
| Charts unchanged, wrapped only | 4 |
| Visual parity + manual verify | 6 |
| No Alpine / no icon extraction | Global constraints |

## Self-review notes

- No TBD/placeholder steps.
- Prop names consistent across Tasks 1–5 (`hintAccent`, `status: 'live' | 'idle'`, `variant: 'primary' | 'secondary'`).
- `DashboardHeader` / `BottomNav` do **not** set named slots internally. The page passes `slot="header"` / `slot="nav"` on the component tags so Astro projects them into `AppShell`.
