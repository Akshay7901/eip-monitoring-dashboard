import { useCallback, useEffect, useState } from 'react'
import { getStatus, UnauthorizedError } from '../api'
import { AddServiceModal } from '../components/AddServiceModal'
import { HistoryPanel } from '../components/HistoryPanel'
import { useAuth } from '../context/AuthContext'
import { formatInterval, formatRelativeSeconds, formatShortAgo } from '../utils/format'
import { HEALTH_META, healthCategory, sortByHealth } from '../utils/health'
import './Dashboard.css'

const FILTER_ORDER = ['unhealthy', 'unknown', 'healthy', 'event']

export default function Dashboard() {
  const { token, logout } = useAuth()
  const [services, setServices] = useState([])
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [fetchedAt, setFetchedAt] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  const [activeFilter, setActiveFilter] = useState(null)

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
  const visibleServices = activeFilter
    ? services.filter((service) => healthCategory(service) === activeFilter)
    : services
  const sortedServices = sortByHealth(visibleServices)

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <span className="status-dot" />
          <span>EIP Automation Monitoring</span>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={`sidebar-item${activeFilter === null ? ' sidebar-item--active' : ''}`}
            onClick={() => setActiveFilter(null)}
          >
            <span>All services</span>
            <span className="sidebar-count">{services.length}</span>
          </button>
          {FILTER_ORDER.map((key) => (
            <button
              type="button"
              key={key}
              className={`sidebar-item${activeFilter === key ? ' sidebar-item--active' : ''}`}
              onClick={() => setActiveFilter((current) => (current === key ? null : key))}
              aria-pressed={activeFilter === key}
            >
              <span className={`health-dot health-dot--${key}`} />
              <span>{HEALTH_META[key].label}</span>
              <span className="sidebar-count">{summary?.[key] ?? 0}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {lastUpdatedSeconds != null && (
            <p className="sidebar-updated">Updated {formatShortAgo(lastUpdatedSeconds)}</p>
          )}
          <button type="button" onClick={load} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button type="button" className="sidebar-logout" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-intro">
          <h1>Services overview</h1>
          <p>Select a service below for uptime, cadence, and ping history</p>
        </div>

        {error && <div className="dashboard-error">{error}</div>}

        <div className="services-panel">
          <div className="services-panel-header">
            <h2>Services</h2>
            <button type="button" onClick={() => setShowAddModal(true)}>
              Add service
            </button>
          </div>

          {sortedServices.length > 0 && (
            <table className="services-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Interval</th>
                  <th>Last ping</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedServices.map((service) => {
                  const category = healthCategory(service)
                  return (
                    <tr key={service.key} onClick={() => setSelectedService(service)}>
                      <td>
                        <span className={`health-dot health-dot--${category}`} />
                        <span className="service-name">{service.name}</span>
                      </td>
                      <td>{formatInterval(service.interval_seconds)}</td>
                      <td>{formatRelativeSeconds(service.seconds_since_ping)}</td>
                      <td>
                        <span className={`health-badge health-badge--${category}`}>
                          {HEALTH_META[category].label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}

          {!loading && services.length === 0 && !error && (
            <p className="dashboard-empty">No services registered yet.</p>
          )}

          {!loading && services.length > 0 && sortedServices.length === 0 && !error && (
            <p className="dashboard-empty">
              No {HEALTH_META[activeFilter].label.toLowerCase()} services.{' '}
              <button
                type="button"
                className="dashboard-clear-filter"
                onClick={() => setActiveFilter(null)}
              >
                Clear filter
              </button>
            </p>
          )}
        </div>
      </main>

      {showAddModal && (
        <AddServiceModal onClose={() => setShowAddModal(false)} onCreated={load} />
      )}

      {selectedService && (
        <HistoryPanel
          key={selectedService.key}
          service={selectedService}
          onClose={() => setSelectedService(null)}
          onDeleted={() => {
            setSelectedService(null)
            load()
          }}
          onUpdated={(patch) => {
            load()
            setSelectedService((current) => (current ? { ...current, ...patch } : current))
          }}
        />
      )}
    </div>
  )
}
