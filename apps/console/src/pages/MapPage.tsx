import { useState, useEffect } from 'react'
import type { FeatureCollection, Geometry, Polygon, MultiPolygon } from 'geojson'
import { supabase } from '../lib/supabase'
import { MapEngine, DEFAULT_COLOR_SCALE } from 'ui'
import type { CountyFeature, OverlayPin } from 'ui'
import { getInitials } from 'utils'
import type { ClientProfile, CaregiverProfile } from 'utils'
import { getSignalCountsByCounty } from '../lib/queries'

// ─── State FIPS → abbreviation ────────────────────────────────────────────────
const STATE_FIPS_TO_ABBR: Record<string, string> = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT',
  '10':'DE','11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL',
  '18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD',
  '25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE',
  '32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND',
  '39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD',
  '47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV',
  '55':'WI','56':'WY','72':'PR',
}

const NON_CONTINENTAL_STATE_FIPS = new Set([
  '02', // Alaska
  '15', // Hawaii
  '72', // Puerto Rico
  '66', // Guam
  '78', // US Virgin Islands
  '60', // American Samoa
  '69', // Northern Mariana Islands
])

// ─── Centroid helpers ─────────────────────────────────────────────────────────

type CentroidCache = Map<string, { lat: number; lng: number }>

function computeCentroid(geometry: Geometry): { lat: number; lng: number } | null {
  const rings: number[][][] = []
  if (geometry.type === 'Polygon') {
    rings.push((geometry as Polygon).coordinates[0])
  } else if (geometry.type === 'MultiPolygon') {
    for (const poly of (geometry as MultiPolygon).coordinates) rings.push(poly[0])
  }
  let sumLat = 0, sumLng = 0, count = 0
  for (const ring of rings) {
    for (const pos of ring) { sumLng += pos[0]; sumLat += pos[1]; count++ }
  }
  if (count === 0) return null
  return { lat: sumLat / count, lng: sumLng / count }
}

function buildCentroidCache(geoJson: FeatureCollection): CentroidCache {
  const cache: CentroidCache = new Map()
  for (const feat of geoJson.features) {
    if (!feat.geometry) continue
    const fips     = (feat.properties?.STATE ?? '') + (feat.properties?.COUNTY ?? '')
    const centroid = computeCentroid(feat.geometry)
    if (centroid) cache.set(fips, centroid)
  }
  return cache
}

// ─── ZIP jitter ───────────────────────────────────────────────────────────────
// DEMO APPROXIMATION: no real ZIP coordinates exist in the crosswalk data.
// This deterministic offset separates ZIPs visually for the demo only — not real geocoding.
// See DECISIONS.md pending entry.
const ZIP_OFFSETS = [
  { dlat:  0.16, dlng:  0.00 },
  { dlat:  0.11, dlng:  0.11 },
  { dlat:  0.00, dlng:  0.16 },
  { dlat: -0.11, dlng:  0.11 },
  { dlat: -0.16, dlng:  0.00 },
  { dlat: -0.11, dlng: -0.11 },
  { dlat:  0.00, dlng: -0.16 },
  { dlat:  0.11, dlng: -0.11 },
] as const

function zipHash(zip: string): number {
  return zip.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
}

function getZipPosition(
  zip: string | null,
  countyFips: string | null,
  centroids: CentroidCache,
  pinType: string,
): { lat: number; lng: number } | null {
  if (!countyFips) return null
  const centroid = centroids.get(countyFips)
  if (!centroid) return null
  if (!zip) return centroid
  const offset = ZIP_OFFSETS[zipHash(zip + pinType) % ZIP_OFFSETS.length]
  return {
    lat: centroid.lat + offset.dlat,
    lng: centroid.lng + offset.dlng,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MapPage() {
  const [counties,          setCounties]    = useState<CountyFeature[]>([])
  const [geojsonData,       setGeojsonData] = useState<FeatureCollection | null>(null)
  const [overlayPins,       setOverlayPins] = useState<OverlayPin[]>([])
  const [focusedCountyFips, setFocused]              = useState<string | null>(null)
  const [isLoading,         setIsLoading]             = useState(true)
  const [selectedCountyClients,    setSelectedCountyClients]    = useState<ClientProfile[]>([])
  const [selectedCountyCaregivers, setSelectedCountyCaregivers] = useState<CaregiverProfile[]>([])

  function handleCountyClick(fips: string) {
    setFocused(fips)
    Promise.all([
      supabase
        .from('client_profiles')
        .select('id, name, preferred_language, county_fips, zip_input')
        .eq('county_fips', fips)
        .eq('is_assigned', false),
      supabase
        .from('caregiver_profiles')
        .select('id, name, languages, skills, is_available, county_fips, zip_input')
        .eq('county_fips', fips)
        .eq('is_available', true),
    ]).then(([clientRes, caregiverRes]) => {
      if (clientRes.error) {
        console.warn('[MapPage] county clients fetch failed:', clientRes.error.message)
      } else {
        setSelectedCountyClients(clientRes.data ?? [])
      }
      if (caregiverRes.error) {
        console.warn('[MapPage] county caregivers fetch failed:', caregiverRes.error.message)
      } else {
        setSelectedCountyCaregivers(caregiverRes.data ?? [])
      }
    }).catch(e => {
      console.warn('[MapPage] county click fetch failed:', e)
    })
  }

  useEffect(() => {
    async function load() {
      try {
        const [
          geoJson,
          { data: clientRows,    error: clientErr    },
          { data: caregiverRows, error: caregiverErr },
          signalCounts,
        ] = await Promise.all([
          fetch('/assets/us-counties-20m.geojson').then(r => r.json() as Promise<FeatureCollection>),
          supabase.from('client_profiles').select('id, name, county_fips, zip_input, is_assigned').eq('is_assigned', false),
          supabase.from('caregiver_profiles').select('id, name, county_fips, zip_input').eq('is_available', true),
          getSignalCountsByCounty(),
        ])

        if (clientErr)    throw new Error(clientErr.message)
        if (caregiverErr) throw new Error(caregiverErr.message)

        geoJson.features = geoJson.features.filter(
          feat => !NON_CONTINENTAL_STATE_FIPS.has(feat.properties?.STATE ?? '')
        )

        setGeojsonData(geoJson)

        // Build centroid cache once — reused for all three pin types
        const centroids = buildCentroidCache(geoJson)

        // All counties get fillValue -1 → colorScale.noData (gray).
        // Boundaries are structural context on Door 2 — no metric coloring.
        const countyFeatures: CountyFeature[] = geoJson.features.map(feat => {
          const fips  = (feat.properties?.STATE ?? '') + (feat.properties?.COUNTY ?? '')
          const name  = `${feat.properties?.NAME ?? ''} ${feat.properties?.LSAD ?? ''}`.trim()
          const state = STATE_FIPS_TO_ABBR[feat.properties?.STATE ?? ''] ?? (feat.properties?.STATE ?? '')
          return {
            fips,
            name,
            state,
            fillValue: -1,
            tooltip: {
              headline: name,
              stats:    [],
              caveat:   'County boundaries — structural context only. No metric shown.',
            },
          }
        })
        setCounties(countyFeatures)

        const pins: OverlayPin[] = []

        // Client pins — unassigned only (is_assigned: false filter applied in query above)
        for (const client of clientRows ?? []) {
          const pos = getZipPosition(client.zip_input ?? null, client.county_fips ?? null, centroids, 'client')
          if (!pos) { console.warn('[MapPage] no position for client', client.id); continue }
          pins.push({
            id:         client.id,
            lat:        pos.lat,
            lng:        pos.lng,
            type:       'client',
            label:      getInitials(client.name ?? ''),
            status:     'unassigned',
            countyFips: client.county_fips ?? '',
          })
        }

        // Caregiver pins — available only (is_available filter applied in query above)
        for (const cg of caregiverRows ?? []) {
          const pos = getZipPosition(cg.zip_input ?? null, cg.county_fips ?? null, centroids, 'caregiver')
          if (!pos) { console.warn('[MapPage] no position for caregiver', cg.id); continue }
          pins.push({
            id:         cg.id,
            lat:        pos.lat,
            lng:        pos.lng,
            type:       'caregiver',
            label:      getInitials(cg.name ?? ''),
            status:     'available',
            countyFips: cg.county_fips ?? '',
          })
        }

        // Signal pins — one per county, positioned at ZIP if available
        // TEMP: label carries demand count. Per contract, signal pins omit label (no person attached).
        // Reusing label as count badge is a documented deviation — proper fix is OverlayPin.count
        // with Lee sign-off. See DECISIONS.md pending entry.
        for (const sig of signalCounts) {
          const pos = getZipPosition(sig.zip, sig.countyFips, centroids, 'signal')
          if (!pos) { console.warn('[MapPage] no position for signal county', sig.countyFips); continue }
          pins.push({
            id:         `signal-${sig.countyFips}`,
            lat:        pos.lat,
            lng:        pos.lng,
            type:       'signal',
            label:      String(sig.count),
            countyFips: sig.countyFips,
          })
        }

        setOverlayPins(pins)
      } catch (e) {
        console.error('[MapPage] load failed:', e)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  return (
    <div style={{
      height: '100%',
      borderRadius: 'var(--radius-card-console)',
      overflow: 'hidden',
      border: 'var(--border-width) solid var(--border)',
    }}>
      <MapEngine
        mode="coordinator"
        counties={counties}
        focusedCountyFips={focusedCountyFips}
        onCountyClick={handleCountyClick}
        overlayPins={overlayPins}
        colorScale={DEFAULT_COLOR_SCALE}
        panelContent={null}
        isLoading={isLoading}
        dataSource="live"
        disclaimerText={null}
        geojsonData={geojsonData ?? undefined}
      />
    </div>
  )
}
