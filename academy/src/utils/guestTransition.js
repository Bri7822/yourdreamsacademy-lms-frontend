import { useAuthStore } from '@/stores/auth'
import { useGuestStore } from '@/stores/guest'
import { useToast } from 'vue-toastification'

const toast = useToast()

/**
 * Handles the transition from guest to authenticated user
 * Cleans up guest sessions and prevents conflicts
 */
export const handleGuestToAuthTransition = async () => {
  console.log('🔄 Handling guest to auth transition...')

  const authStore = useAuthStore()
  const guestStore = useGuestStore()

  // If user is not authenticated, do nothing
  if (!authStore.isAuthenticated) {
    return { success: false, message: 'User not authenticated' }
  }

  // If there's an active guest session, clear it
  if (guestStore.isGuestMode) {
    console.log('🧹 Clearing guest session for authenticated user')

    try {
      // End the guest session
      guestStore.endSession()

      // Show success message
      toast.success('Welcome back! Your guest session has been cleared.', {
        timeout: 3000
      })

      return {
        success: true,
        message: 'Guest session cleared successfully',
        userType: authStore.userType
      }
    } catch (error) {
      console.error('❌ Error clearing guest session:', error)

      toast.error('Error transitioning from guest session', {
        timeout: 3000
      })

      return {
        success: false,
        message: 'Failed to clear guest session',
        error: error.message
      }
    }
  }

  return { success: true, message: 'No guest session to clear' }
}

/**
 * Checks if a user is trying to access guest content while authenticated
 */
export const checkGuestAccessForAuthUser = () => {
  const authStore = useAuthStore()
  const guestStore = useGuestStore()

  return {
    isAuthenticated: authStore.isAuthenticated,
    hasGuestSession: guestStore.isGuestMode,
    shouldRedirect: authStore.isAuthenticated && guestStore.isGuestMode,
    userType: authStore.userType
  }
}

export default {
  handleGuestToAuthTransition,
  checkGuestAccessForAuthUser
}