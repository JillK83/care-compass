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
  const maxDensity = Math.max(...rows.map(r => r.per_1k_seniors), 0.001)

  return rows.map(r => {
    const fillValue = r.per_1k_seniors / maxDensity

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
        headline: `${r.county}, ${r.state}`,
        stats: [
          { label: 'Home health agencies',    value: String(r.agencies) },
          { label: 'Agencies per 1k seniors', value: r.per_1k_seniors.toFixed(1) },
          { label: 'Senior population',       value: r.seniors.toLocaleString() },
        ],
        caveat: 'Counts reflect agency billing location, not service area. CMS 2023 data.',
      },
    }
  })
}
