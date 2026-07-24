# Toggle Alpine Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract toggle pill/equalize logic into a pure `Toggle` class, register it via `Alpine.data('toggle')` through `alpine.init.js`, and replace H/V Astro toggles with one `Toggle.astro` that binds into Alpine forms with `x-model`.

**Architecture:** `Toggle.ts` has zero Alpine imports and owns value + layout. `lib/alpine/toggle.js` is a thin `Alpine.data` wrapper that mounts the class with `$refs` / `$watch`. Parent forms (e.g. `gameConfig`) keep plain string fields; `x-modelable="activeTab"` bridges them. `@astrojs/alpinejs` loads `src/alpine.init.js` as the entrypoint.

**Tech Stack:** Astro 7, Alpine 3 (`@astrojs/alpinejs`), TypeScript, Tailwind v4 token classes already used by toggles (`bg-tab-active`, `duration-tab`, etc.).

**Spec:** `docs/superpowers/specs/2026-07-23-toggle-alpine-extraction-design.md`

## Global Constraints

- `app/src/lib/toggle/Toggle.ts` must not import `alpinejs` or any Alpine helper.
- Options shape is always `{ value: string; label: string }[]` (no string-only options).
- Form fields stay plain strings; toggles never own form state.
- Single Astro shell: `Toggle.astro` with `orientation: 'horizontal' | 'vertical'`.
- Entrypoint file name/path: `app/src/alpine.init.js`, wired as `alpinejs({ entrypoint: '/src/alpine.init.js' })`.
- Do not migrate `ScoreInput` or other inline `x-data` in this plan.
- Work directory for commands: `app/`.
- Workspace may have no git repo — skip commit steps if `git rev-parse` fails.
- Unit tests use Node’s built-in runner (`node --test`); no new test framework dependency.

## File Structure

| Path | Responsibility |
| --- | --- |
| `app/src/lib/toggle/Toggle.ts` | Pure OOP toggle: value, equalize, pill, ResizeObserver |
| `app/src/lib/toggle/Toggle.test.ts` | Node tests for non-DOM API (value / unknown / pad default) |
| `app/src/lib/alpine/toggle.js` | `Alpine.data('toggle')` — imports `Toggle`, no layout math |
| `app/src/lib/alpine/gameConfig.js` | Example form: `format`, `rounds`, `roundType`, `mode` |
| `app/src/alpine.init.js` | Registers all Alpine datas; Astro entrypoint |
| `app/astro.config.mjs` | Pass `entrypoint` into `alpinejs()` |
| `app/src/components/ui/Toggle.astro` | Markup shell + orientation classes + `x-modelable` |
| `app/src/components/ui/toggle/ToggleListItem.astro` | Item uses `value` / `label` (not `title`) |
| `app/src/pages/test.astro` | Demo: H + V toggles + mini `gameConfig` form |
| Delete | `HorizontalToggle.astro`, `VerticleToggle.astro` |

---

### Task 1: Pure `Toggle` class + unit tests

**Files:**
- Create: `app/src/lib/toggle/Toggle.ts`
- Create: `app/src/lib/toggle/Toggle.test.ts`

**Interfaces:**
- Consumes: none
- Produces:
  - `export type ToggleOption = { value: string; label: string }`
  - `export type Orientation = 'horizontal' | 'vertical'`
  - `export type Pill = { w: number; h: number; x: number; y: number }`
  - `export class Toggle` with constructor opts `{ options, orientation, initial?, padRem?, onPillChange? }` and methods/getters per spec

- [ ] **Step 1: Write failing unit tests (non-DOM)**

Create `app/src/lib/toggle/Toggle.test.ts`:

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

  it("defaults padRem to 0.375", () => {
    const t = new Toggle({ options, orientation: "vertical" });
    assert.equal(t.padRem, 0.375);
  });
});
```

Expose `padRem` as a public readonly getter on the class so the last test works.

- [ ] **Step 2: Run tests — expect fail**

Run:

```bash
cd app && node --experimental-strip-types --test src/lib/toggle/Toggle.test.ts
```

Expected: `ERR_MODULE_NOT_FOUND` or similar for `./Toggle.ts`.

- [ ] **Step 3: Implement `Toggle.ts`**

Create `app/src/lib/toggle/Toggle.ts`:

```ts
export type ToggleOption = { value: string; label: string };
export type Orientation = "horizontal" | "vertical";
export type Pill = { w: number; h: number; x: number; y: number };

export type ToggleOpts = {
  options: ToggleOption[];
  orientation: Orientation;
  initial?: string;
  padRem?: number;
  onPillChange?: (pill: Pill) => void;
};

export class Toggle {
  readonly options: ToggleOption[];
  readonly orientation: Orientation;
  readonly padRem: number;
  #value: string;
  #pill: Pill = { w: 0, h: 0, x: 0, y: 0 };
  #listEl: HTMLElement | null = null;
  #getItemEl: ((value: string) => HTMLElement | undefined) | null = null;
  #ro: ResizeObserver | null = null;
  #onPillChange?: (pill: Pill) => void;

  constructor(opts: ToggleOpts) {
    if (!opts.options.length) {
      throw new Error("Toggle requires at least one option");
    }
    this.options = opts.options;
    this.orientation = opts.orientation;
    this.padRem = opts.padRem ?? 0.375;
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

  mount(
    listEl: HTMLElement,
    getItemEl: (value: string) => HTMLElement | undefined,
  ): void {
    this.unmount();
    this.#listEl = listEl;
    this.#getItemEl = getItemEl;
    this.#ro = new ResizeObserver(() => this.layout());
    this.#ro.observe(listEl);
    this.layout();
  }

  unmount(): void {
    this.#ro?.disconnect();
    this.#ro = null;
    this.#listEl = null;
    this.#getItemEl = null;
  }

  layout(): void {
    this.#equalize();
    this.#syncPill();
    this.#onPillChange?.(this.pill);
  }

  #equalize(): void {
    if (!this.#listEl) return;
    const items = [
      ...this.#listEl.querySelectorAll<HTMLElement>(":scope > li"),
    ];
    if (!items.length) return;

    items.forEach((el) => {
      el.style.width = "max-content";
    });

    const rootFs = parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    const pad = this.padRem * rootFs;
    const widest = Math.max(...items.map((el) => el.offsetWidth));
    const width = `${widest + pad * 2}px`;

    items.forEach((el) => {
      el.style.width = width;
    });
  }

  #syncPill(): void {
    if (!this.#getItemEl) return;
    const el = this.#getItemEl(this.#value);
    if (!el) return;
    this.#pill = {
      w: el.offsetWidth,
      h: el.offsetHeight,
      x: el.offsetLeft,
      y: el.offsetTop,
    };
  }
}
```

- [ ] **Step 4: Run tests — expect pass**

Run:

```bash
cd app && node --experimental-strip-types --test src/lib/toggle/Toggle.test.ts
```

Expected: all 5 tests `pass`.

- [ ] **Step 5: Confirm no Alpine import**

Run:

```bash
cd app && ! grep -E "alpinejs|from ['\"]alpine" src/lib/toggle/Toggle.ts
```

Expected: exit code `0` (no matches).

- [ ] **Step 6: Commit (skip if no git)**

```bash
git add app/src/lib/toggle/Toggle.ts app/src/lib/toggle/Toggle.test.ts
git commit -m "$(cat <<'EOF'
feat: add Alpine-free Toggle class with unit tests

EOF
)"
```

---

### Task 2: Alpine entrypoint + `toggle` / `gameConfig` data

**Files:**
- Create: `app/src/lib/alpine/toggle.js`
- Create: `app/src/lib/alpine/gameConfig.js`
- Create: `app/src/alpine.init.js`
- Modify: `app/astro.config.mjs`

**Interfaces:**
- Consumes: `Toggle` from `../toggle/Toggle.ts` (Vite resolves `.ts` from `.js` import — use `../toggle/Toggle` without extension if needed)
- Produces:
  - `Alpine.data('toggle', (config) => …)` with `activeTab`, `options`, `orientation`, `pill`, `select`, `init`, destroy cleanup
  - `Alpine.data('gameConfig', () => ({ format, rounds, roundType, mode }))`
  - `alpine.init.js` default export `(Alpine) => void`

- [ ] **Step 1: Create `lib/alpine/toggle.js`**

```js
import { Toggle } from "../toggle/Toggle.ts";

/**
 * @param {import('alpinejs').Alpine} Alpine
 */
export default (Alpine) => {
  Alpine.data("toggle", (config = {}) => ({
    activeTab: config.initial ?? config.options?.[0]?.value ?? "",
    options: config.options ?? [],
    orientation: config.orientation ?? "vertical",
    pill: { w: 0, h: 0, x: 0, y: 0 },
    /** @type {Toggle | null} */
    _toggle: null,

    init() {
      const resolved = this.options.some((o) => o.value === this.activeTab)
        ? this.activeTab
        : (this.options[0]?.value ?? "");
      this.activeTab = resolved;

      this._toggle = new Toggle({
        options: this.options,
        orientation: this.orientation,
        initial: this.activeTab,
        onPillChange: (pill) => {
          this.pill = pill;
        },
      });

      this.$watch("activeTab", (value) => {
        this._toggle?.setValue(value);
      });

      this.$nextTick(() => {
        const list = this.$refs.list;
        if (!list || !this._toggle) return;
        this._toggle.mount(list, (value) => this.$refs[value]);
      });
    },

    destroy() {
      this._toggle?.unmount();
      this._toggle = null;
    },

    select(value) {
      this.activeTab = value;
    },
  }));
};
```

If Vite rejects the `.ts` import from `.js`, change to `from "../toggle/Toggle"` (extensionless).

- [ ] **Step 2: Create `lib/alpine/gameConfig.js`**

```js
/**
 * @param {import('alpinejs').Alpine} Alpine
 */
export default (Alpine) => {
  Alpine.data("gameConfig", () => ({
    format: "bestOf",
    rounds: 3,
    roundType: "legs",
    mode: "single",
  }));
};
```

- [ ] **Step 3: Create `alpine.init.js`**

```js
import toggle from "./lib/alpine/toggle.js";
import gameConfig from "./lib/alpine/gameConfig.js";

/**
 * @param {import('alpinejs').Alpine} Alpine
 */
export default (Alpine) => {
  toggle(Alpine);
  gameConfig(Alpine);
};
```

- [ ] **Step 4: Wire entrypoint in `astro.config.mjs`**

Replace the integrations line:

```js
integrations: [alpinejs()],
```

with:

```js
integrations: [alpinejs({ entrypoint: "/src/alpine.init.js" })],
```

Full file should remain:

```js
// @ts-check
import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";
import alpinejs from "@astrojs/alpinejs";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [alpinejs({ entrypoint: "/src/alpine.init.js" })],
  devToolbar: {
    enabled: false,
  },

  server: {
    port: 666,
    host: true,
  },
});
```

- [ ] **Step 5: Smoke-build**

Run:

```bash
cd app && npm run build
```

Expected: build succeeds (no runtime Alpine usage required yet). If import path fails, fix the `Toggle` import extension and rebuild.

- [ ] **Step 6: Commit (skip if no git)**

```bash
git add app/src/alpine.init.js app/src/lib/alpine/toggle.js app/src/lib/alpine/gameConfig.js app/astro.config.mjs
git commit -m "$(cat <<'EOF'
feat: register toggle and gameConfig via alpine.init entrypoint

EOF
)"
```

---

### Task 3: `Toggle.astro` + `ToggleListItem` API

**Files:**
- Create: `app/src/components/ui/Toggle.astro`
- Modify: `app/src/components/ui/toggle/ToggleListItem.astro`

**Interfaces:**
- Consumes: `Alpine.data('toggle')` from Task 2
- Produces:
  - `Toggle.astro` props: `{ options: ToggleOption[]; orientation: Orientation; initial?: string }` + attr passthrough for `x-model`
  - `ToggleListItem` props: `{ value: string; label: string }`

- [ ] **Step 1: Update `ToggleListItem.astro`**

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
  class="min-w-0 p-2 rounded-full h-10 flex items-center justify-center cursor-pointer z-1"
  x-ref={value}
  :class={`activeTab === '${value}' ? 'text-accent' : 'text-fg-muted'`}
  @click={`select('${value}')`}
  {...props}
>
  <input type="radio" id={value} value={value} class="hidden peer" />
  <label for={value}>
    <div class="w-full font-medium mb-1 text-center text-sm">{label}</div>
  </label>
</li>
```

- [ ] **Step 2: Create `Toggle.astro`**

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
  [key: string]: any;
}

const { options, orientation, initial, ...rest }: Props = Astro.props;
const resolvedInitial = initial ?? options[0]?.value ?? "";
const config = {
  options,
  orientation,
  initial: resolvedInitial,
};
const listClass =
  orientation === "horizontal"
    ? "relative grid grid-flow-col auto-cols-fr grow items-center justify-center gap-3 rounded-tab border-x border-t border-tab-border bg-tab-card tab-wrapper p-2 w-full"
    : "relative flex flex-col grow items-stretch justify-center gap-3 rounded-tab border-x border-t border-tab-border bg-tab-card tab-wrapper p-2 w-full";
---

<div
  class="tab-container w-fit"
  x-data={`toggle(${JSON.stringify(config)})`}
  x-modelable="activeTab"
  {...rest}
>
  <ul x-ref="list" class={listClass}>
    <div
      class="pointer-events-none absolute left-0 top-0 z-0 rounded-tab-pill bg-tab-active backdrop-blur-[2px] transition-transform duration-tab ease-out"
      :style="`width:${pill.w}px;height:${pill.h}px;transform:translate(${pill.x}px,${pill.y}px)`"
    >
    </div>
    {options.map((opt) => (
      <ToggleListItem value={opt.value} label={opt.label} />
    ))}
  </ul>
</div>
```

- [ ] **Step 3: Commit (skip if no git)**

```bash
git add app/src/components/ui/Toggle.astro app/src/components/ui/toggle/ToggleListItem.astro
git commit -m "$(cat <<'EOF'
feat: add Toggle.astro shell with x-modelable binding

EOF
)"
```

---

### Task 4: Migrate `test.astro`, delete old toggles, verify

**Files:**
- Modify: `app/src/pages/test.astro`
- Delete: `app/src/components/ui/HorizontalToggle.astro`
- Delete: `app/src/components/ui/VerticleToggle.astro`

**Interfaces:**
- Consumes: `Toggle.astro`, `gameConfig` Alpine data
- Produces: working `/test` page demonstrating H + V + form `x-model`

- [ ] **Step 1: Rewrite `test.astro`**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import AppShell from "../layouts/AppShell.astro";
import Toggle from "../components/ui/Toggle.astro";

const demoOptions = [
  { value: "recreational", label: "Recreational" },
  { value: "analytics", label: "Analytics" },
  { value: "settings", label: "Settings" },
];

const formatOpts = [
  { value: "bestOf", label: "Best of" },
  { value: "firstTo", label: "First to" },
];

const roundTypeOpts = [
  { value: "legs", label: "Legs" },
  { value: "sets", label: "Sets" },
];

const modeOpts = [
  { value: "single", label: "Single" },
  { value: "multi", label: "Multi" },
];
---

<BaseLayout title="Toggle demo">
  <AppShell>
    <div class="flex flex-col gap-6 w-full flex-1 p-2">
      <Toggle orientation="horizontal" options={demoOptions} />
      <Toggle orientation="vertical" options={demoOptions} />

      <form x-data="gameConfig" class="flex flex-col gap-4">
        <Toggle
          orientation="vertical"
          options={formatOpts}
          x-model="format"
        />
        <label class="flex items-center gap-2 text-sm">
          Rounds
          <input
            type="number"
            min="1"
            class="rounded-lg border border-tab-border bg-tab-card px-2 py-1 w-20"
            x-model.number="rounds"
          />
        </label>
        <Toggle
          orientation="vertical"
          options={roundTypeOpts}
          x-model="roundType"
        />
        <Toggle
          orientation="horizontal"
          options={modeOpts}
          x-model="mode"
        />
        <pre
          class="text-xs text-fg-muted"
          x-text="JSON.stringify({ format, rounds, roundType, mode }, null, 2)"
        ></pre>
      </form>
    </div>
  </AppShell>
</BaseLayout>
```

Note: Astro may warn that `x-model` is not a declared prop — it is intentionally forwarded via `[key: string]: any` / `...rest` on `Toggle.astro`.

- [ ] **Step 2: Delete legacy components**

```bash
rm app/src/components/ui/HorizontalToggle.astro app/src/components/ui/VerticleToggle.astro
```

Confirm no remaining imports:

```bash
cd app && rg "HorizontalToggle|VerticleToggle" src
```

Expected: no matches.

- [ ] **Step 3: Build**

```bash
cd app && npm run build
```

Expected: success.

- [ ] **Step 4: Manual browser verification**

Run `npm run dev` in `app/`, open `/test`, check:

1. Horizontal demo (3 options): pill slides; all items equal width with extra pad
2. Vertical demo: same
3. Form: changing format / roundType / mode updates the `<pre>` JSON; `rounds` number input works
4. Mixed orientations on one `gameConfig` form work together

- [ ] **Step 5: Commit (skip if no git)**

```bash
git add app/src/pages/test.astro
git add -u app/src/components/ui/HorizontalToggle.astro app/src/components/ui/VerticleToggle.astro
git commit -m "$(cat <<'EOF'
feat: migrate test page to Toggle.astro and remove legacy toggles

EOF
)"
```

---

## Spec coverage checklist

| Spec requirement | Task |
| --- | --- |
| Pure `Toggle` class, no Alpine | Task 1 |
| Equalize + pill + ResizeObserver + padRem 0.375 | Task 1 |
| Unknown initial/value → first option | Task 1 |
| `Alpine.data('toggle')` + modelable bridge | Task 2–3 |
| `gameConfig` plain fields | Task 2 |
| `alpine.init.js` + astro entrypoint | Task 2 |
| Single `Toggle.astro` orientation prop | Task 3 |
| `{ value, label }[]` options | Tasks 1, 3, 4 |
| Form mixes V + H toggles with `x-model` | Task 4 |
| Delete Horizontal/Verticle | Task 4 |
| ScoreInput migration out of scope | — (skipped) |
