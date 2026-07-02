// Manual query test — run from apps/console:
//   node --experimental-strip-types --env-file=.env.local scripts/test-queries.ts
//
// Cannot import src/lib/supabase.ts directly (uses import.meta.env, Vite-only).
// Creates its own client from process.env — same credentials, same queries.

import { createClient } from '@supabase/supabase-js'
import type { ClientProfile, CaregiverProfile } from 'utils'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — run with --env-file=.env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function getUnassignedClientsByCounty(countyFips: string): Promise<ClientProfile[]> {
  const { data, error } = await supabase
    .from('client_profiles')
    .select('id, name, preferred_language, county_fips, zip_input')
    .eq('county_fips', countyFips)
    .eq('is_assigned', false)

  if (error) throw new Error(`getUnassignedClientsByCounty failed: ${error.message}`)
  return (data ?? []) as ClientProfile[]
}

async function getAvailableCaregiversByCounty(countyFips: string): Promise<CaregiverProfile[]> {
  const { data, error } = await supabase
    .from('caregiver_profiles')
    .select('id, name, languages, skills, is_available, county_fips, zip_input')
    .eq('county_fips', countyFips)
    .eq('is_available', true)

  if (error) throw new Error(`getAvailableCaregiversByCounty failed: ${error.message}`)
  return (data ?? []) as CaregiverProfile[]
}

const COUNTY = '04021'

const [clients, caregivers] = await Promise.all([
  getUnassignedClientsByCounty(COUNTY),
  getAvailableCaregiversByCounty(COUNTY),
])

console.log(`=== getUnassignedClientsByCounty('${COUNTY}') — ${clients.length} result(s) ===`)
clients.forEach(c => {
  console.log(`  ${c.name} | lang: ${c.preferred_language ?? '—'} | zip: ${c.zip_input ?? '—'}`)
})

console.log()
console.log(`=== getAvailableCaregiversByCounty('${COUNTY}') — ${caregivers.length} result(s) ===`)
caregivers.forEach(c => {
  console.log(`  ${c.name} | langs: [${c.languages.join(', ')}] | skills: [${c.skills.join(', ')}] | zip: ${c.zip_input ?? '—'}`)
})
