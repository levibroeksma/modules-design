# Dashboard component extraction — Design

**Date:** 2026-07-16  
**Scope:** Refactor `app/src/pages/index.astro` into reusable Astro components. Visual parity only — no redesign.

## Goal

Replace each meaningful UI block in the dashboard page with a dedicated component so `index.astro` only composes layout + demo data.

## Approach

**Sections + shared primitives**, split by folder:

| Folder                          | Role                                           |
| ------------------------------- | ---------------------------------------------- |
| `app/src/components/ui/`        | Reusable primitives                            |
| `app/src/components/dashboard/` | Page sections that compose primitives / charts |

Charts under `components/charts/` stay as-is; `AnalyticsSection` only wraps them.

## File map

```
app/src/components/
  ui/
    StatCard.astro
    TableListItem.astro
    NavItem.astro
    SearchField.astro
    PageIntro.astro
  dashboard/
    DashboardHeader.astro
    StatsGrid.astro          # uses StatCard
    QuickActions.astro
    AnalyticsSection.astro   # uses existing chart components
    TablesList.astro         # uses TableListItem
    BottomNav.astro          # uses NavItem
```

## Component contracts

| Component          | Key props                                                                            |
| ------------------ | ------------------------------------------------------------------------------------ |
| `DashboardHeader`  | `projectName`, `planLabel`                                                           |
| `PageIntro`        | `title`, `description`                                                               |
| `StatCard`         | `label`, `value`, `hint?`, `hintAccent?: boolean`                                    |
| `StatsGrid`        | `items` array matching `StatCard` props                                              |
| `QuickActions`     | `actions: { label, variant: 'primary' \| 'secondary' }[]`                            |
| `SearchField`      | `id`, `placeholder`, `label` (sr-only)                                               |
| `AnalyticsSection` | none — imports chart components                                                      |
| `TableListItem`    | `name`, `rowsLabel`, `href`, `status: 'live' \| 'idle'`; icon via default slot       |
| `TablesList`       | `countLabel`, `items` for `TableListItem`                                            |
| `NavItem`          | `href`, `label`, `active?`; icon via default slot                                    |
| `BottomNav`        | default slot of `NavItem` children (icons stay on the page or inside each `NavItem`) |

## Data flow

- Demo data (stats, tables, nav labels/hrefs) lives on `index.astro` and is passed as props.
- Markup and class names move into components unchanged for visual parity.
- Icons remain inline SVGs for this pass; passed through slots on `NavItem` / `TableListItem`. No new icon system.

## Page composition

```
BaseLayout
  AppShell
    slot:header → DashboardHeader
    main:
      PageIntro
      StatsGrid
      QuickActions
      SearchField
      AnalyticsSection
      TablesList
    slot:nav → BottomNav
```

## Conventions

- Follow existing Astro patterns (`GameHeader.astro`-style `interface Props`).
- Use design tokens / primitives from `app/CLAUDE.md` and `global.css` (`.surface`, `.btn`, `.badge`, `.nav-item`, etc.).
- Keep existing class strings for visual parity (including any current `font-medium` usage).

## Out of scope

- Visual redesign or token changes
- Alpine.js interactivity
- Extracting SVGs into `src/icons/`
- Rewriting CLAUDE.md beyond an optional one-line file-map note

## Done when

1. `index.astro` only imports layouts + dashboard/ui components and supplies demo data.
2. Each listed component exists under the paths above and owns a single concern.
3. Rendered dashboard matches the current page (structure, copy, classes).

## Testing

- Manual: open `/` in `astro dev` and confirm layout, stats, charts, table list, and bottom nav match pre-refactor.
- No automated test harness required for this refactor.
