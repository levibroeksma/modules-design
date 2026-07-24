# Style Guide

Portable UI conventions. Dark-only, mobile-first. Semantic tokens and shared primitives — never ad-hoc colors or one-off button styles.

## Theme

- Dark only. No light mode. Force dark even when the OS prefers light.
- Mobile-first shell: content column capped at `max-w-lg`, full viewport height, safe-area padding on bottom chrome.
- Tap highlight off; `touch-action: manipulation`.

## Tokens

Use semantic tokens only. Never raw palette utilities (`bg-teal-500`, `text-zinc-*`, etc.).

| Role | Classes |
| --- | --- |
| Backgrounds | `bg-bg`, `bg-bg-subtle`, `bg-bg-muted`, `bg-bg-emphasis` |
| Text | `text-fg`, `text-fg-muted`, `text-fg-subtle`, `text-fg-faint` |
| Borders | `border-border`, `border-border-strong` |
| Accent | `bg-accent`, `text-accent`, `text-accent-foreground`, `accent-*` scale |
| States | `destructive` / `success` / `warning` (+ muted variants where needed) |
| Radius | `rounded-md` (controls), `rounded-lg` (cards/surfaces) — subtle, not bubbly |

Suggested motion tokens: `--ease-out`, `--ease-in-out`, `--duration-fast` (140ms), `--duration-normal` (200ms).

## Primitives

Implement these class contracts once and reuse them. Do not reinvent per screen.

| Class | Role |
| --- | --- |
| `.surface` | Cards, panels, primary containers — `rounded-lg border border-border bg-bg-subtle` |
| `.surface-elevated` | Nested wells inside a surface — `rounded-lg border border-border bg-bg-muted` |
| `.btn` + `.btn-primary` / `.btn-secondary` / `.btn-ghost` | All buttons |
| `.input` | Text fields |
| `.badge` + `.badge-accent` / `.badge-muted` | Status chips |
| `.nav-item` / `.nav-item-active` | Bottom navigation items |
| `.app-shell` / `.app-main` / `.app-nav` | Page chrome (column, scroll main, fixed bottom nav) |

Press feedback: `.btn:active` scales to `0.97`. Do not reimplement elsewhere.

## Typography

| Context | Rules |
| --- | --- |
| Body / description / buttons | `font-sans`, `font-normal` — never `font-mono` |
| Titles, tags, labels (headers) | `font-mono` OK |
| Large numeric displays (scores, targets) | `font-mono font-bold tabular-nums` |
| Case | No `uppercase` on body, description, or button text. Scope `uppercase` to the specific title element |
| Weight | Prefer `font-normal`, `font-semibold`, `font-bold`. Avoid `font-medium` (poor cross-browser support) |

When a parent uses `font-mono` / `uppercase`, reset children that should not inherit (`font-sans`, `normal-case`).

## Spacing & layout

| Pattern | Value |
| --- | --- |
| Page / section padding | `p-3` or `px-4 py-5` |
| Between sections | `gap-3` / `mb-6` |
| Tight control / button groups | `gap-2` |
| Tap targets | `min-h-11` default; compact UI may use `min-h-9` / `min-h-10` |
| Shell width | `max-w-lg` |

Prefer `flex flex-1` over fixed fractions (`h-1/2`) when siblings share vertical space.

## Buttons

- Primary: `btn btn-primary`
- Secondary / keypad keys: `btn btn-secondary`
- Text-only / cancel: `btn btn-ghost` (no border)
- Always set `type="button"` unless submitting a form
- Icon-only: `aria-label`; icons typically `size-6 text-fg-subtle`
- Disabled: `disabled:opacity-40 disabled:pointer-events-none`
- Do not use `rounded-full` on primary buttons — keep `rounded-md`

Modal action row: cancel left, confirm right; buttons ~`w-1/3`, row `justify-end`.

## Surfaces & nesting

- One intentional surface level per block
- Never nest `.surface` inside `.surface` — use `.surface-elevated` for inner wells

## Motion

| Do | Don't |
| --- | --- |
| Animate `transform` / `opacity` only | `transition: all` |
| `ease-out` / strong custom curves for UI | `ease-in` on UI |
| Keep UI motion ≤ 300ms | Long decorative delays on frequent actions |
| Rely on `.btn` press scale | Extra press animation on high-frequency input (keypads) |
| Gate hover with `@media (hover: hover) and (pointer: fine)` | Hover-only critical feedback on touch |
| Respect `prefers-reduced-motion` | Ignore reduced motion |

Modals: opacity fade 150–200ms `ease-out`. If scaling on enter, start from `scale-95` + opacity — never `scale(0)`.

## Interactivity (Alpine.js or equivalent)

- Put state on the smallest owner that needs it
- Keep interactive children inside that owner; do not nest dialogs inside wrappers that leak `font-mono` / `uppercase`
- Cloak unready UI (`x-cloak` + `[x-cloak] { display: none }`)
- Escape closes dialogs; backdrop click dismisses
- Prefer declarative bindings for click, show/hide, text, class, and disabled

## Accessibility

- Icon-only controls need `aria-label`
- Dialogs: `role="dialog"`, `aria-modal="true"`, labelled and described
- Prefer semantic HTML (`button`, `a`, headings)
- No hover-only critical affordances on touch

## Anti-patterns

| Avoid | Prefer |
| --- | --- |
| Raw palette colors (`teal-*`, `zinc-*`) | Semantic tokens (`accent`, `bg-*`, `fg-*`) |
| `font-medium` | `font-normal` / `font-semibold` / `font-bold` |
| `font-mono` on body or buttons | `font-sans` |
| Parent `uppercase` wrapping modal/body | Uppercase on the title only |
| Nested `.surface` | `.surface` + `.surface-elevated` |
| Ad-hoc button CSS | `.btn` variants |
| Animating every keypress | Instant state update + shared press scale |
