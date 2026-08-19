export const HEALTH_META = {
  unhealthy: { label: 'Unhealthy' },
  unknown: { label: 'Unknown' },
  healthy: { label: 'Healthy' },
  event: { label: 'Event-driven' },
}

const SORT_ORDER = ['unhealthy', 'unknown', 'healthy', 'event']

export function healthCategory(service) {
  return service.health ?? 'event'
}

export function sortByHealth(services) {
  return [...services].sort(
    (a, b) => SORT_ORDER.indexOf(healthCategory(a)) - SORT_ORDER.indexOf(healthCategory(b)),
  )
}
