// src/composables/useEnrollment.js
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import axios from 'axios'

export function useEnrollment() {
  const router    = useRouter()
  const authStore = useAuthStore()
  const toast     = useToast()
  const isEnrolling = ref(false)

  /**
   * Enroll the current student in a course.
   *
   * @param {Object} course          - { id, title, code, description }
   * @param {Object} [options]       - Optional behaviour overrides
   * @param {boolean} [options.skipNavigation=false]
   *   When true the composable will NOT call router.push after a successful
   *   enrollment.  Use this whenever the CALLER wants to handle navigation
   *   itself (e.g. SearchResults navigating straight to the lesson instead
   *   of to the course page).
   */
  const enrollCourse = async (course, options = {}) => {
    const { skipNavigation = false } = options

    if (!authStore.isAuthenticated) {
      console.log('🚀 Guest user clicking enroll - redirecting to signup')
      toast.info(`Please sign up to enroll in "${course.title}"`)

      router.push({
        path: '/signup',
        query: {
          enroll_course: course.id,
          course_code:   course.code,
          course_name:   course.title,
        },
      })
      return { success: false, action: 'redirect_to_signup' }
    }

    // Admins and teachers cannot enroll
    if (authStore.isAdmin || authStore.isTeacher) {
      const role = authStore.isAdmin ? 'admin' : 'teacher'
      toast.error(`You cannot enroll as a ${role}. You are the course creator!`)
      return { success: false, error: 'invalid_role' }
    }

    isEnrolling.value = true

    try {
      console.log(`🎯 Student enrolling in course: ${course.code}`)

      const response = await axios.post(
        `/api/student/courses/${course.code}/enroll/`,
        {},
        {
          headers: { Authorization: `Bearer ${authStore.accessToken}` },
        },
      )

      console.log('✅ Enrollment response:', response.data)

      const enrollmentStatus = response.data.enrollment_status

      // ── Already enrolled ──────────────────────────────────────────────────
      if (
        enrollmentStatus === 'approved' &&
        response.data.detail?.includes('already enrolled')
      ) {
        toast.info(`You are already enrolled in "${course.title}"`)
        return { success: true, alreadyEnrolled: true, data: response.data }
      }

      // ── Newly approved ────────────────────────────────────────────────────
      if (enrollmentStatus === 'approved') {
        // Only show the generic success toast when the caller hasn't suppressed
        // navigation (i.e. the caller will show its own toast with context).
        if (!skipNavigation) {
          toast.success(`Successfully enrolled in "${course.title}"!`)
        }

        // Always mark the active course in sessionStorage so other parts of
        // the app (sidebar, course list) pick it up.
        sessionStorage.setItem('activeCourseSlug',    course.code)
        sessionStorage.setItem('newlyEnrolledCourse', course.code)

        console.log('💾 Set active course for new enrollment:', course.code)

        // Navigate to course page ONLY when the caller hasn't said it will
        // handle navigation itself.
        if (!skipNavigation) {
          setTimeout(() => {
            router.push({
              path:  `/student/courses/${course.code}`,
              query: { newly_enrolled: 'true' },
            })
          }, 1500)
        }

        return { success: true, newlyEnrolled: true, data: response.data }
      }

      // ── Pending approval ──────────────────────────────────────────────────
      if (enrollmentStatus === 'pending') {
        toast.info(
          `Enrollment request submitted for "${course.title}". Waiting for approval.`,
        )
        return { success: true, pendingApproval: true, data: response.data }
      }

      // ── Default success (fallback) ─────────────────────────────────────────
      if (!skipNavigation) {
        toast.success(`Successfully enrolled in "${course.title}"!`)
        sessionStorage.setItem('activeCourseSlug',    course.code)
        sessionStorage.setItem('newlyEnrolledCourse', course.code)

        setTimeout(() => {
          router.push(`/student/courses/${course.code}`)
        }, 1500)
      }

      return { success: true, data: response.data }

    } catch (error) {
      console.error('Enrollment error:', error)

      let errorMessage = 'Failed to enroll in course. Please try again.'

      if (error.response?.status === 404) {
        errorMessage =
          'Enrollment service is currently unavailable. Please try again later.'
      } else if (error.response?.status === 403) {
        errorMessage =
          error.response.data?.error_code === 'INVALID_USER_ROLE'
            ? error.response.data.detail ||
              'You cannot enroll with your current user role.'
            : 'You are not authorized to enroll in this course.'
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error during enrollment. Please contact support.'
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      }

      toast.error(errorMessage)
      return {
        success: false,
        error:   errorMessage,
        status:  error.response?.status,
      }
    } finally {
      isEnrolling.value = false
    }
  }

  const loadHomeCourses = async () => {
    try {
      const response = await axios.get('/api/student/home/courses/')
      return response.data.courses || []
    } catch (error) {
      console.error('Error loading home courses:', error)
      return []
    }
  }

  const loadDashboardCourses = async () => {
    try {
      const response = await axios.get('/api/student/dashboard/courses/', {
        headers: { Authorization: `Bearer ${authStore.accessToken}` },
      })
      return response.data.courses || []
    } catch (error) {
      console.error('Error loading dashboard courses:', error)
      return []
    }
  }

  return {
    enrollCourse,
    isEnrolling,
    loadHomeCourses,
    loadDashboardCourses,
  }
}