import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Banner } from '../components/Banner'
import { zipToCountyFips } from 'utils'
import './DignityProfilePage.css'

type Mode = 'create' | 'edit' | 'view'

type FormState = {
  name: string
  nickname: string
  pronouns: string
  preferred_language: string
  gender_preference: string
  comfort_note: string
  avoid_note: string
  zip_input: string
}

type AssignmentRow = {
  created_at: string
  caregiver_profiles: { name: string } | null
}

const EMPTY_FORM: FormState = {
  name: '',
  nickname: '',
  pronouns: '',
  preferred_language: '',
  gender_preference: '',
  comfort_note: '',
  avoid_note: '',
  zip_input: '',
}

export function DignityProfilePage({ mode }: { mode: Mode }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(mode !== 'create')
  const [isSaving, setIsSaving] = useState(false)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [zipError, setZipError] = useState('')
  const [aideNames, setAideNames] = useState<string[]>([])

  useEffect(() => {
    const state = location.state as { banner?: string } | null
    if (state?.banner) setBanner({ type: 'success', message: state.banner })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode === 'create' || !id) return

    async function load() {
      const { data, error } = await supabase
        .from('client_profiles')
        .select('name, nickname, pronouns, preferred_language, gender_preference, comfort_note, avoid_note, zip_input')
        .eq('id', id!)
        .single()

      if (error || !data) {
        setBanner({ type: 'error', message: 'Failed to load client profile.' })
      } else {
        setForm({
          name: data.name ?? '',
          nickname: data.nickname ?? '',
          pronouns: data.pronouns ?? '',
          preferred_language: data.preferred_language ?? '',
          gender_preference: data.gender_preference ?? '',
          comfort_note: data.comfort_note ?? '',
          avoid_note: data.avoid_note ?? '',
          zip_input: data.zip_input ?? '',
        })
      }
      setIsLoading(false)

      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments_log')
        .select(`
          created_at,
          caregiver_profiles (
            name
          )
        `)
        .eq('client_id', id!)
        .order('created_at', { ascending: false })

      const names = ((assignmentData ?? []) as unknown as AssignmentRow[])
        .map(row => row.caregiver_profiles?.name)
        .filter((n): n is string => n != null)
      setAideNames([...new Set(names)])
    }

    load()
  }, [id, mode])

  function handleChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setZipError('')

    const rawZip = form.zip_input.trim()
    let county_fips: string | null = null
    if (rawZip) {
      county_fips = zipToCountyFips(rawZip)
      if (!county_fips) {
        setZipError('ZIP code not found. Try a 5-digit US ZIP.')
        return
      }
    }

    setIsSaving(true)
    setBanner(null)

    const payload = {
      name: form.name.trim(),
      nickname: form.nickname.trim() || null,
      pronouns: form.pronouns.trim() || null,
      preferred_language: form.preferred_language.trim() || null,
      gender_preference: form.gender_preference || null,
      comfort_note: form.comfort_note.trim() || null,
      avoid_note: form.avoid_note.trim() || null,
      zip_input: rawZip || null,
      county_fips,
    }

    if (mode === 'create') {
      const { data, error } = await supabase
        .from('client_profiles')
        .insert(payload)
        .select('id')
        .single()
      if (error || !data) {
        setBanner({ type: 'error', message: `Save failed: ${error?.message ?? 'Unknown error'}` })
        setIsSaving(false)
      } else {
        navigate(`/clients/${data.id}`, { replace: true, state: { banner: 'Profile saved' } })
      }
    } else {
      const { error } = await supabase
        .from('client_profiles')
        .update(payload)
        .eq('id', id!)
      if (error) {
        setBanner({ type: 'error', message: `Save failed: ${error.message}` })
      } else {
        setBanner({ type: 'success', message: 'Profile saved' })
      }
      setIsSaving(false)
    }
  }

  const isReadOnly = mode === 'view'

  const pageTitle =
    mode === 'create' ? 'New client' :
    mode === 'edit'   ? 'Edit profile' :
    form.name || 'Client profile'

  if (isLoading) {
    return (
      <main className="profile-page">
        <p className="profile-loading">Loading…</p>
      </main>
    )
  }

  return (
    <main className="profile-page">
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {isReadOnly && (
        <button
          type="button"
          onClick={() => navigate('/clients')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontSize: 'var(--text-sm)',
            color: 'var(--teal-action)',
            fontWeight: 500,
            fontFamily: 'var(--font-family)',
            display: 'block',
            marginBottom: '12px',
          }}
        >
          ← Back to clients
        </button>
      )}
      <div className="profile-card">
        <header className="profile-header">
          <h1 className="profile-title">{pageTitle}</h1>
          {isReadOnly && (
            <div className="profile-header-actions">
              <button className="btn-outline" onClick={() => window.print()}>Print</button>
              <button className="btn-primary" onClick={() => navigate(`/clients/${id}/edit`)}>Edit</button>
            </div>
          )}
        </header>

        {banner && (
          <Banner type={banner.type} message={banner.message} onDismiss={() => setBanner(null)} />
        )}

        <form className="profile-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label className="field-label" htmlFor="field-name">
              Name <span className="field-required" aria-hidden="true">*</span>
            </label>
            {isReadOnly ? (
              <p id="field-name" className="field-value">{form.name || '—'}</p>
            ) : (
              <input
                id="field-name"
                type="text"
                className="field-input"
                value={form.name}
                onChange={handleChange('name')}
                required
                aria-required="true"
                autoComplete="off"
              />
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="field-nickname">
              Nickname <span className="field-optional">optional</span>
            </label>
            {isReadOnly ? (
              <p id="field-nickname" className="field-value">{form.nickname || '—'}</p>
            ) : (
              <input
                id="field-nickname"
                type="text"
                className="field-input"
                value={form.nickname}
                onChange={handleChange('nickname')}
                autoComplete="off"
              />
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="field-pronouns">
              Pronouns <span className="field-optional">optional</span>
            </label>
            {isReadOnly ? (
              <p id="field-pronouns" className="field-value">{form.pronouns || '—'}</p>
            ) : (
              <input
                id="field-pronouns"
                type="text"
                className="field-input"
                value={form.pronouns}
                onChange={handleChange('pronouns')}
                autoComplete="off"
              />
            )}
            {!isReadOnly && <p className="field-hint">So aides know how to refer to your client</p>}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="field-language">
              Preferred language <span className="field-optional">optional</span>
            </label>
            {isReadOnly ? (
              <p id="field-language" className="field-value">{form.preferred_language || '—'}</p>
            ) : (
              <input
                id="field-language"
                type="text"
                className="field-input"
                value={form.preferred_language}
                onChange={handleChange('preferred_language')}
                placeholder="e.g. Spanish, Mandarin"
                autoComplete="off"
              />
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="field-gender-pref">
              Gender preference for aide <span className="field-optional">optional</span>
            </label>
            {isReadOnly ? (
              <p id="field-gender-pref" className="field-value">{form.gender_preference || 'No preference'}</p>
            ) : (
              <select
                id="field-gender-pref"
                className="field-select"
                value={form.gender_preference}
                onChange={handleChange('gender_preference')}
              >
                <option value="">No preference</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="field-comfort">
              Key thing to know <span className="field-optional">optional</span>
            </label>
            <p className="field-hint">One comfort or important context for caregivers</p>
            {isReadOnly ? (
              <p id="field-comfort" className="field-value">{form.comfort_note || '—'}</p>
            ) : (
              <textarea
                id="field-comfort"
                className="field-textarea"
                value={form.comfort_note}
                onChange={handleChange('comfort_note')}
                rows={3}
              />
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="field-avoid">
              Key thing to avoid <span className="field-optional">optional</span>
            </label>
            <p className="field-hint">One trigger or avoid note for caregivers</p>
            {isReadOnly ? (
              <p id="field-avoid" className="field-value">{form.avoid_note || '—'}</p>
            ) : (
              <textarea
                id="field-avoid"
                className="field-textarea"
                value={form.avoid_note}
                onChange={handleChange('avoid_note')}
                rows={3}
              />
            )}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="field-zip">
              ZIP code <span className="field-optional">optional</span>
            </label>
            <p className="field-hint">Used to assign the client to a county service area</p>
            {isReadOnly ? (
              <p id="field-zip" className="field-value">{form.zip_input || '—'}</p>
            ) : (
              <input
                id="field-zip"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{5}(-[0-9]{4})?"
                maxLength={10}
                placeholder="e.g. 85145"
                className="field-input"
                value={form.zip_input}
                onChange={e => { setZipError(''); handleChange('zip_input')(e) }}
                autoComplete="off"
                aria-describedby={zipError ? 'field-zip-error' : undefined}
              />
            )}
            {zipError && (
              <p id="field-zip-error" role="alert" style={{ fontSize: 'var(--text-xs)', color: 'var(--red-critical)', margin: 0 }}>
                {zipError}
              </p>
            )}
          </div>

          <div className="profile-actions">
            {mode === 'edit' && (
              <button type="button" className="btn-outline" onClick={() => window.print()}>
                Print
              </button>
            )}
            {!isReadOnly && (
              <button type="button" className="btn-ghost" onClick={() => navigate('/clients')}>
                Cancel
              </button>
            )}
            {!isReadOnly && (
              <button
                type="submit"
                className="btn-primary"
                disabled={!form.name.trim() || isSaving}
              >
                {isSaving ? 'Saving…' : 'Save profile'}
              </button>
            )}
          </div>
        </form>
      </div>
      {mode !== 'create' && (
        <div className="profile-card" style={{ marginTop: 'var(--space-zone-gap)' }}>
          <p className="field-label">Assigned Aide(s)</p>
          {aideNames.length === 0 ? (
            <p className="field-value">No aide currently assigned</p>
          ) : (
            aideNames.map(name => (
              <p key={name} className="field-value">{name}</p>
            ))
          )}
        </div>
      )}
      </div>
    </main>
  )
}
