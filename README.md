#Care Compass
Care Platform
A React monorepo containing two products built on a shared design system:

Care Console — internal coordinator tool for home health agency staff to manage client assignments and identify care deserts
Care Compass — public-facing consumer tool for families to find Medicare-certified home health agencies near them

Both products share a token system, component library, and choropleth map implementation. See /docs for design system, decisions log, and builder handoff reference.


Getting Started
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

│   ├── design-system.md  # PRD design system section

│   └── builder-handoff.md # Component specs and implementation notes

├── public/

│   └── geo/              # Arizona county GeoJSON / SVG path data

└── README.md


Products
Care Console
Audience: Home health agency coordinators (internal staff) URL: Internal — not publicly accessible Layout: Full-width three-zone desktop workspace — 220px sidebar / map canvas / 360px assignment panel Core workflow: Coordinator selects a county on the choropleth map → views unassigned clients and fit-ranked available aides → assigns aides to clients
Care Compass
Audience: Adult children and family members researching home care for an aging parent URL: Public-facing, no login required Layout: Centered single-column results page (max-width 780px) Core workflow: User enters ZIP code → sees agency count for their county → views nearest alternatives if zero → flags area as needing care


Shared Design System
Both products use the same token system. Tokens are declared in packages/ui/tokens/tokens.css and imported by both apps.
Key color tokens
Token
Hex
Role
--teal-primary
#0F6E56
Search CTA, links (Compass only)
--teal-deep
#1D4E5A
Nav active state (Console only)
--teal-action
#17383F
All action buttons (Assign, Flag)
--teal-light
#E1F5EE
Tag backgrounds, avatar fills, card surfaces
--red-critical
#C0392B
Care desert stat, result card accent
--green-served
#27AE60
Assigned state, served map fill
--orange-alert
#B5450A
Urgency badges only — never on buttons
--text-muted
#767676
Minimum text color on white — WCAG AA floor
--canvas
#F8F7F4
Page background
--surface
#FFFFFF
Card / panel background


Full token reference: docs/design-system.md
Typography
Inter throughout. Scale: 32px display / 24px hero / 16px heading / 14px body / 12px caption. No other typefaces in scope.
WCAG 2.1 AA
Both products are required to meet WCAG 2.1 AA. #9A9A9A fails on white and is restricted to decorative elements only. #767676 is the minimum for any text. See docs/DECISIONS.md — 002 for rationale.


Map Component
The choropleth map is a shared component in packages/ui/map/. It is used by both products with different configurations.
⚠️ Critical implementation notes
County label technique: Labels use SVG paint-order halo, not white rect badges. See docs/DECISIONS.md — 005.

<text

  fill="#1A1A1A"

  stroke="#FFFFFF"

  stroke-width="3"

  paint-order="stroke fill"

>

  County Name

</text>

County geometry: Real SVG path data or Mapbox/Leaflet embed required. The Figma mock uses a rectangle grid placeholder — do not replicate this in code. Source geometry from US Census TIGER/Line shapefiles (simplified with Mapshaper). GeoJSON stored in /public/geo/. See docs/DECISIONS.md — 006.
Map configuration by product
Config
Care Console
Care Compass
Pins
Yes — caregiver locations
No
Selected county highlight
Yes — thick dark border
No
Hover tooltip
County + unassigned count
County + agency count
Legend items
6 (including Care desert county)
3 (No agencies / Some / Well served)
Position in layout
Center zone (always visible)
Bottom of page (optional context)



Docs
File
Contents
Audience
docs/design-system.md
Token tables, color roles, typography, spacing, button tiers, screen constraints
PRD / stakeholders
docs/DECISIONS.md
Non-obvious design and build decisions with rationale and rejected alternatives
Developers, future contributors
docs/builder-handoff.md
Full CSS specs, component code, accessibility checklist, open items
Build reference — retire after initial build



Open Items
Four known gaps between the Figma mocks and build requirements. See docs/DECISIONS.md — Open Items for detail.

#
Item
Screen
A
Replace Figma rect map labels with SVG halo text
Both
B
Replace rectangle choropleth with real county polygon geometry
Both
C
Flag CTA confirmation state not yet mocked
Compass
D
Caveat text contrast — confirm #767676 in computed styles
Compass



Contributing
When making a non-obvious design or build decision, add an entry to docs/DECISIONS.md before opening a PR. Format: decision → rationale → what was considered and rejected.

Do not introduce new color values without updating packages/ui/tokens/tokens.css and docs/design-system.md. No hardcoded hex values in component files.

