import { API_BASE_URL } from '../config'

export class UnauthorizedError extends Error {}

export async function apiFetch(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  })

  if (response.status === 401) {
    throw new UnauthorizedError('Unauthorized')
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error || 'Request failed')
  }

  return data
}
