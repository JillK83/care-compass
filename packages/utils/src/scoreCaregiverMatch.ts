// Minimal profile shapes required for scoring — only the fields the algorithm reads.
// Extend if the full Supabase row type is ever generated.
import { isAdjacentCounty } from './getNearestCountiesWithAgencies.ts'

export interface ClientProfile {
  id: string
  name: string
  preferred_language: string | null
  county_fips: string | null
  zip_input: string | null
}

export interface CaregiverProfile {
  id: string
  name: string
  languages: string[]        // PostgreSQL text[] delivered as JS array by supabase-js
  skills: string[]
  is_available: boolean
  county_fips: string | null
  zip_input: string | null
}

export interface MatchResult {
  score: number              // 0–5, rounded to nearest 0.5
  whyLine: string
  matchedZip: boolean
  matchedCounty: boolean
  matchedAdjacentCounty: boolean
  matchedLanguage: boolean
  isAvailable: boolean
  skills: string[]
}

export interface RankedMatchResult extends MatchResult {
  id: string
  name: string
}

function roundToHalf(n: number): number {
  return Math.round(n * 2) / 2
}

export function scoreCaregiverMatch(
  client: ClientProfile,
  caregiver: CaregiverProfile,
): MatchResult {
  const matchedLanguage =
    client.preferred_language !== null &&
    caregiver.languages.some(
      lang => lang.trim().toLowerCase() === client.preferred_language!.trim().toLowerCase()
    )

  const matchedCounty =
    client.county_fips !== null &&
    caregiver.county_fips !== null &&
    caregiver.county_fips === client.county_fips

  const matchedZip =
    client.zip_input !== null &&
    caregiver.zip_input !== null &&
    caregiver.zip_input === client.zip_input

  // Only check adjacency when counties differ — skip if either FIPS is null.
  const matchedAdjacentCounty =
    !matchedCounty &&
    client.county_fips !== null &&
    caregiver.county_fips !== null &&
    isAdjacentCounty(client.county_fips, caregiver.county_fips)

  const isAvailable = caregiver.is_available

  const raw =
    (matchedLanguage ? 2 : 0) +
    (isAvailable ? 1.5 : 0) +
    (matchedCounty ? 1.5 : 0) +
    (matchedAdjacentCounty ? 0.75 : 0)

  const score = roundToHalf(Math.min(raw, 5))

  // ── whyLine ──────────────────────────────────────────────────────
  // Derive lead clause from highest-priority geographic/language signal.
  // Append a second clause (up to 2 total) following priority order.
  let lead: string | null = null

  if (matchedZip) {
    lead = 'Closest match — same ZIP'
  } else if (matchedCounty) {
    lead = 'Same county'
  } else if (matchedAdjacentCounty) {
    lead = 'Nearby county — caregiver may be able to travel'
  } else if (matchedLanguage) {
    lead = 'Speaks client\'s language'
  }

  let whyLine: string
  if (lead === null) {
    whyLine = 'Backup option — limited overlap with client\'s stated preferences'
  } else {
    // Determine whether there's room for a second clause.
    // Language hasn't been used in the lead yet — try it first.
    // If language is already the lead, try availability (only if borderline).
    let addon = ''
    if (lead !== 'Speaks client\'s language' && matchedLanguage) {
      addon = ', speaks client\'s language'
    } else if (isAvailable && score < 3.5) {
      addon = ', available now'
    }
    whyLine = lead + addon
  }

  return {
    score, whyLine,
    matchedZip, matchedCounty, matchedAdjacentCounty, matchedLanguage,
    isAvailable, skills: caregiver.skills,
  }
}

export function rankCaregiverMatches(
  client: ClientProfile,
  caregivers: CaregiverProfile[],
): RankedMatchResult[] {
  return caregivers
    .map(c => ({ id: c.id, name: c.name, ...scoreCaregiverMatch(client, c) }))
    .sort((a, b) => b.score - a.score)
}
