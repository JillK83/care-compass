# BUILD_CHECKLIST.md — Care Compass Platform

Day-by-day tasks with owners and verification steps.
Check off as you go. Both builders merge to main at each daily checkpoint.

---

## Day 1 — Scaffold & Data Foundation
**Goal:** Monorepo live, shared assets committed, each builder has a working data path before end of day.

### Both (morning — do together before splitting)
- [x] Turborepo scaffold confirmed running — `npm run dev` starts both apps
- [x] `packages/ui/MapEngine.types.ts` interface reviewed and locked — no changes after this point without sign-off
- [x] Both builders can run `apps/compass` (port 5173) and `apps/console` (port 5174) locally
- [x] Merge scaffold to `main`

### Lee — Door 1
- [x] Source `us-counties-20m.geojson` from Census TIGER/Line and commit to `packages/utils/assets/`
- [x] Source `county-adjacency.csv` from Census and commit to `packages/utils/assets/`
- [x] Source `zip-county-crosswalk.csv` from scpike/uszips and commit to `packages/utils/assets/`
- [x] Build `home_care_by_county.csv` by merging CMS Provider Data Catalog + Census ACS 2023 (Table S0101)
  - Filter CMS data to Provider Type = Home Health Agency
  - Group by county FIPS, count distinct agencies
  - Join with Census ACS senior population by county
  - Output columns: `county_fips, county_name, state_abbr, agency_count, senior_population, agencies_per_1k_seniors`
- [x] Commit `home_care_by_county.csv` to `packages/utils/assets/`
- [ ] Verify ZIP codes 85145, 85139, 85128 resolve to desert counties in dataset
  - If they don't: identify real desert Maricopa County ZIPs and update demo scenario
  - **Carried to Day 2** — see crosswalk audit below. Not completed Day 1; tracked as DECISIONS.md O4.
- [x] Static data path working: CSV parsing loads into `CountyFeature[]` without errors
- [x] First county render: map displays with neutral fills (no panel logic yet)

**Day 1 verify (Lee):** `apps/compass` loads, map renders US counties in neutral fill, CSV data loads without error in console. ✅ Verified.

### Jillian — Door 2
- [x] Supabase project created, connection string in `apps/console/.env.local`
- [x] Schema live — all four core tables created and confirmed:
  - `public.coordinator_profiles`
  - `public.client_profiles` (includes `county_fips`, `pronouns`, `assigned_caregiver_id`)
  - `public.caregiver_profiles` (includes `county_fips`)
  - `public.assignments_log` (coordinator_id, client_id, caregiver_id, timestamp, match_score, note)
- [x] Magic link auth working — coordinator can receive link and log in
- [x] Clients List rendering — empty state visible with "Add New Client" CTA
- [x] No fifth table created

**Day 1 verify (Jillian):** `apps/console` loads, magic link email received and works, Clients List renders empty state. ✅ Verified.

### Daily checkpoint
- [x] Both builders merge feature branches to `main`
- [x] MapEngine interface confirmed locked — no solo changes from this point
- [ ] DECISIONS.md O1 and O4 updated with resolution
  - O1 (crosswalk edge case behavior) and O4 (demo ZIP confirmation) remain open — rolled into Day 2 crosswalk audit below.

---

## Day 2 — Panels, Profiles & Logic
**Goal:** Both doors have functional core flows. Dignity Profile completable. Family panel rendering real data.

### Both — before splitting (new, added after Day 1 carryover)
- [ ] Resolve react-leaflet / React 19 peer dependency conflict — blocks MapEngine rendering for both doors. Confirm react-leaflet's supported React version range; likely fix is pinning `react@18` repo-wide or adding an `overrides`/`resolutions` entry. Tracked as DECISIONS.md O6.
- [ ] Confirm both apps still build after the fix before continuing MapEngine-adjacent work
- [ ] Add DECISIONS.md A03 documenting the fix once resolved; close O6 referencing A03

### Lee — Door 1

**Crosswalk audit (do first — pure verification, unblocks the demo ZIP question and O1/O4):**
- [ ] Group `zip-county-crosswalk.csv` by ZIP; confirm any duplicate-ZIP rows have an `is_primary` flag or defined ordering
- [ ] Pull rows for 85145, 85139, 85128 specifically; confirm resolved county matches Maricopa demo expectations
- [ ] Check for orphan ZIPs — ZIP maps to a county FIPS not present in `home_care_by_county.csv`
- [ ] Check for orphan FIPS — county FIPS in `home_care_by_county.csv` or `us-counties-20m.geojson` never hit by any ZIP (lower urgency, sanity pass before demo)
- [ ] **If 85145/85139/85128 don't resolve to desert counties:** identify real desert Maricopa County ZIPs from the dataset and flag to Jillian before continuing — demo script ZIPs are a joint decision, not a solo swap
- [ ] Update DECISIONS.md O1 and O4 with resolution once audit is complete

**Utils (in dependency order):**
- [ ] `computeFillValues.ts` — normalize agency counts to 0.0–1.0 fill scale
- [ ] `zipToCountyFips.ts` — ZIP string → county FIPS via crosswalk, returns `null` if not found
- [ ] `getNearestCountiesWithAgencies.ts` — adjacency lookup for zero-agency counties (depends on `computeFillValues` output)

**ZIP lookup flow & ResourcePanel:**
- [ ] ZIP lookup flow: entry → `zipToCountyFips()` → county highlight → panel populate
- [ ] `ResourcePanel` live:
  - Desert status label
  - Agency count stat
  - Agencies per 1,000 seniors
  - Eldercare Locator link (always shown, "Start here" tag)
  - PACE finder link
  - State Medicaid link (routes to state-specific page using `state` code)
  - Medicare Advantage plan finder link
- [ ] Adjacency logic: `getNearestCountiesWithAgencies()` wired — nearest non-desert county surfaces when family county is desert
- [ ] "I need care here" stub: button present, ZIP flag recorded, confirmation text shown
  - This should resolve DECISIONS.md O5 (Flag CTA confirmation state) — confirm and close once shown
- [ ] Error state: bad/unrecognized ZIP → inline error + direct Eldercare Locator link (no dead end)

**Day 2 verify (Lee):** Enter ZIP 85145 (or confirmed substitute) → county highlights → panel shows desert status → resource links visible → "I need care here" shows confirmation.

### Jillian — Door 2

**Decide first (unblocks everything else tonight):**
- [ ] ClientsListPage "Add new client" CTA — route vs. modal
- [ ] Typography sizing — short conversation with Lee; lock a type scale so new components stop picking literal px values
- [ ] Icon system — decide before Dignity Profile and Assignment Panel both start picking icons independently; check any icon color logic against DECISIONS.md D02
- [ ] Draft DECISIONS.md D11 (typography) and D12 (icon system) once decided

**Dignity Profile:**
- [ ] Dignity Profile form complete:
  - Client name (required)
  - Nickname, preferred language, gender preference for aide, one comfort, one key thing to avoid (all optional)
  - Emergency contacts NOT present
- [ ] Profile save, edit, view, and print working
- [ ] Success and error banners on save/edit

**Seed data & assignment panel:**
- [ ] Seed data script running:
  - 10–12 clients across 3–4 Maricopa County ZIPs, `county_fips` populated
  - 8–10 caregivers, same county spread
  - At least 1 Spanish-speaking caregiver
  - Most clients unassigned; 2–3 assigned (both states visible)
  - At least 1 county with 3+ unassigned clients
  - **Note:** seed data ZIPs should match whatever Lee's crosswalk audit confirms for 85145/85139/85128 or their substitutes — confirm before running seed script
- [ ] Assignment advisory panel scaffolded: unassigned clients visible, match scores displaying

**Day 2 verify (Jillian):** Create a new Dignity Profile for a client → save → view → print. Seed data visible in Clients List.

### Daily checkpoint
- [ ] Both builders merge to `main`
- [ ] Full demo scenario walkable in rough form end-to-end (ZIP entry through family panel; coordinator profile create through assignment panel)
- [ ] Confirm MapEngine renders for both doors post-merge (post react-leaflet fix)
- [ ] DECISIONS.md open items table updated: close O1, O2 (already resolved, see D08), O4, O5, O6 as applicable; leave O3 (Day 3) open

---

## Day 3 — Integration, Loop & Polish
**Goal:** Both doors connected through shared MapEngine. Demand loop demonstrable. Demo scenario runs clean.

### Lee — Door 1
- [ ] `MapEngine` fully wired in `apps/compass` — county fills driven by `computeFillValues()` output
- [ ] Choropleth fill colors match design tokens (desert = `--red-critical`, gap = `--orange-gap`, served = `--green-served`)
- [ ] Color legend always visible, includes text labels alongside swatches (WCAG 1.4.1)
- [ ] County hover tooltip working (Leaflet tooltip, not SVG text)
- [ ] Door 1 WCAG audit run against Figma Make output — any required corrections applied to `theme.css`
- [ ] DECISIONS.md O3 updated with audit result

**Day 3 verify (Lee):** Enter ZIP 85145 (or confirmed substitute) → desert county fills dark red → panel shows 0 agencies → legend visible → nearest county shows. Full visual matches Figma.

### Jillian — Door 2
- [ ] Real-time Supabase map live — county fills reflect unassigned client density from seed data
- [ ] Assignment flow complete:
  - Click county → assignment panel surfaces unassigned clients + caregiver matches
  - Each match shows score + why-line (interpretive, not tag restatement)
  - Filter chips working (language, distance, skill)
  - Assign button → confirmation modal with optional note field
  - Confirm → assignment logged to `assignments_log`
  - Map county fill updates to reflect assignment
  - Banner confirms successful assignment after modal closes
- [ ] Demand signal overlay live — Door 1 ZIP flags appear as county-level overlay on Door 2 map
- [ ] Door 2 WCAG check: legend always visible, `--text-on-surface-warm` used on `--surface-secondary`

**Day 3 verify (Jillian):** Full demo scenario end-to-end without intervention. Assignment logged to audit trail. Map updates after assignment.

### Integration (both)
- [ ] Full demo scenario walkthrough — family ZIP → desert → flag → coordinator map → assign → update
- [ ] QA pass: empty states, error states, edge cases, WCAG legend visibility on both doors
- [ ] Known-gap doc — anything not completed documented with status and demo workaround
- [ ] Known-gap doc committed to repo

### Daily checkpoint
- [ ] Demo scenario runs end-to-end without intervention
- [ ] Both doors pass WCAG 2.1 AA check
- [ ] Known-gap doc committed

---

## Day 4 — Final Polish & Demo Prep
**Goal:** Demo runs clean twice in a row. Both builders know their lines.

- [ ] Demo scenario rehearsed end-to-end — both builders
- [ ] Seed data reset script tested — can reset Supabase data to clean state before presentation
- [ ] Both apps confirmed running on presentation machine
- [ ] Browser windows arranged: Door 1 (port 5173) and Door 2 (port 5174) ready
- [ ] Known-gap doc reviewed — workarounds practiced for any incomplete items
- [ ] Final commit pushed to `main`

---

## Resource Links (verified)

| Resource | URL |
|---|---|
| Eldercare Locator | https://eldercare.acl.gov |
| PACE finder | https://www.medicare.gov/health-drug-plans/health-plans/your-coverage-options/other-medicare-health-plans/PACE |
| Medicare Advantage plan finder | https://www.medicare.gov/plan-compare |
| Medicaid/HCBS | https://www.medicaid.gov |
| CMS Provider Data Catalog | https://data.cms.gov/provider-data/dataset/6jpm-sxkc |
| Census ACS Table S0101 | https://data.census.gov |
| Census TIGER/Line GeoJSON | https://www2.census.gov/geo/tiger/GENZ2023/shp/ |
| scpike/uszips crosswalk | https://github.com/scpike/uszips |
| Census county adjacency | https://www.census.gov/geographies/reference-files/2010/geo/county-adjacency.html |
