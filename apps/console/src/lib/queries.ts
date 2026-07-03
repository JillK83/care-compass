import { supabase } from './supabase'
import type { ClientProfile, CaregiverProfile } from 'utils'

export async function getUnassignedClientsByCounty(countyFips: string): Promise<ClientProfile[]> {
  const { data, error } = await supabase
    .from('client_profiles')
    .select('id, name, preferred_language, county_fips, zip_input')
    .eq('county_fips', countyFips)
    .eq('is_assigned', false)

  if (error) throw new Error(`getUnassignedClientsByCounty failed: ${error.message}`)
  return (data ?? []) as ClientProfile[]
}

export async function getAvailableCaregiversByCounty(countyFips: string): Promise<CaregiverProfile[]> {
  const { data, error } = await supabase
    .from('caregiver_profiles')
    .select('id, name, languages, skills, is_available, county_fips, zip_input')
    .eq('county_fips', countyFips)
    .eq('is_available', true)

  if (error) throw new Error(`getAvailableCaregiversByCounty failed: ${error.message}`)
  return (data ?? []) as CaregiverProfile[]
}

export async function getSignalCountsByCounty(): Promise<
  { countyFips: string; count: number; zip: string | null }[]
> {
  const { data, error } = await supabase
    .from('demand_signals')
    .select('county_fips, zip')

  if (error) throw new Error(`getSignalCountsByCounty failed: ${error.message}`)

  // Group in JS — PostgREST FILTER-COUNT is not trivially composable for anon callers
  const byCounty = new Map<string, { count: number; zip: string | null }>()
  for (const row of data ?? []) {
    if (!row.county_fips) continue
    const entry = byCounty.get(row.county_fips) ?? { count: 0, zip: row.zip ?? null }
    entry.count++
    byCounty.set(row.county_fips, entry)
  }

  return Array.from(byCounty.entries()).map(([countyFips, { count, zip }]) => ({
    countyFips,
    count,
    zip,
  }))
}
