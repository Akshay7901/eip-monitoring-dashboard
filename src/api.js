import { API_BASE_URL } from './config'

export class UnauthorizedError extends Error {}

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
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

export function login(username, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function logout(token) {
  return request('/auth/logout', { token, method: 'POST' })
}

export function getStatus(token) {
  return request('/status', { token })
}

export function getServiceHistory(token, key, limit = 50) {
  return request(`/services/${encodeURIComponent(key)}/history?limit=${limit}`, { token })
}

export function upsertService(token, service) {
  return request('/services', {
    token,
    method: 'POST',
    body: JSON.stringify(service),
  })
}

export function updateService(token, key, patch) {
  return request(`/services/${encodeURIComponent(key)}`, {
    token,
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export function deleteService(token, key) {
  return request(`/services/${encodeURIComponent(key)}`, {
    token,
    method: 'DELETE',
  })
}
