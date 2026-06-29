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

---

## Open Items

Move to resolved once addressed in build. Do not delete — add resolution date and note.

| # | Item | Screen | Status |
|---|---|---|---|
| O1 | Verify ZIP-to-county crosswalk behavior for ZIPs spanning multiple county lines | Both | Open — Lee, Day 1 |
| O2 | Lock choropleth map library dependency before scaffolding MapEngine component API | Both | Open — Both, Day 1 |
| O3 | Run Door 1 WCAG audit against Figma Make output before committing Door 1 CSS | Compass | Open — Lee, Day 3 |
| O4 | Confirm demo ZIP codes (85145, 85139, 85128) against Lee's dataset | Both | Open — Lee, Day 1 |
| O5 | Flag CTA confirmation state (post-click text + visual) not yet mocked | Compass | Open — Build |
