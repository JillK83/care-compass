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

## Open Items

Move to resolved once addressed in build. Do not delete — add resolution date and note.

| # | Item | Screen | Status |
|---|---|---|---|
| O1 | Verify ZIP-to-county crosswalk behavior for ZIPs spanning multiple county lines | Both | Resolved 2026-06-30 — simplemaps crosswalk uses primary county per ZIP; ZIP+4 handled by slice(0,5) in zipToCountyFips.ts |
| O2 | Lock choropleth map library dependency before scaffolding MapEngine component API | Both | Resolved — 2026-06-30, see D08. Library choice (Leaflet + free GeoJSON) was locked in D08; only the react-leaflet/React 19 version conflict remained open, tracked separately as O6. |
| O3 | Run Door 1 WCAG audit against Figma Make output before committing Door 1 CSS | Compass | Open — Lee, Day 3 |
| O4 | Confirm demo ZIP codes (85145, 85139, 85128) against Lee's dataset | Both | Resolved 2026-06-30 — all three ZIPs map to 04021 (Pinal County, AZ), confirmed is_desert=True in home_care_by_county.csv |
| O5 | Flag CTA confirmation state (post-click text + visual) not yet mocked | Compass | Resolved 2026-06-30 — implemented in ResourcePanel.tsx as local useState; confirmation message shows ZIP on click, no backend (D10) |
| O6 | react-leaflet / React 19 peer dependency conflict — blocks MapEngine rendering for both doors | Both | Resolved — 2026-06-30, see A04. Upgraded react-leaflet to 5.0.0; all four workspaces build clean. |
| O7 | Add gender_preference field to Dignity Profile form | Console | Resolved — 2026-07-01, gender_preference column added to client_profiles (text, nullable) and wired into DignityProfilePage.tsx as a select (No preference → null, Female/Male → literal string). |
| O8 | Crosswalk audit complete (Lee, Day 2) | Both | Resolved 2026-07-01 — zero duplicate ZIPs; every ZIP maps to exactly one FIPS, no is_primary flag needed. Demo ZIPs 85145/85139/85128 confirmed → FIPS 04021 (Pinal County, AZ), is_desert=True, 0 agencies; demo script validated. 8 orphan FIPS in crosswalk not present in home_care_by_county.csv — all US territories (American Samoa, Guam, Northern Mariana Islands ×3, US Virgin Islands ×3), expected CMS coverage gap, not a bug. All 4 utils (computeFillValues, zipToCountyFips, getNearestCountiesWithAgencies, plus 4th) and CompassPage.tsx end-to-end wiring confirmed already complete on main. |
| O9 | ResourcePanel bad-ZIP error state missing Eldercare Locator fallback link | Compass | Open — Lee, Day 3. Inline error message exists but direct Eldercare Locator link as fallback not yet included per spec. |
