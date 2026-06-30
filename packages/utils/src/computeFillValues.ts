interface RawCountyRow {
  county_fips: string
  county_name: string
  state_abbr: string
  agency_count: number
  senior_population: number
  agencies_per_1k_seniors: number
}

/** Normalizes agency counts to a 0.0–1.0 fill scale across all counties.
 *  0.0 = zero agencies (care desert). 1.0 = highest agency count in dataset.
 *  Call once at app load after parsing home_care_by_county.csv. */
export function computeFillValues(rows: RawCountyRow[]) {
  const max = Math.max(...rows.map(r => r.agency_count), 1)

  return rows.map(r => ({
    fips:                 r.county_fips,
    name:                 r.county_name,
    state:                r.state_abbr,
    fillValue:            r.agency_count / max,
    agencyCount:          r.agency_count,
    agenciesPer1kSeniors: r.agencies_per_1k_seniors,
    seniorPopulation:     r.senior_population,
  }))
}
