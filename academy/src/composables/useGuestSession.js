import { useAuthStore } from '@/stores/auth'
import { useGuestStore } from '@/stores/guest'
import { useToast } from 'vue-toastification'

export function useGuestSession() {
  const authStore = useAuthStore()
  const guestStore = useGuestStore()
  const toast = useToast()

  const startGuestSessionIfNeeded = async () => {
    // If user is authenticated, no guest session needed
    if (authStore.isAuthenticated) {
      return { success: true, userType: 'authenticated' }
    }

    // If guest session already active, use it
    if (guestStore.isGuestMode) {
      return { success: true, userType: 'guest' }
    }

    // Start new guest session
    try {
      const result = await guestStore.startGuestSession()
      if (result.success) {
        return { success: true, userType: 'guest' }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const handleCourseAccess = async (course) => {
    if (authStore.isAuthenticated) {
      // Authenticated user - go to student course
      return { route: `/student/courses/${course.code}`, userType: 'authenticated' }
    } else {
      // Guest user - start session and go to guest course
      const sessionResult = await startGuestSessionIfNeeded()
      if (sessionResult.success) {
        return { route: `/guest/courses/${course.code}`, userType: 'guest' }
      } else {
        throw new Error(sessionResult.error)
      }
    }
  }

  return {
    startGuestSessionIfNeeded,
    handleCourseAccess
  }
}