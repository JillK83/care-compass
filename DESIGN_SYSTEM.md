# DESIGN_SYSTEM.md — Care Compass Platform

*Care Console + Care Compass · Version 1.0 · June 2026*

This is the single source of truth for all visual decisions on the Care Compass platform. Both doors (`apps/compass` and `apps/console`) share this token system. Any new screen must use these tokens. No new colors, type sizes, or spacing values should be introduced without updating this file.

---

## Overview

Care Console (coordinator tool) and Care Compass (consumer tool) are visually distinct by intent — Console is a dense decision workspace; Compass is a calm, single-purpose results page — but draw from the same palette, type scale, and spacing rules.

**One font family: Inter. No exceptions.**

---

## 1. Color Tokens

### Full token table

| Token | Hex | Role | WCAG status | Used in |
|---|---|---|---|---|
| `--teal-primary` | `#0F6E56` | Brand, search CTA, links, "Find care" button | AA on white ✓ | Compass only |
| `--teal-deep` | `#1D4E5A` | Nav active state, sidebar pill | AA on white ✓ | Console only |
| `--teal-action` | `#17383F` | Primary action buttons (Assign, Flag CTA) | AA on white ✓ | Both |
| `--teal-light` | `#E1F5EE` | Avatar backgrounds, tag backgrounds, flag CTA card surface | Decorative surface only | Both |
| `--orange-alert` | `#B5490A` | Care desert badge, urgency indicators | AA on white ✓ (5.32:1) | Console |
| `--orange-swatch` | `#D85A30` | Legend swatch fill only — decorative, never on text | Decorative only | Console |
| `--red-critical` | `#C0392B` | "0 agencies" stat, result card left accent bar, map desert fill | AA on white ✓ for text | Both |
| `--green-served` | `#27AE60` | Assigned state, served map fill, success | AA on white ✓ | Both |
| `--orange-gap` | `#E67E22` | Gap county map fill | Map fill only — decorative | Both |
| `--gray-no-data` | `#D3D1C7` | No-data map fill | Decorative only | Both |
| `--blue-pin` | `#2980B9` | Caregiver pins on map | Decorative only | Console |
| `--canvas` | `#F8F7F4` | Page background | — | Both |
| `--surface` | `#FFFFFF` | Card / panel background | — | Both |
| `--surface-secondary` | `#F0EEE9` | Sidebar background, disclaimer strip | — | Console |
| `--text-primary` | `#1A1A1A` | All primary text | AA on all surfaces ✓ | Both |
| `--text-secondary` | `#5C5C5C` | Supporting text, subtitles, why-lines | AA on white ✓ | Both |
| `--text-muted` | `#767676` | Caveat text, footer disclaimers, captions | AA on white ✓ (minimum) | Both |
| `--text-on-surface-warm` | `#444441` | Any text on `--surface-secondary` (#F0EEE9) | AA on #F0EEE9 ✓ | Console |
| `--text-muted-decorative` | `#9A9A9A` | Pin icons, decorative labels only — never body text | Decorative only | Both |
| `--border` | `rgba(0,0,0,0.10)` | All card and panel borders | — | Both |
| `--avatar-bg` | `#E1F5EE` | Avatar circle backgrounds | — | Both |
| `--avatar-text` | `#0F6E56` | Avatar initials | AA on `--avatar-bg` ✓ | Both |

### Color role rules — never break these

- `--teal-primary` (`#0F6E56`) is reserved for search/find actions and links on Compass only. Does not appear as a button color on Console.
- `--teal-action` (`#17383F`) is the shared action button color. All primary CTAs that trigger a state change (Assign, Flag) use this token. No exceptions.
- `--teal-deep` (`#1D4E5A`) is reserved for navigation active states only. Must not appear on buttons.
- `--orange-alert` (`#B5490A`) is reserved for urgency badges only. Must not appear on buttons or interactive elements.
- `--text-muted` (`#767676`) is the floor for any text color on white or canvas. Never go lighter for text.
- `--text-muted-decorative` (`#9A9A9A`) fails WCAG AA on white (2.77:1). Restricted to purely decorative elements — pin icons, legend swatches — that are never the sole carrier of information. Never use for text.
- `--text-on-surface-warm` (`#444441`) must be used for all text on `--surface-secondary` (`#F0EEE9`). Never use `--text-muted` on that surface.

### WCAG floor summary

| Text color | Background | Ratio | Status |
|---|---|---|---|
| `#1A1A1A` | `#FFFFFF` | 18.1:1 | ✓ AA |
| `#1A1A1A` | `#F8F7F4` | 16.5:1 | ✓ AA |
| `#5C5C5C` | `#FFFFFF` | 7.1:1 | ✓ AA |
| `#767676` | `#FFFFFF` | 4.54:1 | ✓ AA (minimum) |
| `#444441` | `#F0EEE9` | 6.2:1 | ✓ AA |
| `#B5490A` | `#FFFFFF` | 5.32:1 | ✓ AA |
| `#9A9A9A` | `#FFFFFF` | 2.77:1 | ✗ FAIL — decorative only |
| `#9A9A9A` | `#F0EEE9` | 2.43:1 | ✗ FAIL — never use |

---

## 2. Typography

### Type scale

| Role | Family | Size | Weight | Usage |
|---|---|---|---|---|
| Display / Hero | Inter | 24–32px | 700 | "0 agencies" stat, hero headline |
| Section heading | Inter | 16px | 600 | Panel titles, county name in panel |
| Body | Inter | 14px | 400 | Card body text, resource descriptions |
| Emphasis | Inter | 14px | 500 | Names, key numbers, bold inline |
| Label / Tag | Inter | 11–12px | 500 | Section labels (uppercase), tags, chips |
| Caption / Caveat | Inter | 12px | 400 | Footnotes, disclaimers, privacy notes |
| Top bar tagline | Inter | 12px | 400 | Tagline only — `--text-muted-decorative` acceptable here as purely decorative |

### Typography rules

- Inter is the only font family. No other families in scope for either screen.
- Section labels use 11px uppercase with `letter-spacing: 0.08em`. Do not use uppercase for any other text role.
- Minimum body text size is 14px. Never use 12px for body copy — captions only.
- Hover tooltips on the map use `--text-primary` on `--surface` (white). No special map label font treatment.

---

## 3. Spacing & Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-card` | `12px` | All cards and panels (Compass) |
| `--radius-card-console` | `8px` | All cards (Console) |
| `--radius-button` | `8px` | All buttons, both screens |
| `--radius-chip` | `8px` | Filter chips, tags |
| `--radius-pill` | `20px` | Agency count pills only |
| `--radius-avatar` | `50%` | Avatar circles |
| `--space-card-padding` | `20–24px` | Card internal padding (Compass) |
| `--space-card-padding-console` | `16px` | Console card internal padding |
| `--space-zone-gap` | `12px` | Gap between card zones (B→C in caregiver cards) |
| `--border-width` | `0.5px` | All structural borders |
| `--accent-bar` | `4px` | Left accent bar on result headline card |

---

## 4. Button Tiers

| Tier | Background | Text | Min height | Usage | Screen |
|---|---|---|---|---|---|
| Primary search | `#0F6E56` | White | 44px | "Find care" — search trigger only | Compass |
| Primary action | `#17383F` | White | 36px | "Assign", "Flag this area" — state-change actions | Both |
| Assigned / success | `#27AE60` | White | 36px | Post-assign toggle state | Console |
| Outlined chip | Transparent, `#1A1A1A` text, `--border` border | — | 32px | Filter chips (Language, Distance, Skill) | Console |

### Button rules

- "Flag this area as needing care" button: 320px fixed width, centered.
- No button may use `--teal-deep` (`#1D4E5A`) or `--orange-alert` (`#B5490A`) as a background color.
- Minimum touch target 44px for Compass CTA; 36px acceptable for Console dense layout.

---

## 5. Interaction States

| Element | Default | Active / toggled | Notes |
|---|---|---|---|
| Assign button | `#17383F` bg, white text | `#27AE60` bg, white text | Toggle on click, persist until page reload |
| Flag CTA button | `#17383F` bg, white text | Confirmed state — TBD in build | Confirmation state not yet mocked |
| Filter chips | Outlined, `#1A1A1A` text | Not applicable — secondary controls | "Showing: Available now" is a static label, not a chip |
| Map county hover | Base fill color | Leaflet tooltip: county name + agency count | Both doors — see map implementation rules below |
| Map county click | Hover state | Panel populates with county data | Console: assignment panel. Compass: result card updates. |

---

## 6. Map Implementation Rules

**Both doors use Leaflet + free GeoJSON. No external map API key.**

### County labels

County names are **never rendered as SVG text on map fills**. Labels surface in two places only:

- **Hover:** Leaflet `tooltip` (HTML div) bound to each county feature. Shows county name + agency count on mouseover. Uses `--text-primary` on `--surface` (white tooltip background).
- **Click:** County name appears in the panel header (Console) or result card (Compass). Uses `--text-primary` / section heading type scale.

```js
// Standard implementation pattern
layer.bindTooltip(
  `<strong>${feature.properties.NAME}</strong><br/>${agencyCount} agencies`,
  { sticky: true, className: 'county-tooltip' }
)
layer.on('click', () => onCountyClick(feature.properties.GEOID))
```

Do not implement SVG `<text>` elements on fills. Do not use permanent tooltips at national zoom scale.

### Choropleth fill tokens

| County status | Fill token | Hex | Notes |
|---|---|---|---|
| Served (agencies present) | `--green-served` | `#27AE60` | |
| Gap (low coverage) | `--orange-gap` | `#E67E22` | Map fill only — decorative |
| Desert (zero agencies) | `--red-critical` | `#C0392B` | |
| No data | `--gray-no-data` | `#D3D1C7` | |
| Demand signal (Door 1 flag) | `--blue-pin` | `#2980B9` | Console only — overlay layer |

### Legend

The color legend must always be visible on all map surfaces — never hover-dependent. It must include explicit severity text labels alongside color swatches (WCAG 1.4.1). The legend swatch for "Care desert county" uses `--orange-swatch` (`#D85A30`) — the text label carries the meaning, not the swatch color.

### GeoJSON source

Census TIGER/Line 1:20m simplified (`us-counties-20m.geojson`) — committed to `/shared/assets`. Do not fetch from an external URL at runtime.

---

## 7. Screen-Specific Constraints

### Care Console (coordinator — `apps/console`)

- **Layout:** Three-zone: 220px sidebar / map canvas (fills remaining width) / 360px assignment panel
- **Navigation:** Sidebar is the sole navigation. No top nav bar.
- **Caregiver cards:** Three internal zones — A: identity + match score / B: tags (language, skills) / C: why-line + Assign action
- **"Showing: Available now"** is a static status label, not an interactive chip
- **Card radius:** `--radius-card-console` (8px) — tighter than Compass
- **Card padding:** `--space-card-padding-console` (16px)

### Care Compass (consumer — `apps/compass`)

- **Layout:** Centered content column, max-width 780px
- **Page section order (fixed — do not reorder):**
  1. Hero (ZIP entry)
  2. Result card (desert status, agency count, agencies per 1,000 seniors)
  3. Flag CTA ("I need care here" button)
  4. Nearest counties (adjacency results if desert)
  5. What to do next (resource links)
  6. Map (optional geographic context)
  7. Footer
- **Map position:** Bottom of page — optional context, not primary UI
- **"Start here" tag:** Eldercare Locator row only. No other resource rows get tags.
- **Card radius:** `--radius-card` (12px)
- **Card padding:** `--space-card-padding` (20–24px)

---

## 8. Component Specs

### Caregiver match card (Console)

**Zone A — Identity + score**
- Avatar circle: `--avatar-bg` fill, `--avatar-text` initials, `--radius-avatar` (50%)
- Caregiver name: 14px / 500 / `--text-primary`
- Match score badge: right-aligned, `--orange-alert` background, white text, `--radius-chip`

**Zone B — Tags**
- Language tag, skills tags: outlined chip style, `--text-secondary`, `--border`, `--radius-chip` (8px)
- Gap between Zone A and B: `--space-zone-gap` (12px)

**Zone C — Why-line + action**
- Why-line copy: 14px / 400 / `--text-secondary` — must provide interpretive rationale, not restate tags
- Assign button: `--teal-action` background, white text, 36px min height, `--radius-button`
- Gap between Zone B and C: `--space-zone-gap` (12px)

### Result card (Compass)

- Left accent bar: 4px, `--accent-bar` token, `--red-critical` color when desert status
- Agency count stat: 24–32px / 700 / `--red-critical` for zero, `--text-primary` otherwise
- Desert status label: 16px / 600 / `--text-primary`
- Resource links: 14px / 400, `--teal-primary` color, underline on hover

### Avatar

- Size: 36–40px diameter
- Background: `--avatar-bg` (`#E1F5EE`)
- Initials: `--avatar-text` (`#0F6E56`), 14px / 500
- Radius: 50%

---

## 9. WCAG 2.1 AA — Full Compliance Rules

- Color contrast ≥ 4.5:1 for all normal text; ≥ 3.0:1 for large text (18px+ regular, 14px+ bold) and UI components.
- All map surfaces: color legend always visible, always includes explicit text labels alongside swatches. Never hover-dependent.
- Map fills are decorative — county color never carries meaning without the legend text label.
- `--text-on-surface-warm` (`#444441`) is required for all text on `--surface-secondary` (`#F0EEE9`). `--text-muted` (`#767676`) must not be used on that surface.
- `--text-muted-decorative` (`#9A9A9A`) is never used for text of any kind.
- Door 1 WCAG audit must be run against Figma Make output before committing Door 1 CSS.

---

## 10. What's Not in Scope

- No dark mode in MVP.
- No mobile-optimized layouts — desktop only for both doors.
- No font families other than Inter.
- No new color tokens without updating this file and `theme.css`.
- No `--map-label` token — county labels are Leaflet tooltips only. See Section 6.
