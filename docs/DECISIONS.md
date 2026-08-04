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
| O13 | No auto-create trigger for coordinator_profiles on magic-link sign-up — id column has no default (unlike every other table's gen_random_uuid()), meaning it's designed to key off auth.users.id, but nothing creates this row automatically. Discovered during seed data prep; Jillian's row was inserted manually as a one-time fix. | Jillian | Resolved (2026-07-03) — see D27. handle_new_coordinator trigger fires on auth.users insert, auto-creates the coordinator_profiles row. Discovered as a live 409/23503 FK violation during Assignment Panel testing before the trigger was built. |
| O14 | getSignalCountsByCounty (lib/queries.ts) locks the returned zip to whichever demand_signals row is encountered first per county during grouping — count is always accurate, but pin placement could understate spread if a county accumulates signals across multiple ZIPs. Not an issue with current 2-row demo data. | Jillian | Open — low priority, cosmetic |
| O15 | MapEngine legend renders hardcoded "Care desert / Moderate gap / Well served" text regardless of props — not suppressible from apps/console. Misleading on Door 2, which no longer uses that color scale (see D15). Needs a legendMode prop or equivalent — MapEngine interface change requiring joint sign-off. | Jillian/Lee | Resolved (2026-07-03) — resolved via existing mode prop rather than a new legendMode field. MapEngine.tsx already receives mode ('consumer' | 'coordinator'); the four color-scale legend rows are now conditionally rendered only when mode !== 'coordinator', so Door 2's legend shows only the pin-type rows (Available aide, Unassigned client, Demand signal). No MapEngine.types.ts change or joint sign-off was actually required — the original open item assumed a new prop was needed, but the existing mode prop already carried the necessary signal. |
| O16 | Leaflet's default hover-highlight color (#3388ff) doesn't match Console's design system palette. Needs either a CSS override (console-only, if achievable) or a MapEngine style prop (needs Lee). | Jillian | Open |
| O17 | MapEngine bound tooltips per-layer with no cross-layer coordination, causing overlapping tooltips when hovering adjacent county borders. | Jillian | Resolved (2026-07-02) — activeLayerRef added to MapEngine.tsx, explicitly closes previous layer's tooltip on mouseover handoff before new one opens; listeners cleared before re-adding on re-render to prevent stacking. Internal fix only, no prop/type changes. Lee-approved. Verified clean build on both apps/compass and apps/console. |
| O18 | Live Supabase seed data diverges from git history — James Whitfield and Marcus Boone (caregivers) and one previously null-ZIP client profile were reassigned to Maricopa County (04013) via direct SQL to make the D17 adjacent-county tier demonstrable. No seed script reflects these changes; a fresh seed run from the committed script would overwrite them and break the adjacent-county demo scenario. | Jillian | Open — update seed script or add a supplemental migration before demo reset |
| O19 | Major city labels on map (Phoenix, Tucson, etc.) for geographic orientation at default zoom — not currently present, tooltips only show on hover per-county. Would reuse existing overlayPins/makePinIcon pattern but requires a new MapEngineProps field (e.g. cityLabels) — MapEngine interface change, joint sign-off required with Lee. Small hardcoded dataset, no asset sourcing needed. | Jillian/Lee | Open — add after final UI polish if time allows |
| O20 | Overlay pins (client/caregiver/signal) can visually overlap at low zoom when their deterministic jitter positions land close together within the same county or same ZIP — cosmetic, most visible with small demo datasets. A pinType-aware jitter fix (folding pin type into zipHash input) was drafted to reduce cross-type overlap at a shared ZIP but not yet applied. | Jillian | Open |
| O21 | MapEngine tooltips could stack/remain visible when the map was dragged mid-hover — root cause: browser's mouseout event doesn't fire when an element moves out from under a stationary cursor during a Leaflet pan, leaving activeLayerRef stale. | Jillian | Resolved (2026-07-03) — added a movestart listener on the map instance (not per-layer) that closes the stale tooltip and clears activeLayerRef at the start of any map movement (drag, scroll-zoom, or keyboard pan). Listener explicitly unbound in cleanup alongside the existing map.remove() call. |
| O22 | Caregiver pins and unassigned-client pin borders referenced var(--accent-action), a CSS custom property that was never defined anywhere in theme.css or any other file — resolved to the CSS initial value (transparent/currentColor) at runtime, making caregiver pins effectively invisible on the map. | Jillian | Resolved (2026-07-03) — all three references swapped to var(--blue-pin), the token theme.css already documents as "Caregiver pins on map — decorative." |
| O23 | Caregiver cards (Assignment Panel + Map view) show no indication of existing assignment load — a caregiver already assigned to N clients looks identical to one with zero. Per D31, this isn't a bug (multiple concurrent assignments are valid) but the lack of visibility could read as one in a demo. Scoped fix: add a status tag/count ("Currently assigned: Nx") to the existing card display, sourced from assignments_log, alongside the existing Available/Unavailable tag. A separate client-side assignment history view is a larger feature, not scoped here. | Jillian | Resolved (2026-07-04) — "Currently assigned: Nx" tag shipped in AssignmentPanel, sourced from assignments_log, displayed in Zone A identity column. |
| O24 | Clients List doesn't show which caregiver a client is assigned to — only Assigned/Unassigned status is visible. Requires joining assignments_log to caregiver name per client (most recent assignment if a client has assignment history, per D31's allowance for multiple concurrent assignments). Currently the only way to see this is toggling to the Map/Assignment Panel. | Jillian | Open — next session |
| O25 | No Unassign action exists anywhere in the product — assignment is one-directional (Assign only). Reversing a bad assignment currently requires direct SQL (update client_profiles.is_assigned = false; delete from assignments_log). Scoped fix: reuse the existing AssignmentConfirmModal pattern for consistency — same confirm-before-commit flow as Assign, just the reverse mutation. Surfaced live during 2026-07-04 demo prep when a test assignment needed reverting. | Jillian | Open — next session |

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

**Rejected:** `opacity?: number` on `OverlayPin` — mixes presentation hints into a data type that should carry only identity and position.

**Process:** Made without the standard joint review window per `MapEngine_Interface_Contract.md §10` — Jillian's call, given minimal surface (one optional field, no breaking change, no effect on Door 1) and same-session urgency. Lee notified after the fact. One-time exception, not a precedent.

---

### D30 — Assignment Panel scoped to a single client; no client selector

**Decision:** When a county has multiple unassigned clients, the Assignment Panel always shows ranked caregiver matches for `clients[0]` only. There is no UI to select a different client within the county, and clicking an individual client pin on the map does nothing — only county-level click opens the panel.

**Rationale:** Scoring (`rankCaregiverMatches`) is per-client — a language match for one client isn't the same ranking for another. Adding a full client-selector (list/dropdown to choose which client's matches display) was scoped out to ship the core assign flow first: pick top client, rank, confirm, log. Explicit call made during build: "keep it simple, top client only."

**Rejected:** Building the selector alongside the initial panel. Rejected — would have expanded the panel's first build into a second UI surface (client list + selection state + pin-click wiring) before the core assign→confirm→log path was proven end-to-end.

**Revisit when:** A demo scenario or user feedback requires assigning to more than one client per county in the same session, or when pin-click interactivity is added to the map (currently only county polygons are clickable).

---

### D31 — Caregiver availability not flipped on assignment

**Decision:** Confirming an assignment does not set `caregiver_profiles.is_available = false`. A caregiver can appear as an available match for multiple clients even after being assigned to one.

**Rationale:** Home care aides realistically carry a caseload of multiple clients — `is_available` represents whether a caregiver is taking on any work at all (on leave, fully booked, etc.), a separate coordinator-managed state, not a 1:1 capacity flag tied to assignment count. Practically, with a small seeded caregiver pool, auto-flipping availability on every assign would exhaust available matches after only a few assignments and make the demo brittle.

**Rejected:** Setting `is_available = false` on assign (one active client per caregiver). Rejected — conflates "currently taking work" with "has exactly zero clients," which doesn't reflect how home care staffing actually works, and doesn't match `assignments_log` already being the system of record for who's assigned to whom (no denormalized caregiver-side flag exists, only `client_profiles.is_assigned` per D24).

**Follow-up (open, not yet built):** Coordinators currently have no visibility into how many clients a caregiver already carries when deciding whether to assign another, and there is no client-side view of which caregiver(s) are currently assigned. See O23.

---

### D32 — County-level pin auto-zoom, zoom floor, and occupancy-based offset assignment

**Decision:** Three related additions built while chasing a reported bug (newly added client Sam Davis not appearing on the map):

1. MapEngine auto-zooms (flyTo/setView with explicit zoom computed via getBoundsZoom, reduced-motion aware) to a county's polygon bounds when focusedCountyFips changes, resetting to the national view on deselect. Internal-only — no MapEngine.types.ts change, no sign-off needed. Door 1 inherits this for free via the same focusedCountyFips prop.

2. Auto-zoom result is floored at zoom 9 (capped at 10) — the confirmed threshold where two 32px jittered pins become visually distinct. Large counties (Maricopa) previously landed at zoom 8 via fitBounds alone, one level short. Implemented via `map.getBoundsZoom(bounds, false)` → `Math.min(Math.max(rawZoom, 9), 10)` → explicit `flyTo`/`setView` with center + zoom.

3. ZIP-offset jitter (D20) previously hashed `zip + pinType` with a within-type rank suffix for duplicates — this caught same-zip-same-type collisions (two caregivers, same ZIP) but not cross-type collisions. Sam Davis's client pin and two caregiver pins (different ZIPs, different types) all hashed to offset index 0 in Maricopa and rendered on the identical pixel. Replaced with occupancy-based assignment: a per-county `Map<string, Set<number>>` tracks which offset slots are taken across all pin types together; any pin whose hashed index collides advances to the next free slot via linear probe, in stable id-sorted order (`.order('id')` added to client/caregiver Supabase queries for cross-session determinism).

**Correction to initial diagnosis:** An earlier pass mistakenly identified Eliza/Sam Davis as the colliding pair — recomputing hashes from scratch showed Eliza never collided (index 7) and the actual collision was Sam Davis vs. two caregivers (James Whitfield, Marcus Boone — all three independently hashing to index 0).

**Rationale:** Each fix addressed a distinct, independently confirmed cause — auto-zoom fixed county-too-small-on-screen, the zoom floor fixed fitBounds undershooting on large counties, occupancy-based offsets fixed hash collisions as an inherent birthday-paradox risk regardless of what's fed into the hash string.

**Rejected:** Scaling offset radius outward (only patches today's seed data, risks pushing jittered pins across county boundaries in narrow counties). Appending record id into every pin's hash key (changes output for every pin including non-colliding ones, violates D20's cross-session determinism guarantee).

---

### D33 — Offset capacity raised to 16; rosette pattern; capacity guard made permanent

**Decision:** ZIP_OFFSETS expanded from 8 to 16 entries (`as const`, so truncation surfaces at compile time) after live seed data in Pinal County (3 clients + 7 caregivers = 10 pins) exceeded the original 8-slot ceiling, silently overflowing and re-stacking pins even with the occupancy-probe fix from D32 in place. The `console.warn` added during diagnosis (`'[MapPage] offset capacity exceeded — pin will collide'`, logging `countyFips`/`zip`/`pinType`) is kept permanently rather than removed as temporary debug code — cheap insurance if any county exceeds 16 pins in the future.

**Follow-up:** The original 8-point (and initial 16-point) layouts used a single fixed radius at equal angular spacing, producing a visually artificial perfect-ring/octagon pattern. Replaced with a varied-radius rosette: 8 outer points at 0.16° radius (cardinal + diagonal angles) alternating with 8 inner points at 0.10° radius (intermediate angles), indexed in alternation around the full circle. Still fully deterministic and hardcoded, no runtime randomness, same 0.16° max radius ceiling as D20 — only the shape/distribution of points changed, not the hash, the occupancy-probe logic, or the capacity guard.

**Known limit, still open:** 16-pin ceiling per county. Not currently at risk given seed data, but not infinite — revisit if a county's combined client+caregiver count approaches 16.

**Rejected:** No alternative capacity expansion was considered — 16 was chosen as 60% headroom over the confirmed 10-pin maximum in current data, enough for demo-scale growth without over-engineering.

---

### D34 — --teal-deep used for Clients List row hover text, deviating from nav-only reservation

**Decision:** The Clients List row-name hover state (link-style affordance — color shift + underline signaling the row is clickable) uses `--teal-deep` (#1D4E5A), not `--teal-action` (#17383F).

**Rationale:** `--teal-action` is near-black (#17383F) and sits too close in luminance to `--text-primary` (#1A1A1A) to read as a distinct hover state — the underline was doing all the signaling work, the color shift was imperceptible. `--teal-deep` is documented as nav-active-state-only, but is visually closer to a conventional "interactive link" color and provides actual contrast against static row text. This is a link-text use case, not a button — `--teal-action`'s "no exceptions" rule (D02) is specifically about action buttons, not link-style text affordances, so this doesn't conflict with D02.

**Rejected:** Keeping `--teal-action` and relying on underline alone. Rejected — tested and confirmed insufficient contrast to read as a hover state at a glance. Introducing a new token for this one use case. Rejected — adds a token for a single-surface need when an existing token is visually adequate.

**Follow-up:** If Lee's Door 1 introduces a similar row/list hover pattern, flag this decision for consistency review rather than independently picking a third color.

---

### D35 — Minimal client-selector dropdown added to AssignmentPanel

**Decision:** When a county has more than one unassigned client, the panel shows a dropdown ("Matching for: [Client Name]") letting the coordinator choose which client drives ranking/filtering, instead of always defaulting to clients[0]. Counties with exactly one client keep the original static text line, no dropdown.

**Rationale:** Live flow testing (2026-07-04) surfaced the gap directly — a newly added client (Raphael Antonio) was unreachable in the panel because another client happened to sort first in Pinal County. D30's original "keep it simple, top client only, no selector" decision assumed this would come up rarely enough to defer; testing showed it's a real blocker for coordinators working multi-client counties. This is a scoped fix, not the full deferred feature — it does not touch MapEngine, pin-click wiring, or map highlighting of the selected client, so it doesn't require Lee's sign-off per the MapEngine Interface Contract.

**Rejected:** Full pin-click-to-select wiring (the originally deferred feature). Rejected for now due to time/scope — that still requires cross-team coordination on pin behavior and stays as an open item.

**Follow-up:** Map does not visually indicate which client is currently selected via the dropdown. Worth considering a highlight/pulse on that client's pin in a future pass — would need MapEngine coordination with Lee.

### D36 — Flag CTA button: fit-content width, not 320px fixed

**Decision:** The "Flag this area as needing care" button uses width: fit-content instead of the 320px fixed width specified in DESIGN_SYSTEM.md's button rules table.

**Rationale:** The 320px fixed width, once implemented, created visible excess whitespace on either side of the button's text given this specific copy length, especially against the card's left-aligned heading and description above it. Fit-content sizing keeps the button visually balanced with its own copy while remaining centered in the card.

**Rejected:** Keeping the literal 320px per the original DESIGN_SYSTEM.md spec — rejected because it looked visually unbalanced in practice once built, not just in the abstract spec.

**Follow-up:** DESIGN_SYSTEM.md's button rules table should be updated to reflect this change so the two documents don't contradict each other — not done as part of this fix, flagging separately.

### D37 — Remove "agencies per 1,000 seniors" stat from Door 1 result card

**Decision:** The result card's stat row now shows only "Agencies here" and "Senior population" — the "Per 100k seniors" stat has been removed from this surface. It remains available via the map's hover tooltip, which is unchanged.

**Rationale:** The result card is a confirmatory, single-purpose surface per DESIGN_SYSTEM.md ("a calm, single-purpose results page") answering one question: is there care near me. The normalized per-100k rate is a comparative metric more useful for browsing/analysis (already served by the hover tooltip and the map's color-coded severity fill) than for a family member confirming their own county's status. Removing it reduces scan cost on the page most in need of staying minimal (Hick's Law).

**Deviation note:** This removes a stat explicitly listed as P0 in PRD_Jillian_Krebsbach.md ("Panel displays county-level desert status, agency count, and agencies per 1,000 seniors"). The PRD is being updated separately to reflect this — not automated as part of this change.

**Rejected:** Keeping the stat in both the result card and the hover tooltip — rejected as redundant once the family already has the raw count and the map's color signal for severity.

---

### D38 — Default map view set to Arizona at zoom 5

**Decision:** MapPage initial center set to [34.2, -111.5], zoom 5. Post-login redirect changed from /clients to /map.

**Rationale:** All demo data is Arizona. National default view rendered pins as unreadable blobs. Zoom 5 shows Maricopa and Pinal with readable pins and visible county boundaries — the core demo counties. Map-first landing makes the Door 1 → Door 2 demand signal narrative immediately visible on login.

**Rejected:** Zoom 4 (too far, pins illegible), zoom 6–7 (too tight, loses state context).

---

### A11 — All 5 Care Compass tables migrated to Project 1 under `care_compass` schema

**Decision:** Migrated `assignments_log`, `caregiver_profiles`, `client_profiles`, `coordinator_profiles`, and `demand_signals` from the standalone Care Compass Supabase project into Project 1 (jillian.krebsbach@gmail.com's Org) under a dedicated `care_compass` schema. Old project deleted.

**Rationale:** The standalone project was a separate billing/org unit requiring two sets of env vars and two Supabase contexts for a platform sharing a single deployment pipeline. Consolidating under Project 1 reduces credential surface and removes cross-project coordination overhead. A named schema (`care_compass`) keeps the tables namespaced without requiring a separate project.

**Implementation notes:**
- Tables recreated manually via SQL editor; CSV import failed due to string `"null"` values in UUID fields — data imported via INSERT statements instead
- RLS intentionally disabled on migrated tables (demo-only; matches pre-migration state)
- `.env.local` and Vercel env vars updated in both apps to reflect new project URL and anon key
- Deployed app confirmed working at `care-compass-family.vercel.app/compass` post-migration
- Old Care Compass Supabase project deleted

**Rejected:** Keeping the two-project structure. Rejected — separate org context, duplicate credential sets, and a dead project in the dashboard with no ongoing benefit.

---

### A12 — Supabase project ref `eiowhxkcyicuhnuyzfhk` is the single source of truth

**Decision:** The Supabase project at `https://eiowhxkcyicuhnuyzfhk.supabase.co` (jillian.krebsbach@gmail.com's Project) is the authoritative backend for both `apps/console` and `apps/compass`. No other project ref is valid.

**Rationale:** Post-A11 migration, both apps point to this single project. Any prior project refs (e.g. `xcknjvqaphxdxrvyobhh`) are deleted and must not be reused or confused with the current project.

**Rejected:** No alternative — this decision exists to prevent confusion with prior project refs that appeared in env files during the A11 migration.

---

### A13 — Auth users must be created via the Supabase dashboard, not raw SQL

**Decision:** All `auth.users` rows must be created through the Supabase dashboard (Authentication → Users → Add user). Raw SQL `INSERT INTO auth.users` is prohibited.

**Rationale:** GoTrue initializes additional metadata (identity records, provider linkage, session state) when a user is created through its API. A raw SQL insert bypasses this initialization — the row exists in `auth.users` with a valid password hash but produces `invalid_credentials` on every `signInWithPassword` attempt because GoTrue's internal state is incomplete.

**Rejected:** Raw SQL inserts with `crypt()` password hashing. Rejected — confirmed to produce `invalid_credentials` login failures even when the hash is correct, because GoTrue's metadata initialization is skipped.

---

### A14 — Demo auth user `demo@carecompass.test` managed via Supabase dashboard only

**Decision:** The `demo@carecompass.test` coordinator account is created and password-managed exclusively through Authentication → Users in the Supabase dashboard. SQL `crypt()` updates to `encrypted_password` are not used.

**Rationale:** Per A13, password resets via raw SQL produce an invalid credential state even when the hash appears correct. Dashboard-managed password resets go through GoTrue and are guaranteed to work with `signInWithPassword`.

**Rejected:** Password resets via `UPDATE auth.users SET encrypted_password = crypt(...)`. Rejected — confirmed to fail; see A13.

---

### A15 — Supabase client in `apps/console` scoped to `care_compass` schema

**Decision:** `apps/console/src/lib/supabase.ts` passes `{ db: { schema: 'care_compass' } }` as the third argument to `createClient`. All five tables (`assignments_log`, `caregiver_profiles`, `client_profiles`, `coordinator_profiles`, `demand_signals`) live in the `care_compass` schema, not `public`.

**Rationale:** Post-A11 migration, tables were created under a named schema rather than `public`. Without the schema option, Supabase's PostgREST client defaults to `public` and all queries return empty or error. `apps/compass` does not receive this change — Door 1 reads only from static CSV and its Supabase client (used only for demand signal inserts) targets `demand_signals` which is also in `care_compass`; that alignment should be verified separately.

**Rejected:** Moving tables back to `public`. Rejected — the named schema is the intentional output of A11's consolidation; reverting it would undo the namespacing benefit.

---

### A16 — `care_compass` schema requires explicit USAGE and table grants for `anon` and `authenticated`

**Decision:** After creating the `care_compass` schema, the following grants must be applied before any API request can succeed:

```sql
GRANT USAGE ON SCHEMA care_compass TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA care_compass TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA care_compass TO anon, authenticated;
```

**Rationale:** PostgreSQL does not automatically grant schema access to non-owner roles. Without `USAGE` on the schema, all Supabase API requests (PostgREST) return `403 permission denied for schema care_compass` regardless of RLS state — RLS governs row filtering, not schema-level access. These grants are required even when RLS is disabled.

**Rejected:** Disabling RLS as a substitute. Rejected — confirmed to have no effect on the 403; RLS and schema USAGE grants are independent permission layers.

---

### A17 — `care_compass` schema must be added to Supabase Data API exposed schemas

**Decision:** `care_compass` must be listed under Project Settings → Integrations → Data API → Exposed schemas. Without this, all API requests return `406 Invalid schema`. This is a one-time project-level setting — new tables added to `care_compass` do not require re-exposure.

**Rationale:** Supabase's PostgREST layer only serves schemas explicitly listed in its `db-schema` config. The `care_compass` schema is not exposed by default when created — it must be added alongside `public` in the dashboard setting. Failure mode is `406 Invalid schema` on every request, which is distinct from the `403` produced by missing USAGE grants (A16).

**Rejected:** Using the `public` schema. Rejected — A11's consolidation intentionally namespaces Care Compass tables under `care_compass`; reverting to `public` would undo that.

---

### A18 — Added PRIMARY KEY and FOREIGN KEY constraints to care_compass schema

**Decision:** Added missing PRIMARY KEY constraints to `care_compass.client_profiles`
and `care_compass.caregiver_profiles` (both on the `id` uuid column).
Added FOREIGN KEY constraints from `assignments_log.client_id` →
`client_profiles(id)` and `assignments_log.caregiver_id` →
`caregiver_profiles(id)`, both with ON DELETE CASCADE.
Schema cache reloaded via `notify pgrst, 'reload schema'` after each change.

**Rationale:** PostgREST requires FK relationships to be present in the schema
for nested select joins (e.g. `assignments_log ( caregiver_profiles ( name ) )`)
to resolve. Without the FKs, the query returns a 400 "Could not find a
relationship" error. The PKs were required before the FKs could reference them.

**Applied:** 2026-08-03 via Supabase SQL editor (service role).
