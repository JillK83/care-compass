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
- Map container needs full page shell (sidebar + map + Assignment Panel,
  3-column layout) once panel work lands — current MapPage.tsx renders the
  map in isolation, no surrounding chrome yet
- Reference: Figma mocks + Lee's Compass screenshots are source-of-truth for
  this pass — see project files, not recreated from memory
