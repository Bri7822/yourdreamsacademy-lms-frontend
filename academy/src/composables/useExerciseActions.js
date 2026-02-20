import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useGuestStore } from '@/stores/guest'
import { useToast } from 'vue-toastification'
import { useCourseNavigation } from './useCourseNavigation'
import axios from 'axios'

export function useExerciseActions() {
  const authStore = useAuthStore()
  const guestStore = useGuestStore()
  const toast = useToast()
  const { navigateToCourseExercises } = useCourseNavigation()

  const isEnrolling = ref(false)
  const currentEnrollingCourse = ref(null)

  /**
   * Handle exercise action based on user type and enrollment status
   */
  const handleExerciseAction = async (course) => {
    console.log('🎯 Exercise action clicked for:', course.title)

    try {
      if (!authStore.isAuthenticated) {
        // Guest user - redirect to LessonDetailLayoutGuest with scroll to exercise
        await handleGuestExerciseAccess(course)
      } else if (isCourseEnrolled(course)) {
        // Enrolled student - redirect to exercises with continue action
        await handleEnrolledStudentAccess(course)
      } else {
        // Not enrolled student - enroll and redirect
        await handleNotEnrolledStudentAccess(course)
      }
    } catch (err) {
      console.error('❌ Error handling exercise action:', err)
      toast.error('Failed to access exercises. Please try again.')
    }
  }

  /**
   * Check if course is enrolled
   */
  const isCourseEnrolled = (course) => {
    return course.enrollment_status === 'enrolled' ||
           course.enrollment_status === 'approved' ||
           course.enrollment_status === 'completed'
  }

  /**
   * Handle guest exercise access
   */
  const handleGuestExerciseAccess = async (course) => {
    console.log('🚀 Handling guest exercise access for:', course.title)

    // Ensure guest session exists
    if (!guestStore.isGuestMode) {
      const result = await guestStore.startGuestSession()
      if (!result.success) {
        toast.error('Failed to start preview session')
        return
      }
    }

    // Use the navigation composable to handle guest redirection with scroll
    await navigateToCourseExercises(course, 'guest', true)
  }

  /**
   * Handle enrolled student access
   */
  const handleEnrolledStudentAccess = async (course) => {
    console.log('🎓 Handling enrolled student access for:', course.title)

    // Use the navigation composable to handle student redirection
    await navigateToCourseExercises(course, 'student', true)
  }

  /**
   * Handle not enrolled student access (enroll first)
   */
  const handleNotEnrolledStudentAccess = async (course) => {
    console.log('📝 Handling not enrolled student access for:', course.title)

    if (isCourseEnrolled(course)) {
      console.log('ℹ️ Course already enrolled - no action needed')
      return
    }

    currentEnrollingCourse.value = course.id
    const result = await enrollCourse(course)
    currentEnrollingCourse.value = null

    if (result.success) {
      if (result.alreadyEnrolled || result.newlyEnrolled) {
        course.enrollment_status = 'enrolled'
        console.log(`✅ Updated enrollment status for ${course.title}`)

        // Use the navigation composable to handle redirection after enrollment
        await navigateToCourseExercises(course, 'student', true)
      }
    } else {
      console.log('❌ Enrollment failed:', result.error)
      toast.error('Enrollment failed. Please try again.')
    }
  }

  /**
   * Enroll in a course (separate from your existing useEnrollment.js)
   */
  const enrollCourse = async (course) => {
    isEnrolling.value = true

    try {
      console.log(`📝 Enrolling in course: ${course.title}`)

      const response = await axios.post(
        `/api/student/courses/${course.code}/enroll/`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${authStore.accessToken}`
          }
        }
      )

      console.log('✅ Enrollment response:', response.data)

      let result = {
        success: true,
        alreadyEnrolled: false,
        newlyEnrolled: false
      }

      if (response.status === 200) {
        // Already enrolled
        result.alreadyEnrolled = true
        toast.success(`You're already enrolled in ${course.title}`)
      } else if (response.status === 201) {
        // Newly enrolled
        result.newlyEnrolled = true
        toast.success(`Successfully enrolled in ${course.title}!`)
      }

      return result

    } catch (error) {
      console.error('❌ Enrollment error:', error)

      const errorMessage = error.response?.data?.detail ||
                          error.response?.data?.error_code ||
                          'Enrollment failed. Please try again.'

      toast.error(errorMessage)

      return {
        success: false,
        error: errorMessage
      }
    } finally {
      isEnrolling.value = false
    }
  }

  return {
    handleExerciseAction,
    isEnrolling,
    currentEnrollingCourse,
    isCourseEnrolled
  }
}