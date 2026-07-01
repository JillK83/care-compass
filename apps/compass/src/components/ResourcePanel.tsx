import { useState } from 'react'

interface NearbyCounty {
  fips: string
  name: string
  state: string
  agencyCount: number
}

interface ResourcePanelProps {
  countyName: string
  stateName: string
  isDesert: boolean
  agencyCount: number
  agenciesPer1k: number
  seniorPopulation: number
  searchedZip: string
  nearbyCounties: NearbyCounty[]
}

export function ResourcePanel({
  countyName,
  stateName,
  isDesert,
  agencyCount,
  agenciesPer1k,
  seniorPopulation,
  searchedZip,
  nearbyCounties,
}: ResourcePanelProps) {
  const [signalSent, setSignalSent] = useState(false)

  const stateSlug = stateName.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="resource-panel">

      {/* ── Result headline ── */}
      <div className="result-card" data-desert={isDesert}>
        {isDesert ? (
          <>
            <span className="desert-badge">Care desert</span>
            <h2 className="result-heading">{countyName}, {stateName}</h2>
            <p className="result-subhead">
              No home health agencies are based in this county.
            </p>
          </>
        ) : (
          <>
            <h2 className="result-heading">{countyName}, {stateName}</h2>
            <p className="result-subhead">
              {agencyCount} home health {agencyCount === 1 ? 'agency' : 'agencies'} in this county
            </p>
          </>
        )}

        <dl className="stat-row">
          <div className="stat">
            <dt>Agencies here</dt>
            <dd style={{ color: agencyCount === 0 ? 'var(--red-critical)' : 'var(--text-primary)' }}>
              {agencyCount}
            </dd>
          </div>
          <div className="stat">
            <dt>Per 1,000 seniors</dt>
            <dd>{agenciesPer1k.toFixed(1)}</dd>
          </div>
          <div className="stat">
            <dt>Senior population</dt>
            <dd>{seniorPopulation.toLocaleString()}</dd>
          </div>
        </dl>
      </div>

      {/* ── Demand signal button ── */}
      <div className="flag-cta">
        {signalSent ? (
          <p className="flag-sent" role="status">
            Thanks — we've noted that care is needed near ZIP {searchedZip}.
          </p>
        ) : (
          <>
            <p className="flag-prompt">Don't see options near you?</p>
            <button
              className="btn-flag"
              onClick={() => setSignalSent(true)}
              aria-label={`Flag that care is needed near ZIP code ${searchedZip}`}
            >
              I need care near here
            </button>
          </>
        )}
      </div>

      {/* ── Nearby counties (only shown for deserts) ── */}
      {isDesert && nearbyCounties.length > 0 && (
        <div className="nearby-section">
          <h3 className="nearby-heading">Nearest counties with agencies</h3>
          <ul className="nearby-list">
            {nearbyCounties.map(c => (
              <li key={c.fips} className="nearby-item">
                <span className="nearby-name">{c.name}, {c.state}</span>
                <span className="nearby-count">{c.agencyCount} {c.agencyCount === 1 ? 'agency' : 'agencies'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Resource links ── */}
      <div className="resource-links">
        <h3 className="resource-heading">Find care options</h3>
        <ul className="resource-list">
          <li>
            <a
              href="https://eldercare.acl.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="resource-link"
            >
              Eldercare Locator — national helpline + local agency finder
            </a>
          </li>
          <li>
            <a
              href="https://www.medicare.gov/care-compare/"
              target="_blank"
              rel="noopener noreferrer"
              className="resource-link"
            >
              Medicare Care Compare — find rated home health agencies
            </a>
          </li>
          <li>
            <a
              href={`https://www.medicare.gov/health-and-drug-plans/health-plans/pace/find-a-pace-plan-in-your-area?zipcode=${searchedZip}`}
              target="_blank"
              rel="noopener noreferrer"
              className="resource-link"
            >
              PACE Program finder — all-inclusive care for seniors
            </a>
          </li>
          <li>
            <a
              href={`https://www.medicaid.gov/about-us/beneficiary-resources/index.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="resource-link"
            >
              Medicaid home care — state benefits for eligible seniors
            </a>
          </li>
          <li>
            <a
              href={`https://www.medicare.gov/health-and-drug-plans/health-plans/find-health-plans-in-your-area?zipcode=${searchedZip}`}
              target="_blank"
              rel="noopener noreferrer"
              className="resource-link"
            >
              Medicare Advantage plan finder — plans that cover home care
            </a>
          </li>
        </ul>
        <p className="resource-caveat">
          Agency counts reflect billing location, not service area. CMS 2023 data.
        </p>
      </div>

    </div>
  )
}
