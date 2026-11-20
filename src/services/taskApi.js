// Vite exposes this optional URL to the browser; the default points to the local API.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function request(path, accessToken, options = {}) {
  if (!accessToken) {
    throw new Error('Please sign in again to continue.')
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  })

  // 204 responses intentionally have no JSON body.
  if (response.status === 204) {
    return null
  }

  const responseBody = await response.json()
  if (!response.ok) {
    throw new Error(responseBody.error || 'The request could not be completed.')
  }

  return responseBody
}

export function getTasks(accessToken) {
  return request('/tasks', accessToken)
}

export function createTask(accessToken, task) {
  return request('/tasks', accessToken, {
    method: 'POST',
    body: JSON.stringify(task),
  })
}

export function updateTask(accessToken, id, task) {
  return request(`/tasks/${id}`, accessToken, {
    method: 'PUT',
    body: JSON.stringify(task),
  })
}

export function updateTaskStatus(accessToken, id, status) {
  return request(`/tasks/${id}/status`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function deleteTask(accessToken, id) {
  return request(`/tasks/${id}`, accessToken, { method: 'DELETE' })
}
