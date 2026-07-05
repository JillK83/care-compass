# UI_CHANGES_PENDING.md — Care Compass Platform

Visual/UX changes flagged during build but deliberately deferred — not bugs,
not scope gaps, just polish that needs a dedicated pass against the Figma
mocks rather than a mid-build fix. Add a new dated section each time a batch
of these accumulates.

---

## 2026-07-02 — Map screen (Door 2)

- Legend content needs legendMode prop (see O15 in DECISIONS.md) — currently
  shows desert/gap/served labels that don't apply to Door 2's neutral map
- Hover highlight color (Leaflet default blue) should match Console design
  system palette
- [RESOLVED — see DECISIONS.md] Map container needs full page shell (sidebar + map + Assignment Panel, 3-column layout) once panel work lands — current MapPage.tsx rendered the map in isolation, no surrounding chrome yet
- Reference: Figma mocks + Lee's Compass screenshots are source-of-truth for
  this pass — see project files, not recreated from memory

---

## 2026-07-03 — UI element pass — Door 2 + Door 1 cleanup

- Empty-state visual polish: "Select a county" and "No unassigned clients" states read as broken rather than intentionally empty — sparse text-only content against a full-height blank panel, no visual weight (icon, centering) to signal "this is designed." Needs a pass once other UI work is batched.
- Header missing across all Console pages, including the login page — no consistent page title/wordmark treatment.
- Login page formatting needs a full pass — currently unstyled inputs/buttons, no layout treatment.
- Clients List further visual cleanup pending (beyond the row-click and banner fixes already shipped).
- Compass (Door 1) — additional cleanup items pending, to gather from Lee.

---

## 2026-07-04 — Map pin visibility fixes + deferred UI items from testing pass

Resolved during live testing (not deferred — documented here for traceability,
full detail in DECISIONS.md D32/D33):
- County auto-zoom on focus, zoom floor, occupancy-based pin offset
  assignment, 16-point rosette jitter pattern. See D32/D33.

Deferred from this session — needs a dedicated UI pass:
- Clients List: row hover state (dead inline style, can't express :hover —
  needs CSS class), Assigned column badges (replace plain Yes/No), ZIP/
  county column for transparency (came up during map debugging — would
  speed up future diagnosis), column header visual weight (Name/Pronouns/
  Assigned blend into row text), row numbering, sortable headers, no
  visible edit affordance on rows (currently: click name/pronouns/assigned
  cell — unclear it's clickable), no "recently added" indicator for new
  clients.
- Assignment Panel: filter chips (language/zip-distance) don't reset when
  countyFips changes — confirmed bug, fix drafted, not yet applied.
- Map: no search-by-ZIP/county input (present in old Compass-era mock,
  never confirmed in scope for Door 2).
- Caregiver cards (Map view + Assignment Panel): no visibility into
  existing assignment load per caregiver — see DECISIONS.md O23 for scoped
  fix ("Currently assigned: Nx" tag).
- Reference: this batch surfaced during live map/data testing rather than
  a Figma comparison pass — Door 2 has no Figma mocks for Clients List,
  Login, or Profile screens (only Compass has mocks). DESIGN_SYSTEM.md
  tokens + Laws of UX are being used as the substitute reference for these
  three screens.

---

## 2026-07-04 (addendum) — O24/O25 logged during demo prep

- O24: Clients List shows no caregiver name for assigned clients — only
  Assigned/Unassigned badge. Requires assignments_log join to surface the
  most recent caregiver name per client. Currently visible only via Map/
  Assignment Panel. See DECISIONS.md O24.
- O25: No Unassign action exists — assignment is one-directional. Reversing
  a bad assignment requires direct SQL. Scoped fix: reuse AssignmentConfirmModal
  pattern (same confirm-before-commit flow as Assign, reverse mutation).
  Surfaced during 2026-07-04 demo prep. See DECISIONS.md O25.
