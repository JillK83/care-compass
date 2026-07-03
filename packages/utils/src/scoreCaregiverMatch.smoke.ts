// Smoke test — run with: node --experimental-strip-types src/scoreCaregiverMatch.smoke.ts
// Uses demo scenario data: Spanish-speaking client in Pinal County (04021), ZIP 85145
import { rankCaregiverMatches } from './scoreCaregiverMatch.ts'
import type { ClientProfile, CaregiverProfile } from './scoreCaregiverMatch.ts'
import { loadAdjacency } from './getNearestCountiesWithAgencies.ts'

// Seed minimal adjacency for the smoke test.
// Pinal (04021) ↔ Maricopa (04013) are confirmed adjacent in Arizona.
loadAdjacency([
  { fips: '04021', adjacent_fips: '04013' },
  { fips: '04013', adjacent_fips: '04021' },
])

const client: ClientProfile = {
  id: 'client-demo-001',
  name: 'Maria Espinoza',
  preferred_language: 'Spanish',
  county_fips: '04021',
  zip_input: '85145',
}

const caregivers: CaregiverProfile[] = [
  {
    id: 'cg-001',
    name: 'Rosa Delgado',
    languages: ['Spanish', 'English'],
    skills: ['personal care', 'medication reminders'],
    is_available: true,
    county_fips: '04021',
    zip_input: '85145',    // same ZIP
  },
  {
    id: 'cg-002',
    name: 'Ana Reyes',
    languages: ['Spanish'],
    skills: ['dementia care', 'personal care'],
    is_available: false,
    county_fips: '04021',
    zip_input: '85139',    // same county, different ZIP
  },
  {
    id: 'cg-003',
    name: 'James Whitfield',
    languages: ['English'],
    skills: ['mobility assistance'],
    is_available: true,
    county_fips: '04021',
    zip_input: '85128',    // same county, different ZIP, no language match
  },
  {
    id: 'cg-004',
    name: 'Teresa Nguyen',
    languages: ['Vietnamese', 'English'],
    skills: [],
    is_available: false,
    county_fips: '04013',  // Maricopa — adjacent to Pinal (04021), exercises new tier
    zip_input: '85001',
  },
]

const ranked = rankCaregiverMatches(client, caregivers)

console.log('=== Caregiver Match Rankings ===')
console.log(`Client: ${client.name} | Language: ${client.preferred_language} | County: ${client.county_fips} | ZIP: ${client.zip_input}`)
console.log()
ranked.forEach((r, i) => {
  console.log(`#${i + 1}  ${r.name}  (id: ${r.id})`)
  console.log(`    score: ${r.score}`)
  console.log(`    why:   ${r.whyLine}`)
  console.log(`    flags: zip=${r.matchedZip} county=${r.matchedCounty} adjacentCounty=${r.matchedAdjacentCounty} lang=${r.matchedLanguage} avail=${r.isAvailable}`)
  console.log()
})
