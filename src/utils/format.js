export function formatRelativeSeconds(seconds) {
  if (seconds == null) return 'Never'
  if (seconds < 60) return `${Math.max(0, Math.floor(seconds))} seconds ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export function formatShortAgo(seconds) {
  if (seconds < 60) return `${Math.max(0, seconds)}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export function formatInterval(seconds) {
  if (!seconds) return '—'
  if (seconds % 86400 === 0) {
    const days = seconds / 86400
    return `Every ${days} day${days === 1 ? '' : 's'}`
  }
  if (seconds % 3600 === 0) {
    const hours = seconds / 3600
    return `Every ${hours} hour${hours === 1 ? '' : 's'}`
  }
  if (seconds % 60 === 0) {
    const minutes = seconds / 60
    return `Every ${minutes} min`
  }
  return `Every ${seconds}s`
}
