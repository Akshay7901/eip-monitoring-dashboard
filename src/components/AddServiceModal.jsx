import { useState } from 'react'
import { upsertService } from '../api'
import { useAuth } from '../context/AuthContext'
import './AddServiceModal.css'

const UNITS = [
  { label: 'seconds', seconds: 1 },
  { label: 'minutes', seconds: 60 },
  { label: 'hours', seconds: 3600 },
  { label: 'days', seconds: 86400 },
]

export function AddServiceModal({ onClose, onCreated }) {
  const { token } = useAuth()
  const [key, setKey] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [intervalValue, setIntervalValue] = useState(1)
  const [unitIndex, setUnitIndex] = useState(2)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const created = await upsertService(token, {
        key: key.trim(),
        name: name.trim(),
        description: description.trim(),
        interval_seconds: Number(intervalValue) * UNITS[unitIndex].seconds,
      })
      setResult(created)
      onCreated()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!result?.ping_curl) return
    await navigator.clipboard.writeText(result.ping_curl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {result ? (
          <>
            <h2>Service registered</h2>
            <p className="modal-subtitle">
              Use this command in the automation to send pings.
            </p>
            <pre className="ping-curl">{result.ping_curl}</pre>
            <div className="modal-actions">
              <button type="button" onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy command'}
              </button>
              <button type="button" className="modal-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2>Add service</h2>

            <label htmlFor="svc-key">Key</label>
            <input
              id="svc-key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="invoice-sender"
              required
            />

            <label htmlFor="svc-name">Name</label>
            <input
              id="svc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Invoice Sender"
              required
            />

            <label htmlFor="svc-description">Description</label>
            <textarea
              id="svc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sends invoices to authors every hour"
              rows={2}
            />

            <label htmlFor="svc-interval">Ping interval</label>
            <div className="interval-field">
              <input
                id="svc-interval"
                type="number"
                min="1"
                value={intervalValue}
                onChange={(e) => setIntervalValue(e.target.value)}
                required
              />
              <select
                value={unitIndex}
                onChange={(e) => setUnitIndex(Number(e.target.value))}
              >
                {UNITS.map((unit, i) => (
                  <option key={unit.label} value={i}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>

            {error && <div className="modal-error">{error}</div>}

            <div className="modal-actions">
              <button type="button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="modal-primary" disabled={loading}>
                {loading ? 'Saving…' : 'Save service'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
