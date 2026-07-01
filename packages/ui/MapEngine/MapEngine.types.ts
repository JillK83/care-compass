// packages/ui/MapEngine/MapEngine.types.ts
// SOURCE OF TRUTH — do not redefine these in apps/compass or apps/console.
// Any change requires sign-off from both Jillian and Lee.
// See MapEngine_Interface_Contract.md § 10 for change protocol.

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
  geojsonData?:       GeoJSON.FeatureCollection
}
