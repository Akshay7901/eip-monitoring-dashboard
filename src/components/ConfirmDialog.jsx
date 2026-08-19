import './ConfirmDialog.css'

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        e.stopPropagation()
        onCancel()
      }}
    >
      <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="modal-actions">
          <button type="button" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="confirm-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
