// packages/ui/MapEngine/MapEngine.tsx
// Shared map component — used by both Door 1 (apps/compass) and Door 2 (apps/console).
// Auth-agnostic. Never fetches data. Renders what it receives.
// Interface contract: MapEngine_Interface_Contract.md

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { MapEngineProps, OverlayPin, ColorScale, CountyFeature } from './MapEngine.types'
import './MapEngine.css'

const DEFAULT_DISCLAIMERS: Record<string, string> = {
  static: 'Data from CMS and US Census. Home health agencies only. Counts reflect agency billing location, not service area.',
  live:   'Demo data — not real agencies or clients.',
}

// ─── Color helpers ───────────────────────────────────────────────

function fillValueToHex(fillValue: number, colorScale: ColorScale): string {
  if (fillValue < 0)    return colorScale.noData
  if (fillValue < 0.05) return colorScale.low   // 0 agencies or near-zero
  if (fillValue < 0.25) return colorScale.mid   // below-average coverage
  return colorScale.high                         // above p75 relative to p95 cap
}

// ─── Pin rendering ───────────────────────────────────────────────

function makePinIcon(pin: OverlayPin): L.DivIcon {
  // Signal pins: no label, render as a demand signal dot
  if (!pin.label) {
    return L.divIcon({
      className: '',
      html: `<div class="map-pin map-pin--signal" aria-label="Demand signal"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    })
  }
  // Caregiver / client pins: show initials
  return L.divIcon({
    className: '',
    html: `<div class="map-pin map-pin--${pin.type} map-pin--${pin.status ?? 'unknown'}" aria-label="${pin.label}">${pin.label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

// ─── Component ───────────────────────────────────────────────────

export function MapEngine({
  mode,
  counties,
  focusedCountyFips,
  onCountyClick,
  overlayPins,
  colorScale,
  panelContent,
  isLoading,
  dataSource,
  disclaimerText,
  geojsonData,
}: MapEngineProps) {
  const mapRef     = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<L.Map | null>(null)
  const geoLayerRef = useRef<L.GeoJSON | null>(null)
  const pinLayerRef = useRef<L.LayerGroup | null>(null)

  // ── Mount map once ──────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return

    leafletRef.current = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([37.8, -96], 4)

    geoLayerRef.current = L.geoJSON(undefined, {
      style: () => ({ weight: 0.5, color: '#888', fillOpacity: 0.75 }),
    }).addTo(leafletRef.current)

    pinLayerRef.current = L.layerGroup().addTo(leafletRef.current)

    return () => {
      leafletRef.current?.remove()
      leafletRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load GeoJSON boundaries + bind tooltips and clicks ──────────
  useEffect(() => {
    if (!geoLayerRef.current || !geojsonData) return
    geoLayerRef.current.clearLayers()
    geoLayerRef.current.addData(geojsonData)
    geoLayerRef.current.eachLayer(layer => {
      const f = (layer as unknown as { feature?: GeoJSON.Feature }).feature
      const fips = (f?.properties?.STATE ?? '') + (f?.properties?.COUNTY ?? '')
      const county = counties.find(c => c.fips === fips)
      if (county) {
        (layer as L.Layer).bindTooltip(
          `<strong>${county.tooltip.headline}</strong><br/>` +
          county.tooltip.stats.map(s => `${s.label}: ${s.value}`).join('<br/>') +
          `<br/><em>${county.tooltip.caveat}</em>`,
          { sticky: true }
        )
      }
      layer.on('click', () => onCountyClick(fips))
    })
  }, [geojsonData, counties, onCountyClick]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update county fills and tooltips when data changes ─────────
  useEffect(() => {
    if (!geoLayerRef.current || counties.length === 0) return

    geoLayerRef.current.setStyle(feature => {
      const fips   = (feature?.properties?.STATE ?? '') + (feature?.properties?.COUNTY ?? '')
      const county = counties.find(c => c.fips === fips)
      const fill   = county ? fillValueToHex(county.fillValue, colorScale) : colorScale.noData
      return { fillColor: fill }
    })

    geoLayerRef.current.eachLayer(layer => {
      const gl    = layer as L.Path
      const fips  = ((layer as unknown as { feature: GeoJSON.Feature }).feature?.properties?.STATE ?? '') + ((layer as unknown as { feature: GeoJSON.Feature }).feature?.properties?.COUNTY ?? '')
      const county = counties.find(c => c.fips === fips)

      gl.off('click')
      gl.on('click', () => onCountyClick(fips))

      if (county) {
        gl.unbindTooltip()
        gl.bindTooltip(
          `<strong>${county.tooltip.headline}</strong><br/>` +
          county.tooltip.stats.map(s => `${s.label}: ${s.value}`).join('<br/>') +
          `<br/><em>${county.tooltip.caveat}</em>`,
          { sticky: true }
        )
      }
    })
  }, [counties, colorScale, geojsonData])

  // ── Highlight focused county ────────────────────────────────────
  useEffect(() => {
    if (!geoLayerRef.current) return

    geoLayerRef.current.eachLayer(layer => {
      const gl    = layer as L.Path
      const fips  = ((layer as unknown as { feature: GeoJSON.Feature }).feature?.properties?.STATE ?? '') + ((layer as unknown as { feature: GeoJSON.Feature }).feature?.properties?.COUNTY ?? '')
      gl.setStyle({ weight: fips === focusedCountyFips ? 2.5 : 0.5 })
    })
  }, [focusedCountyFips])

  // ── Render overlay pins ─────────────────────────────────────────
  useEffect(() => {
    if (!pinLayerRef.current) return

    pinLayerRef.current.clearLayers()

    overlayPins.forEach(pin => {
      const marker = L.marker([pin.lat, pin.lng], { icon: makePinIcon(pin) })
      if (pin.label) {
        marker.bindTooltip(pin.label, { direction: 'top' })
      }
      pinLayerRef.current!.addLayer(marker)
    })
  }, [overlayPins])

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="map-engine-root">

      {/* Map canvas */}
      <div ref={mapRef} className="map-engine-canvas" />

      {/* Side panel — injected by parent */}
      {panelContent && (
        <div className="map-engine-panel">
          {panelContent}
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="map-engine-loading" aria-live="polite" aria-label="Map loading">
          <span>Loading map data…</span>
        </div>
      )}

      {/* Color legend — always visible, not hover-only (WCAG + PRD requirement) */}
      <div className="map-engine-legend" aria-label="Map legend">
        <div className="map-engine-legend__item">
          <span className="map-engine-legend__swatch" style={{ background: colorScale.low }} />
          <span>Care desert</span>
        </div>
        <div className="map-engine-legend__item">
          <span className="map-engine-legend__swatch" style={{ background: colorScale.mid }} />
          <span>Moderate gap</span>
        </div>
        <div className="map-engine-legend__item">
          <span className="map-engine-legend__swatch" style={{ background: colorScale.high }} />
          <span>Well served</span>
        </div>
        <div className="map-engine-legend__item">
          <span className="map-engine-legend__swatch" style={{ background: colorScale.noData }} />
          <span>No data</span>
        </div>
        {mode === 'coordinator' && (
          <>
            <div className="map-engine-legend__item">
              <span className="map-engine-legend__pin map-engine-legend__pin--caregiver" />
              <span>Available aide</span>
            </div>
            <div className="map-engine-legend__item">
              <span className="map-engine-legend__pin map-engine-legend__pin--signal" />
              <span>Demand signal</span>
            </div>
          </>
        )}
      </div>

      {/* Disclaimer — always shown */}
      <div className="map-engine-disclaimer">
        {disclaimerText ?? DEFAULT_DISCLAIMERS[dataSource]}
      </div>

    </div>
  )
}
