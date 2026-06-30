/** Returns up to 3 adjacent non-desert counties ordered by agency count descending.
 *  Used by Door 1 ResourcePanel when the family's county is a care desert.
 *
 *  @param fips        FIPS of the desert county
 *  @param allCounties Full CountyFeature[] from computeFillValues() — searched for adjacent matches
 *  @param adjacency   Pre-indexed { [fips]: adjacentFips[] } — built from county-adjacency.csv */
export function getNearestCountiesWithAgencies(
  fips: string,
  allCounties: Array<{ fips: string; agencyCount?: number; [key: string]: unknown }>,
  adjacency: Record<string, string[]>,
  maxResults = 3,
) {
  const adjacentFips = new Set(adjacency[fips] ?? [])
  return allCounties
    .filter(c => adjacentFips.has(c.fips) && (c.agencyCount ?? 0) > 0)
    .sort((a, b) => (b.agencyCount ?? 0) - (a.agencyCount ?? 0))
    .slice(0, maxResults)
}
