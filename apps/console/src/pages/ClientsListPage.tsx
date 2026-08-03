import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './ClientsListPage.css'

type AssignmentLogEntry = {
  created_at: string
  caregiver_profiles: { name: string } | null
}

type ClientProfile = {
  id: string
  name: string
  county_fips: string | null
  is_assigned: boolean
  assignments_log: AssignmentLogEntry[] | null
}

const ARIZONA_COUNTY_NAMES: Record<string, string> = {
  '04001': 'Apache County',
  '04003': 'Cochise County',
  '04005': 'Coconino County',
  '04007': 'Gila County',
  '04009': 'Graham County',
  '04011': 'Greenlee County',
  '04012': 'La Paz County',
  '04013': 'Maricopa County',
  '04015': 'Mohave County',
  '04017': 'Navajo County',
  '04019': 'Pima County',
  '04021': 'Pinal County',
  '04023': 'Santa Cruz County',
  '04025': 'Yavapai County',
  '04027': 'Yuma County',
}

export function ClientsListPage() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('client_profiles')
      .select(`
        id,
        name,
        county_fips,
        is_assigned,
        assignments_log (
          created_at,
          caregiver_profiles (
            name
          )
        )
      `)
      .order('name')
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError(fetchError.message)
        } else {
          setClients((data as ClientProfile[]) ?? [])
        }
        setIsLoading(false)
      })
  }, [])

  if (isLoading) {
    return (
      <main style={styles.page}>
        <p style={styles.loadingText}>Loading clients…</p>
      </main>
    )
  }

  if (error) {
    return (
      <main style={styles.page}>
        <p role="alert" style={styles.errorText}>Failed to load clients: {error}</p>
      </main>
    )
  }

  if (clients.length === 0) {
    return (
      <main style={styles.page}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Clients</h1>
          <button style={styles.ctaButton} onClick={() => navigate('/clients/new')}>
            Add new client
          </button>
        </div>
        <div style={styles.emptyCard}>
          {/*
            Placeholder inline SVG — no shared icon system exists yet in packages/ui.
            This is a one-off until an icon pattern is established project-wide.
            fill/stroke use var(--gray-no-data) — CSS custom properties resolve correctly
            in SVG presentation attributes for inline SVG (verified in Chromium).
          */}
          <svg
            width="56"
            height="56"
            viewBox="0 0 56 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="28" cy="20" r="10" fill="var(--gray-no-data)" />
            <path
              d="M8 48c0-11.046 8.954-20 20-20s20 8.954 20 20"
              stroke="var(--gray-no-data)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>

          <h2 style={styles.emptyHeading}>No clients yet</h2>

          <p style={styles.emptyBody}>
            Add a client profile to begin matching caregivers.
          </p>

        </div>
      </main>
    )
  }

  // Populated state — placeholder table.
  // Pronouns and assigned status columns are stubs pending full schema confirmation
  // and assignments_log join logic (out of scope for this task).
  return (
    <main style={styles.page}>
      <div style={styles.pageHeader}>
        <h1 style={styles.pageTitle}>Clients</h1>
        <button style={styles.ctaButton} onClick={() => navigate('/clients/new')}>
          Add new client
        </button>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={{ ...styles.th, width: '30%' }}>Name</th>
            <th style={{ ...styles.th, width: '25%' }}>County</th>
            <th style={{ ...styles.th, width: '15%' }}>Assigned</th>
            <th style={{ ...styles.th, width: '30%' }}>Assigned Aide</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(c => {
            const logs = (c.assignments_log ?? []).filter(l => l.caregiver_profiles != null)
            let aideName: string | null = null
            let overflowCount = 0
            if (logs.length === 1) {
              aideName = logs[0].caregiver_profiles!.name
            } else if (logs.length > 1) {
              const sorted = [...logs].sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
              aideName = sorted[0].caregiver_profiles!.name
              overflowCount = logs.length - 1
            }

            return (
              <tr
                key={c.id}
                className="clients-row"
                onClick={() => navigate(`/clients/${c.id}`)}
              >
                <td style={styles.td}>
                  <span className="clients-row-name">{c.name}</span>
                </td>
                <td style={styles.td}>
                  {c.county_fips != null
                    ? (ARIZONA_COUNTY_NAMES[c.county_fips] ?? c.county_fips)
                    : '—'}
                </td>
                <td style={styles.td}>
                  <span className={`assigned-badge assigned-badge--${c.is_assigned ? 'yes' : 'no'}`}>
                    {c.is_assigned ? 'Assigned' : 'Unassigned'}
                  </span>
                </td>
                <td style={styles.td}>
                  {aideName != null
                    ? overflowCount > 0
                      ? `${aideName} +${overflowCount}`
                      : aideName
                    : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
  },
  pageTitle: {
    margin: 0,
    fontSize: 'var(--text-xl)',
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-family)',
  },
  page: {
    padding: '32px',
    fontFamily: 'var(--font-family)',
    background: 'var(--canvas)',
    minHeight: '100vh',
    boxSizing: 'border-box',
  },
  loadingText: {
    fontSize: 'var(--text-base)',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-family)',
  },
  errorText: {
    fontSize: 'var(--text-base)',
    color: 'var(--red-critical)',
    fontFamily: 'var(--font-family)',
  },
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    padding: 'var(--space-card-padding-console)',
    background: 'var(--surface)',
    border: 'var(--border-width) solid var(--border)',
    borderRadius: 'var(--radius-card-console)',
    maxWidth: '400px',
    margin: '80px auto 0',
    textAlign: 'center',
  },
  emptyHeading: {
    margin: 0,
    fontSize: 'var(--text-xl)',
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-family)',
  },
  emptyBody: {
    margin: 0,
    fontSize: 'var(--text-base)',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-family)',
  },
  ctaButton: {
    marginTop: '8px',
    padding: '10px 24px',
    background: 'var(--teal-action)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 'var(--radius-button)',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-family)',
    fontWeight: 500,
    cursor: 'pointer',
    minHeight: '36px',
  },
  table: {
    width: '100%',
    tableLayout: 'fixed',
    borderCollapse: 'collapse',
    fontFamily: 'var(--font-family)',
    fontSize: 'var(--text-base)',
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    color: 'var(--text-secondary)',
    fontWeight: 600,
    fontSize: 'var(--text-sm)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    borderBottom: 'var(--border-width) solid var(--border)',
  },
  td: {
    padding: '10px 12px',
    color: 'var(--text-primary)',
    borderBottom: 'var(--border-width) solid var(--border)',
  },
}
