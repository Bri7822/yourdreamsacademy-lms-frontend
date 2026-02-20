import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGuestStore } from '@/stores/guest'
import { useAuthStore } from '@/stores/auth'

export function useLessonNavigation() {
  const route = useRoute()
  const router = useRouter()
  const guestStore = useGuestStore()
  const authStore = useAuthStore()

  const isLoading = ref(false)

  const navigateToFirstLesson = async (course) => {
    isLoading.value = true

    try {
      if (authStore.isAuthenticated && isCourseEnrolled(course)) {
        // Student access
        await router.push(`/student/courses/${course.code}/lessons/first`)
      } else {
        // Guest access
        const result = await guestStore.navigateToFirstLesson(course.code)
        if (result.success) {
          await router.push(`/guest/courses/${course.code}/lessons/${result.lessonId}`)
        } else {
          throw new Error(result.error || 'Failed to navigate to first lesson')
        }
      }
    } catch (error) {
      console.error('Navigation error:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const isCourseEnrolled = (course) => {
    return course.enrollment_status === 'enrolled' ||
           course.enrollment_status === 'approved' ||
           course.enrollment_status === 'completed'
  }

  const getAccessType = (course) => {
    if (!authStore.isAuthenticated) return 'guest'
    return isCourseEnrolled(course) ? 'student' : 'guest'
  }

  return {
    isLoading,
    navigateToFirstLesson,
    isCourseEnrolled,
    getAccessType
  }
}