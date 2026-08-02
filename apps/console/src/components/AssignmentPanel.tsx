import { useEffect, useState } from 'react'
import { MousePointerClick } from 'lucide-react'
import { Link } from 'react-router-dom'
import { rankCaregiverMatches, getInitials } from 'utils'
import type { ClientProfile, CaregiverProfile, RankedMatchResult } from 'utils'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { AssignmentConfirmModal } from './AssignmentConfirmModal'
import { Banner } from './Banner'
import './AssignmentPanel.css'

interface AssignmentPanelProps {
  countyFips: string | null
  countyName: string
  clients: ClientProfile[]
  caregivers: CaregiverProfile[]
  onAssignSuccess: (clientId: string) => void
}

export function AssignmentPanel({
  countyFips,
  countyName,
  clients,
  caregivers,
  onAssignSuccess,
}: AssignmentPanelProps) {
  const [languageFilterActive, setLanguageFilterActive] = useState(false)
  const [zipFilterActive,      setZipFilterActive]      = useState(false)
  const [selectedMatch,        setSelectedMatch]        = useState<RankedMatchResult | null>(null)
  const [isSubmitting,         setIsSubmitting]         = useState(false)
  const [banner,               setBanner]               = useState<string | null>(null)
  const [assignmentCounts,     setAssignmentCounts]     = useState<Record<string, number>>({})
  const [selectedClientId,     setSelectedClientId]     = useState<string | null>(null)
  const { session } = useAuth()

  useEffect(() => {
    setLanguageFilterActive(false)
    setZipFilterActive(false)
    setSelectedClientId(null)
  }, [countyFips])

  useEffect(() => {
    if (caregivers.length === 0) {
      setAssignmentCounts({})
      return
    }
    async function fetchCounts() {
      const { data, error } = await supabase
        .from('assignments_log')
        .select('caregiver_id')
        .in('caregiver_id', caregivers.map(c => c.id))
      if (error) {
        console.error('[AssignmentPanel] failed to fetch assignment counts:', error.message)
        return
      }
      const counts: Record<string, number> = {}
      for (const row of data ?? []) {
        const id = row.caregiver_id as string
        counts[id] = (counts[id] ?? 0) + 1
      }
      setAssignmentCounts(counts)
    }
    fetchCounts()
  }, [caregivers])

  const clientLabel    = `${clients.length} unassigned client${clients.length !== 1 ? 's' : ''}`
  const caregiverLabel = `${caregivers.length} available aide${caregivers.length !== 1 ? 's' : ''}`

  const activeClient = clients.find(c => c.id === selectedClientId) ?? clients[0] ?? null
  const ranked       = activeClient ? rankCaregiverMatches(activeClient, caregivers) : []

  let filtered = ranked
  if (languageFilterActive) filtered = filtered.filter(r => r.matchedLanguage)
  if (zipFilterActive)      filtered = filtered.filter(r => r.matchedZip || r.matchedCounty || r.matchedAdjacentCounty)

  async function handleConfirm(note: string) {
    if (!activeClient || !selectedMatch) return
    setIsSubmitting(true)
    try {
      const { error: insertError } = await supabase
        .from('assignments_log')
        .insert({
          coordinator_id: session!.user.id,
          client_id:      activeClient.id,
          caregiver_id:   selectedMatch.id,
          match_score:    selectedMatch.score,
          note:           note.trim() === '' ? null : note.trim(),
        })
      if (insertError) throw new Error(insertError.message)

      const { error: updateError } = await supabase
        .from('client_profiles')
        .update({ is_assigned: true })
        .eq('id', activeClient.id)
      if (updateError) {
        console.error('[AssignmentPanel] is_assigned update failed:', updateError.message)
      }

      const assignedName = selectedMatch.name
      setSelectedMatch(null)
      setIsSubmitting(false)
      onAssignSuccess(activeClient.id)
      setBanner(`Assigned ${assignedName} to ${activeClient.name}`)
    } catch (e) {
      setIsSubmitting(false)
      throw e
    }
  }

  return (
    <div className="assignment-panel">
      {/* Banner renders regardless of which state branch is active */}
      {banner && (
        <Banner
          type="success"
          message={banner}
          onDismiss={() => setBanner(null)}
        />
      )}

      {countyFips === null ? (
        <div className="assignment-panel__empty-state">
          <MousePointerClick size={48} color="var(--gray-no-data)" aria-hidden="true" />
          <h2 className="assignment-panel__county-name">Find clients who need an aide</h2>
          <p className="assignment-panel__subtext">
            Click any county on the map to see unassigned clients and caregiver matches.
          </p>
        </div>
      ) : clients.length === 0 ? (
        <>
          <div className="assignment-panel__header">
            <h2 className="assignment-panel__county-name">{countyName}</h2>
          </div>
          <div className="assignment-panel__empty-state">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="28" cy="20" r="10" fill="var(--gray-no-data)" />
              <path d="M8 48c0-11.046 8.954-20 20-20s20 8.954 20 20" stroke="var(--gray-no-data)" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <p className="assignment-panel__empty">
              No unassigned clients in this county.
            </p>
            <Link className="assignment-panel__empty-link" to="/clients">
              View clients list
            </Link>
          </div>
        </>
      ) : (
        <>
          {/* 1. Header */}
          <div className="assignment-panel__header">
            <h2 className="assignment-panel__county-name">{countyName}</h2>
            <p className="assignment-panel__subtext">{clientLabel} · {caregiverLabel}</p>
            {clients.length > 1 ? (
              <div className="assignment-panel__client-select">
                <label htmlFor="client-select" className="assignment-panel__client-select-label">
                  Matching for:
                </label>
                <select
                  id="client-select"
                  className="assignment-panel__client-select-input"
                  value={activeClient?.id ?? ''}
                  onChange={e => setSelectedClientId(e.target.value)}
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="assignment-panel__matching-for">Matching for: {activeClient?.name}</p>
            )}
          </div>

          {/* 2. Showing label */}
          <p className="assignment-panel__showing">Showing: Available now</p>

          {/* 3. Filter chips */}
          <div className="assignment-panel__filters">
            <button
              className={`assignment-panel__chip${languageFilterActive ? ' assignment-panel__chip--active' : ''}`}
              onClick={() => setLanguageFilterActive(v => !v)}
            >
              Language
            </button>
            <button
              className={`assignment-panel__chip${zipFilterActive ? ' assignment-panel__chip--active' : ''}`}
              onClick={() => setZipFilterActive(v => !v)}
            >
              Zip/distance
            </button>
          </div>

          {/* 4. Section label */}
          <p className="assignment-panel__section-label">Fit-ranked aides</p>

          {/* 5. Card list or empty filter state */}
          {filtered.length === 0 ? (
            <p className="assignment-panel__no-match">No caregivers match the current filters.</p>
          ) : (
            <div className="assignment-panel__cards">
              {filtered.map(match => (
                <div key={match.id} className="assignment-panel__card">
                  {/* Zone A: avatar + identity (name + load) + score */}
                  <div className="assignment-panel__zone-a">
                    <span className="assignment-panel__avatar">{getInitials(match.name)}</span>
                    <div className="assignment-panel__identity">
                      <span className="assignment-panel__name">{match.name}</span>
                      <p className="assignment-panel__assignment-count">
                        Currently assigned: {assignmentCounts[match.id] ?? 0}x
                      </p>
                    </div>
                    <span className="assignment-panel__score-badge">{match.score}/5</span>
                  </div>

                  {/* Zone B: status chip + skills */}
                  <div className="assignment-panel__zone-b">
                    <span className="assignment-panel__tag">
                      {match.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                    {match.skills.map(skill => (
                      <span key={skill} className="assignment-panel__tag">{skill}</span>
                    ))}
                  </div>

                  {/* Zone C: why-line + assign button */}
                  <div className="assignment-panel__zone-c">
                    <span className="assignment-panel__why-line">{match.whyLine}</span>
                    <button
                      className="assignment-panel__assign-btn"
                      onClick={() => setSelectedMatch(match)}
                    >
                      Assign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Confirmation modal — outside branches; selectedMatch is cleared before onAssignSuccess fires */}
      {selectedMatch && activeClient && (
        <AssignmentConfirmModal
          clientName={activeClient.name}
          caregiverName={selectedMatch.name}
          matchScore={selectedMatch.score}
          isSubmitting={isSubmitting}
          onCancel={() => setSelectedMatch(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  )
}
