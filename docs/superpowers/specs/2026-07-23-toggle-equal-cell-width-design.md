# Toggle equal cell sizing + class-based width — Design

**Date:** 2026-07-23  
**Scope:** Make toggle list items share the parent equally on the main axis, and let callers set Toggle size via root CSS `class`. Drop content-based JS equalize / `padRem`.

## Goal

- Horizontal: each item width = `(list inner width − gaps) / N`
- Vertical: each item height = `(list inner height − gaps) / N` when the shell has a defined height
- Callers control shell size with Tailwind (or other) classes on the root, e.g. `class="w-full"` / `class="w-full h-48"`
- Default size remains shrink-wrap (`w-fit`); no forced fill
- Sliding pill still tracks the active item after layout

## Decisions

| Topic | Choice |
| --- | --- |
| Width API | Root `class` only (no `width` prop) |
| Equal split | Both orientations (H → width, V → height) |
| Default size | Keep `w-fit` |
| Implementation | CSS grid equal `fr` tracks; JS only measures pill |

## Approach

**CSS grid owns item geometry.** `Toggle.ts` stops writing inline widths from content. ResizeObserver + `#syncPill` remain so the pill matches the active cell after resize / selection.

Rejected:

- JS `parentSize / N` equalize — duplicates grid, more races with ResizeObserver
- Hybrid (CSS H + JS V) — two paths; vertical still needs a defined height to mean anything

## File map

| Path | Change |
| --- | --- |
| `app/src/components/ui/Toggle.astro` | Equal-fr grid for H and V; root stays `w-fit` + spread `class` / attrs |
| `app/src/components/ui/toggle/ToggleListItem.astro` | Fill grid cell (`w-full` / `h-full` as needed); no JS width dependency |
| `app/src/lib/toggle/Toggle.ts` | Remove `#equalize`, `padRem`; `layout()` = sync pill only |
| `app/src/lib/toggle/Toggle.test.ts` | Drop `padRem` test; keep value / proxy regression tests |
| `app/src/lib/alpine/toggle.js` | No API change (closure-held instance stays) |

Call sites (`ScoreTrainingConfig`, `/test`) unchanged unless a width class is desired later.

## `Toggle.astro` contract

| Prop / attr | Notes |
| --- | --- |
| `options` | `{ value, label }[]` — unchanged |
| `orientation` | `'horizontal' \| 'vertical'` — unchanged |
| `initial` | Optional; unchanged |
| `class` (and other attrs) | Spread on root; use for `w-*` / `h-*` / layout |
| `x-model` | Via `x-modelable="activeTab"` — unchanged |

**List classes (intent):**

- Horizontal: grid with `N` equal columns (`1fr`), existing gap
- Vertical: grid with `N` equal rows (`1fr`), existing gap; equal row height only when shell height is set

Pill: absolute; `:style` from Alpine `pill` after measure.

## `Toggle` class

```ts
layout(): void {
  this.#syncPill()
  this.#onPillChange?.(this.pill)
}
```

- Remove `padRem` from `ToggleOpts` and the class
- Remove `#equalize`
- Keep `mount` / `unmount` / ResizeObserver / `#syncPill` (bbox relative to list)

## Edge cases

| Case | Behavior |
| --- | --- |
| No size class | `w-fit` — equal columns among themselves; overall shrinks to content |
| `class="w-full"` | Fills parent; N equal columns (H) or full-width rows (V) |
| Vertical + no height | Rows content-sized; equal *height* only with `h-*` / `h-full` |
| Gaps | Grid gap included in division — items share space after gaps |
| Labels longer than cell | Item/cell clips or wraps per existing item styles (no JS widen) |

## Out of scope

- New `width` / `height` props
- Inventing vertical height when none is set
- Restyling tab chrome / tokens
- Migrating ScoreTrainingConfig widths unless requested

## Verification

1. `/test` / ScoreTrainingConfig — pill tracks selection; no private-field / mount errors
2. With `class="w-full"` on a horizontal Toggle — item widths equal and sum (with gaps) to list width
3. Vertical with `class="h-48"` (or similar) — item heights equal
4. Unit tests: no `padRem`; value + Proxy regression still pass
5. Confirm `Toggle.ts` does not set inline item widths
