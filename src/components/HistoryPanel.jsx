import { useEffect, useState } from 'react'
import { deleteService, getServiceHistory, updateService, UnauthorizedError } from '../api'
import { useAuth } from '../context/AuthContext'
import { formatInterval } from '../utils/format'
import { ConfirmDialog } from './ConfirmDialog'
import './HistoryPanel.css'

export function HistoryPanel({ service, onClose, onDeleted, onUpdated }) {
  const { token, logout } = useAuth()
  const [pings, setPings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [editing, setEditing] = useState(false)
  const [nameValue, setNameValue] = useState(service.name)
  const [descriptionValue, setDescriptionValue] = useState(service.description ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

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

  const cancelEdit = () => {
    setNameValue(service.name)
    setDescriptionValue(service.description ?? '')
    setSaveError('')
    setEditing(false)
  }

  const handleSave = async () => {
    const trimmedName = nameValue.trim()
    if (!trimmedName) {
      setSaveError('Name is required')
      return
    }
    setSaving(true)
    setSaveError('')
    try {
      await updateService(token, service.key, {
        name: trimmedName,
        description: descriptionValue.trim(),
      })
      setEditing(false)
      onUpdated({ name: trimmedName, description: descriptionValue.trim() })
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        logout()
        return
      }
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

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
          <h2>Service details</h2>
          <button type="button" className="history-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {editing ? (
          <div className="history-fields">
            <label htmlFor="hist-name" className="history-field-label">
              Name
            </label>
            <input
              id="hist-name"
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') cancelEdit()
              }}
            />

            <label htmlFor="hist-description" className="history-field-label">
              Description
            </label>
            <textarea
              id="hist-description"
              value={descriptionValue}
              onChange={(e) => setDescriptionValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') cancelEdit()
              }}
              rows={2}
            />

            {saveError && <p className="history-status history-status--error">{saveError}</p>}

            <div className="history-edit-actions">
              <button type="button" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={cancelEdit} disabled={saving}>
                Cancel
              </button>
            </div>

            <span className="history-field-label">Key</span>
            <p className="history-field-value history-field-value--mono">{service.key}</p>
          </div>
        ) : (
          <div className="history-fields">
            <div className="history-fields-top">
              <span className="history-field-label">Name</span>
              <button type="button" className="history-edit-link" onClick={() => setEditing(true)}>
                Edit
              </button>
            </div>
            <p className="history-field-value">{service.name}</p>

            <span className="history-field-label">Description</span>
            <p className="history-field-value">{service.description || 'No description'}</p>

            <span className="history-field-label">Key</span>
            <p className="history-field-value history-field-value--mono">{service.key}</p>
          </div>
        )}

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
