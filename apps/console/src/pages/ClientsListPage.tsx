import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// Placeholder type — columns confirmed from CLAUDE.md Dignity Profile contract.
// Assigned status derivation (from assignments_log join) is out of scope for this task.
type ClientProfile = {
  id: string
  name: string
  pronouns: string | null
  is_assigned: boolean
}

export function ClientsListPage() {
  const navigate = useNavigate()
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('client_profiles')
      .select('id, name, pronouns, is_assigned')
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

          {/* Heading size 20px — not yet tokenized; typography scale beyond
              --font-size-body-min is still under review per DESIGN_SYSTEM.md */}
          <h2 style={styles.emptyHeading}>No clients yet</h2>

          <p style={styles.emptyBody}>
            Add a client profile to begin matching caregivers.
          </p>

          <button
            style={styles.ctaButton}
            onClick={() => navigate('/clients/new')}
          >
            Add new client
          </button>
        </div>
      </main>
    )
  }

  // Populated state — placeholder table.
  // Pronouns and assigned status columns are stubs pending full schema confirmation
  // and assignments_log join logic (out of scope for this task).
  return (
    <main style={styles.page}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Pronouns</th>
            <th style={styles.th}>Assigned</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(c => (
            <tr
              key={c.id}
              style={{ ...styles.tr, cursor: 'pointer' }}
              onClick={() => navigate(`/clients/${c.id}`)}
            >
              <td style={styles.td}>{c.name}</td>
              <td style={styles.td}>{c.pronouns || '—'}</td>
              <td style={styles.td}>{c.is_assigned ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    padding: '32px',
    fontFamily: 'var(--font-family)',
    background: 'var(--canvas)',
    minHeight: '100vh',
    boxSizing: 'border-box',
  },
  loadingText: {
    fontSize: 'var(--font-size-body-min)',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-family)',
  },
  errorText: {
    fontSize: 'var(--font-size-body-min)',
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
    // 20px — not yet tokenized; typography scale under review per DESIGN_SYSTEM.md
    fontSize: '20px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-family)',
  },
  emptyBody: {
    margin: 0,
    fontSize: 'var(--font-size-body-min)',
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
    fontSize: 'var(--font-size-body-min)',
    fontFamily: 'var(--font-family)',
    fontWeight: 500,
    cursor: 'pointer',
    minHeight: '36px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: 'var(--font-family)',
    fontSize: 'var(--font-size-body-min)',
  },
  tr: {
    transition: 'background 0.1s',
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    borderBottom: 'var(--border-width) solid var(--border)',
  },
  td: {
    padding: '10px 12px',
    color: 'var(--text-primary)',
    borderBottom: 'var(--border-width) solid var(--border)',
  },
}
