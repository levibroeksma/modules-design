# Toggle Equal Cell Sizing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make toggle items share the parent equally on the main axis via CSS grid, let callers set shell size with root `class`, and remove content-based JS `#equalize` / `padRem`.

**Architecture:** Grid `repeat(N, minmax(0, 1fr))` owns item geometry (columns for horizontal, rows for vertical). `Toggle.ts` only measures the active item for the sliding pill. Root size defaults to `w-fit`; callers pass e.g. `class="w-full"` or `class="w-full h-48"`.

**Tech Stack:** Astro 7, Alpine 3 (`@astrojs/alpinejs`), TypeScript, Tailwind v4, Node `node:test`.

**Spec:** `docs/superpowers/specs/2026-07-23-toggle-equal-cell-width-design.md`

## Global Constraints

- No new `width` / `height` props — size via root `class` only.
- Do not invent vertical height when none is set; equal row height requires caller `h-*` / `h-full`.
- `app/src/lib/toggle/Toggle.ts` must not import `alpinejs`.
- Keep Alpine instance in a **closure** (never on reactive `this`) — private fields break under Alpine proxies.
- Do not restyle tab chrome / tokens.
- Do not change ScoreTrainingConfig widths unless needed for verification demos.
- Work directory for commands: `app/`.
- Workspace may have no git repo — skip commit steps if `git rev-parse` fails.
- Unit tests: `node --test`; no new test framework.

## File Structure

| Path | Responsibility |
| --- | --- |
| `app/src/lib/toggle/Toggle.ts` | Value + pill measure + ResizeObserver; no item sizing |
| `app/src/lib/toggle/Toggle.test.ts` | Value / proxy regression; no `padRem` |
| `app/src/components/ui/Toggle.astro` | Root class API + equal-fr grid list |
| `app/src/components/ui/toggle/ToggleListItem.astro` | Fill grid cell (`w-full` / `h-full`) |
| `app/src/lib/alpine/toggle.js` | Unchanged API (closure-held `Toggle`) |

---

### Task 1: Remove `padRem` / `#equalize` from `Toggle` (TDD)

**Files:**
- Modify: `app/src/lib/toggle/Toggle.ts`
- Modify: `app/src/lib/toggle/Toggle.test.ts`

**Interfaces:**
- Consumes: existing `Toggle` / `ToggleOpts`
- Produces: `ToggleOpts` without `padRem`; no `padRem` field on class; `layout()` only syncs pill

- [ ] **Step 1: Update tests — remove `padRem`, assert no inline width API**

Replace the `defaults padRem to 0.375` test with an assertion that `padRem` is gone, and keep the Proxy regression. Final `Toggle.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Toggle } from "./Toggle.ts";

describe("Toggle", () => {
  const options = [
    { value: "bestOf", label: "Best of" },
    { value: "firstTo", label: "First to" },
  ];

  it("defaults value to first option when initial omitted", () => {
    const t = new Toggle({ options, orientation: "vertical" });
    assert.equal(t.value, "bestOf");
  });

  it("uses initial when it matches an option", () => {
    const t = new Toggle({
      options,
      orientation: "vertical",
      initial: "firstTo",
    });
    assert.equal(t.value, "firstTo");
  });

  it("falls back to first option when initial is unknown", () => {
    const t = new Toggle({
      options,
      orientation: "vertical",
      initial: "nope",
    });
    assert.equal(t.value, "bestOf");
  });

  it("setValue ignores unknown values", () => {
    const t = new Toggle({
      options,
      orientation: "horizontal",
      initial: "bestOf",
    });
    t.setValue("nope");
    assert.equal(t.value, "bestOf");
    t.setValue("firstTo");
    assert.equal(t.value, "firstTo");
  });

  it("does not expose padRem", () => {
    const t = new Toggle({ options, orientation: "vertical" });
    assert.equal("padRem" in t, false);
  });

  it("throws when methods run through a Proxy (Alpine must not wrap Toggle)", () => {
    const t = new Toggle({ options, orientation: "horizontal" });
    const proxied = new Proxy(t, {});
    assert.throws(() => proxied.unmount(), /private member/);
  });
});
```

- [ ] **Step 2: Run tests — expect `padRem` assertion to fail**

Run:

```bash
cd app && node --test src/lib/toggle/Toggle.test.ts
```

Expected: FAIL — `"padRem" in t` is `true` (or property still exists).

- [ ] **Step 3: Strip equalize / padRem from `Toggle.ts`**

Replace `app/src/lib/toggle/Toggle.ts` with:

```ts
export type ToggleOption = { value: string; label: string };
export type Orientation = "horizontal" | "vertical";
export type Pill = { w: number; h: number; x: number; y: number };

export type ToggleOpts = {
  options: ToggleOption[];
  orientation: Orientation;
  initial?: string;
  onPillChange?: (pill: Pill) => void;
};

export class Toggle {
  readonly options: ToggleOption[];
  readonly orientation: Orientation;
  #value: string;
  #pill: Pill = { w: 0, h: 0, x: 0, y: 0 };
  #listEl: HTMLElement | null = null;
  #ro: ResizeObserver | null = null;
  #onPillChange?: (pill: Pill) => void;

  constructor(opts: ToggleOpts) {
    if (!opts.options.length) {
      throw new Error("Toggle requires at least one option");
    }
    this.options = opts.options;
    this.orientation = opts.orientation;
    this.#onPillChange = opts.onPillChange;
    this.#value = this.#resolveValue(opts.initial);
  }

  get value(): string {
    return this.#value;
  }

  set value(v: string) {
    this.setValue(v);
  }

  get pill(): Pill {
    return { ...this.#pill };
  }

  #resolveValue(candidate?: string): string {
    if (candidate && this.options.some((o) => o.value === candidate)) {
      return candidate;
    }
    return this.options[0].value;
  }

  setValue(value: string): void {
    if (!this.options.some((o) => o.value === value)) return;
    this.#value = value;
    this.layout();
  }

  /**
   * @param listEl - Positioned container that wraps the option list (and pill).
   */
  mount(listEl: HTMLElement): void {
    this.unmount();
    this.#listEl = listEl;
    this.#ro = new ResizeObserver(() => this.layout());
    this.#ro.observe(listEl);
    this.layout();
  }

  unmount(): void {
    this.#ro?.disconnect();
    this.#ro = null;
    this.#listEl = null;
  }

  layout(): void {
    this.#syncPill();
    this.#onPillChange?.(this.pill);
  }

  #activeItem(): HTMLElement | undefined {
    if (!this.#listEl) return undefined;
    return (
      this.#listEl.querySelector<HTMLElement>(
        `[data-toggle-value="${CSS.escape(this.#value)}"]`,
      ) ?? undefined
    );
  }

  #syncPill(): void {
    const el = this.#activeItem();
    if (!el || !this.#listEl) return;

    const listBox = this.#listEl.getBoundingClientRect();
    const itemBox = el.getBoundingClientRect();
    this.#pill = {
      w: el.offsetWidth,
      h: el.offsetHeight,
      x: itemBox.left - listBox.left + this.#listEl.scrollLeft,
      y: itemBox.top - listBox.top + this.#listEl.scrollTop,
    };
  }
}
```

- [ ] **Step 4: Run tests — expect pass**

Run:

```bash
cd app && node --test src/lib/toggle/Toggle.test.ts
```

Expected: `tests 6` / `pass 6` / `fail 0`.

- [ ] **Step 5: Commit (skip if no git)**

```bash
git rev-parse --is-inside-work-tree 2>/dev/null || exit 0
git add app/src/lib/toggle/Toggle.ts app/src/lib/toggle/Toggle.test.ts
git commit -m "$(cat <<'EOF'
refactor(toggle): drop JS equalize and padRem

EOF
)"
```

---

### Task 2: Equal-fr grid + class-based root size in Astro

**Files:**
- Modify: `app/src/components/ui/Toggle.astro`
- Modify: `app/src/components/ui/toggle/ToggleListItem.astro`

**Interfaces:**
- Consumes: Task 1 `Toggle` (pill-only layout); Alpine `toggle` unchanged
- Produces: Root `class:list` with default `w-fit` when `class` omitted; list uses `repeat(N, minmax(0, 1fr))` on the main axis; items fill cells

- [ ] **Step 1: Update `ToggleListItem.astro` to fill the grid cell**

Replace file contents with:

```astro
---
interface Props {
  value: string;
  label: string;
  [key: string]: any;
}
const { value, label, ...props }: Props = Astro.props;
---

<li
  class="min-w-0 min-h-10 w-full h-full p-2 rounded-full flex items-center justify-center cursor-pointer"
  data-toggle-value={value}
  :class={`activeTab === '${value}' ? 'text-accent' : 'text-fg-muted'`}
  @click={`select('${value}')`}
  {...props}
>
  <input type="radio" id={value} value={value} class="hidden peer" />
  <label for={value} class="w-full">
    <div class="w-full font-medium mb-1 text-center text-sm">{label}</div>
  </label>
</li>
```

- [ ] **Step 2: Update `Toggle.astro` — merge `class`, equal-fr grid**

Replace file contents with:

```astro
---
import ToggleListItem from "./toggle/ToggleListItem.astro";

interface ToggleOption {
  value: string;
  label: string;
}

interface Props {
  options: ToggleOption[];
  orientation: "horizontal" | "vertical";
  initial?: string;
  class?: string;
  [key: string]: any;
}

const {
  options,
  orientation,
  initial,
  class: className,
  ...rest
}: Props = Astro.props;
const resolvedInitial = initial ?? options[0]?.value ?? "";
const config = {
  options,
  orientation,
  initial: resolvedInitial,
};
const n = options.length;
const shellClass =
  "relative grow w-full h-full rounded-tab border-x border-t border-tab-border bg-tab-card tab-wrapper p-2";
const listClass =
  orientation === "horizontal"
    ? "relative z-1 grid h-full w-full items-stretch gap-3"
    : "relative z-1 grid h-full w-full items-stretch gap-3";
const listStyle =
  orientation === "horizontal"
    ? `grid-template-columns: repeat(${n}, minmax(0, 1fr));`
    : `grid-template-rows: repeat(${n}, minmax(0, 1fr));`;
---

<div
  class:list={["tab-container", className ?? "w-fit"]}
  x-data={`toggle(${JSON.stringify(config)})`}
  x-modelable="activeTab"
  {...rest}
>
  <div x-ref="list" class={shellClass}>
    <div
      class="pointer-events-none absolute left-0 top-0 z-0 rounded-tab-pill bg-tab-active backdrop-blur-[2px] transition-transform duration-tab ease-out"
      :style="`width:${pill.w}px;height:${pill.h}px;transform:translate(${pill.x}px,${pill.y}px)`"
    >
    </div>
    <ul class={listClass} style={listStyle}>
      {
        options.map((opt) => (
          <ToggleListItem value={opt.value} label={opt.label} />
        ))
      }
    </ul>
  </div>
</div>
```

Notes for implementer:
- `className ?? "w-fit"` means a provided `class` **replaces** the default size token (pass `class="w-full"`, or `class="w-fit mt-2"` if you still want fit + extras). No `twMerge` in this repo.
- Shell gets `h-full` so a root `h-*` propagates into the vertical equal-row grid.
- Do not leave `grid-flow-col auto-cols-fr` / `flex flex-col` — those are replaced by explicit `repeat(N, 1fr)`.

- [ ] **Step 3: Grep — no leftover equalize / padRem / auto-cols-fr**

Run:

```bash
cd app && rg "padRem|#equalize|auto-cols-fr|flex flex-col items-stretch" src/lib/toggle src/components/ui/Toggle.astro src/components/ui/toggle
```

Expected: no matches (or only historical comments — prefer zero).

- [ ] **Step 4: Manual verify in browser**

With `npm run dev` in `app/`:

1. Open `/test` (ScoreTrainingConfig). Click options — pill must track; no console `private member` errors.
2. Temporarily add `class="w-full"` to the horizontal mode Toggle in `ScoreTrainingConfig.astro`, reload — item widths must be equal and fill the row.
3. Temporarily add `class="h-48"` to a vertical Toggle, reload — item heights must be equal.
4. Revert temporary demo classes unless product wants them kept (spec: call sites unchanged by default).

- [ ] **Step 5: Re-run unit tests**

Run:

```bash
cd app && node --test src/lib/toggle/Toggle.test.ts
```

Expected: `pass 6`.

- [ ] **Step 6: Commit (skip if no git)**

```bash
git rev-parse --is-inside-work-tree 2>/dev/null || exit 0
git add app/src/components/ui/Toggle.astro app/src/components/ui/toggle/ToggleListItem.astro
git commit -m "$(cat <<'EOF'
feat(toggle): equal-fr grid cells and class-based shell size

EOF
)"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
| --- | --- |
| H: width = (list − gaps) / N | Task 2 grid columns |
| V: height = (list − gaps) / N when height set | Task 2 grid rows + `h-full` shell |
| Size via root `class` | Task 2 `class:list` |
| Default `w-fit` | Task 2 `className ?? "w-fit"` |
| Drop `#equalize` / `padRem` | Task 1 |
| Pill still tracks | Task 1 `#syncPill` + Task 2 markup unchanged binding |
| No ScoreTrainingConfig migration required | Task 2 step 4 reverts demo classes |
| Alpine closure / no proxy wrap | Unchanged; regression test kept in Task 1 |

**Placeholder scan:** none.  
**Type consistency:** `ToggleOpts` / `layout()` match Astro + Alpine consumers; no `padRem` references remain after Task 1.
