import { useCallback, useEffect, useState } from 'react'
import { getStatus } from '../api/status'
import { UnauthorizedError } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatInterval, formatRelativeSeconds, formatShortAgo } from '../utils/format'
import './Dashboard.css'

const HEALTH_META = {
  healthy: { label: 'Healthy' },
  late: { label: 'Late' },
  dead: { label: 'Dead' },
  unknown: { label: 'Unknown' },
  event: { label: 'Event-driven' },
}

const SUMMARY_ORDER = ['healthy', 'late', 'dead', 'unknown', 'event']

export default function Dashboard() {
  const { token, logout } = useAuth()
  const [services, setServices] = useState([])
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [fetchedAt, setFetchedAt] = useState(null)
  const [now, setNow] = useState(Date.now())

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getStatus(token)
      setServices(data.services || [])
      setSummary(data.summary || null)
      setFetchedAt(Date.now())
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        logout()
        return
      }
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token, logout])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tick)
  }, [])

  const lastUpdatedSeconds = fetchedAt ? Math.floor((now - fetchedAt) / 1000) : null

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <div className="dashboard-brand">
            <span className="status-dot" />
            <h1>Automation Monitoring</h1>
          </div>
          <p className="dashboard-subtitle">
            Health of scheduled and event-driven jobs across systems
          </p>
        </div>
        <div className="dashboard-actions">
          {lastUpdatedSeconds != null && (
            <span className="dashboard-updated">
              Last updated {formatShortAgo(lastUpdatedSeconds)}
            </span>
          )}
          <button type="button" onClick={load} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button type="button" className="dashboard-logout" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      {error && <div className="dashboard-error">{error}</div>}

      {summary && (
        <div className="summary-row">
          {SUMMARY_ORDER.map((key) => (
            <div key={key} className={`summary-chip summary-chip--${key}`}>
              <span className="summary-chip-dot" />
              {HEALTH_META[key].label}
              <strong>{summary[key] ?? 0}</strong>
            </div>
          ))}
        </div>
      )}

      <div className="service-grid">
        {services.map((service) => (
          <div key={service.key} className={`service-card service-card--${service.health}`}>
            <div className="service-card-top">
              <h2>{service.name}</h2>
              <span className={`health-badge health-badge--${service.health}`}>
                {HEALTH_META[service.health]?.label ?? service.health}
              </span>
            </div>
            {service.description && (
              <p className="service-description">{service.description}</p>
            )}
            <div className="service-row">
              <span>Last ping</span>
              <span>{formatRelativeSeconds(service.seconds_since_ping)}</span>
            </div>
            <div className="service-row">
              <span>Interval</span>
              <span>{formatInterval(service.interval_seconds)}</span>
            </div>
          </div>
        ))}
      </div>

      {!loading && services.length === 0 && !error && (
        <p className="dashboard-empty">No services registered yet.</p>
      )}
    </div>
  )
}
