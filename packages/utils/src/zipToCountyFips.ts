// Crosswalk is loaded once at app startup and held in module scope.
// Call loadCrosswalk() before any zipToCountyFips() calls.
let crosswalkIndex: Record<string, string> = {}

export function loadCrosswalk(rows: Array<{ zip: string; county_fips: string }>) {
  crosswalkIndex = Object.fromEntries(rows.map(r => [r.zip, r.county_fips]))
}

/** Crosswalks a ZIP code string to a 5-digit county FIPS.
 *  Returns null if ZIP is not found in the crosswalk.
 *  ZIPs spanning multiple counties resolve to the primary county per the crosswalk file. */
export function zipToCountyFips(zip: string): string | null {
  return crosswalkIndex[zip.trim()] ?? null
}
