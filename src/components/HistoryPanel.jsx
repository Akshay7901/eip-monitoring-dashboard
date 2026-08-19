import { useEffect, useState } from 'react'
import { deleteService, getServiceHistory, UnauthorizedError } from '../api'
import { useAuth } from '../context/AuthContext'
import { formatInterval } from '../utils/format'
import { ConfirmDialog } from './ConfirmDialog'
import './HistoryPanel.css'

export function HistoryPanel({ service, onClose, onDeleted }) {
  const { token, logout } = useAuth()
  const [pings, setPings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    getServiceHistory(token, service.key, 50)
      .then((data) => {
        if (!cancelled) setPings(data.pings || [])
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof UnauthorizedError) {
          logout()
          return
        }
        setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token, service.key, logout])

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteService(token, service.key)
      onDeleted()
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        logout()
        return
      }
      setDeleteError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="history-overlay" onClick={onClose}>
      <div className="history-panel" onClick={(e) => e.stopPropagation()}>
        <div className="history-header">
          <div>
            <h2>{service.name}</h2>
            <p className="history-key">{service.key}</p>
          </div>
          <button type="button" className="history-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {service.description && <p className="history-description">{service.description}</p>}

        <div className="history-meta">
          <span>Interval</span>
          <span>{formatInterval(service.interval_seconds)}</span>
        </div>

        <h3 className="history-subheading">Ping history</h3>

        {loading && <p className="history-status">Loading…</p>}
        {error && <p className="history-status history-status--error">{error}</p>}

        {!loading && !error && pings.length === 0 && (
          <p className="history-status">No pings recorded yet.</p>
        )}

        {!loading && !error && pings.length > 0 && (
          <ul className="history-list">
            {pings.map((ping) => (
              <li key={ping.id}>{new Date(ping.pinged_at).toLocaleString()}</li>
            ))}
          </ul>
        )}

        <div className="history-footer">
          {deleteError && <p className="history-status history-status--error">{deleteError}</p>}
          <button
            type="button"
            className="history-delete"
            onClick={() => setConfirmingDelete(true)}
          >
            Delete service
          </button>
        </div>
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete service?"
          message={`This removes "${service.name}" and all of its ping history. This can't be undone.`}
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  )
}
