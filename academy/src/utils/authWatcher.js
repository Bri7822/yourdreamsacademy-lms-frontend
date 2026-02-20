import { useAuthStore } from '@/stores/auth'
import { useGuestStore } from '@/stores/guest'
import { useToast } from 'vue-toastification'

let authWatcherInitialized = false

export const initAuthWatcher = () => {
  if (authWatcherInitialized) return

  console.log('👀 Initializing auth state watcher...')

  const authStore = useAuthStore()
  const guestStore = useGuestStore()
  const toast = useToast()

  // Watch for auth state changes
  const originalLogin = authStore.login
  authStore.login = async function(...args) {
    const result = await originalLogin.apply(this, args)

    if (result.success) {
      // Clear guest session on successful login
      if (guestStore.isGuestMode) {
        console.log('🧹 Clearing guest session after login')
        guestStore.endSession()

        // Dispatch event for components to react
        window.dispatchEvent(new CustomEvent('auth-state-changed', {
          detail: { action: 'login', userType: authStore.userType }
        }))
      }
    }

    return result
  }

  // Watch for logout
  const originalLogout = authStore.logout
  authStore.logout = function(...args) {
    originalLogout.apply(this, args)

    // Dispatch logout event
    window.dispatchEvent(new CustomEvent('auth-state-changed', {
      detail: { action: 'logout' }
    }))
  }

  authWatcherInitialized = true
  console.log('✅ Auth watcher initialized')
}

// Initialize in main.js
// Add this to your main.js initialization
initAuthWatcher()