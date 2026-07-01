// Column names match home_care_by_county.csv exactly — do not rename.
interface RawCountyRow {
  fips: string
  county: string
  state: string
  seniors: number
  agencies: number
  per_1k_seniors: number
  is_desert: string   // CSV delivers "True" / "False" as strings
}

export function computeFillValues(rows: RawCountyRow[]) {
  const sorted = [...rows.map(r => r.per_1k_seniors)].sort((a, b) => a - b)
  const cap = Math.max(sorted[Math.floor(sorted.length * 0.95)] ?? 0.001, 0.001)

  return rows.map(r => {
    const fillValue = Math.min(r.per_1k_seniors / cap, 1.0)

    return {
      fips:                 r.fips,
      name:                 r.county,
      state:                r.state,
      fillValue,
      agencyCount:          r.agencies,
      agenciesPer1kSeniors: r.per_1k_seniors,
      seniorPopulation:     r.seniors,
      isDesert:             r.is_desert === 'True',
      tooltip: {
        headline: r.is_desert === 'True'
          ? `Care desert — ${r.agencies} ${r.agencies === 1 ? 'agency' : 'agencies'}`
          : `${r.county}, ${r.state}`,
        stats: [
          { label: 'Home health agencies',    value: String(r.agencies) },
          { label: 'Agencies per 100k seniors', value: (r.per_1k_seniors * 100).toFixed(1) },
          { label: 'Senior population',       value: r.seniors.toLocaleString() },
        ],
        caveat: 'Counts reflect agency billing location, not service area. CMS 2023 data.',
      },
    }
  })
}
