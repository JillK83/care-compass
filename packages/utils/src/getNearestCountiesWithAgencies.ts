// Call loadAdjacency() once at app startup before getNearestCountiesWithAgencies().
let adjacencyIndex: Record<string, string[]> = {}

export function loadAdjacency(rows: Array<{ fips: string; adjacent_fips: string }>) {
  adjacencyIndex = {}
  for (const row of rows) {
    const f = row.fips.trim()
    const a = row.adjacent_fips.trim()
    if (!adjacencyIndex[f]) adjacencyIndex[f] = []
    adjacencyIndex[f].push(a)
  }
}

export function getNearestCountiesWithAgencies(
  fips: string,
  allCounties: Array<{ fips: string; name: string; state: string; agencyCount?: number }>,
  maxResults = 3,
) {
  const adjacentFips = new Set(adjacencyIndex[fips] ?? [])
  return allCounties
    .filter(c => adjacentFips.has(c.fips) && (c.agencyCount ?? 0) > 0)
    .sort((a, b) => (b.agencyCount ?? 0) - (a.agencyCount ?? 0))
    .slice(0, maxResults)
}
