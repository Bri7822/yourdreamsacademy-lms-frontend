// src/composables/useBackNavigation.js
import { useRouter } from 'vue-router'
import { NavigationHistory } from '@/utils/navigationHistory'

export function useBackNavigation() {
  const router = useRouter()

  const handleBackNavigation = (currentParams = {}) => {
    console.log('🔙 Handling back navigation...')

    // Check navigation history first
    const backRoute = NavigationHistory.getBackRoute(currentParams)

    if (backRoute) {
      console.log('📌 Navigating to stored route:', backRoute)
      router.push(backRoute)
      return
    }

    // Fallback: Check if we have a previous route in sessionStorage
    try {
      const previousRoute = sessionStorage.getItem('previousRoute')
      if (previousRoute) {
        const routeData = JSON.parse(previousRoute)
        console.log('📌 Navigating to previous route:', routeData.name)

        // Check if this route is accessible from lesson detail
        const accessibleRoutes = [
          'student-dashboard',
          'student-course-detail',
          'student-Lessons',
          'lessons-overview',
          'exercises-overview',
          'courses',
          'all-courses'
        ]

        if (accessibleRoutes.includes(routeData.name)) {
          router.push({
            name: routeData.name,
            params: routeData.params,
            query: routeData.query
          })
          return
        }
      }
    } catch (error) {
      console.error('Error parsing previous route:', error)
    }

    // Final fallback: Go to student dashboard
    console.log('📌 No navigation source found, going to dashboard')
    router.push({ name: 'student-dashboard' })
  }

  const handleGuestBackNavigation = () => {
    console.log('🔙 Handling guest back navigation...')

    const source = sessionStorage.getItem('guestNavigationSource')
    const courseSlug = sessionStorage.getItem('guestCurrentCourseSlug')

    if (source === 'guest-course-detail' && courseSlug) {
      console.log('📌 Returning to guest course detail:', courseSlug)
      router.push({
        name: 'guest-course-detail',
        params: { courseSlug }
      })
    } else {
      // Default to guest courses
      console.log('📌 Returning to guest courses')
      router.push({ name: 'guest-courses' })
    }
  }

  return {
    handleBackNavigation,
    handleGuestBackNavigation
  }
}