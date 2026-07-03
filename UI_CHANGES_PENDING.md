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
