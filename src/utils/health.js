export const HEALTH_META = {
  dead: { label: 'Dead' },
  late: { label: 'Late' },
  unknown: { label: 'Unknown' },
  healthy: { label: 'Healthy' },
  event: { label: 'Event-driven' },
}

const SORT_ORDER = ['dead', 'late', 'unknown', 'healthy', 'event']

export function healthCategory(service) {
  return service.health ?? 'event'
}

export function sortByHealth(services) {
  return [...services].sort(
    (a, b) => SORT_ORDER.indexOf(healthCategory(a)) - SORT_ORDER.indexOf(healthCategory(b)),
  )
}
