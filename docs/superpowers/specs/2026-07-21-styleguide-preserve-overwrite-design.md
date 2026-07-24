# Styleguide adopt with selective preserve — Design

**Date:** 2026-07-21  
**Status:** Approved for planning  
**Source of truth (new):** `app/new-style-guide/global.css`  
**Current app styles:** `app/src/styles/global.css`

## Goal

Adopt the new styleguide (sky accent, glass surfaces, Montserrat / Michroma / JetBrains Mono, new `.btn` / `.input` chrome) as the app default, while:

1. **Games controls** get new fonts/colors/chrome but **keep current hit-box size** (`min-h`, padding, flex sizing).
2. **Games panels** move from `.surface` / `.surface-elevated` to new **glass** utilities (layout/structure kept).
3. **`HorizontalToggle` and `VerticleToggle`** (and `ToggleListItem`) stay **pixel-identical**, including **teal** tab chrome — no restyle in this pass.
4. **Rest of the app** migrates incrementally via temporary token aliases after the global CSS swap.

## Non-goals

- Full dashboard/chart class rewrite in the same pass as the CSS swap.
- Restyling or retinting the frozen toggles to sky.
- Changing game keypad geometry (gaps/panel padding may stay; button hit-boxes must not shrink).
- Introducing a second long-lived button API (no `.btn-new` fork).

## Approach

**Dual-layer CSS (chosen):**

| Layer | File | Role |
| --- | --- | --- |
| New styleguide | `app/src/styles/global.css` | Replace contents with `new-style-guide/global.css` |
| Compat aliases | `app/src/styles/compat-aliases.css` | Old `bg` / `fg-*` / accent-scale bridges so non-migrated UI keeps resolving |
| Toggle freeze | `app/src/styles/toggle-freeze.css` | Sealed copy of today’s tab tokens + rules; hard-coded teal (not `var(--accent)`) |
| Game control lock | `app/src/styles/game-control-lock.css` | Reassert game control dimensions after new `.btn` rules |

**Import order** (from `BaseLayout.astro` or equivalent):

1. `global.css`
2. `compat-aliases.css`
3. `toggle-freeze.css`
4. `game-control-lock.css`

Later imports win on conflicts for locks/freeze.

## Architecture

```
BaseLayout
  └─ styles
       ├─ global.css          ← new styleguide (sky, glass, fonts, btn/input)
       ├─ compat-aliases.css  ← temporary old→new token map
       ├─ toggle-freeze.css   ← teal tab island for toggles only
       └─ game-control-lock.css ← size locks for games controls
```

**Boundaries**

- **Default path:** new styleguide wins.
- **Games:** glass panels + new button chrome; size locked.
- **Toggles:** consume freeze-file tokens only; markup unchanged this pass.
- **Dashboard / charts / shell:** keep working via aliases; migrate class names over time; delete aliases when unused outside freeze.

## Component rules

### Preservation matrix

| Zone | Fonts / chrome | Colors | Size / layout | Notes |
| --- | --- | --- | --- | --- |
| `games/*` controls (`InputButton`, keypad rows) | New | New (sky / surface) | **Locked** — current `min-h`, padding, `flex-1` / `h-full` | Hit-box unchanged |
| `games/*` panels | New `.glass` / `.glass-strong` | New | Keep padding/gaps/structure | Replace `.surface` / `.surface-elevated` |
| `HorizontalToggle` / `VerticleToggle` / `ToggleListItem` | Frozen | Frozen (teal) | Frozen | No markup/token edits; CSS island only |
| Dashboard / charts / other UI | New as migrated | New via aliases until rewritten | Unconstrained | Incremental |

### Games — this pass

| Component | Change |
| --- | --- |
| `TargetDisplay`, `ScoreInput`, `DartInput`, `PerDartInput`, `InputDisplayItem`, `ConfirmModal` | `.surface` → `.glass`; elevated shells → `.glass-strong` (or equivalent elevated glass). Old `text-fg-*` may remain temporarily via aliases or flip to `text-muted` / `text-muted-foreground`. |
| `InputButton` | Keep `.btn.btn-secondary` + flex size classes. New global `.btn` chrome applies. `game-control-lock` reasserts dimensions if new padding fights them. |
| `GameHeader` / modal actions | New chrome OK; do not shrink `size-11` / `min-h-9` controls. |
| Score / target numerals | Keep explicit `font-mono` / size classes; do not rely on bare global `h1–h4` Michroma alone where mono score feel is required. |

### Toggles — this pass

- **No edits** to `HorizontalToggle.astro`, `VerticleToggle.astro`, or `ToggleListItem.astro` for visual migration.
- `toggle-freeze.css` owns (at minimum): `--color-tab-border`, `--color-tab-inset`, `--background-image-tab-card`, `--background-image-tab-active`, `--background-image-tab-active-ring`, `--radius-tab`, `--radius-tab-pill`, `--duration-tab`, plus `.tab-wrapper` / `.tab-container` rules as required by those components.
- Teal mixes are **literals** in the freeze file (current teal-based `color-mix` values), not derived from the new sky `--accent`.
- Freeze also covers any `text-fg-muted` / `text-accent` resolution those components need so they do not pick up unintended global retints (either via freeze-local aliases or by keeping compat aliases stable for those names during the pass).
- `TabContainer.astro` shares `.tab-container` / `.tab-wrapper` utilities with the toggles. Those shared rules live in the freeze file so toggles stay intact; `TabContainer` is **not** under the pixel-freeze promise unless a later decision extends it.

## Token / alias strategy

### Compat aliases (temporary)

Bridge enough old `@theme` / utility names that existing dashboard and chart markup still compiles after the swap. Minimum map:

| Old | Bridges toward |
| --- | --- |
| `bg`, `bg-subtle`, `bg-muted`, `bg-emphasis` | `surface` / raised / overlay mixes |
| `fg`, `fg-muted`, `fg-subtle`, `fg-faint` | `foreground` / `muted-foreground` / `muted` |
| `accent-300`…`accent-950` usages | nearest `--accent*` / muted mixes (new guide has no full scale) |
| `destructive*` | `error*` |
| Old `.surface` / `.surface-elevated` | Not kept long-term — games callers swap to glass in this pass; drop the old component classes from the live stylesheet once callers are updated |

**Exit criteria:** grep shows zero old-token usages outside `toggle-freeze.css` (and any intentional freeze-only helpers); then delete `compat-aliases.css`.

### Game control lock

Scoped so it does not resize dashboard buttons. Prefer a games-scoped selector (e.g. a wrapper class on game input roots, or locks tied to `InputButton`’s class list).

**Locks (examples — match current computed metrics):**

- `min-height` consistent with today’s `min-h-11` where that applied
- padding matching current keypad buttons
- `flex: 1 1 0%`, `min-width: 0`, `height: 100%` as on `InputButton` today

**Must not lock:** font-family, font-weight, border, box-shadow, background, or color.

### Fonts wiring

`BaseLayout.astro` currently loads Inter. After the swap, load the new guide fonts (Montserrat, Michroma, JetBrains Mono) instead of or in addition as required by `global.css` `--font-*` tokens. Toggles do not depend on Michroma for their frozen look.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| New `.btn` padding shrinks keys | Control lock imported last / higher specificity |
| Toggle teal bleeds into app accent | Freeze uses literal teal, not `var(--accent)` |
| Aliases hide unfinished migration | Grep count of old tokens; remove aliases at zero |
| Global heading styles restyle game titles | Games keep explicit type classes (`font-mono`, uppercase tracking, etc.) |
| Shared tab tokens still used by old `.surface` | Games move to glass first; freeze owns tab tokens; do not leave global teal tab tokens as the app accent path |

## Verification

1. **Games keypad:** hit-boxes match pre-migration (before/after compare on `ScoreInput` / `DartInput` / `PerDartInput`).
2. **Toggles:** Horizontal + Vertical match pre-migration visually (teal active pill, radii, motion).
3. **Smoke:** dashboard and chart pages still render via aliases.
4. **Grep:** tab freeze tokens remain available to toggles; no accidental deletion.
5. **Fonts:** new guide fonts load; game control labels use new family without size regression.

## Implementation sequence (high level)

1. Extract toggle freeze CSS from current `global.css` tab section (teal literals).
2. Replace `global.css` with new styleguide; update font `<link>`s in `BaseLayout`.
3. Add `compat-aliases.css` for old surface/fg/accent-scale names.
4. Add `game-control-lock.css`; wire import order.
5. Swap games panels `.surface` → glass; confirm `InputButton` sizing.
6. Smoke dashboard; list remaining alias consumers for follow-up migration.
7. Do not touch toggle Astro files in this pass.

## Open decisions (resolved)

| Decision | Choice |
| --- | --- |
| Games control “size” | Hit-box only (`min-h`, padding, flex) — not type scale freeze |
| Games panels | Adopt glass (not keep old surface chrome) |
| Toggles | Pixel-identical freeze including teal |
| Migration breadth | Tokens + primitives first; incremental component migration via aliases |
| Architecture | Dual-layer CSS (not data-theme scopes, not `.btn-new` fork) |
