let crosswalkIndex: Record<string, string> = {}

export function loadCrosswalk(rows: Array<{ zip: string; county_fips: string }>) {
  crosswalkIndex = Object.fromEntries(rows.map(r => [r.zip.trim(), r.county_fips.trim()]))
}

export function zipToCountyFips(zip: string): string | null {
  // Strip non-digits, take first 5 (handles ZIP+4 like "85145-1234"), pad for leading zeros
  const normalized = zip.trim().replace(/\D/g, '').slice(0, 5).padStart(5, '0')
  if (normalized.length !== 5) return null
  return crosswalkIndex[normalized] ?? null
}
