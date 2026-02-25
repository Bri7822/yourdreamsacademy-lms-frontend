import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useGuestStore } from '@/stores/guest'


const API_URL = 'https://yourdreamsacademy.up.railway.app/api/auth/'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    loading: false,
    error: null,
    isInitialized: false
  }),

  getters: {
    getUser: (state) => {
      if (!state.user) {
        // Try to load from localStorage
        const user = localStorage.getItem('user')
        return user ? JSON.parse(user) : null
      }
      return state.user
    },

    isAuthenticated: (state) => !!state.accessToken,
    // Add token getter for compatibility
    token: (state) => state.accessToken,
    userType: (state) => state.user?.profile?.user_type,
    getError: (state) => state.error,
    isAdmin: (state) => state.user?.profile?.user_type === 'admin',
    isTeacher: (state) => state.user?.profile?.user_type === 'teacher',
    isStudent: (state) => state.user?.profile?.user_type === 'student'
  },

  actions: {
    async initAuth() {
      try {
        const accessToken = localStorage.getItem('accessToken')
        const refreshToken = localStorage.getItem('refreshToken')
        const user = localStorage.getItem('user')

        if (accessToken && user) {
          // Verify token is still valid
          const response = await axios.get(`${API_URL}user/`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          })

          // If verification succeeds, set the state
          this.user = JSON.parse(user)
          this.accessToken = accessToken
          this.refreshToken = refreshToken

          // Set default axios header
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

          // Verify user type matches the expected format
          if (!this.user?.profile?.user_type) {
            console.warn('User profile missing user_type')
            this.logout()
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        // Only log out if the server explicitly rejected the token
        if (error.response?.status === 401 || error.response?.status === 403) {
          this.logout()
        } else {
          // Network error or server issue — keep local session alive
          const user = localStorage.getItem('user')
          const accessToken = localStorage.getItem('accessToken')
          if (user && accessToken) {
            this.user = JSON.parse(user)
            this.accessToken = accessToken
            this.refreshToken = localStorage.getItem('refreshToken')
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
          }
        }
      } finally {
        this.isInitialized = true
      }
    },

    async login(credentials) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.post('/api/auth/login/', credentials)
        const { access, refresh, user } = response.data

        // Validate user data
        if (!user?.profile?.user_type) {
          console.error('Invalid user data:', user)
          throw new Error('Server returned incomplete user data')
        }

        // ✅ CRITICAL: Clear any active guest session before setting auth state
        try {
          const guestStore = useGuestStore()
          if (guestStore.isGuestMode) {
            console.log('🧹 Clearing guest session during login...')
            await guestStore.handleAuthenticationTransition(user.profile.user_type)
          }
        } catch (error) {
          console.warn('Error clearing guest session during login:', error)
        }

        // Update state
        this.user = user
        this.accessToken = access
        this.refreshToken = refresh

        // Store in localStorage
        localStorage.setItem('accessToken', access)
        localStorage.setItem('refreshToken', refresh)
        localStorage.setItem('user', JSON.stringify(user))
        // In your axios instance or store
        console.log('Auth token:', localStorage.getItem('accessToken'))
        // Set default axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${access}`

        return { success: true }
      } catch (error) {
        let errorMessage = 'Login failed'
        if (error.response) {
          if (error.response.status === 400) {
            errorMessage = error.response.data?.detail || 'Invalid credentials'
          } else if (error.response.status === 403) {
            errorMessage = error.response.data?.detail || 'Account not active or not verified'
          }
        } else if (error.message === 'Server returned incomplete user data') {
          errorMessage = 'Account configuration error - Please contact support'
        }

        this.error = errorMessage
        return { success: false, error: errorMessage }
      } finally {
        this.loading = false
      }
    },

    logout() {
      // Clear guest session on logout
      try {
        const guestStore = useGuestStore()
        if (guestStore.isGuestMode) {
          guestStore.endSession()
        }
      } catch (error) {
        console.warn('Error clearing guest session on logout:', error)
      }

      this.accessToken = null
      this.refreshToken = null
      this.user = null
      this.error = null

      // Clear localStorage
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')

      // Clear axios default header
      delete axios.defaults.headers.common['Authorization']
    },

    async refreshAccessToken() {
      if (!this.refreshToken) {
        this.logout()
        return false
      }

      try {
        const response = await axios.post(`${API_URL}token/refresh/`, {
          refresh: this.refreshToken
        })

        const { access } = response.data
        this.accessToken = access
        localStorage.setItem('accessToken', access)

        // Update axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${access}`

        return true
      } catch (error) {
        console.error('Token refresh error:', error)
        this.logout()
        return false
      }
    },

    clearError() {
      this.error = null
    }
  }
})