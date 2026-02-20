import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

export function useCourseNavigation() {
  const router = useRouter()
  const toast = useToast()

  /**
   * Navigate to course exercises with proper user type handling
   * @param {Object} course - Course object
   * @param {string} userType - 'guest' or 'student'
   * @param {boolean} scrollToExercise - Whether to scroll to exercises
   */
  const navigateToCourseExercises = async (course, userType, scrollToExercise = false) => {
    try {
      console.log(`🎯 Navigating to exercises for ${course.title} as ${userType}`)

      let routePath
      let queryParams = {}

      if (userType === 'guest') {
        routePath = `/guest/courses/${course.code}/exercises`
        // Add scroll parameter for guest
        if (scrollToExercise) {
          queryParams.scrollTo = 'exercises'
        }
      } else {
        routePath = `/student/courses/${course.code}/exercises`
        // Add scroll parameter for student
        if (scrollToExercise) {
          queryParams.scrollTo = 'exercises'
        }
      }

      console.log(`📍 Navigating to: ${routePath}`, queryParams)

      // Use router push with query parameters
      await router.push({
        path: routePath,
        query: queryParams
      })

    } catch (error) {
      console.error('❌ Navigation error:', error)
      throw error
    }
  }

  /**
   * Handle exercise auto-scroll after navigation
   * This should be called in the target component's mounted hook
   */
  const handleExerciseAutoScroll = () => {
    const route = router.currentRoute
    const shouldScroll = route.query.scrollTo === 'exercises'

    if (shouldScroll) {
      // Use nextTick to ensure DOM is ready
      setTimeout(() => {
        scrollToExercisesSection()
        // Clean up the query parameter
        router.replace({ ...route, query: {} })
      }, 500)
    }
  }

  /**
   * Scroll to exercises section in the target page
   */
  const scrollToExercisesSection = () => {
    try {
      const exercisesSection = document.getElementById('exercises-section') ||
                              document.querySelector('[data-section="exercises"]') ||
                              document.querySelector('.exercises-container')

      if (exercisesSection) {
        exercisesSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
        console.log('✅ Scrolled to exercises section')
      } else {
        console.log('ℹ️ Exercises section not found, scrolling to top')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (error) {
      console.error('❌ Scroll error:', error)
    }
  }

  return {
    navigateToCourseExercises,
    handleExerciseAutoScroll,
    scrollToExercisesSection
  }
}