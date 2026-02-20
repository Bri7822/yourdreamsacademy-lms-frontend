// src/composables/useExerciseNavigation.js
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGuestStore } from '@/stores/guest'
import { useToast } from 'vue-toastification'
import axios from 'axios'

export function useExerciseNavigation() {
  const router = useRouter()
  const authStore = useAuthStore()
  const guestStore = useGuestStore()
  const toast = useToast()

  const isEnrolling = ref(false)
  const currentEnrollingCourse = ref(null)

  // Helper function to generate slug from title
  const generateSlug = (title) => {
    if (!title) return ''
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim()
  }

  /**
   * Handle exercise navigation based on user type and enrollment status
   */
  const handleExerciseNavigation = async (course, specificLesson = null) => {
    console.log('🎯 Exercise navigation for:', course.title, {
      specificLesson,
      userType: authStore.isAuthenticated ? 'student' : 'guest'
    })

    try {
      if (!authStore.isAuthenticated) {
        // Guest user - redirect to GuestLessonDetailLayout
        await handleGuestExerciseNavigation(course, specificLesson)
      } else if (isCourseEnrolled(course)) {
        // Enrolled student - redirect to LessonDetailLayout
        await handleStudentExerciseNavigation(course, specificLesson)
      } else {
        // Not enrolled student - enroll first, then redirect
        await handleNotEnrolledStudentNavigation(course, specificLesson)
      }
    } catch (err) {
      console.error('❌ Error in exercise navigation:', err)
      throw err
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
   * Handle guest exercise navigation to GuestLessonDetailLayout
   */
  const handleGuestExerciseNavigation = async (course, specificLesson = null) => {
    console.log('🚀 Handling guest exercise navigation for:', course.title, { specificLesson })

    // Ensure guest session exists
    if (!guestStore.isGuestMode) {
      const result = await guestStore.startGuestSession()
      if (!result.success) {
        toast.error('Failed to start preview session')
        return
      }
    }

    // Navigate to guest lesson layout
    await navigateToGuestLessonLayout(course, specificLesson)
  }

  /**
   * Handle enrolled student navigation to LessonDetailLayout
   */
  const handleStudentExerciseNavigation = async (course, specificLesson = null) => {
    console.log('🎓 Handling enrolled student navigation for:', course.title, { specificLesson })

    // Navigate to student lesson layout
    await navigateToStudentLessonLayout(course, specificLesson)
  }

  /**
   * Handle not enrolled student (enroll first, then navigate)
   */
  const handleNotEnrolledStudentNavigation = async (course, specificLesson = null) => {
    console.log('📝 Handling not enrolled student navigation for:', course.title, { specificLesson })

    if (isCourseEnrolled(course)) {
      console.log('ℹ️ Course already enrolled - navigating directly')
      await navigateToStudentLessonLayout(course, specificLesson)
      return
    }

    isEnrolling.value = true
    currentEnrollingCourse.value = course.id

    try {
      const result = await enrollCourse(course)

      if (result.success) {
        if (result.alreadyEnrolled || result.newlyEnrolled) {
          course.enrollment_status = 'enrolled'
          console.log(`✅ Updated enrollment status for ${course.title}`)

          // Navigate to student lesson layout after successful enrollment
          await navigateToStudentLessonLayout(course, specificLesson)
        }
      } else {
        console.log('❌ Enrollment failed:', result.error)
        toast.error('Enrollment failed. Please try again.')
      }
    } finally {
      isEnrolling.value = false
      currentEnrollingCourse.value = null
    }
  }

  /**
   * Navigate to guest lesson layout (GuestLessonDetailLayout) - UPDATED FOR SLUGS
   */
  const navigateToGuestLessonLayout = async (course, specificLesson = null) => {
    try {
      console.log(`📍 Navigating guest to course: ${course.code}`, { specificLesson })

      // First, get the course lessons to find the appropriate lesson
      const lessons = await getCourseLessons(course, 'guest')

      let targetLesson = null

      // If specificLesson is an ID, find the lesson
      if (specificLesson) {
        if (typeof specificLesson === 'number' || !isNaN(specificLesson)) {
          // specificLesson is an ID
          targetLesson = lessons.find(lesson => lesson.id === parseInt(specificLesson))
        } else if (typeof specificLesson === 'object') {
          // specificLesson is a lesson object
          targetLesson = specificLesson
        } else if (typeof specificLesson === 'string') {
          // specificLesson might be a slug or title - try to find by title/slug
          targetLesson = lessons.find(lesson =>
            generateSlug(lesson.title) === specificLesson ||
            lesson.title === specificLesson
          )
        }
      }

      // If no specific lesson provided or not found, use the first lesson
      if (!targetLesson && lessons.length > 0) {
        targetLesson = lessons[0]
        console.log('🎯 Using first lesson as default:', targetLesson.title)
      }

      if (!targetLesson) {
        console.error('❌ No lesson found for navigation')
        toast.error('No lesson available for preview')
        return
      }

      // Generate slug from lesson title
      const lessonSlug = generateSlug(targetLesson.title)

      console.log('🚀 Navigating to lesson with slug:', {
        courseSlug: course.code,
        lessonSlug: lessonSlug,
        lessonId: targetLesson.id,
        lessonTitle: targetLesson.title
      })

      // Navigate to guest lesson layout using slug
      await router.push({
        name: 'guest-lesson-detail',
        params: {
          courseSlug: course.code,
          lessonSlug: lessonSlug  // ✅ Changed from lessonId to lessonSlug
        }
      })

      console.log('✅ Guest navigation successful')

    } catch (error) {
      console.error('❌ Guest navigation error:', error)
      throw error
    }
  }

  const navigateToStudentLessonLayout = async (course, specificLesson = null) => {
    try {
      console.log(`📍 Navigating student to course: ${course.code}`, { specificLesson })

      const lessons = await getCourseLessons(course, 'student')

      let targetLessonSlug = null

      // ✅ Handle different types of specificLesson input
      if (specificLesson) {
        if (typeof specificLesson === 'object') {
          // It's a lesson object
          targetLessonSlug = generateSlug(specificLesson.title)
        } else if (typeof specificLesson === 'string') {
          // It might be a slug already or need conversion
          const lesson = lessons.find(l =>
            l.id.toString() === specificLesson ||
            generateSlug(l.title) === specificLesson
          )
          if (lesson) {
            targetLessonSlug = generateSlug(lesson.title)
          } else {
            targetLessonSlug = specificLesson // Assume it's already a slug
          }
        }
      }

      // If no specific lesson, use first
      if (!targetLessonSlug && lessons.length > 0) {
        const firstLesson = lessons[0]
        targetLessonSlug = generateSlug(firstLesson.title)
      }

      console.log('🚀 Navigating to student lesson with slug:', {
        courseSlug: course.code,
        lessonSlug: targetLessonSlug || 'first'
      })

      // ✅ CORRECT: Use lessonSlug parameter
      await router.push({
        name: 'student-lesson-detail',
        params: {
          courseSlug: course.code,
          lessonSlug: targetLessonSlug || 'first'
        }
      })

    } catch (error) {
      console.error('❌ Student navigation error:', error)
      throw error
    }
  }

  /**
   * Get course lessons for navigation
   */
  const getCourseLessons = async (course, userType) => {
    try {
      console.log(`📖 Fetching lessons for ${course.code} as ${userType}`)

      let response
      if (userType === 'student') {
        response = await axios.get(`/api/student/courses/${course.code}/lessons/`, {
          headers: {
            'Authorization': `Bearer ${authStore.accessToken}`
          }
        })
      } else {
        // Guest user
        if (!guestStore.isGuestMode) {
          await guestStore.startGuestSession()
        }

        response = await axios.get(`/api/student/guest/courses/${course.code}/lessons/`, {
          params: {
            session_id: guestStore.session?.session_id
          }
        })
      }

      let lessons = []
      if (Array.isArray(response.data)) {
        lessons = response.data
      } else if (response.data && Array.isArray(response.data.lessons)) {
        lessons = response.data.lessons
      }

      console.log(`✅ Loaded ${lessons.length} lessons for ${course.code}`)
      return lessons

    } catch (error) {
      console.error(`❌ Failed to fetch lessons for ${course.code}:`, error)
      return []
    }
  }

  /**
   * Enroll in a course
   */
  const enrollCourse = async (course) => {
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
    }
  }

  /**
   * Direct navigation method for external use
   */
  const navigateToCourseExercises = async (course, userType, specificLesson = null) => {
    if (userType === 'guest') {
      await navigateToGuestLessonLayout(course, specificLesson)
    } else {
      await navigateToStudentLessonLayout(course, specificLesson)
    }
  }

  return {
    handleExerciseNavigation,
    navigateToCourseExercises,
    isEnrolling,
    currentEnrollingCourse,
    isCourseEnrolled,
    generateSlug // Export if needed elsewhere
  }
}