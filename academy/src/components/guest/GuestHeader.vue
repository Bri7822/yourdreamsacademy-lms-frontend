<!-- src/components/guest/GuestHeader.vue -->
<template>
  <header class="guest-dashboard-header">
    <!-- LEFT SIDE: Courses & Lessons Icons (Expandable) - BOTH AVAILABLE -->
    <div class="header-left">
      <!-- Courses Toggle - Shows when in COURSE DETAIL view -->
      <button
        v-if="showCoursesToggle"
        class="header-action-btn courses-toggle-btn"
        :class="{ 'active': showMobileCourses }"
        @click="toggleMobileCourses"
        title="Available Courses"
      >
        <i class="fas fa-book"></i>
        <span class="courses-label">Courses</span>
      </button>

      <!-- Lessons Toggle - Shows when in LESSON DETAIL view -->
      <button
        v-if="showLessonsToggle"
        class="header-action-btn lessons-toggle-btn"
        :class="{ 'active': showMobileLessons }"
        @click="toggleMobileLessons"
        title="Course Lessons"
      >
        <i class="fas fa-list-ul"></i>
        <span class="lessons-label">Lessons</span>
      </button>
    </div>

    <!-- CENTER: Page Title -->
    <div class="page-title">
      <div class="empty-title"></div>
    </div>

    <!-- RIGHT SIDE: Actions -->
    <div class="header-actions">
      <!-- Back Arrow - Shows for both course detail and lesson detail ON ALL DEVICES -->
      <button
        v-if="showBackButton"
        @click="goBack"
        class="header-action-btn back-btn"
        :title="backButtonTitle"
      >
        <i class="fas fa-arrow-left"></i>
      </button>

      <!-- Home icon -->
      <router-link
        to="/"
        class="header-action-btn"
        title="Home"
        exact-active-class="active"
      >
        <i class="fas fa-home"></i>
      </router-link>

      <!-- Notifications icon -->
      <button class="header-action-btn notification-btn" title="Notifications">
        <i class="fas fa-bell"></i>
        <span class="notification-badge" v-if="notificationCount > 0">
          {{ notificationCount }}
        </span>
      </button>
    </div>

    <!-- Expanded Courses Sidebar (slides from left) -->
    <transition name="slide-left">
      <div v-if="showMobileCourses" class="courses-sidebar-overlay" @click="closeMobileCourses">
        <div class="courses-sidebar-panel" @click.stop>
          <div class="sidebar-header">
            <h6>Available Courses</h6>
            <button @click="closeMobileCourses" class="close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="loadingCourses" class="sidebar-loading">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <span class="ms-2">Loading courses...</span>
          </div>

          <!-- Error State -->
          <div v-else-if="coursesError" class="sidebar-error">
            <i class="fas fa-exclamation-triangle text-danger"></i>
            <span class="ms-2">{{ coursesError }}</span>
          </div>

          <!-- Courses List -->
          <ul v-else-if="courses.length > 0" class="courses-list">
            <li
              v-for="course in courses"
              :key="`header-course-${course.id}`"
              class="course-item"
              :class="{ 'active': isActiveCourse(course) }"
              @click="selectCourse(course)"
            >
              <div class="course-icon">
                <i class="fas fa-book"></i>
              </div>
              <div class="course-info">
                <span class="course-name">{{ course.title }}</span>
                <span class="course-code">{{ course.code }}</span>
              </div>
              <i v-if="isActiveCourse(course)" class="fas fa-check text-success"></i>
            </li>
          </ul>

          <!-- Empty State -->
          <div v-else class="sidebar-empty">
            <i class="fas fa-book-open text-muted"></i>
            <p class="mb-0 mt-2">No courses available</p>
          </div>
        </div>
      </div>
    </transition>

    <!-- Expanded Lessons Sidebar (slides from left) -->
    <transition name="slide-left">
      <div v-if="showMobileLessons" class="lessons-sidebar-overlay" @click="closeMobileLessons">
        <div class="lessons-sidebar-panel" @click.stop>
          <div class="sidebar-header">
            <h6>{{ currentCourseTitle }}</h6>
            <button @click="closeMobileLessons" class="close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="loadingLessons" class="sidebar-loading">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <span class="ms-2">Loading lessons...</span>
          </div>

          <!-- Error State -->
          <div v-else-if="lessonsError" class="sidebar-error">
            <i class="fas fa-exclamation-triangle text-danger"></i>
            <span class="ms-2">{{ lessonsError }}</span>
          </div>

          <!-- Lessons List -->
          <ul v-else-if="lessons.length > 0" class="lessons-list">
            <li
              v-for="(lesson, index) in lessons"
              :key="`header-lesson-${lesson.id}`"
              class="lesson-item"
              :class="{
                'active': isActiveLesson(lesson),
                'completed': lesson.completed
              }"
              @click="selectLesson(lesson)"
            >
              <div class="lesson-number">
                <i v-if="lesson.completed" class="fas fa-check-circle"></i>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <div class="lesson-info">
                <span class="lesson-name">{{ lesson.title }}</span>
                <div class="lesson-meta">
                  <i class="fas fa-clock"></i>
                  <span>{{ lesson.duration || '30' }} min</span>
                  <span v-if="lesson.completed" class="completed-badge">
                    Completed
                  </span>
                </div>
              </div>
              <i v-if="isActiveLesson(lesson)" class="fas fa-check text-primary"></i>
            </li>
          </ul>

          <!-- Empty State -->
          <div v-else class="sidebar-empty">
            <i class="fas fa-list-ul text-muted"></i>
            <p class="mb-0 mt-2">No lessons available</p>
          </div>

          <!-- Progress Section -->
          <div v-if="lessons.length > 0" class="progress-section">
            <div class="progress-header">
              <i class="fas fa-trophy"></i>
              <h6>Your Progress</h6>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: progressPercentage + '%' }"
              ></div>
            </div>
            <p class="progress-text">
              {{ completedLessonsCount }} of {{ lessons.length }} completed ({{ progressPercentage }}%)
            </p>
          </div>
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGuestStore } from '@/stores/guest'
import GuestNavigation from '@/utils/navigation'

const props = defineProps({
  notificationCount: {
    type: Number,
    default: 0
  }
})

const route = useRoute()
const router = useRouter()
const guestStore = useGuestStore()

// State
const currentCourseTitle = ref('')
const showMobileCourses = ref(false)
const showMobileLessons = ref(false)
const courses = ref([])
const lessons = ref([])
const loadingCourses = ref(false)
const loadingLessons = ref(false)
const coursesError = ref(null)
const lessonsError = ref(null)

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

// Show courses toggle when on guest COURSE DETAIL page AND on tablets/mobile
const showCoursesToggle = computed(() => {
  return route.name === 'guest-course-detail'
})

// Show lessons toggle when on guest LESSON DETAIL page AND on tablets/mobile
const showLessonsToggle = computed(() => {
  return route.name === 'guest-lesson-detail'
})

// Show back button for both guest course detail and lesson detail ON ALL DEVICES
const showBackButton = computed(() => {
  return route.name === 'guest-lesson-detail' || route.name === 'guest-course-detail'
})

// Dynamic back button title
const backButtonTitle = computed(() => {
  // For course detail view
  if (route.name === 'guest-course-detail') {
    try {
      const storedSource = sessionStorage.getItem('courseNavSource')
      if (storedSource) {
        const sourceData = JSON.parse(storedSource)
        switch(sourceData.source) {
          case 'courses':
          case 'all-courses':
            return 'Back to All Courses'
          case 'popular-courses':
            return 'Back to Popular Courses'
          case 'new-courses':
            return 'Back to New Courses'
          case 'home':
            return 'Back to Home'
          default:
            return 'Go Back'
        }
      }
    } catch (error) {
      console.error('Error parsing courseNavSource:', error)
    }
    return 'Back to Courses'
  }

  // For lesson detail view
  const source = GuestNavigation.getSource()
  if (source === 'guest-course-detail') {
    return 'Back to Course'
  } else if (source === 'exercises-overview' || source === 'lessons-overview') {
    return 'Back to Exercises'
  } else if (source === 'guest-courses') {
    return 'Back to Courses'
  } else if (source === 'home') {
    return 'Back to Home'
  }
  return 'Go Back'
})

// Computed properties for lessons
const completedLessonsCount = computed(() => {
  return lessons.value.filter(l => l.completed === true).length
})

const progressPercentage = computed(() => {
  const total = lessons.value.length
  const completed = completedLessonsCount.value
  return total > 0 ? Math.round((completed / total) * 100) : 0
})

// Check if a course is the currently active one
const isActiveCourse = (course) => {
  return route.params.courseSlug === course.code
}

// Check if a lesson is the currently active one
const isActiveLesson = (lesson) => {
  if (!route.params.lessonSlug) return false

  // Generate slug from lesson title for comparison
  const lessonSlug = generateSlug(lesson.title)
  return route.params.lessonSlug === lessonSlug
}

// Toggle mobile courses sidebar
const toggleMobileCourses = () => {
  showMobileCourses.value = !showMobileCourses.value
  if (showMobileCourses.value && courses.value.length === 0) {
    fetchCourses()
  }
  // Close lessons if open
  if (showMobileCourses.value) {
    showMobileLessons.value = false
  }
}

// Toggle mobile lessons sidebar
const toggleMobileLessons = () => {
  showMobileLessons.value = !showMobileLessons.value
  if (showMobileLessons.value && lessons.value.length === 0) {
    fetchLessons()
  }
  // Close courses if open
  if (showMobileLessons.value) {
    showMobileCourses.value = false
  }
}

// Close mobile courses sidebar
const closeMobileCourses = () => {
  showMobileCourses.value = false
}

// Close mobile lessons sidebar
const closeMobileLessons = () => {
  showMobileLessons.value = false
}

// Fetch available courses
const fetchCourses = async () => {
  loadingCourses.value = true
  coursesError.value = null

  try {
    const coursesData = await guestStore.getGuestCourses()
    courses.value = coursesData.courses || coursesData || []
  } catch (err) {
    console.error('Error fetching guest courses:', err)
    coursesError.value = 'Failed to load courses'
  } finally {
    loadingCourses.value = false
  }
}

// Fetch lessons for current course
const fetchLessons = async () => {
  loadingLessons.value = true
  lessonsError.value = null

  try {
    const courseSlug = route.params.courseSlug
    if (courseSlug) {
      const lessonsData = await guestStore.getGuestCourseLessons(courseSlug)
      lessons.value = lessonsData || []

      // Load course data for title
      const courseData = await guestStore.getGuestCourseDetail(courseSlug)
      currentCourseTitle.value = courseData?.title || 'Course Lessons'
    }
  } catch (err) {
    console.error('Error fetching lessons:', err)
    lessonsError.value = 'Failed to load lessons'
  } finally {
    loadingLessons.value = false
  }
}

// Select a course and navigate to it
const selectCourse = (course) => {
  showMobileCourses.value = false
  router.push(`/guest/courses/${course.code}`)
}

// Select a lesson and navigate to it
const selectLesson = (lesson) => {
  showMobileLessons.value = false

  // Generate slug from lesson title
  const lessonSlug = generateSlug(lesson.title)
  router.push(`/guest/courses/${route.params.courseSlug}/lessons/${lessonSlug}`)
}

// Smart back navigation for guest
const goBack = () => {
  console.log('⬅️ GUEST HEADER: Back button clicked')

  // Handle CourseDetail back navigation
  if (route.name === 'guest-course-detail') {
    console.log('📍 GUEST HEADER: Handling CourseDetail back navigation')

    try {
      const storedSource = sessionStorage.getItem('courseNavSource')
      if (storedSource) {
        const sourceData = JSON.parse(storedSource)
        console.log('📌 Found course navigation source:', sourceData.source)

        switch(sourceData.source) {
          case 'courses':
          case 'all-courses':
          case 'popular-courses':
          case 'new-courses':
            router.push({ name: sourceData.source })
            break
          case 'home':
            router.push({ name: 'home' })
            break
          default:
            router.back()
        }
        return
      } else {
        // Default for course layout: go to courses list
        console.log('⚠️ No course navigation source, defaulting to courses list')
        router.push({ name: 'guest-courses' })
        return
      }
    } catch (error) {
      console.error('Error parsing course navigation source:', error)
      router.back()
      return
    }
  }

  // Handle LessonDetail back navigation (existing logic)
  const source = GuestNavigation.getSource()
  const courseSlug = GuestNavigation.getCurrentCourseSlug()

  console.log('Navigation source:', source)
  console.log('Current course slug:', courseSlug)

  // Option 1: Came from guest course detail
  if (source === 'guest-course-detail' && courseSlug) {
    console.log('✅ Navigating back to guest course detail')
    router.push({
      name: 'guest-course-detail',
      params: { courseSlug }
    })
    return
  }

  // Option 2: Came from exercises overview
  if (source === 'exercises-overview' || source === 'lessons-overview') {
    console.log('✅ Navigating back to exercises overview')
    router.push({ name: 'exercises-overview' })
    return
  }

  // Option 3: Came from home
  if (source === 'home') {
    console.log('✅ Navigating back to home')
    router.push({ name: 'home' })
    return
  }

  // Option 4: Try to go back to guest courses list
  console.log('⚠️ No specific source found, navigating to guest courses')
  router.push({ name: 'guest-courses' })
}

// Load course title if available
const loadCourseTitle = async () => {
  const courseSlug = GuestNavigation.getCurrentCourseSlug() || route.params.courseSlug
  if (courseSlug && guestStore.isGuestMode) {
    try {
      // Try to get from store first
      const course = guestStore.currentCourse
      if (course?.title) {
        currentCourseTitle.value = course.title
      } else {
        // Fallback to sessionStorage
        const cached = sessionStorage.getItem(`guest_course_${courseSlug}`)
        if (cached) {
          const courseData = JSON.parse(cached)
          currentCourseTitle.value = courseData.title || ''
        }
      }
    } catch (error) {
      console.error('Failed to load course title:', error)
    }
  }
}

// Setup navigation source when entering guest lesson detail
const setupNavigationSource = () => {
  if (route.name === 'guest-lesson-detail') {
    // Get previous route from router or sessionStorage
    const previousRoute = sessionStorage.getItem('previousRoute')
    let source = 'guest-courses' // Default source

    if (previousRoute) {
      try {
        const parsed = JSON.parse(previousRoute)
        source = parsed.name || 'guest-courses'
      } catch (e) {
        console.error('Failed to parse previous route:', e)
      }
    }

    // Store the source
    GuestNavigation.setSource(source)

    // Store current course slug
    const courseSlug = route.params.courseSlug
    if (courseSlug) {
      GuestNavigation.setCurrentCourse(courseSlug)

      // Try to load course data for title
      loadCourseTitle()
    }
  }
}

// Watch for route changes
watch(() => route.name, (newName, oldName) => {
  if (newName === 'guest-lesson-detail') {
    setupNavigationSource()
  }

  // Close both sidebars when route changes
  if (showMobileCourses.value) {
    showMobileCourses.value = false
  }
  if (showMobileLessons.value) {
    showMobileLessons.value = false
  }
})

// Watch for lesson changes to update the lessons list
watch(() => route.params.courseSlug, (newSlug) => {
  if (newSlug && showLessonsToggle.value) {
    lessons.value = []
    loadCourseTitle()
  }
})

// Initial setup
onMounted(() => {
  if (route.name === 'guest-lesson-detail') {
    setupNavigationSource()
  }

  // Load lessons if we're on a lesson detail page
  if (showLessonsToggle.value && route.params.courseSlug) {
    loadCourseTitle()
  }
})

// Cleanup on unmount
onUnmounted(() => {
  // Only clear if navigating away from guest entirely
  if (!route.name?.includes('guest')) {
    GuestNavigation.clearSource()
  }
})
</script>

<style scoped>
/* Guest Header specific styles */
.guest-dashboard-header {
  background-color: var(--header-bg);
  padding: 10.3px 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 3px var(--shadow-color);
  height: 60px;
  box-sizing: border-box;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

/* Courses & Lessons Toggle Buttons */
.courses-toggle-btn,
.lessons-toggle-btn {
  display: flex !important;
  align-items: center;
  gap: 8px;
  padding: 8px 16px !important;
  border-radius: 8px !important;
  transition: all 0.3s ease;
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
}

.courses-toggle-btn:hover,
.lessons-toggle-btn:hover {
  background: rgba(8, 121, 144, 0.2) !important;
  transform: translateX(0) !important;
}

.courses-toggle-btn.active,
.lessons-toggle-btn.active {
  background: var(--primary-color) !important;
  color: white !important;
}

.courses-label,
.lessons-label {
  font-size: 0.9rem;
  font-weight: 500;
}

.page-title {
  flex: 1;
  min-width: 0;
}

.empty-title {
  width: 1px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-action-btn {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 50%;
  color: var(--primary-color);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.header-action-btn:hover {
  background-color: rgba(8, 121, 144, 0.1);
  color: var(--primary-color);
  transform: scale(1.1);
}

.header-action-btn.active {
  color: var(--primary-color);
  background-color: rgba(8, 121, 144, 0.15);
}

.header-action-btn i {
  font-size: 1.2rem;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: var(--error-color);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
}

/* Shared Sidebar Styles */
.courses-sidebar-overlay,
.lessons-sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
}

.courses-sidebar-panel,
.lessons-sidebar-panel {
  width: 320px;
  max-width: 85vw;
  height: 100vh;
  background: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(8, 121, 144, 0.08);
  background: linear-gradient(135deg, rgba(8, 121, 144, 0.05), rgba(8, 121, 144, 0.02));
}

.sidebar-header h6 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary-color);
}

.close-btn {
  background: none;
  border: none;
  color: var(--secondary-color);
  font-size: 1.3rem;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: rgba(8, 121, 144, 0.1);
  color: var(--primary-color);
  transform: rotate(90deg);
}

.sidebar-loading,
.sidebar-error,
.sidebar-empty {
  padding: 32px 24px;
  text-align: center;
  color: var(--primary-color);
  font-size: 0.9rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.sidebar-error {
  color: var(--error-color);
}

.sidebar-empty i {
  font-size: 2.5rem;
  opacity: 0.3;
}

/* Courses List Styles */
.courses-list {
  list-style: none;
  padding: 8px;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}

.course-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 3px solid transparent;
  border-radius: 10px;
  margin-bottom: 4px;
}

.course-item:hover {
  background-color: rgba(8, 121, 144, 0.06);
  transform: translateX(4px);
}

.course-item.active {
  background: linear-gradient(135deg, rgba(8, 121, 144, 0.12), rgba(8, 121, 144, 0.08));
  border-left-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(8, 121, 144, 0.1);
}

.course-item.active .course-name {
  color: var(--primary-color);
  font-weight: 700;
}

.course-item.active .course-code {
  color: var(--primary-color);
  opacity: 0.9;
}

.course-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-color), #065e6f);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.1rem;
  box-shadow: 0 4px 12px rgba(8, 121, 144, 0.2);
}

.course-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.course-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.course-code {
  font-size: 0.75rem;
  color: var(--secondary-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  opacity: 0.8;
}

/* Lessons List Styles */
.lessons-list {
  list-style: none;
  padding: 8px;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}

.lesson-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 3px solid transparent;
  border-radius: 10px;
  margin-bottom: 4px;
}

.lesson-item:hover {
  background-color: rgba(8, 121, 144, 0.06);
  transform: translateX(4px);
}

.lesson-item.active {
  background: linear-gradient(135deg, rgba(8, 121, 144, 0.12), rgba(8, 121, 144, 0.08));
  border-left-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(8, 121, 144, 0.1);
}

.lesson-item.completed .lesson-number {
  color: var(--success-color);
}

.lesson-number {
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
  border-radius: 8px;
  background: rgba(8, 121, 144, 0.1);
}

.lesson-number i {
  font-size: 1.2rem;
}

.lesson-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lesson-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.lesson-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.7rem;
  color: var(--secondary-color);
  opacity: 0.8;
}

.completed-badge {
  display: inline-flex;
  align-items: center;
  background-color: var(--success-color);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.6rem;
  font-weight: 600;
  margin-left: 4px;
}

/* Progress Section */
.progress-section {
  padding: 16px;
  border-top: 1px solid rgba(8, 121, 144, 0.1);
  background: rgba(8, 121, 144, 0.03);
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.progress-header i {
  color: #ffc107;
  font-size: 1rem;
}

.progress-header h6 {
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0;
  color: var(--secondary-color);
}

.progress-bar {
  height: 6px;
  background-color: rgba(8, 121, 144, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), #0a9bb8);
  transition: width 0.5s ease;
  border-radius: 3px;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--secondary-color);
  margin: 0;
  text-align: center;
  opacity: 0.8;
}

/* Slide Left Animation */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-active .courses-sidebar-panel,
.slide-left-leave-active .courses-sidebar-panel,
.slide-left-enter-active .lessons-sidebar-panel,
.slide-left-leave-active .lessons-sidebar-panel {
  transition: transform 0.3s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  opacity: 0;
}

.slide-left-enter-from .courses-sidebar-panel,
.slide-left-enter-from .lessons-sidebar-panel {
  transform: translateX(-100%);
}

.slide-left-leave-to .courses-sidebar-panel,
.slide-left-leave-to .lessons-sidebar-panel {
  transform: translateX(-100%);
}

/* Custom Scrollbar */
.courses-list::-webkit-scrollbar,
.lessons-list::-webkit-scrollbar {
  width: 6px;
}

.courses-list::-webkit-scrollbar-track,
.lessons-list::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 0;
}

.courses-list::-webkit-scrollbar-thumb,
.lessons-list::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--primary-color), #065e6f);
  border-radius: 10px;
}

.courses-list::-webkit-scrollbar-thumb:hover,
.lessons-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #065e6f, var(--primary-color));
}

/* Responsive styles */
@media (max-width: 768px) {
  .guest-dashboard-header {
    padding: 10px;
  }

  .header-left {
    gap: 10px;
  }

  .header-actions {
    gap: 8px;
  }

  .courses-label,
  .lessons-label {
    display: none;
  }

  .courses-toggle-btn,
  .lessons-toggle-btn {
    padding: 8px !important;
    width: 36px;
    height: 36px;
    border-radius: 50% !important;
  }

  .courses-sidebar-panel,
  .lessons-sidebar-panel {
    width: 280px;
  }

  .course-icon {
    width: 35px;
    height: 35px;
  }

  .course-item,
  .lesson-item {
    height: auto !important;
    background-color: white;
  }
}

@media (max-width: 480px) {
  .header-action-btn {
    width: 36px;
    height: 36px;
  }

  .courses-sidebar-panel,
  .lessons-sidebar-panel {
    width: 85vw;
  }
}

/* Hide toggles on DESKTOP (>1024px) */
@media (min-width: 1025px) {
  .courses-toggle-btn,
  .lessons-toggle-btn {
    display: none !important;
  }
}

/* Show toggles on tablets and small devices (<=1024px) */
@media (max-width: 1024px) {
  .courses-toggle-btn,
  .lessons-toggle-btn {
    display: flex !important;
  }

  .course-item,
  .lesson-item {
    height: auto !important;
    background-color: white;
  }
}

/* Tablet specific adjustments */
@media (min-width: 768px) and (max-width: 1024px) {
  .guest-dashboard-header {
    padding: 10px;
  }

  .header-left {
    margin-left: 0.5rem;
  }

  .courses-toggle-btn,
  .lessons-toggle-btn {
    display: flex !important;
  }

  .courses-sidebar-panel,
  .lessons-sidebar-panel {
    width: 300px;
  }

  /* Ensure back button is ALWAYS visible on tablets */
  .back-btn {
    display: flex !important;
  }
}

/* Ensure back button is ALWAYS visible on ALL devices */
.back-btn {
  display: flex !important;
}
</style>