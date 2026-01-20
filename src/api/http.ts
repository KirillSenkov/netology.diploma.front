import axios from 'axios'

function getCSRFToken(): string | null {
  const match = document.cookie.match(/csrftoken=([^;]+)/)
  return match ? match[1] : null
}

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// Подставляем CSRF для POST/PATCH/DELETE
api.interceptors.request.use((config) => {
  const token = getCSRFToken()

  if (token && config.method && ['post', 'patch', 'delete'].includes(config.method)) {
    config.headers['X-CSRFToken'] = token
  }

  return config
})