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
  if (pin.type === 'signal') {
    return L.divIcon({
      className: '',
      html: `<div class="map-pin map-pin--signal" aria-label="Demand signal"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.4"/><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.4"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></svg></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
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
  dimmedPinIds,
  colorScale,
  panelContent,
  isLoading,
  dataSource,
  disclaimerText,
  geojsonData,
}: MapEngineProps) {
  const mapRef          = useRef<HTMLDivElement>(null)
  const leafletRef      = useRef<L.Map | null>(null)
  const geoLayerRef     = useRef<L.GeoJSON | null>(null)
  const pinLayerRef     = useRef<L.LayerGroup | null>(null)
  // Tracks the layer whose tooltip is currently open so we can close it
  // before the next layer's tooltip opens — prevents stacked tooltips at borders.
  const activeLayerRef  = useRef<L.Path | null>(null)

  // ── Mount map once ──────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return

    leafletRef.current = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
      minZoom: 4,
    }).setView([37.8, -96], 4)

    geoLayerRef.current = L.geoJSON(undefined, {
      style: () => ({ weight: 0.5, color: '#888', fillOpacity: 0.75 }),
    }).addTo(leafletRef.current)

    pinLayerRef.current = L.layerGroup().addTo(leafletRef.current)

    const handleMoveStart = () => {
      activeLayerRef.current?.closeTooltip()
      activeLayerRef.current = null
    }
    leafletRef.current.on('movestart', handleMoveStart)

    return () => {
      leafletRef.current?.off('movestart', handleMoveStart)
      leafletRef.current?.remove()
      leafletRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Invalidate size when container resizes ──────────────────────
  useEffect(() => {
    if (!leafletRef.current) return
    const observer = new ResizeObserver(() => {
      leafletRef.current?.invalidateSize()
    })
    if (mapRef.current) {
      observer.observe(mapRef.current)
    }
    return () => observer.disconnect()
  }, [])

  // ── Load GeoJSON boundaries + bind tooltips and clicks ──────────
  useEffect(() => {
    if (!geoLayerRef.current || !geojsonData) return
    geoLayerRef.current.clearLayers()
    geoLayerRef.current.addData(geojsonData)
    geoLayerRef.current.eachLayer(layer => {
      const gl  = layer as L.Path
      const f   = (gl as unknown as { feature?: GeoJSON.Feature }).feature
      const fips = (f?.properties?.STATE ?? '') + (f?.properties?.COUNTY ?? '')
      const county = counties.find(c => c.fips === fips)
      if (county) {
        gl.bindTooltip(
          `<strong>${county.tooltip.headline}</strong>` +
          (county.tooltip.stats.length > 0
            ? '<br/>' + county.tooltip.stats.map(s => `${s.label}: ${s.value}`).join('<br/>')
            : ''),
          { sticky: true }
        )
      }
      gl.on('mouseover', () => {
        if (activeLayerRef.current && activeLayerRef.current !== gl) {
          activeLayerRef.current.closeTooltip()
        }
        activeLayerRef.current = gl
      })
      gl.on('mouseout', () => {
        if (activeLayerRef.current === gl) activeLayerRef.current = null
      })
      gl.on('click', () => onCountyClick(fips))
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
      gl.off('mouseover')
      gl.off('mouseout')
      gl.on('click', () => onCountyClick(fips))
      gl.on('mouseover', () => {
        if (activeLayerRef.current && activeLayerRef.current !== gl) {
          activeLayerRef.current.closeTooltip()
        }
        activeLayerRef.current = gl
      })
      gl.on('mouseout', () => {
        if (activeLayerRef.current === gl) activeLayerRef.current = null
      })

      if (county) {
        gl.unbindTooltip()
        gl.bindTooltip(
          `<strong>${county.tooltip.headline}</strong>` +
          (county.tooltip.stats.length > 0
            ? '<br/>' + county.tooltip.stats.map(s => `${s.label}: ${s.value}`).join('<br/>')
            : ''),
          { sticky: true }
        )
      }
    })
  }, [counties, colorScale, geojsonData, onCountyClick]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Highlight focused county ────────────────────────────────────
  useEffect(() => {
    if (!geoLayerRef.current) return

    geoLayerRef.current.eachLayer(layer => {
      const gl    = layer as L.Path
      const fips  = ((layer as unknown as { feature: GeoJSON.Feature }).feature?.properties?.STATE ?? '') + ((layer as unknown as { feature: GeoJSON.Feature }).feature?.properties?.COUNTY ?? '')
      gl.setStyle({ weight: fips === focusedCountyFips ? 2.5 : 0.5 })
    })
  }, [focusedCountyFips])

  // ── Auto-zoom to focused county ─────────────────────────────────
  useEffect(() => {
    if (!leafletRef.current || !geoLayerRef.current) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (focusedCountyFips === null) {
      if (reducedMotion) {
        leafletRef.current.setView([37.8, -96], 4)
      } else {
        leafletRef.current.flyTo([37.8, -96], 4)
      }
      return
    }

    let found = false
    geoLayerRef.current.eachLayer(layer => {
      if (found) return
      const gl   = layer as L.Path
      const fips = ((layer as unknown as { feature: GeoJSON.Feature }).feature?.properties?.STATE ?? '') +
                   ((layer as unknown as { feature: GeoJSON.Feature }).feature?.properties?.COUNTY ?? '')
      if (fips !== focusedCountyFips) return
      found = true
      const bounds = (gl as unknown as L.GeoJSON).getBounds?.()
      if (!bounds?.isValid()) return
      const rawZoom = leafletRef.current!.getBoundsZoom(bounds, false)
      const zoom    = Math.min(Math.max(rawZoom, 9), 10)
      const center  = bounds.getCenter()
      if (reducedMotion) {
        leafletRef.current!.setView(center, zoom)
      } else {
        leafletRef.current!.flyTo(center, zoom)
      }
    })
  }, [focusedCountyFips]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Render overlay pins ─────────────────────────────────────────
  useEffect(() => {
    if (!pinLayerRef.current) return

    pinLayerRef.current.clearLayers()

    const dimmedSet = new Set(dimmedPinIds ?? [])
    overlayPins.forEach(pin => {
      const marker = L.marker([pin.lat, pin.lng], {
        icon:    makePinIcon(pin),
        opacity: dimmedSet.has(pin.id) ? 0.3 : 1,
      })
      if (pin.label) {
        marker.bindTooltip(pin.label, { direction: 'top' })
      }
      pinLayerRef.current!.addLayer(marker)
    })
  }, [overlayPins, dimmedPinIds])

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="map-engine-outer">
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
          {mode !== 'coordinator' && (
            <>
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
            </>
          )}
          {mode === 'coordinator' && (
            <>
              <div className="map-engine-legend__item">
                <span className="map-engine-legend__pin map-engine-legend__pin--caregiver" />
                <span>Available aide</span>
              </div>
              <div className="map-engine-legend__item">
                <span className="map-engine-legend__pin map-engine-legend__pin--client" />
                <span>Unassigned client</span>
              </div>
              <div className="map-engine-legend__item">
                <span className="map-engine-legend__pin map-engine-legend__pin--signal" />
                <span>Demand signal</span>
              </div>
            </>
          )}
        </div>

      </div>

      {/* Disclaimer — below map in normal document flow */}
      <div className="map-engine-disclaimer">
        {disclaimerText ?? DEFAULT_DISCLAIMERS[dataSource]}
      </div>

    </div>
  )
}
