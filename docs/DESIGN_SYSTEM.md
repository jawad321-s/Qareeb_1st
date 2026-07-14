# Design System — Qareeb

A single visual language shared across the mobile apps and the admin dashboard,
inspired by Apple, Airbnb, Uber, Stripe, Linear, Notion and Material 3.

## 1. Color Palette

### Brand
| Token | Hex | Use |
|---|---|---|
| `primary.600` | `#4F46E5` | Primary actions, brand |
| `primary.500` | `#6366F1` | Hover / accents |
| `primary.400` | `#818CF8` | Dark-mode tint |
| `accent.500` | `#06B6D4` | Secondary accent, gradients |

### Semantic
| Token | Hex |
|---|---|
| success | `#10B981` |
| warning | `#F59E0B` |
| danger | `#EF4444` |
| info | `#3B82F6` |

### Surfaces (theme-aware)
| Token | Light | Dark |
|---|---|---|
| bg | `#F8FAFC` | `#0B1120` |
| surface | `#FFFFFF` | `#111827` |
| card | `#FFFFFF` | `#141C2E` |
| border | `#E2E8F0` | `#2A344A` |
| fg | `#0F172A` | `#F1F5F9` |
| muted | `#64748B` | `#94A3B8` |

### Signature gradients
- **Brand:** `#4F46E5 → #6366F1 → #06B6D4`
- **Success:** `#10B981 → #06B6D4`
- **Sunset:** `#F59E0B → #EF4444`

## 2. Typography

Font family: **Inter** (400/500/600/700).

| Style | Size / Line | Weight |
|---|---|---|
| display | 34 / 40 | 700 |
| h1 | 28 / 34 | 700 |
| h2 | 22 / 28 | 600 |
| h3 | 18 / 24 | 600 |
| body | 15 / 22 | 400 |
| bodyMedium | 15 / 22 | 500 |
| caption | 13 / 18 | 400 |
| overline | 11 / 14 | 600 |

## 3. Spacing & Radius

**Spacing scale (px):** 4 · 8 · 12 · 16 · 24 · 32 · 48
**Radius (px):** sm 8 · md 12 · lg 16 · xl 20 · 2xl 28 · full 9999

Cards use `xl` (20), buttons/inputs `lg` (16), pills `full`.

## 4. Elevation

| Level | Shadow |
|---|---|
| sm | y1, blur4, 6% |
| md | y6, blur16, 10% |
| lg | y12, blur28, 16% |

## 5. Components (mobile)

Primitives: `Text`, `Button` (primary/secondary/outline/ghost/danger),
`Card` (solid + glass/blur), `Input`, `Badge`, `Avatar`, `Rating`, `Icon`
(60+ curated SVGs), `SearchBar`, `Header`, `Screen`, `TabBar` (floating glass).

Feedback: `Skeleton`/shimmer, `EmptyState`, `Toast` (haptic + blur).

Domain: `CategoryTile`, `ServiceCard`, `ArtisanCard`, `OfferCard`,
`RequestCard`, `StatusBadge`, `TrackingTimeline`, `BarChart`.

## 6. Motion

- **Reanimated 4** for all animation. Buttons spring to `0.96` on press.
- Entrances use `FadeInDown` / `FadeIn` staggered by ~40–120 ms.
- Skeletons shimmer on a 1.2 s loop; toasts spring in from the top.
- Haptics (`expo-haptics`) on button press, tab switch, and toast events.

## 7. Principles

1. **Depth through light** — soft shadows and glass, never harsh borders.
2. **Motion with meaning** — every transition communicates state.
3. **One accent at a time** — the brand gradient leads; semantic colors inform.
4. **Native feel** — safe areas, haptics, platform gestures respected.
5. **Dark mode is first-class**, not an afterthought.
