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
