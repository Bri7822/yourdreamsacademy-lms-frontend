// src/plugins/axios-setup.js
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

/**
 * Setup axios interceptors for authentication
 * This ensures all requests include the auth token
 */
export function setupAxios() {
  // Request interceptor - add auth token to all requests
  axios.interceptors.request.use(
    (config) => {
      const authStore = useAuthStore()
      const token = authStore.accessToken || localStorage.getItem('accessToken')

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor - handle token refresh
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config

      // If 401 and we haven't retried yet, try to refresh token
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        const authStore = useAuthStore()
        const refreshed = await authStore.refreshAccessToken()

        if (refreshed) {
          const token = authStore.accessToken
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axios(originalRequest)
        } else {
          // Refresh failed, redirect to login
          authStore.logout()
          window.location.href = '/login'
        }
      }

      return Promise.reject(error)
    }
  )
}