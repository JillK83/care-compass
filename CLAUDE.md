# CLAUDE.md — Care Compass Platform

Behavioral guidelines for Claude when working on this project. These rules merge general coding discipline with project-specific contracts. When in doubt, re-read this file before writing any code.

Read these companion files before starting any session:
- `DESIGN_SYSTEM.md` — full token tables, typography, spacing, button tiers, screen constraints
- `MapEngine_Interface_Contract.md` — shared prop interface between Door 1 and Door 2
- `DECISIONS.md` — ten locked design decisions with rationale and rejected alternatives

---

## 1. Think Before Coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing anything:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### Project-specific rules

**Two-door architecture is non-negotiable.** Door 1 (`/compass`, `apps/compass`) is public and reads only from static CSV. Door 2 (`/map`, `apps/console`) is coordinator-gated and reads from Supabase in real time. These data paths must never be mixed. No Supabase query may appear in `apps/compass`. No PII from Door 2 may be exposed on Door 1, including in error states.

**County is the geographic unit.** ZIP is input only. The crosswalk resolves ZIP to county silently — all downstream rendering, logic, and data display operates at county level. Never render or store at ZIP level.

**MapEngine is shared and locked.** Both doors render through a single `MapEngine` React component defined in `packages/ui`. Its TypeScript interface contract lives in `MapEngine_Interface_Contract.md` and `MapEngine.types.ts`. Data adapts to fit the contract — never the reverse. See Section 5 for the full sign-off protocol.

**Ambiguity is a signal, not a default.** If data is missing or a state is undefined, surface it explicitly — empty state, error state, or fallback copy. Never silently default to a value or suppress an edge case.

---

## 2. Simplicity First

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Project-specific rules

**MVP scope is fixed.** Do not implement multi-org support, EHR integration, automated routing, dynamic scheduling, caregiver self-management, or mobile-optimized layouts. Desktop only for both doors.

**Design tokens only.** Use CSS custom properties from `theme.css` for all visual decisions. Do not introduce new hex values, new component libraries, or override established tokens. If a token doesn't exist for what you need, ask — don't invent one.

**TypeScript only.** Both apps use TypeScript. No JavaScript-only patterns. All shared utilities in `packages/utils` must be typed.

**No PII on Door 1, ever.** The "I need care here" button captures ZIP only — no email, no name, no contact information of any kind. If you are ever writing code that would capture family identity on the Door 1 surface, stop and flag it.

---

## 3. Surgical Changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that your changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### Project-specific rules

**Supabase schema is locked.** The four core tables (`public.client_profiles`, `public.caregiver_profiles`, `public.assignments_log`, `public.coordinator_profiles`) are defined and seeded. Do not add columns, rename fields, or alter table structure without explicit instruction. Query before writing — never assume the table matches the seed files.

**Shared utilities are shared.** `packages/utils` contains the ZIP-to-county crosswalk function, county fill normalization, and county adjacency lookup. These are used by both doors. Do not reimplement crosswalk or adjacency logic inside either app directory.

**Geo assets live in `/shared/assets`.** `us-counties-20m.geojson`, `county-adjacency.csv`, and `home_care_by_county.csv` are committed once. Do not duplicate them inside app directories.

---

## 4. Goal-Driven Execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"

For multi-step tasks, state a brief plan:

```
[Step] → verify: [check]
[Step] → verify: [check]
[Step] → verify: [check]
```

### Build phases

**Phase A — Door 2 (Care Console):** Supabase schema, magic link auth, Clients List, Dignity Profile form, assignment advisory panel, seed data script, real-time map, audit log, demand signal overlay.

**Phase B — Door 1 (Care Compass Family):** Static data path, ZIP lookup, county render, ResourcePanel, adjacency logic, "I need care here" stub and demand signal write.

**Phase C — Integration:** Shared MapEngine wired to both doors, demand signal loop demonstrable end-to-end, WCAG audit on both doors, demo scenario walkthrough.

---

## 5. MapEngine Interface Contract — NEVER BREAK THIS

The MapEngine is the highest-risk shared surface in this project. Both doors depend on it. A breaking change breaks both.

### Rules

- `MapEngine.types.ts` in `packages/ui` is the single source of truth for all prop shapes and data interfaces.
- Full contract is documented in `MapEngine_Interface_Contract.md`.
- **Any change to the interface requires sign-off from both Jillian and Lee before implementation.**
- The review window for any proposed interface change is a minimum of 2 hours before a PR is opened.
- If you are working on Door 2 and need a MapEngine prop that doesn't exist, stop. Document the need. Do not modify the contract unilaterally.
- Data adapts to fit the contract. The contract does not adapt to fit the data.

### What each door owns

| Surface | Owner | Data path |
|---|---|---|
| `apps/compass` (Door 1) | Lee | Static CSV → shared utils → MapEngine |
| `apps/console` (Door 2) | Jillian | Supabase → shared utils → MapEngine |
| `packages/ui/MapEngine` | Both (joint sign-off) | Interface contract only |
| `packages/utils` | Both (joint sign-off) | ZIP crosswalk, adjacency, fill normalization |

---

## 6. WCAG 2.1 AA — Non-Negotiable

WCAG 2.1 AA compliance is required across both doors.

### Hard rules

- Color contrast ≥ 4.5:1 for all normal text; ≥ 3.0:1 for large text (18px+ regular or 14px+ bold) and UI components.
- The color legend on all map surfaces must always be visible — not hover-dependent. It must include explicit severity text labels alongside color fills (satisfies WCAG 1.4.1).
- `--text-muted` (`#9A9A9A`) fails AA on white (2.77:1) — restricted to purely decorative elements only (pin icons, legend swatches). Never use for text.
- `--text-muted` must never be used on the warm surface `#F0EEE9` — use `--text-on-surface-warm` (`#444441`) instead.
- Map county fills are decorative — county color alone never carries meaning without a text label in the legend.

### Confirmed token corrections (committed)

These three tokens were corrected following the Door 2 WCAG audit. They are confirmed and committed — do not revert to old values.

```css
--orange-alert: #B5490A;         /* was #D85A30 — fixes badge + Assign button (now 5.32:1 on white) */
--text-on-surface-warm: #444441; /* use on #F0EEE9 warm surface only — passes AA */
```

**County labels:** There are no SVG text labels rendered on map fills. County names surface via Leaflet hover tooltip only (HTML div, `--text-primary` on `--surface`). On click, the county name appears in the panel header. The `--map-label` token does not exist — do not introduce it.

### Door 1 WCAG audit

Door 1 WCAG audit must be run against Figma Make output before committing Door 1 CSS. The same orange token issue that affected Door 2 may apply if Door 1 uses any orange CTAs. See `DESIGN_SYSTEM.md` for the full token constraint table.

---

## 7. Key Contracts — Never Break These

### Data path separation

```
Door 1 data path: home_care_by_county.csv → packages/utils → apps/compass
Door 2 data path: Supabase → packages/utils → apps/console
```

These paths must never intersect. No Supabase import in `apps/compass`. No static CSV read in `apps/console` (except seed scripts).

### Demand signal path

```
Door 1 "I need care here" click
  → anonymous ZIP captured (no PII)
  → crosswalk resolves ZIP to county FIPS
  → county-level flag stored
  → surfaced as overlay on Door 2 coordinator map
```

No family identity at any point in this path. If you are touching the demand signal flow, verify this chain before committing.

### Dignity Profile field contract

Required: client name only.

Optional fields: nickname, preferred language, gender preference for aide, one comfort / key thing to know, one key thing to avoid or trigger.

**Emergency contacts are explicitly excluded from the MVP Dignity Profile.** Do not add them. If asked to add them, flag it as out of scope.

### Supabase table contract

| Table | Purpose |
|---|---|
| `public.client_profiles` | One record per client — demand side |
| `public.caregiver_profiles` | One record per caregiver — supply side |
| `public.assignments_log` | Full audit trail — every assignment action |
| `public.coordinator_profiles` | User and auth management |

`assignments_log` must capture: coordinator ID, client ID, caregiver ID, timestamp, match score, and optional note. No assignment action is untracked.

### Auth contract

- Door 1: no authentication, fully public.
- Door 2: Supabase magic link auth — email only, no password.
- No coordinator data, Supabase queries, or auth state is ever accessible from the `/compass` route.

### Geographic unit contract

- Input: ZIP code (user-facing only)
- Processing: crosswalk resolves to primary county FIPS silently
- Storage and rendering: county FIPS only
- ZIPs spanning multiple county lines resolve to the primary county as defined by the crosswalk file

---

## 8. Tech Stack

| Layer | Choice |
|---|---|
| Monorepo | Turborepo |
| Framework | React + Vite |
| Language | TypeScript |
| Styling | CSS custom properties via `theme.css` |
| Map | Leaflet + free GeoJSON (no API key required) |
| County boundaries | Census TIGER/Line 1:20m simplified (`us-counties-20m.geojson`) |
| Database (Door 2) | Supabase |
| Auth (Door 2) | Supabase magic link |
| Data (Door 1) | Static CSV |
| Platform | Desktop only — no mobile optimization in MVP |

---

## 9. Open Items

Track these before or during Day 1. Do not close them silently — update `DECISIONS.md` when resolved.

| # | Item | Owner | Status |
|---|---|---|---|
| O1 | Verify ZIP-to-county crosswalk behavior for ZIPs spanning multiple county lines | Lee | Open — Day 1 |
| O2 | Lock choropleth map library dependency before scaffolding MapEngine component API | Both | Open — Day 1 |
| O3 | Run Door 1 WCAG audit against Figma Make output before committing Door 1 CSS | Lee | Open — Day 3 |
| O4 | Confirm demo ZIP codes for Maricopa County scenario against Lee's dataset | Lee | Open — Day 1 |

---

## 10. Demo Scenario Reference

The demo sequences both doors in one session. Know this before touching any demo-path code.

1. Family enters ZIP 85145 (rural Pinal County, Arizona)
2. County resolves → map highlights desert county → panel shows zero/low agency count
3. Resource links visible → "I need care here" clicked → ZIP flagged
4. Coordinator logs into Care Console → sees demand signal on map in Pinal County
5. Clicks county → assignment panel surfaces unassigned client
6. Spanish-speaking aide matched → assignment confirmed → map fill updates → audit log entry recorded

Seed data requirements: at least one confirmed Spanish-speaking caregiver, at least one client in a confirmed desert county.

---

## 11. Reference Files

| File | Purpose |
|---|---|
| `DESIGN_SYSTEM.md` | Full token tables, typography, spacing, button tiers, screen constraints |
| `MapEngine_Interface_Contract.md` | Full TypeScript prop definitions, data shapes, auth enforcement, change protocol |
| `DECISIONS.md` | Ten locked design decisions with rationale and rejected alternatives |
| `BUILD_CHECKLIST.md` | Day-by-day task list with owners and verification steps |
| `CareCompass_PRD_v1.0.docx` | Full product requirements document |
