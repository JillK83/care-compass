#Care Compass

Why This Exists

Two data gaps shaped this build.

Gap 1 — Families have no starting point. No publicly available tool shows whether home care agencies serve a given county. When a parent needs care, adult children hit phone trees, dead ends, and duplicate effort. That absence became Door 1.

Gap 2 — Aides arrive unprepared. Home health aide turnover averages 64% annually — with some regions seeing 30% attrition in the first 30 days alone. The root cause isn't pay or supply; it's that aides show up not knowing who they're caring for. That became Door 2 and the Dignity Profile.

The two gaps point to the same failure: coordinators can't see demand, families can't find supply, and the gap widens silently. Care Compass closes the loop — family demand signals flow anonymously from Door 1 into the coordinator's map on Door 2, without a marketplace or any PII crossing between them.

Solution

A two-door platform built as a React monorepo. Both products share a token system, component library, and choropleth map implementation.

Door 1 — Care Compass (/compass): Public-facing, no login required. Families enter a ZIP code, see agency count for their county, view nearest alternatives if the county is a care desert, and can anonymously flag their area as needing care.

Door 2 — Care Console (/map): Internal coordinator tool. Coordinators view unassigned client clusters and available caregiver locations on a live map, run fit-ranked matches, assign aides, and see demand signals flagged from Door 1 — all logged to an audit trail

Contributors

Jillian Krebsbach — Care Console (Door 2): coordinator auth, Dignity Profile, assignment workflow, Supabase backend, audit trail,Design system and UI component library

Leebert McDonald — Care Compass (Door 1): family ZIP lookup, care desert logic, shared MapEngine component, shared UI component library

Getting Started
bash
# Install dependencies
npm install

# Run Care Console (coordinator tool)
npm run dev:console

# Run Care Compass (consumer tool)
npm run dev:compass

# Run both concurrently
npm run dev
Project Structure
/
├── apps/
│   ├── console/          # Care Console — coordinator tool (internal)
│   └── compass/          # Care Compass — consumer tool (public)
├── packages/
│   ├── ui/               # Shared component library
│   │   ├── components/   # Cards, buttons, chips, avatars, badges
│   │   ├── tokens/       # CSS custom properties (tokens.css)
│   │   └── map/          # Choropleth map component (shared)
│   └── utils/            # Shared utilities
├── docs/
│   ├── DECISIONS.md      # Design & build decisions log
│   ├── design-system.md  # Token tables, color roles, typography
│   └── builder-handoff.md
├── public/
│   └── geo/              # County GeoJSON / SVG path data
└── README.md
Products
Care Console
Audience: Home health agency coordinators (internal staff)
Layout: Full-width three-zone desktop — 220px sidebar / map canvas / 360px assignment panel
Core workflow: Select county → view unassigned clients and fit-ranked aides → assign → action logged to audit trail
Care Compass
Audience: Adult children and family members researching home care
Layout: Centered single-column results page (max-width 780px)
Core workflow: Enter ZIP → see agency count for county → view nearest alternatives if zero → flag area as needing care
Shared Design System

Tokens are declared in packages/ui/tokens/tokens.css and imported by both apps.

Key color tokens
Token	Hex	Role
--teal-primary	
#0F6E56	Search CTA, links (Compass only)
--teal-deep	
#1D4E5A	Nav active state (Console only)
--teal-action	
#17383F	All action buttons (Assign, Flag)
--teal-light	
#E1F5EE	Tag backgrounds, avatar fills, card surfaces
--red-critical	
#C0392B	Care desert stat, result card accent
--green-served	
#27AE60	Assigned state, served map fill
--orange-alert	
#B5450A	Urgency badges only — never on buttons
--text-muted	
#767676	Minimum text color on white — WCAG AA floor
--canvas	
#F8F7F4	Page background
--surface	
#FFFFFF	Card / panel background

Full token reference: docs/design-system.md

Typography

Inter throughout. Scale: 32px display / 24px hero / 16px heading / 14px body / 12px caption.

WCAG 2.1 AA

Both products are required to meet WCAG 2.1 AA. 
#9A9A9A fails on white and is restricted to decorative elements only. 
#767676 is the minimum for any text. See docs/DECISIONS.md — 002 for rationale.

Map Component

Shared component in packages/ui/map/. Used by both products with different configurations.

⚠️ Critical implementation notes

County labels use SVG paint-order halo, not white rect badges:

html
<text
  fill="#1A1A1A"
  stroke="#FFFFFF"
  stroke-width="3"
  paint-order="stroke fill"
>
  County Name
</text>

County geometry: Source from US Census TIGER/Line shapefiles (simplified with Mapshaper). GeoJSON stored in /public/geo/. The Figma mock uses a rectangle grid placeholder — do not replicate this in code. See docs/DECISIONS.md — 006.

Map configuration by product
Config	Care Console	Care Compass
Pins	Yes — caregiver locations	No
Selected county highlight	Yes — thick dark border	No
Hover tooltip	County + unassigned count	County + agency count
Legend items	6 (including Care desert)	3 (No agencies / Some / Well served)
Position in layout	Center zone (always visible)	Bottom of page (optional context)
Docs
File	Contents
docs/design-system.md	Token tables, color roles, typography, spacing, button tiers
docs/DECISIONS.md	Non-obvious decisions with rationale and rejected alternatives
docs/builder-handoff.md	Full CSS specs, component code, accessibility checklist, open items
Open Items
#	Item	Screen
A	Replace Figma rect map labels with SVG halo text	Both
B	Replace rectangle choropleth with real county polygon geometry	Both
C	Flag CTA confirmation state not yet mocked	Compass
D	Caveat text contrast — confirm 
#767676 in computed styles	Compass
Contributing

When making a non-obvious design or build decision, add an entry to docs/DECISIONS.md before opening a PR. Format: decision → rationale → what was considered and rejected.

Do not introduce new color values without updating packages/ui/tokens/tokens.css and docs/design-system.md. No hardcoded hex values in component files.

The main changes: expanded the Solution section so it actually describes both doors with the same specificity as the Problem section, and trimmed the redundant phrasing in a few spots. Everything else is your existing structure, preserved as-is.


