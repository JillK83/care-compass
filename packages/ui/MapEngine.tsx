import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import type { MapEngineProps } from './MapEngine.types'
import './MapEngine.css'

const DEFAULT_DISCLAIMERS: Record<string, string> = {
  static: 'Data from CMS and US Census. Home health agencies only. Counts reflect agency billing location, not service area.',
  live:   'Demo data — not real agencies or clients.',
}

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
}: MapEngineProps) {
  const mapRef     = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return
    leafletRef.current = L.map(mapRef.current).setView([37.8, -96], 4)
    // County GeoJSON layer, tooltip binding, pin overlay, click handlers — Day 3
  }, [])

  // Scaffold: all props used in Day 3 implementation
  void mode; void counties; void focusedCountyFips; void onCountyClick
  void overlayPins; void colorScale; void isLoading

  return (
    <div className="map-engine-wrapper">
      <div ref={mapRef} className="map-canvas" />
      {panelContent && (
        <div className="map-panel">
          {panelContent}
        </div>
      )}
      <div className="map-disclaimer">
        {disclaimerText ?? DEFAULT_DISCLAIMERS[dataSource]}
      </div>
    </div>
  )
}
