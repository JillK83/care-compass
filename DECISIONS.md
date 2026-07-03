# DECISIONS.md — Care Compass Platform

Non-obvious design and build decisions with rationale and rejected alternatives. Add an entry any time you make a call that would need explaining in a code review. Don't delete resolved items — mark them resolved with a date so the history is preserved.

## How to add an entry

Copy this template and append it to the relevant section (Design, Architecture, or a new section if needed):

```
### D## — Short decision title

**Decision:** What was chosen, in one sentence.

**Rationale:** Why. Reference a Laws of UX principle, a technical constraint, or a product requirement by name if applicable.

**Rejected:** What else was considered and why it was ruled out.
```

**Numbering:** Design decisions are D-series (D01, D02...). Architecture decisions are A-series (A01, A02...). Pick the next available number in sequence — don't reuse numbers even if an entry is resolved.

**Ownership:** Either builder can add entries. Door 1 decisions (Lee) and Door 2 decisions (Jillian) can go on your respective feature branches and merge at the daily checkpoint. Shared/architecture decisions go on whichever branch touches them first — flag in the PR so the other builder sees it.

**Open items:** Add new open items to the table at the bottom with your name and target day. Update status inline when resolved — don't delete the row.

---

---

## Design Decisions

### D01 — Sidebar-only navigation on Care Console

**Decision:** Care Console uses sidebar-only navigation. No top nav bar.

**Rationale:** Hick's Law — dual navigation (sidebar + top bar) doubled the decision points for coordinators who are already managing a cognitively dense assignment workflow. The sidebar gives full access to Clients and the Care Desert Map from a single persistent location. Removing the top bar also recovers vertical space for the map canvas, which is the primary work surface.

**Rejected:** Top bar + sidebar combination. Rejected because it created redundant navigation paths that pulled attention away from the map and introduced a Von Restorff conflict — two navigation systems competing for the same visual weight.

---

### D02 — `--orange-alert` reserved for urgency badges only; action buttons use `--teal-action`

**Decision:** `--orange-alert` (`#B5490A`) is restricted to the care desert badge and urgency indicators. All action buttons (Assign, Flag CTA) use `--teal-action` (`#17383F`).

**Rationale:** Von Restorff Effect — when the urgency badge and the Assign button shared the same orange color (`#D85A30`), neither stood out. The badge lost its signal value; the button looked like a warning. Separating them by function restores the badge's semantic meaning and gives the action button a neutral, authoritative color that doesn't compete.

**Additional fix:** `#D85A30` also failed WCAG AA on white (3.87:1). `#B5490A` passes at 5.32:1.

**Rejected:** Shared orange for badge and button. Rejected — color collision between urgency signal and primary action is a WCAG failure and a Von Restorff violation simultaneously.

---

### D03 — Caregiver match cards use three explicit visual zones

**Decision:** Caregiver cards are structured into three zones — A: identity + match score / B: tags (language, skills) / C: why-line + Assign action — with `--space-zone-gap` (12px) separating each zone.

**Rationale:** Gestalt / Proximity — coordinators scan cards under time pressure. Without explicit zones, identity, tags, and action collapsed into a single undifferentiated block that required full reading to parse. Three zones create a scannable hierarchy: who → what they bring → why and what to do.

**Rejected:** Single-block card layout. Rejected — required reading every card fully before acting, violating the goal of sub-5-minute assignment flow.

---

### D04 — Why-line copy provides interpretive rationale, not tag restatement

**Decision:** The why-line in Zone C of caregiver cards explains *why* a match is good, not what the tags already show.

**Example of rejected copy:** "Spanish-speaking, available in Maricopa County" — restates Zone B tags.
**Example of accepted copy:** "Closest available Spanish-speaking aide to this client's county, no current assignments" — adds information the tags don't carry.

**Rationale:** Miller's Law / cognitive load — restating visible tag information in prose forces the coordinator to process the same information twice without gaining anything. The why-line earns its space only if it adds interpretive value.

**Rejected:** Auto-generated why-lines that concatenate tag values. Rejected — produced copy indistinguishable from the tags themselves.

---

### D05 — Flag CTA placed immediately after result card, above the map

**Decision:** On Care Compass, the "I need care here" button appears immediately after the result card — before the nearest counties section, the resource links, and the map.

**Rationale:** Goal-Gradient Effect + Peak-End Rule — families who see a desert result are at peak emotional activation. The demand signal action should be available at that moment, not after scrolling past resource links and a map. Placing it after the map buried the most emotionally resonant action at the end of a long scroll.

**Fixed page section order:** Hero → Result card → Flag CTA → Nearest counties → What to do next → Map → Footer.

**Rejected:** Flag CTA after the map. Rejected — families most likely to flag need were least likely to scroll that far, meaning the demand signal would be systematically undercaptured from the highest-need users.

---

### D06 — Map positioned at bottom of Care Compass page as optional context

**Decision:** The choropleth map on Care Compass is the last content section before the footer — below resource links and the Flag CTA.

**Rationale:** Jakob's Law / information hierarchy — families come to Compass for an answer ("is there care near my parent?"), not to explore a map. The result card gives the answer in text within seconds. The map is geographic confirmation for users who want it, not the primary answer surface. Placing it at the bottom ensures the answer is never blocked by map load time.

**Rejected:** Map as hero / above the fold. Rejected — map load time would delay the primary answer, and most family users don't need a geographic view to act on the result.

---

### D07 — County as geographic unit; ZIP is input only

**Decision:** All rendering, data storage, and logic operates at county level. ZIP is user-facing input only — the crosswalk resolves silently to county FIPS before any processing.

**Rationale:** Home care agency coverage areas are defined at county level by Medicaid/Medicare licensing. ZIP codes are postal artifacts that don't map cleanly to care availability. Using ZIP as the data unit would require agency data at ZIP granularity that doesn't exist in public datasets.

**Rejected:** ZIP-level rendering. Rejected — no reliable public dataset exists at ZIP granularity for agency coverage; ZIP polygons also cross county lines in ways that would produce misleading desert status results.

---

### D08 — Leaflet + free GeoJSON; no external map API key

**Decision:** Both doors use Leaflet with Census TIGER/Line GeoJSON for county boundary rendering. No Mapbox, Google Maps, or paid tile service.

**Rationale:** Demo build constraint — no API key dependency means the demo runs anywhere without environment configuration. Census TIGER/Line 1:20m simplified GeoJSON is accurate enough for county-level choropleth at national zoom and is free to use without attribution restrictions.

**Rejected:** Mapbox GL JS. Rejected — requires API key, adds billing risk for a demo, and is overbuilt for county-level choropleth without custom styling needs.

---

### D09 — County labels via Leaflet hover tooltip only; no SVG text on fills

**Decision:** County names are never rendered as SVG text elements on map fills. Labels appear in two places only: Leaflet hover tooltip (HTML div, fires on mouseover) and the panel/result card header (fires on click).

**Rationale:** For a demo scoped to a handful of Arizona counties, permanent SVG text labels on fills add visual noise and create unsolvable contrast failures on colored fills (green-served and red-critical fills both fail AA against dark text at practical font sizes). Leaflet tooltips are HTML, use CSS custom properties cleanly, and only show the label when the user needs it.

**Rejected:** SVG `<text>` with white `paint-order` halo stroke. Rejected — halo technique is fragile at small sizes, doesn't scale cleanly across all four fill colors, and was spec'd before the Leaflet-only constraint was confirmed. Removing SVG text also eliminates the contrast problem entirely.

---

### D10 — Demand signal is anonymous ZIP flag only; no family PII captured

**Decision:** The "I need care here" button on Care Compass captures the ZIP code only. No email, name, phone, or any family identity is collected at any point in the demand signal path. The ZIP is crosswalked to county FIPS before storage.

**Rationale:** Tesler's Law / privacy — asking families for contact information at the moment they discover a care desert adds friction at exactly the wrong time and creates a PII liability that is out of scope for a demo. The signal value (which counties have unmet demand) is fully captured at county level without any identity.

**Rejected:** Email capture for follow-up. Rejected — introduces GDPR/CCPA scope, creates a data retention obligation, and would depress signal capture by filtering out families unwilling to share contact information.

---

### D13 — "Add new client" uses a route, not a modal

**Decision:** Clicking "Add new client" on the Clients List navigates to /clients/new, a full route, rather than opening a modal over the list.

**Rationale:** Consistent with D01's sidebar-only navigation logic — Console favors single, unambiguous focus over layered UI patterns. Avoids modal accessibility overhead (focus trap, escape-key handling, scroll lock) for a six-field form that warrants full screen space. Matches A03's precedent of not building infrastructure ahead of need.

**Rejected:** Modal over the Clients List. Rejected — adds interaction pattern complexity for a single entry point with no requirement to preserve list context.

---

### D11 — Typography scale locked to six-token system

**Decision:** All font sizes across both doors use the following named tokens, replacing the prior Display/Hero, Section heading, Body, Emphasis, Label/Tag, Caption role-based scale from design_system.md:

--text-xs:   0.75rem   (12px) — captions, caveats, disclaimer footer
--text-sm:   0.875rem  (14px) — secondary labels, tags, stat values
--text-base: 1rem      (16px) — body, form fields, panel content
--text-lg:   1.125rem  (18px) — card headers, panel titles
--text-xl:   1.25rem   (20px) — page section headers
--text-2xl:  1.5rem    (24px) — primary page title, wordmark

No component may use a literal px or rem value for font-size — tokens only.

**Rationale:** The original role-based scale (Display/Hero 24-32px, Section heading 16px, Body 14px, Label/Tag 11-12px) produced inconsistent literal values in practice — ClientsListPage independently chose 20px for a heading against a locked 16px value, and the Figma Make mock for Door 1 showed the "0 agencies" stat headline oversized and the wordmark undersized against any of the original role definitions. A named token scale with an enforced no-literal-values rule closes that drift path going forward.

**Rejected:** Keeping the role-based table as-is and fixing individual literal-value bugs as they appear. Rejected — this is the second drift incident (ClientsListPage heading, now the Door 1 mock) and a token system prevents the class of bug rather than patching instances of it.

---

### D12 — Lucide React for icon system; currentColor inheritance only

**Decision:** Lucide React is the icon library for both doors. Icons inherit `currentColor` by default and may not introduce their own color values. If an icon needs color emphasis, it uses an existing token only — `--orange-alert` for urgency, `--teal-action` for interactive icons — never a new value.

**Rationale:** Lucide is tree-shakeable, has zero-config React/Vite integration, and its stroke-based style matches the calm, non-decorative tone established in D09 (no SVG text labels) and D02 (strict color-function separation). The currentColor/no-new-tokens rule prevents icon color from reopening the Von Restorff conflict D02 already resolved between urgency badges and action buttons.

**Rejected:** Heroicons. Comparable quality, no decisive advantage over Lucide for this scope — decision made on team preference, not a technical differentiator. Also rejected: allowing icons their own color tokens. Rejected — would let icon color drift into urgency/action territory the same way D02 already had to correct for badges and buttons.

---

### D14 — Wayfinding link replaces shared Back/Cancel button on Dignity Profile

**Decision:** View mode shows a "← Back to clients" text link above the profile card, navigating explicitly to /clients. Edit/create mode keeps "Cancel" in its existing bottom-right position next to "Save profile", also navigating to /clients instead of browser history.

**Rationale:** The original shared button used navigate(-1) for both "Back" (view) and "Cancel" (edit) — but these are different actions. Cancel is a form action (abandon changes, stay in flow); Back is wayfinding (orient and leave). Bottom-of-card placement for Back meant a coordinator had to scroll past the entire profile to find an exit. navigate(-1) also made the destination unpredictable after a save used replace: true. Aligns with D01's sidebar-only navigation principle — this link reinforces the sidebar's existing Clients entry rather than introducing a second navigation source.

**Rejected:** Keeping one shared button for both modes. Rejected because it conflated two different action types under one label and position, and relying on navigate(-1) made "Back" mean different things depending on navigation history.

---

### D15 — Door 2 map redesigned as neutral boundaries + pin-based visualization

**Decision:** Door 2's map renders all counties with uniform noData (gray) fill — no demand-driven or metric-based choropleth coloring. Information is carried by three overlay pin types instead: client (assigned/unassigned status), caregiver (availability), and signal (aggregate demand count per county).

**Rationale:** A demand-driven fill would require inventing a metric semantics distinct from Door 1's desert/served scale (which measures care access, not coordinator workload) without a clear product need. Pin-based visualization directly serves the Assignment Panel workflow — showing supply and demand as discrete, clickable entities — rather than an aggregate color that doesn't answer "who specifically needs an aide."

**Rejected:** Fill-by-unassigned-client-ratio (red = high need). Rejected — conflates Door 2's "unmet demand" question with Door 1's visually identical but semantically different "care desert" scale, risking confusion since both doors share the same MapEngine color tokens.

---

### D16 — Signal pin count rendered via label field reuse

**Decision:** The demand-signal count badge (e.g. "3") is rendered using OverlayPin.label, which is documented in the interface contract for person-initials only ("omit entirely for signal pins").

**Rationale:** Adding a proper count field to OverlayPin requires a MapEngine interface change and joint sign-off with Lee — out of scope for tonight's timeline. label is a valid string type regardless of content, so this is a non-breaking, temporary reuse rather than a contract violation.

**Rejected:** Stopping to request the interface change before shipping any signal pin visualization. Rejected — would block demo-critical map work on a sign-off cycle; the deviation is small, documented, and easily reverted once count is added properly.

---

### D17 — Adjacent-county match tier added to caregiver scoring

**Decision:** scoreCaregiverMatch now includes a matchedAdjacentCounty check (+0.75 score, "Nearby county — caregiver may be able to travel" why-line), inserted between same-county and language-match in the priority chain. Reuses isAdjacentCounty, a new export on the existing getNearestCountiesWithAgencies.ts module built for Door 1's care-desert fallback logic.

**Rationale:** The original scoring function (language/availability/county) had no way to reflect that a nearby but non-same-county caregiver might still be a reasonable match, undercutting the PRD's stated "region" filter requirement (Journey 3, P0). Reusing the existing adjacency utility avoids inventing distance logic without lat/long data, consistent with D07's county-as-unit approach.

**Rejected:** Real geographic distance (lat/long-based). Rejected — no coordinate data exists in the ZIP crosswalk, and county-level adjacency already answers the practical "can this caregiver reasonably travel here" question without new data infrastructure.

**Note:** To make this demonstrable, two caregivers (James Whitfield, Marcus Boone) and one client (the profile with a previously null ZIP) were reassigned in Supabase to Maricopa County (04013) via direct SQL — not through a seed script, so this change does not appear in git history. See O18 below.

---

### D18 — MapEngine minZoom hardcoded to prevent over-zoom-out

**Decision:** MapEngine's Leaflet init sets `minZoom: 4`, matching the default initial zoom level, so the map cannot be zoomed out past the national view on either door.

**Rationale:** Without a floor, Leaflet allows zooming out indefinitely, producing a near-empty view with Alaska/Hawaii isolated in gray space and no useful geographic context. Hardcoded as an internal default rather than a prop since neither door has a use case for a different zoom floor; this avoids an unnecessary MapEngine.types.ts change and the associated sign-off cycle. Lee confirmed agreement on the fix (2026-07-03).

**Rejected:** Exposing minZoom as a new MapEngineProps field. Rejected — no current or anticipated need for door-specific zoom floors makes this premature interface surface, consistent with A06's "extract only when a second consumer needs it" principle.

---

### D19 — Non-continental territories filtered from Door 2 map at the page level

**Decision:** apps/console/src/pages/MapPage.tsx filters geoJson.features to exclude Alaska, Hawaii, Puerto Rico, Guam, US Virgin Islands, American Samoa, and Northern Mariana Islands (by STATE FIPS) before the data is passed to MapEngine via setGeojsonData, and before countyFeatures is built from the same object.

**Rationale:** The default map view rendered non-continental territories in mostly-empty space at low zoom, adding visual noise with no demo value — current seed data and demo scenario are Arizona-only. Filtering at the page level (not inside MapEngine) keeps this a per-door data-shaping concern rather than a shared-component change — no MapEngine.types.ts edit, no sign-off cycle required, since each door already owns and filters its own geojsonData before handing it to MapEngine as a prop.

**Rejected:** Filtering inside MapEngine.tsx via maxBounds. Rejected — would constrain shared map interaction/panning behavior for both doors based on a Door-2-specific demo scope decision, and would require a MapEngine.types.ts-adjacent change. Also rejected: a shared filter utility in packages/utils — unnecessary given only one door currently needs this, and packages/utils changes require the same joint sign-off as MapEngine itself per the interface contract.

**Note:** apps/compass (Door 1) has not received the equivalent filter as of this entry — flagged to Lee separately, not yet applied to his data path.

---

### D20 — ZIP-to-pin position uses deterministic jitter from county centroid

**Decision:** OverlayPin lat/lng positions for client, caregiver, and signal pins are computed as a county centroid plus a deterministic offset derived from a hash of the ZIP string (see ZIP_OFFSETS / zipHash / getZipPosition in MapPage.tsx), not real ZIP-level coordinates.

**Rationale:** No ZIP-level coordinate data exists in the current crosswalk or seed data — only ZIP-to-county-FIPS mappings. Deterministic jitter gives visually distinct, stable pin positions per ZIP within a county for demo purposes without fabricating false geographic precision. Determinism (same ZIP always produces the same offset) ensures the map doesn't jitter between renders or sessions.

**Rejected:** Real ZIP centroid geocoding. Rejected — no free/public dataset was sourced for this at ZIP granularity within the project timeline, and county-level precision is sufficient for the demo's purposes (consistent with D07's county-as-unit approach).

---

### D21 — Map disclaimer restructured to normal document flow below the map

**Decision:** MapEngine's disclaimer footer is now rendered as a block-level element below the map canvas (inside a new .map-engine-outer flex-column wrapper), rather than absolutely positioned as an overlay on top of the pannable map.

**Rationale:** As an absolute overlay, the disclaimer could be visually obscured by or collide with overlay pins and the legend at certain pan/zoom positions on Door 2 — an always-visible disclaimer that can be covered by other content doesn't meet the intent of "always shown." Moving it outside the map's pannable viewport entirely removes the possibility of collision rather than managing z-index around it.

**Rejected:** Increasing z-index to force the disclaimer above all map content. Rejected — doesn't solve the inverse case (pins rendering behind an opaque disclaimer, becoming invisible instead of colliding), and treats a structural layering problem as a stacking-order problem.

---

### D22 — Map tooltip content simplified: caveat line removed, empty stats suppressed

**Decision:** County hover tooltips no longer render the italic caveat line ("Counts reflect agency billing location..."). Additionally, the stats line (and its leading line break) only renders when county.tooltip.stats is non-empty.

**Rationale:** The caveat text duplicated the always-visible footer disclaimer (per D09/WCAG requirement that the disclaimer is always shown) — repeating it in every tooltip added length without adding information, the same logic D04 already applied to why-line copy. Separately, Door 2's counties always pass an empty stats array (per D15, no metric shown), which left a visible blank line where the stats would have rendered.

**Rejected:** Keeping the caveat in tooltips for standalone context. Rejected — the footer disclaimer already satisfies the "always visible" requirement without needing repetition per-hover.

---

### D23 — Demand signal pin rendered as a distinct icon, not a label-based count badge

**Decision:** Signal-type pins render as an inline SVG Radio icon (colored via var(--orange-alert)) regardless of whether OverlayPin.label is present, instead of falling into the same 32px labeled-circle style used for caregiver/client initials. The count carried in label is still surfaced via the existing hover tooltip binding.

**Rationale:** D16 documented reusing label to carry the demand count as a temporary, non-breaking deviation. In practice this made signal pins render in a style built for person-initials, at a size/contrast that was illegible for a numeric badge. Branching on pin.type === 'signal' instead of presence/absence of label gives signal pins their own visual treatment without any OverlayPin/MapEngineProps change — count is preserved via tooltip rather than removed.

**Rejected:** Adding a proper OverlayPin.count field. Rejected for now — same reasoning as D16, still avoids the MapEngine.types.ts sign-off cycle for what remains a demo-scope visual fix; count-via-tooltip achieves the same information access.

---

### D24 — Console map shows only unassigned clients

**Decision:** apps/console/src/pages/MapPage.tsx filters client_profiles to is_assigned = false before building client pins. Assigned clients no longer appear on the map at all. The legend gained a third row ("Unassigned client") to match.

**Rationale:** D15 established that pin-based visualization exists to answer "who here needs an aide" — an assigned client has already exited that state. Showing assigned and unassigned clients identically (same color/size, distinguishable only by a subtle border) worked against the map's own purpose by adding visual noise to the exact view meant to surface unmet need.

**Rejected:** Keeping both on the map with a bolder unassigned-only border. Rejected — even a bold border still requires the coordinator to actively parse each pin rather than seeing unmet need at a glance, which is the whole point of D15's pin-based approach in the first place.

---

## Architecture Decisions

### A01 — Two-door architecture; one monorepo

**Decision:** Care Compass Family (Door 1, `/compass`) and Care Console (Door 2, `/map`) are two separate React apps in a single Turborepo monorepo with shared packages (`packages/ui`, `packages/utils`).

**Rationale:** Shared MapEngine component and geo utilities need a single source of truth. Separate apps enforce the data path separation (static CSV vs. Supabase) at the routing level — no accidental Supabase import on the public surface.

**Rejected:** Single app with conditional rendering by auth state. Rejected — mixing public and coordinator data paths in one app bundle creates too much risk of PII exposure through error states or misconfigured guards.

---

### A02 — Magic link auth; no password on Door 2

**Decision:** Care Console uses Supabase magic link authentication. No password field.

**Rationale:** Coordinator demo users shouldn't need to manage a password for a 3-day demo build. Magic link is frictionless for the demo scenario and is Supabase's recommended auth pattern for low-volume internal tools.

**Rejected:** Password auth. Rejected — adds password reset flow, storage, and hashing complexity for a demo that doesn't need it.

### A03 — react-leaflet peer dependency override for React 19

**Decision:** Root `package.json` uses npm `overrides` to allow `react-leaflet@4.2.1` to run under React 19: `{ "overrides": { "react-leaflet": { "react": "^19.0.0" } } }`.

**Rationale:** `react-leaflet@4.2.1` declares `"react": "^18.0.0"` as a peer dependency but is functionally compatible with React 19. The monorepo is locked to React 19.2.7 across both apps. Downgrading to React 18 would have required cascading changes across both `apps/compass` and `apps/console`. The override costs nothing at runtime — it only suppresses the false peer dep error at install time.

**Rejected:** Pinning the monorepo to React 18. Rejected — both apps are already on React 19.2.7 and Jillian's Supabase auth work was built against React 19. Downgrading created more churn than the fix warranted.

---

### A06 — Direct inline Supabase calls; no custom hook layer (yet)

**Decision:** Components fetch Supabase data directly inline (`useEffect` + `supabase.from(...)`), with local `useState` for data/loading/error. No `useClients()`-style custom hook or service/helper layer exists yet.

**Rationale:** This is a 3-day MVP with one current data-fetching consumer (`ClientsListPage`). Designing a shared hook today means guessing at requirements for the Day 3 realtime map work (`useEffect` fetch-once vs. Supabase realtime subscription are different shapes) before that work has started. Extracting a hook once a second component needs the same data is lower-risk than designing one upfront from a single call site.

**Rejected:** Custom hook per resource (`useClients()`, `useCaregivers()`) built now. Rejected — premature abstraction for a single call site; risks designing the wrong shape before the realtime map requirements (Day 3) are concrete.

**Revisit when:** A second component needs `client_profiles` data (e.g. Assignment Advisory Panel), or when Day 3 realtime map work begins — at that point, decide whether to extract `useClients()` and whether realtime needs a separate hook (`useClientsRealtime()`) rather than overloading one hook with both fetch-once and subscription behavior.

---

### A04 — Upgrade react-leaflet to 5.0.0 to resolve React 19 peer dependency conflict

**Decision:** Upgraded react-leaflet to 5.0.0 across all four workspaces. All four workspaces build clean post-upgrade.

**Rationale:** react-leaflet 4.x declared peer dependencies on React 17 and 18 only. With the project running React 19, pnpm reported an unresolvable peer conflict that blocked clean installs and caused MapEngine rendering to fail in both doors. react-leaflet 5.0.0 drops the React version pin and declares React 18+ (including 19) as a valid peer, resolving the conflict without any changes to calling code.

**Rejected:** Downgrading to React 18 — rejected because React 19 is the project standard and would require auditing all React 19-specific API usage. Using `--legacy-peer-deps` or pnpm overrides — rejected because it papers over the conflict without resolving it; CI and fresh installs would still warn or fail. Patching react-leaflet 4.x `peerDependencies` manually — rejected because it creates a fork maintenance burden and doesn't receive upstream fixes.

---

### A05 — geojsonData passed as prop to MapEngine; not fetched internally

**Decision:** County boundary GeoJSON (us-counties-20m.geojson) is fetched by the parent page and passed into MapEngine via an optional `geojsonData?: GeoJSON.FeatureCollection` prop. MapEngine does not fetch the file itself.

**Rationale:** Consistent with MapEngine's existing contract — Section 3 explicitly lists "Data fetching" as not MapEngine's responsibility. Passing GeoJSON as a prop keeps MapEngine stateless with respect to asset loading, allows each door to control its own fetch lifecycle, and means Door 2 can pass the same boundary file from a different asset path if needed without touching shared component code.

**Rejected:** Fetching us-counties-20m.geojson inside MapEngine on mount. Rejected — would couple a shared component to a specific asset path, violate the contract's data-fetching boundary, and make it impossible for Door 2 to control when boundaries load relative to its Supabase data.

**Note:** @types/geojson added explicitly to packages/ui/package.json devDependencies in the same commit — previously only present transitively via @types/leaflet.

---

### A07 — demand_signals Supabase table for Door 1 → Door 2 demand loop

**Decision:** demand_signals is a Supabase table that enables anonymous demand signal writes from Door 1 and coordinator reads from Door 2. Schema: id (uuid, pk), zip (text, not null), county_fips (text, not null), created_at (timestamptz). RLS: INSERT open to anon (unauthenticated Door 1 users); SELECT restricted to authenticated (Door 2 coordinators). No UPDATE/DELETE policies — flags are write-once.

**Rationale:** Closes O5. The demand signal path (D10) is anonymous and ZIP-only — the schema enforces this at the column level (no identity fields) and RLS enforces it at the access level (no read-back to Door 1). Keeping signals in Supabase makes the Door 2 overlay query a simple authenticated SELECT with no additional infra.

**Rejected:** Storing demand signals outside Supabase. Rejected — Supabase is already the Door 2 data store; a second storage target for a simple INSERT adds infra complexity without benefit for a demo build.

---

### A08 — Dropped `aide_gender_pref`; activated `pronouns` for client-facing use

**Decision:** Removed the unused `aide_gender_pref` column from `client_profiles`. Wired the existing but previously unused `pronouns` column into the Dignity Profile form and Clients List. `gender_preference` remains the sole field for "gender preference of aide" (PRD-spec'd); `pronouns` is a distinct, separate field for how the aide should refer to the client.

**Rationale:** Discovered via direct Supabase query that the schema had two dead/duplicate gender-related columns (`aide_gender_pref`, `pronouns`) alongside the one actually in use (`gender_preference`). Root cause: `aide_gender_pref` and `pronouns` were added outside version control (no migration file, no git history) and never wired to any component. On inspection, `pronouns` serves a real, distinct need — the PRD's aide-gender-preference field doesn't cover cases where a client's name doesn't make pronouns clear to an aide meeting them for the first time. Kept it and gave it a real purpose instead of dropping it.

**Rejected:** Dropping `pronouns` as dead weight along with `aide_gender_pref`. Rejected because it maps to a genuine person-centered-care need distinct from aide gender preference — closing this now was faster than re-adding a column later once the gap surfaced during the demo.

---

## Open Items

Move to resolved once addressed in build. Do not delete — add resolution date and note.

| # | Item | Screen | Status |
|---|---|---|---|
| O1 | Verify ZIP-to-county crosswalk behavior for ZIPs spanning multiple county lines | Both | Resolved 2026-06-30 — simplemaps crosswalk uses primary county per ZIP; ZIP+4 handled by slice(0,5) in zipToCountyFips.ts |
| O2 | Lock choropleth map library dependency before scaffolding MapEngine component API | Both | Resolved — 2026-06-30, see D08. Library choice (Leaflet + free GeoJSON) was locked in D08; only the react-leaflet/React 19 version conflict remained open, tracked separately as O6. |
| O3 | Run Door 1 WCAG audit against Figma Make output before committing Door 1 CSS | Compass | Open — Lee, Day 3 |
| O4 | Confirm demo ZIP codes (85145, 85139, 85128) against Lee's dataset | Both | Resolved 2026-06-30 — all three ZIPs map to 04021 (Pinal County, AZ), confirmed is_desert=True in home_care_by_county.csv |
| O5 | Demand signal backend wiring — Supabase insert from Door 1 'I need care here' button | Compass | Resolved (Lee, Day 3) — Created apps/compass/src/lib/supabase.ts matching console's createClient pattern. ResourcePanel.tsx's 'I need care here' button now performs an async insert into demand_signals (zip, county_fips) via Supabase — replaces prior local-only stub. UI shows 'Sending…' in flight, inline error on failure, confirmation on success. apps/compass/.env.local created with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY only — no service role key, confirmed by Jillian. Demand signals now flow to Console map overlay. |
| O6 | react-leaflet / React 19 peer dependency conflict — blocks MapEngine rendering for both doors | Both | Resolved — 2026-06-30, see A04. Upgraded react-leaflet to 5.0.0; all four workspaces build clean. |
| O7 | Add gender_preference field to Dignity Profile form | Console | Resolved — 2026-07-01, gender_preference column added to client_profiles (text, nullable) and wired into DignityProfilePage.tsx as a select (No preference → null, Female/Male → literal string). |
| O8 | Crosswalk audit complete (Lee, Day 2) | Both | Resolved 2026-07-01 — zero duplicate ZIPs; every ZIP maps to exactly one FIPS, no is_primary flag needed. Demo ZIPs 85145/85139/85128 confirmed → FIPS 04021 (Pinal County, AZ), is_desert=True, 0 agencies; demo script validated. 8 orphan FIPS in crosswalk not present in home_care_by_county.csv — all US territories (American Samoa, Guam, Northern Mariana Islands ×3, US Virgin Islands ×3), expected CMS coverage gap, not a bug. All 4 utils (computeFillValues, zipToCountyFips, getNearestCountiesWithAgencies, plus 4th) and CompassPage.tsx end-to-end wiring confirmed already complete on main. |
| O9 | ResourcePanel bad-ZIP error state missing Eldercare Locator fallback link | Compass | Resolved 2026-07-01 — inline "Try Eldercare Locator instead" link added to zip-error paragraph in CompassPage.tsx (commit 729e85d). Merged into main 2026-07-02. |
| O10 | Create demand_signals table for Door 1 demand signal writes | Both | Resolved 2026-07-01 — table created on Supabase project xcknjvqaphxdxrvyobhh: columns id (uuid pk), zip (text not null), county_fips (text not null), created_at (timestamptz). RLS enabled; INSERT open to anon (Door 1 unauthenticated), SELECT restricted to authenticated (Door 2 coordinators). No UPDATE/DELETE policies — flags are write-once. |
| O11 | per-1,000 → per-100,000 stat rescale in computeFillValues.ts and ResourcePanel.tsx | Both | Resolved (Lee, Day 3) — computeFillValues.ts and ResourcePanel.tsx display layer updated: label changed to 'Agencies per 100k seniors', value computed as (per_1k_seniors * 100).toFixed(1). Internal field names (agenciesPer1kSeniors, per_1k_seniors) unchanged — display-only fix, no schema or calculation-source changes. |
| O12 | Console + Compass UI polish pass — missing pin/external-link icons, "View on map" per-county links, "Start here" badge on Eldercare Locator, Label/Tag typography on section headers | Both | Open — Jillian, own thread |
| — | Note (Jillian, Day 3) re: O5 | Compass | O5's Supabase wiring is code-complete but not yet locally verified by Lee — his apps/compass/.env.local (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) is not yet created on his machine. He'll add it and test the live insert tomorrow. Treat O5 as code-resolved, pending local confirmation. |
| O13 | No auto-create trigger for coordinator_profiles on magic-link sign-up — id column has no default (unlike every other table's gen_random_uuid()), meaning it's designed to key off auth.users.id, but nothing creates this row automatically. Discovered during seed data prep; Jillian's row was inserted manually as a one-time fix. | Jillian | Open — needed before multi-coordinator use, not blocking single-coordinator demo |
| O14 | getSignalCountsByCounty (lib/queries.ts) locks the returned zip to whichever demand_signals row is encountered first per county during grouping — count is always accurate, but pin placement could understate spread if a county accumulates signals across multiple ZIPs. Not an issue with current 2-row demo data. | Jillian | Open — low priority, cosmetic |
| O15 | MapEngine legend renders hardcoded "Care desert / Moderate gap / Well served" text regardless of props — not suppressible from apps/console. Misleading on Door 2, which no longer uses that color scale (see D15). Needs a legendMode prop or equivalent — MapEngine interface change requiring joint sign-off. | Jillian/Lee | Resolved (2026-07-03) — resolved via existing mode prop rather than a new legendMode field. MapEngine.tsx already receives mode ('consumer' | 'coordinator'); the four color-scale legend rows are now conditionally rendered only when mode !== 'coordinator', so Door 2's legend shows only the pin-type rows (Available aide, Unassigned client, Demand signal). No MapEngine.types.ts change or joint sign-off was actually required — the original open item assumed a new prop was needed, but the existing mode prop already carried the necessary signal. |
| O16 | Leaflet's default hover-highlight color (#3388ff) doesn't match Console's design system palette. Needs either a CSS override (console-only, if achievable) or a MapEngine style prop (needs Lee). | Jillian | Open |
| O17 | MapEngine bound tooltips per-layer with no cross-layer coordination, causing overlapping tooltips when hovering adjacent county borders. | Jillian | Resolved (2026-07-02) — activeLayerRef added to MapEngine.tsx, explicitly closes previous layer's tooltip on mouseover handoff before new one opens; listeners cleared before re-adding on re-render to prevent stacking. Internal fix only, no prop/type changes. Lee-approved. Verified clean build on both apps/compass and apps/console. |
| O18 | Live Supabase seed data diverges from git history — James Whitfield and Marcus Boone (caregivers) and one previously null-ZIP client profile were reassigned to Maricopa County (04013) via direct SQL to make the D17 adjacent-county tier demonstrable. No seed script reflects these changes; a fresh seed run from the committed script would overwrite them and break the adjacent-county demo scenario. | Jillian | Open — update seed script or add a supplemental migration before demo reset |
| O19 | Major city labels on map (Phoenix, Tucson, etc.) for geographic orientation at default zoom — not currently present, tooltips only show on hover per-county. Would reuse existing overlayPins/makePinIcon pattern but requires a new MapEngineProps field (e.g. cityLabels) — MapEngine interface change, joint sign-off required with Lee. Small hardcoded dataset, no asset sourcing needed. | Jillian/Lee | Open — add after final UI polish if time allows |
| O20 | Overlay pins (client/caregiver/signal) can visually overlap at low zoom when their deterministic jitter positions land close together within the same county or same ZIP — cosmetic, most visible with small demo datasets. A pinType-aware jitter fix (folding pin type into zipHash input) was drafted to reduce cross-type overlap at a shared ZIP but not yet applied. | Jillian | Open |
| O21 | MapEngine tooltips could stack/remain visible when the map was dragged mid-hover — root cause: browser's mouseout event doesn't fire when an element moves out from under a stationary cursor during a Leaflet pan, leaving activeLayerRef stale. | Jillian | Resolved (2026-07-03) — added a movestart listener on the map instance (not per-layer) that closes the stale tooltip and clears activeLayerRef at the start of any map movement (drag, scroll-zoom, or keyboard pan). Listener explicitly unbound in cleanup alongside the existing map.remove() call. |
| O22 | Caregiver pins and unassigned-client pin borders referenced var(--accent-action), a CSS custom property that was never defined anywhere in theme.css or any other file — resolved to the CSS initial value (transparent/currentColor) at runtime, making caregiver pins effectively invisible on the map. | Jillian | Resolved (2026-07-03) — all three references swapped to var(--blue-pin), the token theme.css already documents as "Caregiver pins on map — decorative." |

---

### D25 — Assignment Panel made persistent; prompt and empty states instead of conditional mount

**Decision:** `AssignmentPanel` is always rendered via `MapPage.tsx`'s `panelContent` prop — null county shows a prompt state ("Select a county"), a county with no unassigned clients shows an empty state, and a county with clients shows the ranked match list.

**Rationale:** The prior pattern passed `panelContent={focused ? <AssignmentPanel/> : null}`, which caused MapEngine's 360px panel column to collapse entirely when no county was selected. This produced a visible layout reflow on every county deselect — the map resized to fill the vacated column, then resized back on the next click. Jakob's Law: layout shifting on interaction breaks the user's spatial model. The PRD's three-zone layout (sidebar / map / panel) is a locked constraint, not a suggestion.

**Rejected:** Keeping conditional mount and accepting the reflow as a minor artifact. Rejected because the panel read as broken (disappearing) rather than intentionally empty during testing, and the reflow directly violated the locked three-zone layout.

---

### D26 — `min-width: 0` on flex text children to prevent Assignment Panel card overflow clipping

**Decision:** `.assignment-panel__name` and `.assignment-panel__why-line` both receive `min-width: 0`, overriding the CSS default `min-width: auto` that flex items inherit.

**Rationale:** CSS spec defines `min-width: auto` as the default for flex items — a flex item will never shrink below its intrinsic content width even when `flex: 1` is set. On long caregiver names or why-lines, the score badge and Assign button at the right end of each card were pushed outside the panel's visible area. `min-width: 0` allows the text container to shrink below its content size, keeping the badge and button in view.

**Rejected:** `overflow: hidden` on the card to hide the clipped elements. Rejected — hides the symptom without fixing the layout; the Assign button would become inaccessible rather than visible.

---

### D27 — `handle_new_coordinator` trigger auto-provisions `coordinator_profiles` on sign-up

**Decision:** A Supabase database trigger (`handle_new_coordinator`, fires on `INSERT` to `auth.users`) creates a matching row in `coordinator_profiles` with the new user's `id` and `email`.

**Rationale:** Without this trigger, any coordinator who signs in for the first time gets a row in `auth.users` but nothing in `coordinator_profiles`. The first assignment attempt then hits a foreign key violation (`assignments_log.coordinator_id` references `coordinator_profiles.id`) — discovered as a live 409/23503 during testing. The trigger closes the gap at the schema level rather than requiring manual row creation per new user.

**Rejected:** Manual `coordinator_profiles` row creation per new user. Rejected — this was the original approach and the direct cause of the FK violation; it doesn't scale beyond a single manually-seeded coordinator.

---

### A09 — Password auth replaces magic link for Door 2 (supersedes A02)

**Decision:** Care Console uses Supabase `signInWithPassword` (email + password). Magic link (`signInWithOtp`) has been removed from `AuthContext.tsx` and the login page entirely.

**Rationale:** Resend's sandbox sender domain (`onboarding@resend.dev`) restricts delivery to the Resend account owner's own registered email address — confirmed via a 403 in Resend's delivery logs — meaning magic link was structurally unable to reach any coordinator other than the account owner without a verified custom domain. A02's original rationale (avoiding password-reset infrastructure for a demo) no longer holds once magic link proved unreliable for anyone but a single operator. Password auth removes the email-delivery dependency entirely and requires no additional infrastructure for a closed demo set of users.

**Rejected:** Verifying a custom Resend sender domain instead. Rejected for now — a larger, non-code task better scoped separately from unblocking the demo.

---

### D28 — Sign-out button added to Console sidebar

**Decision:** A "Sign out" button was added at the bottom of `AppShell.tsx`'s sidebar, visually separated from the Clients/Map nav links by a `border-top`. Calls `signOut()` from `AuthContext`; `ProtectedRoute` handles the redirect to `/login` once session becomes null.

**Rationale:** No mechanism existed to end a coordinator session from the UI — the only path was clearing browser storage manually. Required for any multi-coordinator demo scenario.

**Rejected:** No alternative considered — this was a missing baseline affordance.

---

### D29 — Dignity Profile edit-save banner uses `setBanner` directly, not router state

**Decision:** On successful edit save, `DignityProfilePage.tsx` calls `setBanner({ type: 'success', message: 'Profile saved' })` directly, without navigating. Previously it used `navigate(..., { state: { banner: 'Profile saved' } })` and read `location.state.banner` on mount at the destination.

**Rationale:** The router-state pattern depends on `location.state` being readable at the exact moment the destination component mounts — in practice the banner silently failed to appear in some navigation timing cases during testing. Direct `setBanner` on the edit page is synchronous and guaranteed, and matches the pattern `AssignmentPanel` already uses for its own success banner. The create path (`mode === 'create'`) retains navigate-with-state because it must navigate to get the new record's ID.

**Rejected:** Keeping the router-state pattern and debugging the timing issue. Rejected — the direct `setBanner` approach is simpler, already proven in `AssignmentPanel`, and eliminates the dependency on navigation/mount timing entirely.

---

### A10 — `dimmedPinIds` added to `MapEngineProps` (bypassed 2-hour review window)

**Decision:** Added optional `dimmedPinIds?: string[]` to `MapEngineProps`. Pins whose `id` appears in the list render at 0.3 opacity via Leaflet's native `opacity` marker option; all others render at full opacity. On Door 2, county focus dims pins outside that county's relevance — caregiver relevance follows D17's adjacency logic (`isAdjacentCounty`), not a raw `countyFips` match, so legitimately-scored adjacent-county matches stay at full opacity. Signal pins are never dimmed. Door 1 never passes the prop (optional, defaults to no dimming).

**Rationale:** Map pins were unscoped to the focused county while the Assignment Panel's counts were correctly scoped — read as a data bug, was actually a scope mismatch. Chose a `MapEngineProps`-level field over an `OverlayPin.opacity` field to keep pin data pure (identity, position, status) and rendering decisions inside MapEngine.

**Process:** Made without the standard joint review window per `MapEngine_Interface_Contract.md §10` — Jillian's call, given minimal surface (one optional field, no breaking change, no effect on Door 1) and same-session urgency. Lee notified after the fact. One-time exception, not a precedent.

**Rejected:** `opacity?: number` on `OverlayPin` — mixes presentation hints into a data type that should carry only identity and position.
