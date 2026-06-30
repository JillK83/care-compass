let crosswalkIndex: Record<string, string> = {}

export function loadCrosswalk(rows: Array<{ zip: string; county_fips: string }>) {
  crosswalkIndex = Object.fromEntries(rows.map(r => [r.zip.trim(), r.county_fips.trim()]))
}

export function zipToCountyFips(zip: string): string | null {
  const normalized = zip.trim().replace(/\D/g, '').padStart(5, '0')
  if (normalized.length !== 5) return null
  return crosswalkIndex[normalized] ?? null
}
