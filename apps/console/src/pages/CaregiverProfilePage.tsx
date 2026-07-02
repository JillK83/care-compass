import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Banner } from '../components/Banner'
import { zipToCountyFips } from 'utils'
import './DignityProfilePage.css'

type Mode = 'create' | 'edit' | 'view'

type FormState = {
  name: string
  zip_input: string
}

const EMPTY_FORM: FormState = {
  name: '',
  zip_input: '',
}

export function CaregiverProfilePage({ mode }: { mode: Mode }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [isLoading, setIsLoading] = useState(mode !== 'create')
  const [isSaving, setIsSaving] = useState(false)
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [zipError, setZipError] = useState('')

  useEffect(() => {
    const state = location.state as { banner?: string } | null
    if (state?.banner) setBanner({ type: 'success', message: state.banner })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode === 'create' || !id) return
    supabase
      .from('caregiver_profiles')
      .select('name, zip_input')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setBanner({ type: 'error', message: 'Failed to load caregiver profile.' })
        } else {
          setForm({
            name: data.name ?? '',
            zip_input: data.zip_input ?? '',
          })
        }
        setIsLoading(false)
      })
  }, [id, mode])

  function handleChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
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
      zip_input: rawZip || null,
      county_fips,
    }

    if (mode === 'create') {
      const { data, error } = await supabase
        .from('caregiver_profiles')
        .insert(payload)
        .select('id')
        .single()
      if (error || !data) {
        setBanner({ type: 'error', message: `Save failed: ${error?.message ?? 'Unknown error'}` })
        setIsSaving(false)
      } else {
        navigate(`/caregivers/${data.id}`, { replace: true, state: { banner: 'Profile saved' } })
      }
    } else {
      const { error } = await supabase
        .from('caregiver_profiles')
        .update(payload)
        .eq('id', id!)
      if (error) {
        setBanner({ type: 'error', message: `Save failed: ${error.message}` })
        setIsSaving(false)
      } else {
        navigate(`/caregivers/${id}`, { replace: true, state: { banner: 'Profile saved' } })
      }
    }
  }

  const isReadOnly = mode === 'view'

  const pageTitle =
    mode === 'create' ? 'New caregiver' :
    mode === 'edit'   ? 'Edit caregiver' :
    form.name || 'Caregiver profile'

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
            onClick={() => navigate('/map')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-family)',
              display: 'block',
              marginBottom: '12px',
            }}
          >
            ← Back
          </button>
        )}
        <div className="profile-card">
          <header className="profile-header">
            <h1 className="profile-title">{pageTitle}</h1>
            {isReadOnly && (
              <div className="profile-header-actions">
                <button className="btn-outline" onClick={() => window.print()}>Print</button>
                <button className="btn-primary" onClick={() => navigate(`/caregivers/${id}/edit`)}>Edit</button>
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
              <label className="field-label" htmlFor="field-zip">
                ZIP code <span className="field-optional">optional</span>
              </label>
              <p className="field-hint">Used to assign the caregiver to a county service area</p>
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
                <button type="button" className="btn-ghost" onClick={() => navigate('/map')}>
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
      </div>
    </main>
  )
}
