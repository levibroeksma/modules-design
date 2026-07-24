# Toggle Alpine extraction — Design

**Date:** 2026-07-23  
**Scope:** Extract inline toggle `x-data` into a pure OOP `Toggle` module, wire it through Alpine via `alpine.init.js`, and expose a single `Toggle.astro` usable inside Alpine forms with `x-model`.

## Goal

Form fields stay plain strings on a parent Alpine data object. Each toggle is a reusable control that:

- Renders horizontal or vertical from one Astro component
- Accepts `{ value, label }[]` options
- Moves an equal-width sliding pill for any option count
- Syncs to the parent via `x-model` / `x-modelable` (e.g. `x-model="roundType"`)

## Approach

**Recommended binding model:** nested `Alpine.data('toggle')` + `x-modelable`, with form state as plain fields.

| Layer | Responsibility | Depends on Alpine? |
| --- | --- | --- |
| `Toggle` class | Value, options, equalize, pill geometry, ResizeObserver | No |
| `Alpine.data('toggle')` | Reactivity, `$refs` / `$watch` / `$nextTick`, mounts `Toggle` | Yes |
| Parent form data (e.g. `gameConfig`) | Plain fields only (`format`, `rounds`, `roundType`, `mode`) | Yes |
| `Toggle.astro` | Markup + orientation classes; forwards attrs for `x-model` | Markup only |
| `alpine.init.js` | Entrypoint registered in `astro.config.mjs` | Yes |

**Rejected alternatives**

- Form field = `new Toggle(...)` — hurts serialize/submit; class reactivity is awkward in Alpine
- Parallel plain field + separate Toggle helper — two sources of truth

## File map

```
app/src/
  alpine.init.js                      # @astrojs/alpinejs entrypoint
  lib/toggle/Toggle.ts                # OOP module — no alpine import
  lib/alpine/toggle.js                # Alpine.data('toggle') — imports Toggle
  lib/alpine/gameConfig.js            # example form data (plain fields)
  components/ui/Toggle.astro          # single shell (orientation prop)
  components/ui/toggle/ToggleListItem.astro
app/astro.config.mjs                  # alpinejs({ entrypoint: '/src/alpine.init.js' })
```

**Removed after migration:** `HorizontalToggle.astro`, `VerticleToggle.astro`.  
**Updated:** `test.astro` (and any callers) → `Toggle.astro`.

## `Toggle` module API

Pure class. No `alpinejs` import.

```ts
type ToggleOption = { value: string; label: string }
type Orientation = 'horizontal' | 'vertical'
type Pill = { w: number; h: number; x: number; y: number }

class Toggle {
  constructor(opts: {
    options: ToggleOption[]
    orientation: Orientation
    initial?: string
    padRem?: number // default 0.375 (Tailwind px-1.5)
    onPillChange?: (pill: Pill) => void
  })

  get value(): string
  set value(v: string) // ignore unknown option values
  get options(): ToggleOption[]
  get orientation(): Orientation
  get pill(): Pill

  mount(
    listEl: HTMLElement,
    getItemEl: (value: string) => HTMLElement | undefined,
  ): void
  unmount(): void
  setValue(value: string): void // set + layout()
  layout(): void // equalize → syncPill → onPillChange
}
```

### Layout rules

1. **Equalize:** temporarily size items to `max-content`, take max width, set every item to `widest + 2 * padRem * rootFontSize`.
2. **syncPill:** copy active item `offsetWidth`, `offsetHeight`, `offsetLeft`, `offsetTop` into `pill`.
3. **ResizeObserver** on `listEl` calls `layout()`.
4. **Orientation** affects Astro/CSS only; measurement math is shared.

## `Alpine.data('toggle')`

Thin wrapper in `lib/alpine/toggle.js`:

- Config: `{ options, orientation, initial? }`
- State: `activeTab`, `options`, `orientation`, `pill`
- `init`: construct `Toggle` with `onPillChange` → `this.pill`; `$nextTick` → `mount($refs.list, (v) => $refs[v])`; `$watch('activeTab', …)` → `setValue`
- `select(value)` sets `activeTab`
- `destroy` / teardown calls `unmount()`
- Root uses `x-modelable="activeTab"` so parent `x-model` binds a plain string

## Entrypoint

```js
// app/src/alpine.init.js
import toggle from './lib/alpine/toggle.js'
import gameConfig from './lib/alpine/gameConfig.js'

export default (Alpine) => {
  toggle(Alpine)
  gameConfig(Alpine)
}
```

```js
// app/astro.config.mjs
integrations: [alpinejs({ entrypoint: '/src/alpine.init.js' })]
```

Each alpine module exports `default (Alpine) => { Alpine.data(...) }`.

## `Toggle.astro` contract

| Prop | Type | Notes |
| --- | --- | --- |
| `options` | `{ value: string; label: string }[]` | Required |
| `orientation` | `'horizontal' \| 'vertical'` | Required |
| `initial` | `string?` | Defaults to first option value; overridden by `x-model` when present |

- Root: `x-data="toggle({...})"`, `x-modelable="activeTab"`, spread remaining attrs (for `x-model`)
- List: `x-ref="list"`; horizontal → `grid grid-flow-col auto-cols-fr`; vertical → `flex flex-col`
- Pill: absolute, `:style` from `pill`, keep `transition-transform duration-tab ease-out`
- Items: `ToggleListItem` — `x-ref={value}`, active class from `activeTab`, `@click="select(value)"`

## Form usage

```js
// lib/alpine/gameConfig.js
export default (Alpine) => {
  Alpine.data('gameConfig', () => ({
    format: 'bestOf',
    rounds: 3,
    roundType: 'legs',
    mode: 'single',
  }))
}
```

```astro
<form x-data="gameConfig">
  <Toggle orientation="vertical" options={formatOpts} x-model="format" />
  <input type="number" x-model.number="rounds" />
  <Toggle orientation="vertical" options={roundTypeOpts} x-model="roundType" />
  <Toggle orientation="horizontal" options={modeOpts} x-model="mode" />
</form>
```

Same form may mix vertical and horizontal toggles freely.

## Edge cases

| Case | Behavior |
| --- | --- |
| N options (2+) | Pill tracks active index/item; equalize from widest |
| Unknown `x-model` / initial value | Fall back to first option on mount; do not throw |
| Component teardown | `unmount()` disconnects ResizeObserver |
| Pad | Default `padRem = 0.375`; configurable on `Toggle` |

## Out of scope

- Full game-config page visual polish beyond wiring
- Migrating `ScoreInput` (or other inline `x-data`) to the entrypoint pattern
- Keyboard roving tabindex beyond existing click / radio markup

## Verification

1. `/test` — `Toggle` horizontal and vertical with 2+ options; pill slides; widths equal + pad
2. Shared `gameConfig` form — two vertical toggles + one horizontal; confirm `format`, `roundType`, `mode` update as plain strings
3. Confirm `Toggle.ts` has no `alpinejs` import
4. Confirm Alpine boots via `alpine.init.js` entrypoint in `astro.config.mjs`
