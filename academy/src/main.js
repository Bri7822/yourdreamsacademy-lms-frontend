// src/main.js
import './assets/main.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import Toast from "vue-toastification"
import "vue-toastification/dist/index.css"
import { progressSync } from './utils/progressSync'
import clickOutside from '@/directives/clickOutside'

// Create app and pinia FIRST
const app = createApp(App)
app.directive('click-outside', clickOutside)

const pinia = createPinia()

// Use pinia BEFORE any store usage
app.use(pinia)

// ✅ FIXED: Only log important mutations, not ALL mutations
pinia.use(({ store }) => {
  store.$subscribe((mutation, state) => {
    // Only log non-direct mutations (actions) in development
    if (import.meta.env.DEV && mutation.type !== 'direct') {
      console.log('🔵 PINIA ACTION:', mutation.type, mutation.storeId)
    }
  })
})

// Configure toast
app.use(Toast, {
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: "button",
  icon: true,
  rtl: false,
  toastClassName: "custom-toast"
})

// Use router
app.use(router)

// Set base URL for axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'https://yourdreamsacademy.pythonanywhere.com'
axios.defaults.withCredentials = false

// ✅ FIXED: Less verbose axios logging
let requestId = 0
axios.interceptors.request.use(
  config => {
    config.metadata = { requestId: ++requestId, startTime: new Date() }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// ✅ FIXED: Only log slow requests (> 1000ms)
axios.interceptors.response.use(
  response => {
    if (import.meta.env.DEV && response.config.metadata) {
      const duration = new Date() - response.config.metadata.startTime
      // Only log slow requests
      if (duration > 1000) {
        console.log(`⚠️ Slow request #${response.config.metadata.requestId} took ${duration}ms`)
      }
    }
    return response
  },
  error => {
    if (import.meta.env.DEV && error.config?.metadata) {
      const duration = new Date() - error.config.metadata.startTime
      console.log(`✗ Request #${error.config.metadata.requestId} failed after ${duration}ms`)
    }
    return Promise.reject(error)
  }
)

// Setup axios interceptors
import { setupAxios } from './plugins/axios-setup'
setupAxios()

// Add global properties
app.config.globalProperties.$axios = axios

// Global error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Global error:', err)
  console.error('Component:', instance)
  console.error('Info:', info)

  // Show toast for user-facing errors
  if (import.meta.env.DEV) {
    const toast = app.config.globalProperties.$toast
    if (toast) {
      toast.error('An error occurred. Check console for details.')
    }
  }
}

// Performance monitoring in development
if (import.meta.env.DEV) {
  app.config.performance = true
}

// Log environment info
console.log('🚀 App initialized')
console.log('📦 Environment:', import.meta.env.MODE)
console.log('🌐 API Base URL:', axios.defaults.baseURL)

// Initialize progress sync system
console.log('🚀 Initializing Progress Sync System...')
progressSync.init()

// ✅ FIXED: Import stores AFTER pinia is set up
import { useAuthStore } from './stores/auth'
import { useGuestStore } from './stores/guest'

// Initialize stores and mount app
const initializeApp = async () => {
  try {
    // Initialize auth store first
    const authStore = useAuthStore()
    await authStore.initAuth()
    console.log('✓ Auth initialized')

    // Initialize guest store
    const guestStore = useGuestStore()
    guestStore.restoreSession()
    console.log('✓ Guest store initialized')

    // Mount the app
    app.mount('#app')
    console.log('✓ App mounted successfully')

  } catch (error) {
    console.error('✗ Failed to initialize app:', error)
    // Still mount the app even if initialization fails
    app.mount('#app')
  }
}
// Add this to main.js or any early-loaded script
window.debugGuestCompletion = (lessonId = 275) => {
  console.group('🔍 GUEST COMPLETION DEBUG')
  console.log('1. Event bridge exists:', !!(window.guestEventBridge))
  console.log('2. Window events work:', true)
  console.log('3. localStorage available:', !!localStorage)

  // Test event dispatch
  const testData = {
    lessonId: lessonId,
    courseSlug: 'AFN',
    timestamp: new Date().toISOString()
  }

  // Test window event
  window.dispatchEvent(new CustomEvent('guest-lesson-completed', {
    detail: testData
  }))
  console.log('4. Window event dispatched')

  // Test event bridge
  if (window.guestEventBridge) {
    window.guestEventBridge.emit('guest-lesson-completed', testData)
    console.log('5. Event bridge event dispatched')
  }

  console.groupEnd()
}

// Call this in browser console: debugGuestCompletion(275)

// Start the app initialization
initializeApp()