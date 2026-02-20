import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGuestStore } from '@/stores/guest'
import axios from 'axios'

export function useCourses() {
  const router = useRouter()
  const authStore = useAuthStore()
  const guestStore = useGuestStore()

  const courses = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Fetch all courses from backend
  const fetchCourses = async () => {
    loading.value = true
    error.value = null

    try {
      let endpoint = '/api/student/home/courses/'

      // Use appropriate endpoint based on authentication
      if (authStore.isAuthenticated) {
        endpoint = '/api/student/courses/'
      } else {
        endpoint = '/api/student/guest/courses/'
      }

      const response = await axios.get(endpoint)

      if (response.data && response.data.courses) {
        courses.value = response.data.courses
      } else {
        courses.value = response.data || []
      }

      console.log(`✅ Loaded ${courses.value.length} real courses from backend`)
    } catch (err) {
      console.error('❌ Failed to fetch courses:', err)
      error.value = 'Failed to load courses'
      courses.value = [] // Fallback to empty array
    } finally {
      loading.value = false
    }
  }

  // Check if user is enrolled in a course
  const isUserEnrolled = (courseCode) => {
    if (!authStore.isAuthenticated) return false

    const course = courses.value.find(c => c.code === courseCode)
    return course ? course.is_enrolled : false
  }

  // Handle course click with proper routing
  const handleCourseClick = async (course) => {
    console.log('🎯 Course clicked:', course.title)

    if (authStore.isAuthenticated) {
      // Check enrollment status for authenticated users
      if (course.is_enrolled) {
        // User is enrolled - go to CourseDetailLayout
        router.push(`/student/courses/${course.code}`)
      } else {
        // User is not enrolled - go to GuestCourseLayout
        router.push(`/guest/courses/${course.code}`)
      }
    } else {
      // Guest user - start guest session and go to GuestCourseLayout
      try {
        const sessionResult = await guestStore.startGuestSession()
        if (sessionResult.success) {
          router.push(`/guest/courses/${course.code}`)
        } else {
          console.error('Failed to start guest session:', sessionResult.error)
          // Fallback - still navigate but guest features might be limited
          router.push(`/guest/courses/${course.code}`)
        }
      } catch (err) {
        console.error('Error starting guest session:', err)
        router.push(`/guest/courses/${course.code}`)
      }
    }
  }

  // Get course by code
  const getCourseByCode = (courseCode) => {
    return courses.value.find(course => course.code === courseCode)
  }

  // Filter courses by category or other criteria
  const filteredCourses = computed(() => {
    return courses.value
  })

  // Popular courses
  const popularCourses = computed(() => {
    return courses.value.filter(course => course.is_popular)
  })

  // New courses
  const newCourses = computed(() => {
    return courses.value.filter(course => course.is_new)
  })

  return {
    courses,
    loading,
    error,
    fetchCourses,
    handleCourseClick,
    isUserEnrolled,
    getCourseByCode,
    filteredCourses,
    popularCourses,
    newCourses
  }
}