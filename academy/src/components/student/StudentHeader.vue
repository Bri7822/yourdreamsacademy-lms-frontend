<!-- src/components/layout/StudentHeader.vue -->
<template>
  <header class="dashboard-header">
    <!-- LEFT SIDE: Courses & Lessons Icons (Expandable) -->
    <div class="header-left">
      <!-- Courses Toggle -->
      <button
        v-if="showCoursesDropdown"
        class="header-action-btn courses-toggle-btn"
        :class="{ 'active': showMobileCourses }"
        @click="toggleMobileCourses"
        title="My Courses"
      >
        <i class="fas fa-book"></i>
        <span class="courses-label">Courses</span>
      </button>

      <!-- Lessons Toggle -->
      <button
        v-if="showLessonsDropdown"
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
      <!-- <h1>{{ title }}</h1> -->
    </div>

    <!-- RIGHT SIDE: Actions -->
    <div class="header-actions">
      <!-- Back Arrow - Shows when in lesson detail view -->
      <button
        v-if="showBackButton"
        @click="goBack"
        class="header-action-btn back-btn"
        :title="backButtonTitle"
      >
        <i class="fas fa-arrow-left"></i>
      </button>

      <!-- Dashboard Icon - Shows when in LessonDetail view -->
      <router-link
        v-if="showDashboardButton"
        :to="dashboardRoute"
        class="header-action-btn"
        title="Dashboard"
        exact-active-class="active"
      >
        <i class="fas fa-tachometer-alt"></i>
      </router-link>

      <router-link
        to="/"
        class="header-action-btn"
        title="Home"
        exact-active-class="active"
      >
        <i class="fas fa-home"></i>
      </router-link>

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
            <h6>My Courses</h6>
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
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NavigationHistory } from '@/utils/navigationHistory'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useLessonStore } from '@/stores/lesson'

const props = defineProps({
  title: {
    type: String,
    default: 'Dashboard'
  },
  notificationCount: {
    type: Number,
    default: 0
  }
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const lessonStore = useLessonStore()

const showMobileCourses = ref(false)
const showMobileLessons = ref(false)
const courses = ref([])
const lessons = ref([])
const loadingCourses = ref(false)
const loadingLessons = ref(false)
const coursesError = ref(null)
const lessonsError = ref(null)

const showBackButton = computed(() => {
  // Show back button in both LessonDetail AND CourseLayout
  return route.name === 'student-lesson-detail' ||
         route.name === 'guest-lesson-detail' ||
         route.name === 'student-course-detail' ||
         route.name === 'guest-course-detail'
})

const showCoursesDropdown = computed(() => {
  return route.name === 'student-course-detail' || route.name === 'guest-course-detail'
})

const showLessonsDropdown = computed(() => {
  return route.name === 'student-lesson-detail' || route.name === 'guest-lesson-detail'
})

// NEW: Show dashboard button when in LessonDetail OR CourseLayout
const showDashboardButton = computed(() => {
  return route.name === 'student-lesson-detail' ||
         route.name === 'guest-lesson-detail' ||
         route.name === 'student-course-detail' ||
         route.name === 'guest-course-detail'
})

// NEW: Dashboard route based on user type
const dashboardRoute = computed(() => {
  if (route.name === 'guest-lesson-detail' || route.name === 'guest-course-detail') {
    return '/guest/courses'
  }
  // For authenticated students
  return '/student'
})

const currentCourseTitle = computed(() => {
  return lessonStore.courseData?.title || 'Course Lessons'
})

const completedLessonsCount = computed(() => {
  return lessons.value.filter(l => l.completed === true).length
})

const progressPercentage = computed(() => {
  const total = lessons.value.length
  const completed = completedLessonsCount.value
  return total > 0 ? Math.round((completed / total) * 100) : 0
})

const backButtonTitle = computed(() => {
  const source = getNavigationSource()

  // For course detail view
  if (route.name === 'student-course-detail' || route.name === 'guest-course-detail') {
    try {
      const storedSource = sessionStorage.getItem('courseNavSource')
      if (storedSource) {
        const sourceData = JSON.parse(storedSource)
        switch(sourceData.source) {
          case 'student-courses':
            return 'Back to My Courses'
          case 'student-dashboard':
            return 'Back to Dashboard'
          case 'courses':
          case 'all-courses':
            return 'Back to All Courses'
          case 'popular-courses':
            return 'Back to Popular Courses'
          case 'new-courses':
            return 'Back to New Courses'
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
  switch(source?.source) {
    case 'exercises-overview':
      return 'Back to Exercises'
    case 'lessons-overview':
      return 'Back to Lessons Overview'
    case 'student-Lessons':
      return 'Back to All Lessons'
    case 'student-course-detail':
      return 'Back to Course'
    case 'guest-course-detail':
      return 'Back to Course Preview'
    default:
      return 'Go Back'
  }
})

const isActiveCourse = (course) => {
  return route.params.courseSlug === course.code
}

const isActiveLesson = (lesson) => {
  if (!route.params.lessonSlug) return false

  // Generate slug from lesson title for comparison
  const lessonSlug = lesson.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()

  return route.params.lessonSlug === lessonSlug
}

const getNavigationSource = () => {
  return NavigationHistory.getSource()
}

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

const closeMobileCourses = () => {
  showMobileCourses.value = false
}

const closeMobileLessons = () => {
  showMobileLessons.value = false
}

const fetchCourses = async () => {
  loadingCourses.value = true
  coursesError.value = null

  try {
    const response = await axios.get('/api/student/courses/', {
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`
      }
    })

    courses.value = response.data.courses || []
  } catch (err) {
    console.error('Error fetching courses:', err)
    coursesError.value = 'Failed to load courses'
  } finally {
    loadingCourses.value = false
  }
}

const fetchLessons = async () => {
  loadingLessons.value = true
  lessonsError.value = null

  try {
    // Get lessons from store or fetch them
    if (lessonStore.lessons.length > 0) {
      lessons.value = lessonStore.lessons
    } else {
      const courseSlug = route.params.courseSlug
      if (courseSlug) {
        await lessonStore.loadLessons(courseSlug)
        lessons.value = lessonStore.lessons
      }
    }
  } catch (err) {
    console.error('Error fetching lessons:', err)
    lessonsError.value = 'Failed to load lessons'
  } finally {
    loadingLessons.value = false
  }
}

const selectCourse = (course) => {
  showMobileCourses.value = false
  router.push(`/student/courses/${course.code}`)
}

const selectLesson = (lesson) => {
  showMobileLessons.value = false

  // Generate slug from lesson title
  const lessonSlug = lesson.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()

  router.push(`/student/courses/${route.params.courseSlug}/lessons/${lessonSlug}`)
}

const goBack = () => {
  console.log('\n' + '='.repeat(80))
  console.log('⬅️ HEADER: Back button clicked')
  console.log('Current route:', route.name)
  console.log('Route params:', route.params)

  // Handle CourseLayout back navigation
  if (route.name === 'student-course-detail' || route.name === 'guest-course-detail') {
    console.log('📍 HEADER: Handling CourseLayout back navigation')

    try {
      const storedSource = sessionStorage.getItem('courseNavSource')
      if (storedSource) {
        const sourceData = JSON.parse(storedSource)
        console.log('📌 Found course navigation source:', sourceData.source)

        switch(sourceData.source) {
          case 'student-courses':
            router.push({ name: 'student-courses' })
            break
          case 'student-dashboard':
            router.push({ name: 'student-dashboard' })
            break
          case 'courses':
          case 'all-courses':
          case 'popular-courses':
          case 'new-courses':
            router.push({ name: sourceData.source })
            break
          default:
            router.back()
        }
        console.log('='.repeat(80) + '\n')
        return
      } else {
        // Default for course layout: go to courses list
        console.log('⚠️ No course navigation source, defaulting to courses list')
        if (route.name === 'guest-course-detail') {
          router.push({ name: 'guest-courses' })
        } else {
          router.push({ name: 'student-courses' })
        }
        console.log('='.repeat(80) + '\n')
        return
      }
    } catch (error) {
      console.error('Error parsing course navigation source:', error)
      router.back()
      console.log('='.repeat(80) + '\n')
      return
    }
  }

  // Handle LessonDetail back navigation (existing logic)
  const currentParams = {
    courseSlug: route.params.courseSlug,
    lessonId: route.params.lessonId
  }

  const source = getNavigationSource()
  console.log('Navigation source:', source)
  console.log('='.repeat(80))

  const backRoute = NavigationHistory.getBackRoute(currentParams)

  if (backRoute) {
    console.log('✅ Navigating to stored route:', backRoute)
    NavigationHistory.clear()
    router.push(backRoute)
  } else {
    try {
      const storedSource = sessionStorage.getItem('lessonNavSource')
      if (storedSource) {
        const sourceData = JSON.parse(storedSource)
        console.log('📌 Found backup source:', sourceData.source)

        switch(sourceData.source) {
          case 'student-Lessons':
            router.push({ name: 'student-Lessons' })
            break
          case 'student-course-detail':
            const slug = sourceData.params?.courseSlug || currentParams.courseSlug
            if (slug) {
              router.push({
                name: 'student-course-detail',
                params: { courseSlug: slug }
              })
            } else {
              router.back()
            }
            break
          case 'guest-course-detail':
            const guestSlug = sourceData.params?.courseSlug || currentParams.courseSlug
            if (guestSlug) {
              router.push({
                name: 'guest-course-detail',
                params: { courseSlug: guestSlug }
              })
            } else {
              router.push({ name: 'guest-courses' })
            }
            break
          default:
            router.back()
        }
      } else {
        console.log('⚠️ No navigation source found, using browser back')
        router.back()
      }
    } catch (error) {
      console.error('Error parsing backup source:', error)
      router.back()
    }
  }

  console.log('='.repeat(80) + '\n')
}

watch(() => route.name, (newName, oldName) => {
  const lessonSources = ['exercises-overview', 'lessons-overview', 'student-Lessons', 'student-course-detail', 'guest-course-detail']

  if (lessonSources.includes(oldName) &&
      (newName === 'student-lesson-detail' || newName === 'guest-lesson-detail')) {
    console.log('📍 HEADER: Storing navigation source from:', oldName)

    NavigationHistory.setSource(oldName, {
      courseSlug: route.params.courseSlug,
      ...route.params
    })
  }

  // Close both sidebars when route changes
  if (showMobileCourses.value) {
    showMobileCourses.value = false
  }
  if (showMobileLessons.value) {
    showMobileLessons.value = false
  }
})

// Watch for lesson store changes to update the lessons list
watch(() => lessonStore.lessons, (newLessons) => {
  if (newLessons.length > 0) {
    lessons.value = newLessons
  }
}, { deep: true })

onMounted(() => {
  if (showBackButton.value) {
    console.log('📍 HEADER: Mounted on lesson detail view')
    console.log('Current source:', getNavigationSource())
  }

  // Load lessons if we're on a lesson detail page
  if (showLessonsDropdown.value && lessonStore.lessons.length > 0) {
    lessons.value = lessonStore.lessons
  }
})
</script>

<style scoped>
/* All existing styles remain the same */
.dashboard-header {
  background-color: var(--header-bg);
  padding: 10.3px 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 3px var(--shadow-color);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.courses-toggle-btn,
.lessons-toggle-btn {
  display: flex !important;
  align-items: center;
  gap: 8px;
  padding: 8px 16px !important;
  border-radius: 8px !important;
  transition: all 0.3s ease;
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
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.page-title h1 {
  font-size: var(--fs-lg);
  font-weight: 700;
  color: var(--secondary-color);
  margin: 0;
  font-family: var(--font-heading);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
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

.lesson-item.inactive {
  opacity: 0.7;
}

.lesson-item.active .lesson-name {
  color: var(--primary-color) !important;
  font-weight: 700;
}

.lesson-item.active .lesson-code {
  color: var(--primary-color) !important;
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

/* Mobile Responsive Styles */
@media (max-width: 767.98px) {
  .dashboard-header {
    padding: 8px 12px;
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

  .page-title h1 {
    font-size: var(--fs-md);
  }

  .header-actions {
    gap: 8px;
  }

  .header-action-btn {
    width: 36px;
    height: 36px;
  }

  .header-action-btn i {
    font-size: 1.1rem;
  }

  .notification-badge {
    width: 18px;
    height: 18px;
    font-size: 0.65rem;
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
}

@media (max-width: 575.98px) {
  .header-actions {
    gap: 6px;
  }

  .header-action-btn {
    width: 34px;
    height: 34px;
  }

  .courses-sidebar-panel,
  .lessons-sidebar-panel {
    width: 85vw;
  }
}

@media (min-width: 1025px) {
  .courses-toggle-btn,
  .lessons-toggle-btn {
    display: none !important;
  }
}

@media (min-width: 768px) and (max-width: 991px) {
  .dashboard-header {
    padding: 8px 12px;
  }

  .header-left {
    margin-left: .5rem;
  }

  .page-title h1 {
    font-size: 1.1rem;
  }

  .header-actions {
    gap: 8px;
  }

  .header-action-btn {
    width: 36px;
    height: 36px;
  }

  .courses-sidebar-panel,
  .lessons-sidebar-panel {
    width: 300px;
  }

  .course-item,
  .lesson-item {
    height: auto !important;
    background-color: white;
  }
}

/* Hide back button on tablets when sidebar is visible */
@media (min-width: 768px) and (max-width: 991px) {
  .back-btn {
    display: flex;
  }

  .header-left {
    margin-left: 1rem;
  }
}
</style>