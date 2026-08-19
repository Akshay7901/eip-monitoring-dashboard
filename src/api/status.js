import { apiFetch } from './client'

export function getStatus(token) {
  return apiFetch('/status', token)
}
