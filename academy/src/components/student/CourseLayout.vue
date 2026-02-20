<!-- src/components/student/CourseLayout.vue -->
<template>
  <div class="course-layout-wrapper">
    <!-- Sidebar - Fixed Position -->
    <CourseDetailsSideBar
      :other-courses="allCourses"
      :current-course="activeCourse"
      :loading-other-courses="loadingCourses"
      :other-courses-error="coursesError"
      :current-course-id="activeCourseId"
      @refresh-courses="fetchAllCourses"
      @course-selected="handleCourseSelected"
    />

    <!-- Main Content - With proper margin to account for fixed sidebar -->
    <div class="course-main-content">
      <CourseDetail
        :key="activeCourseSlug"
        :course-slug="activeCourseSlug"
        @course-loaded="handleCourseLoaded"
        @set-active-course="setActiveCourse"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'
import CourseDetailsSideBar from './CourseDetailsSidebar.vue'
import CourseDetail from './CourseDetail.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// All courses for the sidebar
const allCourses = ref([])
const loadingCourses = ref(false)
const coursesError = ref(null)

// Active course state (synced with CourseDetail)
const activeCourse = ref(null)
const activeCourseId = ref(null)

const activeCourseSlug = computed(() => route.params.courseSlug)

// Fetch all enrolled courses for sidebar
const fetchAllCourses = async () => {
  loadingCourses.value = true
  coursesError.value = null

  try {
    console.log('📚 CourseLayout: Fetching all courses for sidebar...')

    const response = await axios.get('/api/student/courses/', {
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`
      }
    })

    allCourses.value = response.data.courses || []
    console.log('✅ CourseLayout: Loaded', allCourses.value.length, 'courses')

    // If we have an active course slug but no active course, try to set it
    if (activeCourseSlug.value && !activeCourse.value) {
      const foundCourse = allCourses.value.find(c => c.code === activeCourseSlug.value)
      if (foundCourse) {
        setActiveCourse(foundCourse)
      }
    }

  } catch (error) {
    console.error('❌ CourseLayout: Error fetching courses:', error)
    coursesError.value = 'Failed to load courses'
    allCourses.value = []
  } finally {
    loadingCourses.value = false
  }
}

// Handle course loaded event from CourseDetail
const handleCourseLoaded = (courseData) => {
  console.log('📥 CourseLayout: Course loaded from detail:', courseData.title)
  setActiveCourse(courseData)
}

// Set the active course
const setActiveCourse = (course) => {
  console.log('🎯 CourseLayout: Setting active course:', course.title)

  activeCourse.value = course
  activeCourseId.value = course.id

  // Store in session
  sessionStorage.setItem('activeCourseSlug', course.code)
  sessionStorage.setItem('activeCourseId', course.id)

  // Emit event for global coordination
  if (window.eventBridge) {
    window.eventBridge.emit('course-activated', {
      courseId: course.id,
      courseCode: course.code,
      course: course,
      source: 'layout'
    })
  }
}

// Handle course selection from sidebar
const handleCourseSelected = (course) => {
  console.log('🔄 CourseLayout: Course selected from sidebar:', course.title)

  // Update active course immediately for visual feedback
  setActiveCourse(course)

  // Navigate to the course if not already there
  if (activeCourseSlug.value !== course.code) {
    console.log('🔄 CourseLayout: Navigating to course:', course.code)
    router.push(`/student/courses/${course.code}`)
  }
}

// Watch for route changes
watch(activeCourseSlug, (newSlug, oldSlug) => {
  if (newSlug && newSlug !== oldSlug) {
    console.log('🔄 CourseLayout: Route changed to:', newSlug)

    // Try to find and set the course from our courses list
    const foundCourse = allCourses.value.find(c => c.code === newSlug)
    if (foundCourse) {
      setActiveCourse(foundCourse)
    }
  }
}, { immediate: true })

// Debug watch for active course ID
watch(activeCourseId, (newId) => {
  console.log('🔍 Layout: Active course ID changed to:', newId)
})

// Watch for authentication changes
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
  if (isAuthenticated) {
    console.log('🔐 CourseLayout: Authentication changed, refreshing courses')
    fetchAllCourses()
  }
})

onMounted(() => {
  console.log('🏗️ CourseLayout mounted')
  fetchAllCourses()
})
</script>

<style scoped>
.course-layout-wrapper {
  display: flex;
  width: 100%;
  min-height: 100vh;
  position: relative;
}

.course-main-content {
  flex: 1;
  min-width: 0;
  width: 100%;
  /* Margin equals sidebar width + 1.5rem gap */
  margin-left: calc(280px + .2rem);
  padding: 0;
}

/* Extra Large devices (desktops, 1400px and up) */
@media (min-width: 1400px) {
  .course-main-content {
    margin-left: calc(280px + .2rem);
  }
}

/* Large devices (desktops, 1200px to 1399px) */
@media (min-width: 1200px) and (max-width: 1399px) {
  .course-main-content {
    margin-left: calc(280px + .2rem);
  }
}

/* Medium devices (tablets landscape, 992px to 1199px) */
@media (min-width: 992px) and (max-width: 1199px) {
  .course-main-content {
    margin-left: calc(240px + .2rem);
  }
}

/* Tablets and below - sidebar is hidden, no margin needed */
@media (max-width: 991px) {
  .course-main-content {
    margin-left: 0;
  }
}
</style>