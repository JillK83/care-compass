import { useState, useEffect, useRef } from 'react'
import type { FeatureCollection } from 'geojson'
import Papa from 'papaparse'
import './CompassPage.css'
import {
  computeFillValues,
  loadCrosswalk,
  loadAdjacency,
  zipToCountyFips,
  getNearestCountiesWithAgencies,
} from 'utils'
import { MapEngine, DEFAULT_COLOR_SCALE } from 'ui'
import type { CountyFeature } from 'ui'
import { ResourcePanel } from '../components/ResourcePanel'

// ── Types ────────────────────────────────────────────────────────

interface CountyRow {
  fips: string
  county: string
  state: string
  seniors: string
  agencies: string
  per_1k_seniors: string
  is_desert: string
}

interface CrosswalkRow {
  zip: string
  county_fips: string
}

interface AdjacencyRow {
  fips: string
  adjacent_fips: string
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error'

// ── Component ────────────────────────────────────────────────────

export function CompassPage() {
  const [loadState, setLoadState]     = useState<LoadState>('idle')
  const [counties, setCounties]       = useState<CountyFeature[]>([])
  const [geojsonData, setGeoJsonData] = useState<FeatureCollection | null>(null)
  const [zipInput, setZipInput]       = useState('')
  const [searchedZip, setSearchedZip] = useState('')
  const [focusedFips, setFocusedFips] = useState<string | null>(null)
  const [errorMsg, setErrorMsg]       = useState('')

  const allCountiesRef = useRef<ReturnType<typeof computeFillValues>>([])

  // ── Load CSVs once on mount ───────────────────────────────────
  useEffect(() => {
    setLoadState('loading')

    async function load() {
      try {
        const [countyText, crosswalkText, adjacencyText, geoJsonRaw] = await Promise.all([
          fetch('/assets/home_care_by_county.csv').then(r => r.text()),
          fetch('/assets/zip-county-crosswalk.csv').then(r => r.text()),
          fetch('/assets/county-adjacency.csv').then(r => r.text()),
          fetch('/assets/us-counties-20m.geojson').then(r => r.json()),
        ])

        const countyRows = Papa.parse<CountyRow>(countyText, {
          header: true, skipEmptyLines: true,
        }).data

        const crosswalkRows = Papa.parse<CrosswalkRow>(crosswalkText, {
          header: true, skipEmptyLines: true,
        }).data

        const adjacencyRows = Papa.parse<AdjacencyRow>(adjacencyText, {
          header: true, skipEmptyLines: true,
        }).data

        const parsed = countyRows.map(r => ({
          ...r,
          seniors:        Number(r.seniors),
          agencies:       Number(r.agencies),
          per_1k_seniors: Number(r.per_1k_seniors),
        }))

        const computed = computeFillValues(parsed)
        allCountiesRef.current = computed

        loadCrosswalk(crosswalkRows)
        loadAdjacency(adjacencyRows)

        const features: CountyFeature[] = computed.map(c => ({
          fips:      c.fips,
          name:      c.name,
          state:     c.state,
          fillValue: c.fillValue,
          tooltip:   c.tooltip,
        }))

        setCounties(features)
        setGeoJsonData(geoJsonRaw)
        setLoadState('ready')
      } catch (e) {
        console.error(e)
        setLoadState('error')
      }
    }

    load()
  }, [])

  // ── ZIP lookup ────────────────────────────────────────────────
  function handleSearch(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrorMsg('')

    const fips = zipToCountyFips(zipInput)
    if (!fips) {
      setErrorMsg('ZIP code not found. Try a 5-digit US ZIP.')
      return
    }

    setSearchedZip(zipInput.trim())
    setFocusedFips(fips)
  }

  // ── Derive result ─────────────────────────────────────────────
  const focusedCounty = focusedFips
    ? allCountiesRef.current.find(c => c.fips === focusedFips)
    : null

  const nearbyCounties = focusedFips && focusedCounty?.isDesert
    ? getNearestCountiesWithAgencies(focusedFips, allCountiesRef.current)
    : []

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="compass-page">

      {/* Hero */}
      <header className="compass-hero">
        <h1 className="compass-title">Care Compass</h1>
        <p className="compass-subtitle">Find home health care options near you</p>
      </header>

      {/* ZIP search */}
      <form className="zip-form" onSubmit={handleSearch} aria-label="ZIP code search">
        <label htmlFor="zip-input" className="zip-label">
          Enter your ZIP code
        </label>
        <div className="zip-row">
          <input
            id="zip-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{5}(-[0-9]{4})?"
            maxLength={10}
            placeholder="e.g. 85145"
            value={zipInput}
            onChange={e => setZipInput(e.target.value)}
            className="zip-input"
            aria-describedby={errorMsg ? 'zip-error' : undefined}
            disabled={loadState !== 'ready'}
          />
          <button
            type="submit"
            className="btn-search"
            disabled={loadState !== 'ready' || zipInput.trim().length < 5}
          >
            {loadState === 'loading' ? 'Loading…' : 'Find care'}
          </button>
        </div>
        {errorMsg && (
          <p id="zip-error" className="zip-error" role="alert">
            {errorMsg}{' '}
            <a
              href="https://eldercare.acl.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="zip-error-link"
            >
              Try Eldercare Locator instead
            </a>
          </p>
        )}
        {loadState === 'error' && (
          <p className="zip-error" role="alert">Failed to load data. Please refresh.</p>
        )}
      </form>

      {/* Result */}
      {focusedCounty && (
        <ResourcePanel
          countyName={focusedCounty.name}
          stateName={focusedCounty.state}
          isDesert={focusedCounty.isDesert}
          agencyCount={focusedCounty.agencyCount}
          agenciesPer1k={focusedCounty.agenciesPer1kSeniors}
          seniorPopulation={focusedCounty.seniorPopulation}
          searchedZip={searchedZip}
          countyFips={focusedFips ?? ''}
          nearbyCounties={nearbyCounties.map(c => ({
            fips:        c.fips,
            name:        c.name,
            state:       c.state,
            agencyCount: c.agencyCount ?? 0,
          }))}
        />
      )}

      {/* Map */}
      {loadState === 'ready' && (
        <section className="map-section" aria-label="Care desert map">
          <MapEngine
            mode="consumer"
            counties={counties}
            focusedCountyFips={focusedFips}
            onCountyClick={setFocusedFips}
            overlayPins={[]}
            colorScale={DEFAULT_COLOR_SCALE}
            panelContent={null}
            isLoading={false}
            dataSource="static"
            disclaimerText={null}
            geojsonData={geojsonData ?? undefined}
          />
        </section>
      )}

    </div>
  )
}
