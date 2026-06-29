# MapEngine Interface Contract

*Care Compass Platform · Version 1.0 · June 2026*

This is the single source of truth for the shared `MapEngine` React component in `packages/ui`. Both `apps/compass` (Door 1) and `apps/console` (Door 2) render through this component. The contract is locked after Day 1 scaffold.

**Any change to this file or `MapEngine.types.ts` requires sign-off from both Jillian and Lee before implementation. Minimum 2-hour review window before a PR is opened.**

---

## 1. Ownership

| Surface | Owner | Data path |
|---|---|---|
| `apps/compass` (Door 1) | Lee | Static CSV → `computeFillValues()` → `CountyFeature[]` → MapEngine |
| `apps/console` (Door 2) | Jillian | Supabase → aggregate query → `CountyFeature[]` + `OverlayPin[]` → MapEngine |
| `packages/ui/MapEngine` | Both — joint sign-off required | Interface contract only |
| `packages/utils` | Both — joint sign-off required | Shared utilities only |

MapEngine is auth-agnostic. It renders whatever data it receives. Auth lives in the route wrapper, never inside the component.

---

## 2. TypeScript Interfaces

These live in `packages/ui/MapEngine.types.ts`. Do not redefine them inside either app directory.

```ts
// ─── County data ─────────────────────────────────────────────────

export interface CountyFeature {
  fips:      string         // 5-digit FIPS e.g. "04013" = Maricopa, AZ
  name:      string         // "Maricopa County"
  state:     string         // "AZ"
  fillValue: number         // 0.0–1.0  (0 = deepest desert, 1 = well-served)
  tooltip:   CountyTooltip
}

export interface CountyTooltip {
  headline:  string         // "Care desert — 0 agencies"
  stats:     TooltipStat[]
  caveat:    string         // always: "Counts are by agency location, home health only"
}

export interface TooltipStat {
  label: string             // "Agencies based here"
  value: string             // "0" | "3" | "12"
}

// ─── Overlay pins ────────────────────────────────────────────────

export type PinType   = "caregiver" | "signal" | "client"
export type PinStatus = "available" | "unavailable" | "unknown" | "unassigned"

export interface OverlayPin {
  id:          string
  lat:         number
  lng:         number
  type:        PinType
  label?:      string       // initials only e.g. "M.R." — NEVER full name or address
                            // omit entirely for signal pins (no person attached)
  status?:     PinStatus
  countyFips:  string
}

// ─── Color scale ─────────────────────────────────────────────────

export interface ColorScale {
  low:    string            // deepest desert  → "#C0392B"  (--red-critical)
  mid:    string            // moderate gap    → "#E67E22"  (--orange-gap)
  high:   string            // well served     → "#27AE60"  (--green-served)
  noData: string            // not in dataset  → "#D3D1C7"  (--gray-no-data)
}

export const DEFAULT_COLOR_SCALE: ColorScale = {
  low:    '#C0392B',
  mid:    '#E67E22',
  high:   '#27AE60',
  noData: '#D3D1C7',
}

// ─── Component props ─────────────────────────────────────────────

export type MapMode    = "consumer" | "coordinator"
export type DataSource = "static" | "live"
//  "static" → Door 1, CSV data, shows CMS/Census vintage disclaimer
//  "live"   → Door 2, Supabase demo data, shows demo data disclaimer

export interface MapEngineProps {
  mode:               MapMode
  counties:           CountyFeature[]
  focusedCountyFips:  string | null
  onCountyClick:      (fips: string) => void
  overlayPins:        OverlayPin[]
  colorScale:         ColorScale
  panelContent:       React.ReactNode | null
  isLoading:          boolean
  dataSource:         DataSource
  disclaimerText:     string | null   // null = use default for dataSource
}
```

---

## 3. What MapEngine owns internally

```
MapEngine responsibility              Not MapEngine's responsibility
────────────────────────────────────  ────────────────────────────────────
Leaflet map instance + lifecycle      Data fetching
County polygon rendering              Panel content
fillValue → hex color mapping         Auth state
Hover tooltip (county name + stats)   Assignment logic
County click → onCountyClick()        Resource link routing
Focused county highlight border       "I need care here" button
OverlayPin dot rendering              Nearest county computation
Pin tooltip on hover                  Demand signal storage
Loading skeleton overlay              ZIP-to-county crosswalk
Disclaimer footer (always shown)
Color legend (always visible)
Zoom / pan controls
```

MapEngine never fetches data. It never reads from Supabase. It never reads from CSV. It receives fully-formed `CountyFeature[]` and renders them.

---

## 4. Usage by door

### Door 1 — Lee (`apps/compass`)

```tsx
// apps/compass/pages/compass.tsx
// Public route — no auth wrapper required

const [counties, setCounties] = useState<CountyFeature[]>([])
const [focused, setFocused] = useState<string | null>(null)

// Lee's data path:
// home_care_by_county.csv → computeFillValues() → CountyFeature[]
// No Supabase, no auth, no overlay pins

<MapEngine
  mode="consumer"
  counties={counties}
  focusedCountyFips={focused}
  onCountyClick={(fips) => setFocused(fips)}
  overlayPins={[]}                  // no pins on consumer map
  colorScale={DEFAULT_COLOR_SCALE}
  panelContent={
    focused
      ? <ResourcePanel fips={focused} counties={counties} />
      : null
  }
  isLoading={isLoading}
  dataSource="static"
  disclaimerText={null}             // uses default CMS/Census disclaimer
/>
```

### Door 2 — Jillian (`apps/console`)

```tsx
// apps/console/pages/map.tsx
// Protected route — redirect to login if no Supabase session

const [counties, setCounties]   = useState<CountyFeature[]>([])
const [focused, setFocused]     = useState<string | null>(null)
const [pins, setPins]           = useState<OverlayPin[]>([])

// Jillian's data path:
// Supabase client_profiles + caregiver_profiles
// → aggregate query by county_fips → CountyFeature[]
// + caregiver lat/lng + demand signal lat/lng → OverlayPin[]

<MapEngine
  mode="coordinator"
  counties={counties}
  focusedCountyFips={focused}
  onCountyClick={(fips) => setFocused(fips)}
  overlayPins={pins}                // caregiver pins + signal pins
  colorScale={DEFAULT_COLOR_SCALE}
  panelContent={
    focused
      ? <AssignmentPanel fips={focused} onAssign={handleAssign} />
      : null
  }
  isLoading={isLoading}
  dataSource="live"
  disclaimerText={null}             // uses default demo disclaimer
/>
```

---

## 5. Pin construction patterns

### Caregiver pin (Door 2 only)

```ts
// label is populated — caregiver has a person attached
const caregiverPin: OverlayPin = {
  id:         row.id,
  lat:        row.lat,
  lng:        row.lng,
  type:       'caregiver',
  label:      getInitials(row.name),  // "M.R." — initials only, never full name
  status:     row.availability_status,
  countyFips: row.county_fips,
}
```

### Signal pin (Door 2 only — demand signal from Door 1)

```ts
// label is omitted — signal pin has no person attached
const signalPin: OverlayPin = {
  id:         row.id,
  lat:        row.lat,
  lng:        row.lng,
  type:       'signal',
  // no label field — correct per interface (label?: string)
  countyFips: row.county_fips,
}
```

### Null check pattern inside MapEngine pin renderer

```ts
// MapEngine must handle missing label — render signal icon when absent
const renderPin = (pin: OverlayPin) => {
  if (pin.label) {
    return renderInitialsMarker(pin.label, pin.type, pin.status)
  }
  return renderSignalMarker(pin.countyFips)
}
```

---

## 6. Supabase aggregate query (Door 2)

This query produces the data Jillian maps to `CountyFeature[]`. Do not restructure the query shape without updating `CountyFeature` and notifying Lee.

```sql
SELECT
  cp.county_fips                          AS fips,
  cp.county_name                          AS name,
  cp.state_abbr                           AS state,
  COUNT(*)  FILTER (WHERE cp.assigned_caregiver_id IS NULL)
                                          AS unassigned_count,
  COUNT(*)                                AS total_clients
FROM public.client_profiles cp
GROUP BY cp.county_fips, cp.county_name, cp.state_abbr
ORDER BY unassigned_count DESC;
```

`fillValue` is derived from `unassigned_count` after the query returns — use `computeFillValues()` from `packages/utils` to normalize to 0.0–1.0 scale.

---

## 7. Shared utility functions (`packages/utils`)

Lee writes these. Jillian imports as needed. Neither door reimplements them.

### `computeFillValues(raw)`

Normalizes raw county data to `CountyFeature[]` with `fillValue` on 0.0–1.0 scale.

```ts
// packages/utils/computeFillValues.ts
export function computeFillValues(
  raw: CMSCountyRow[]
): CountyFeature[]
```

### `zipToCountyFips(zip)`

Crosswalks a ZIP code string to a 5-digit county FIPS. Returns `null` if ZIP is not found.

```ts
// packages/utils/zipToCountyFips.ts
export function zipToCountyFips(
  zip: string
): string | null
```

### `getNearestCountiesWithAgencies(fips, allCounties, adjacency)`

Returns up to 3 adjacent non-desert counties ordered by agency count descending. Used by Door 1 ResourcePanel when the family's county is a desert.

```ts
// packages/utils/getNearestCountiesWithAgencies.ts
export function getNearestCountiesWithAgencies(
  fips:       string,
  allCounties: CountyFeature[],
  adjacency:  Record<string, string[]>
): CountyFeature[]
```

### `getInitials(name)`

Derives display initials from a caregiver name string. Used when constructing `OverlayPin.label`.

```ts
// packages/utils/getInitials.ts
export function getInitials(name: string): string
// "Maria Rodriguez" → "M.R."
// "Lee" → "L."
```

---

## 8. Shared asset paths

All geo assets live in `/shared/assets`. Neither app fetches them from an external URL at runtime.

| File | Path | Used by |
|---|---|---|
| County boundaries | `packages/utils/assets/us-counties-20m.geojson` | MapEngine (both doors) |
| County adjacency | `packages/utils/assets/county-adjacency.csv` | `getNearestCountiesWithAgencies()` |
| ZIP crosswalk | `packages/utils/assets/zip-county-crosswalk.csv` | `zipToCountyFips()` (both doors) |
| Door 1 data | `packages/utils/assets/home_care_by_county.csv` | Door 1 only — built by Lee Day 1 from CMS + Census ACS |

---

## 9. Route and auth enforcement

| Route | Auth required | Mode | DataSource |
|---|---|---|---|
| `/compass` | No | `"consumer"` | `"static"` |
| `/map` | Yes (Supabase session) | `"coordinator"` | `"live"` |

Auth check lives in the route wrapper in `apps/console`, not inside MapEngine. MapEngine is completely auth-agnostic. A bug in auth never leaks coordinator data through the component itself.

No Supabase import may appear anywhere in `apps/compass`. No coordinator data, client data, or caregiver data may be exposed on the `/compass` route, including in error states.

---

## 10. Change protocol

This contract is locked after the Day 1 scaffold commit.

**To propose a change:**
1. Open a GitHub issue or PR describing the proposed change and why
2. Tag both Jillian and Lee for review
3. Minimum 2-hour review window before merging
4. Both builders must explicitly approve — one approval is not enough
5. Update `MapEngine.types.ts`, this file, and `DECISIONS.md` (add an A-series entry) in the same commit
6. Both builders pull and verify their door still builds before continuing parallel work

**Never:**
- Modify `MapEngine.types.ts` without updating this file in the same commit
- Add a prop to MapEngine without updating both usage examples in Section 4
- Change the `CountyFeature` shape without notifying the other builder — the Supabase query in Section 6 depends on it
