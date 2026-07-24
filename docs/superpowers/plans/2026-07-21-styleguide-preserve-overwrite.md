# Styleguide Adopt with Selective Preserve — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace app styles with the new styleguide while freezing Horizontal/Vertical toggles (teal, pixel-identical), adopting glass + new chrome on games without shrinking control hit-boxes, and keeping dashboard/charts alive via temporary token aliases.

**Architecture:** Dual-layer CSS — new `global.css` as source of truth; `compat-aliases.css` bridges old `bg`/`fg-*`/accent-scale names; `toggle-freeze.css` seals teal tab tokens (scoped accent inside `.tab-wrapper`); `game-control-lock.css` reasserts game keypad button dimensions. Import order in `BaseLayout.astro` enforces freeze/lock precedence.

**Tech Stack:** Astro, Tailwind CSS v4 (`@import "tailwindcss"`, `@theme`, `@utility`, `@layer`), Alpine.js (existing in games/toggles), Google Fonts (Montserrat, Michroma, JetBrains Mono).

**Spec:** `docs/superpowers/specs/2026-07-21-styleguide-preserve-overwrite-design.md`

## Global Constraints

- Do **not** edit `HorizontalToggle.astro`, `VerticleToggle.astro`, or `ToggleListItem.astro` for visual migration.
- Toggle freeze uses **literal teal** (`--color-teal-*`), never `var(--accent)`.
- Games controls: new fonts/chrome/colors OK; **hit-box locked** (`min-h`, padding, flex sizing only).
- Games panels: `.surface` / `.surface-elevated` → `.glass` / `.glass-strong`.
- No long-lived `.btn-new` fork.
- Preserve mobile app shell layout: `html`/`body` stay `h-dvh max-h-dvh overflow-hidden` (new guide’s `min-h-dvh` alone is not enough).
- No automated visual test harness — verify with `npm run build` (or `astro check` / `astro build`) in `app/`, grep, and manual `/` + `/test` review.
- Workspace may have no git repo — skip commit steps if `git rev-parse` fails.
- Work directory for commands: `app/`.

## File Structure

| Path | Responsibility |
| --- | --- |
| `app/src/styles/global.css` | New styleguide + app-shell base overrides (`h-dvh` lock) |
| `app/src/styles/compat-aliases.css` | Temporary old→new `@theme` bridges + thin `.surface`→glass for non-games leftovers |
| `app/src/styles/toggle-freeze.css` | Teal tab tokens, `.tab-container` / `.tab-wrapper`, scoped accent for toggles |
| `app/src/styles/game-control-lock.css` | Size locks for `.game-control .btn` |
| `app/src/layouts/BaseLayout.astro` | Import all four CSS files in order; new font links |
| `app/src/components/games/*.astro` | Panel class swaps; `game-control` wrapper / `InputButton` marker |
| `app/new-style-guide/global.css` | Read-only source — copy from here into `global.css` |

---

### Task 1: Extract `toggle-freeze.css` (before swapping global)

**Files:**
- Create: `app/src/styles/toggle-freeze.css`
- Reference (do not delete yet): `app/src/styles/global.css` lines 60–80, 228–255

**Interfaces:**
- Consumes: current tab token values from `global.css`
- Produces: freeze file that defines tab theme keys + `.tab-container` / `.tab-wrapper` + scoped teal accent under `.tab-wrapper`

- [ ] **Step 1: Create `toggle-freeze.css` with sealed teal tab tokens**

```css
/* Frozen toggle chrome — teal literals; do not point at --accent / sky. */
@theme {
  --color-tab-border: color-mix(in oklab, var(--color-teal-600) 6%, transparent);
  --color-tab-inset: color-mix(in oklab, var(--color-teal-400) 10%, transparent);
  --background-image-tab-card: linear-gradient(
    137deg,
    color-mix(in oklab, var(--color-zinc-900) 88%, var(--color-teal-800)) 4.87%,
    color-mix(in oklab, var(--color-zinc-950) 92%, var(--color-teal-950)) 75.88%
  );
  --background-image-tab-active: radial-gradient(
    51.07% 92.4% at 51% 7.61%,
    color-mix(in oklab, var(--color-teal-500) 50%, var(--color-zinc-600)) 0,
    color-mix(in oklab, var(--color-zinc-900) 75%, var(--color-teal-950)) 100%
  );
  --background-image-tab-active-ring: linear-gradient(
    180deg,
    var(--color-teal-300),
    transparent
  );
  --radius-tab: 1.9375rem;
  --radius-tab-pill: 2.25rem;
  --duration-tab: 300ms;
}

@layer components {
  .tab-container {
    @apply flex max-w-full overflow-x-scroll px-6;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .tab-container::-webkit-scrollbar {
    display: none;
  }

  .tab-wrapper {
    box-shadow: inset 0 1px 0 0 var(--color-tab-inset);
    /* Keep text-accent teal inside toggles after global accent → sky */
    --color-accent: var(--color-teal-400);
    --accent: var(--color-teal-400);
  }
}
```

- [ ] **Step 2: Verify freeze file exists and contains teal, not accent-as-source**

Run:

```bash
test -f src/styles/toggle-freeze.css && rg -n "teal|--color-accent: var\\(--color-teal" src/styles/toggle-freeze.css && ! rg -n "var\\(--accent\\)" src/styles/toggle-freeze.css
```

Expected: file exists; matches for teal / scoped accent; no `var(--accent)` dependency for freeze colors.

- [ ] **Step 3: Commit (if git available)**

```bash
git rev-parse --is-inside-work-tree 2>/dev/null && git add src/styles/toggle-freeze.css && git commit -m "$(cat <<'EOF'
Extract teal toggle freeze stylesheet before styleguide swap.

EOF
)" || echo "SKIP commit: no git repo"
```

---

### Task 2: Replace `global.css` + preserve app-shell base + update fonts

**Files:**
- Modify: `app/src/styles/global.css` (replace with new guide + shell overrides)
- Modify: `app/src/layouts/BaseLayout.astro` (fonts only in this task; CSS imports in Task 5)
- Read-only source: `app/new-style-guide/global.css`

**Interfaces:**
- Consumes: full contents of `app/new-style-guide/global.css`
- Produces: live `global.css` with new tokens/utilities plus app `h-dvh` overrides that win over the guide’s `min-h-dvh` body

- [ ] **Step 1: Copy new styleguide into `global.css`**

```bash
cp new-style-guide/global.css src/styles/global.css
```

- [ ] **Step 2: Append app-shell layout overrides at the end of `global.css`**

Append exactly:

```css
/* App shell — keep fixed viewport (product constraint; not in marketing styleguide) */
@layer base {
  html {
    color-scheme: dark only;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    @apply h-dvh max-h-dvh overflow-hidden;
  }

  body {
    @apply h-dvh max-h-dvh overflow-hidden;
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }

  @media (prefers-color-scheme: light) {
    html {
      color-scheme: dark only;
    }
  }
}
```

Do **not** reintroduce old teal accent scale or old `.surface` / `.btn` rules here.

- [ ] **Step 3: Update Google Fonts in `BaseLayout.astro`**

Replace the Inter `<link>` with:

```html
<link
  href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Michroma&family=Montserrat:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

Keep preconnect links. Update `theme-color` to near-black matching new surface if desired (`#000000`) — optional.

- [ ] **Step 4: Confirm new tokens present and old tab tokens absent from `global.css`**

Run:

```bash
rg -n "--font-display|--color-surface|@utility glass" src/styles/global.css | head
rg -n "tab-card|color-tab-border|bg-bg|--color-fg:" src/styles/global.css || true
```

Expected: first command shows display font / surface / glass; second finds no old tab-card / `bg-bg` / `--color-fg` theme keys (app-shell block may mention `color-scheme` only).

- [ ] **Step 5: Commit (if git available)**

```bash
git rev-parse --is-inside-work-tree 2>/dev/null && git add src/styles/global.css src/layouts/BaseLayout.astro && git commit -m "$(cat <<'EOF'
Swap global.css to new styleguide and load guide fonts.

EOF
)" || echo "SKIP commit: no git repo"
```

---

### Task 3: Add `compat-aliases.css`

**Files:**
- Create: `app/src/styles/compat-aliases.css`

**Interfaces:**
- Consumes: new guide CSS variables (`--surface`, `--foreground`, `--muted`, `--accent`, `--error`, etc.)
- Produces: `@theme` aliases so existing `bg-bg`, `text-fg-muted`, `bg-accent-500/15`, etc. still generate utilities; temporary `.surface` / `.surface-elevated` → glass for non-games callers

- [ ] **Step 1: Create `compat-aliases.css`**

```css
/* Temporary bridges — delete when grep shows no old token usages outside toggle-freeze. */
@theme {
  --color-bg: var(--surface);
  --color-bg-subtle: var(--surface-raised);
  --color-bg-muted: var(--surface-overlay);
  --color-bg-emphasis: var(--glass-highlight);

  --color-fg: var(--foreground);
  --color-fg-muted: var(--muted-foreground);
  --color-fg-subtle: var(--muted);
  --color-fg-faint: var(--muted);

  /* Approximate old accent scale with sky singles / mixes */
  --color-accent-50: color-mix(in oklch, var(--accent) 12%, white);
  --color-accent-100: color-mix(in oklch, var(--accent) 20%, white);
  --color-accent-200: color-mix(in oklch, var(--accent) 35%, white);
  --color-accent-300: var(--accent-hover);
  --color-accent-400: var(--accent);
  --color-accent-500: var(--accent);
  --color-accent-600: color-mix(in oklch, var(--accent) 85%, black);
  --color-accent-700: color-mix(in oklch, var(--accent) 70%, black);
  --color-accent-800: color-mix(in oklch, var(--accent) 55%, black);
  --color-accent-950: color-mix(in oklch, var(--accent) 35%, black);

  --color-destructive: var(--error);
  --color-destructive-muted: var(--error-muted);

  --color-success: var(--success);
  --color-success-muted: var(--success-muted);

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
  --duration-fast: 140ms;
  --duration-normal: 200ms;
}

@layer components {
  /* Non-games leftovers (StatCard, charts, etc.) until those callers migrate */
  .surface {
    @apply glass rounded-xl;
  }

  .surface-elevated {
    @apply glass-strong rounded-xl;
  }
}
```

- [ ] **Step 2: Sanity-check alias file**

Run:

```bash
rg -n "--color-bg:|--color-fg-muted:|\\.surface" src/styles/compat-aliases.css
```

Expected: all three patterns present.

- [ ] **Step 3: Commit (if git available)**

```bash
git rev-parse --is-inside-work-tree 2>/dev/null && git add src/styles/compat-aliases.css && git commit -m "$(cat <<'EOF'
Add temporary styleguide compat token aliases.

EOF
)" || echo "SKIP commit: no git repo"
```

---

### Task 4: Add `game-control-lock.css` + mark game controls

**Files:**
- Create: `app/src/styles/game-control-lock.css`
- Modify: `app/src/components/games/InputButton.astro`
- Modify: `app/src/components/games/ScoreInput.astro` (optional wrapper — prefer class on `InputButton` only)
- Modify: `app/src/components/games/DartInput.astro` / `PerDartInput.astro` only if needed for scope

**Interfaces:**
- Consumes: new global `.btn` rules (padding may differ from old `min-h-11` + `px-4`)
- Produces: `.game-control` marker on `InputButton`; lock rules that restore flex/hit-box metrics without locking color/font

- [ ] **Step 1: Add `game-control` to `InputButton.astro` class list**

```astro
---
interface Props {
  class?: string;
  type?: "button" | "submit" | "reset";
}

const {
  class: className = "",
  type = "button",
  ...rest
} = Astro.props as Props & Record<string, unknown>;
---

<button
  type={type}
  class:list={[
    "game-control btn btn-secondary flex-1 basis-0 min-w-0 h-full font-semibold",
    className,
  ]}
  {...rest}
>
  <slot />
</button>
```

- [ ] **Step 2: Create `game-control-lock.css`**

```css
/* Hit-box lock only — do not set color, font-family, border, or box-shadow. */
@layer components {
  .game-control.btn {
    min-height: 2.75rem; /* min-h-11 */
    padding-left: 1rem; /* px-4 */
    padding-right: 1rem;
    flex: 1 1 0%;
    min-width: 0;
    height: 100%;
  }
}
```

- [ ] **Step 3: Verify lock does not set chrome properties**

Run:

```bash
! rg -n "color:|font-family:|box-shadow:|background:" src/styles/game-control-lock.css
rg -n "min-height: 2\\.75rem|flex: 1 1 0%" src/styles/game-control-lock.css
```

Expected: first command exit 0 (no matches); second shows lock metrics.

- [ ] **Step 4: Commit (if git available)**

```bash
git rev-parse --is-inside-work-tree 2>/dev/null && git add src/styles/game-control-lock.css src/components/games/InputButton.astro && git commit -m "$(cat <<'EOF'
Lock game control hit-boxes after new btn chrome.

EOF
)" || echo "SKIP commit: no git repo"
```

---

### Task 5: Wire CSS import order in `BaseLayout`

**Files:**
- Modify: `app/src/layouts/BaseLayout.astro`
- Modify: `app/src/pages/test.astro` (remove duplicate `global.css` import if present)

**Interfaces:**
- Consumes: the four stylesheets from Tasks 1–4
- Produces: single import chain — `global` → `compat-aliases` → `toggle-freeze` → `game-control-lock`

- [ ] **Step 1: Update frontmatter imports in `BaseLayout.astro`**

```astro
---
import "../styles/global.css";
import "../styles/compat-aliases.css";
import "../styles/toggle-freeze.css";
import "../styles/game-control-lock.css";

interface Props {
  title?: string;
}

const { title = "App" } = Astro.props;
---
```

- [ ] **Step 2: Remove duplicate style import from `test.astro`**

`test.astro` currently imports `../styles/global.css` and `BaseLayout`. Delete the direct `global.css` import; keep `BaseLayout` only.

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import AppShell from "../layouts/AppShell.astro";
import Btn from "../components/buttons/Btn.astro";

import ExitIcon from "../icons/exit.svg";
import ScoreInput from "../components/games/ScoreInput.astro";
import TargetDisplay from "../components/games/TargetDisplay.astro";
---
```

(Remove unused `Btn` / `ExitIcon` imports only if unused — do not expand scope; if they are unused, drop them to keep `astro check` clean.)

- [ ] **Step 3: Build**

Run:

```bash
npm run build
```

Expected: build succeeds (no missing theme tokens for `bg-bg`, `text-fg-muted`, `bg-tab-card`, etc.).

- [ ] **Step 4: Commit (if git available)**

```bash
git rev-parse --is-inside-work-tree 2>/dev/null && git add src/layouts/BaseLayout.astro src/pages/test.astro && git commit -m "$(cat <<'EOF'
Wire styleguide, aliases, toggle freeze, and game locks.

EOF
)" || echo "SKIP commit: no git repo"
```

---

### Task 6: Migrate games panels to glass

**Files:**
- Modify: `app/src/components/games/TargetDisplay.astro`
- Modify: `app/src/components/games/ScoreInput.astro`
- Modify: `app/src/components/games/DartInput.astro`
- Modify: `app/src/components/games/PerDartInput.astro`
- Modify: `app/src/components/games/InputDisplayItem.astro`
- Modify: `app/src/components/games/ConfirmModal.astro`
- Do **not** modify toggle Astro files

**Interfaces:**
- Consumes: `@utility glass` / `glass-strong` from new `global.css`
- Produces: games markup free of `.surface` / `.surface-elevated` class names

- [ ] **Step 1: Apply class swaps**

| File | Replace | With |
| --- | --- | --- |
| `TargetDisplay.astro` | `surface` on outer shell | `glass` |
| `ScoreInput.astro` | `surface-elevated` (score readout) | `glass-strong` |
| `ScoreInput.astro` | `surface` (keypad shell) | `glass` |
| `DartInput.astro` | both `surface` | `glass` |
| `PerDartInput.astro` | `surface` | `glass` |
| `InputDisplayItem.astro` | `surface-elevated` | `glass-strong` |
| `ConfirmModal.astro` | `surface` on dialog | `glass-strong` (keep `border border-border`, padding, layout classes) |

Leave `text-fg-*` / `bg-bg/*` as-is for this task (compat aliases cover them). Keep `font-mono` on scores.

Example — `TargetDisplay.astro` outer:

```astro
<div class="px-3 flex-1 glass">
```

Example — `InputDisplayItem.astro`:

```astro
<span
  class:list={[
    "glass-strong w-full rounded-md p-2 text-center text-sm font-semibold tabular-nums",
    className,
  ]}
  {...rest}
>
```

- [ ] **Step 2: Confirm games no longer reference surface classes**

Run:

```bash
rg -n "surface" src/components/games/
```

Expected: no matches (or only comments). Dashboard may still use `.surface` via compat.

- [ ] **Step 3: Manual visual check**

With `npm run dev`:

1. Open `/test` — keypad buttons use new chrome; hit-boxes still fill rows (`flex-1` / full height).
2. Open `/` — dashboard still renders; toggles (if on page) still teal pill.

- [ ] **Step 4: Commit (if git available)**

```bash
git rev-parse --is-inside-work-tree 2>/dev/null && git add src/components/games && git commit -m "$(cat <<'EOF'
Migrate games panels from surface to glass utilities.

EOF
)" || echo "SKIP commit: no git repo"
```

---

### Task 7: Verification checklist + alias consumer inventory

**Files:**
- Create (optional note): none required — record inventory in the commit message or leave as command output for the human
- Do **not** delete `compat-aliases.css` in this plan (exit criteria is a follow-up)

**Interfaces:**
- Consumes: completed Tasks 1–6
- Produces: verified build + written list of remaining old-token call sites

- [ ] **Step 1: Grep freeze integrity**

```bash
rg -n "tab-card|rounded-tab|tab-wrapper" src/styles/toggle-freeze.css
rg -n "HorizontalToggle|VerticleToggle|ToggleListItem" src/components/ui/HorizontalToggle.astro src/components/ui/VerticleToggle.astro src/components/ui/ToggleListItem.astro >/dev/null
# Ensure toggle files were not rewritten for colors:
git rev-parse --is-inside-work-tree 2>/dev/null && git diff --stat -- src/components/ui/HorizontalToggle.astro src/components/ui/VerticleToggle.astro src/components/ui/ToggleListItem.astro || echo "no git — confirm manually that toggle Astro files are unchanged"
```

Expected: freeze still defines tab utilities; toggle Astro files unchanged.

- [ ] **Step 2: List remaining alias consumers (follow-up migration fodder)**

```bash
rg -n "text-fg-|bg-bg|bg-accent-|surface-elevated|\\bsurface\\b" src/components --glob '*.astro'
```

Expected: hits in dashboard/charts/ui (not games); zero required cleanup in this pass.

- [ ] **Step 3: Final build**

```bash
npm run build
```

Expected: success.

- [ ] **Step 4: Commit verification note (if git available)**

```bash
git rev-parse --is-inside-work-tree 2>/dev/null && git status -sb && echo "Verification complete" || echo "SKIP commit: no git repo / nothing to commit"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
| --- | --- |
| Replace `global.css` with new guide | Task 2 |
| Compat aliases for old tokens | Task 3 |
| Toggle freeze teal island + no toggle markup edits | Tasks 1, 5, 7 |
| Scoped accent so toggles stay teal after sky swap | Task 1 (`.tab-wrapper` custom props) |
| Game hit-box lock | Task 4 |
| Games panels → glass | Task 6 |
| Import order | Task 5 |
| Fonts (Montserrat / Michroma / JetBrains Mono) | Task 2 |
| App shell `h-dvh` preserved | Task 2 append |
| Dashboard smoke via aliases | Tasks 3, 5, 7 |
| No `.btn-new` fork | All tasks use `.btn` |
| Alias exit criteria deferred | Task 7 inventory only |

## Placeholder / consistency notes

- Compat keeps temporary `.surface` → glass for **non-games** callers; games drop those class names in Task 6 (matches “not long-term” without breaking dashboard in the same pass).
- `text-accent` inside toggles resolves to teal via inherited `--color-accent` on `.tab-wrapper`, not via editing toggle Astro files.
