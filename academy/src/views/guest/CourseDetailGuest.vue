<template>
  <div class="container-fluid px-0 guest-course-detail">
    <!-- Guest Header - Attached to top with no space -->
    <GuestHeader :title="course.title || 'Course Preview'" :context="'guest'" class="sticky-top" />

    <!-- Main Content with Sidebar -->
    <div class="main-content-with-sidebar">
      <!-- Sidebar Column -->
      <div class="sidebar-column" :class="{ 'mobile-hidden': !showMobileSidebar }">
        <CourseDetailsSideBarGuest
          :other-courses="otherCourses"
          :current-course="course"
          :loading-other-courses="loadingOtherCourses"
          :other-courses-error="otherCoursesError"
          :current-course-id="course.id"
          @refresh-courses="fetchOtherCourses"
          @course-navigate="handleSidebarCourseNavigation"
          @update-course="handleCourseUpdate"
        />
      </div>

      <!-- Main Content Column -->
      <div class="content-column">
        <div class="course-main-content">
          <h3 class="section-title">{{ course.title || 'Course Preview' }}</h3>

          <!-- Loading State -->
          <div v-if="loading" class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading course preview...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="error" class="error-container">
            <i class="fas fa-exclamation-triangle"></i>
            <p>{{ error }}</p>
            <button @click="fetchCourseDetails" class="retry-button">Try Again</button>
          </div>

          <!-- Course Content -->
          <div v-else-if="course.id" class="course-content">
            <!-- Course Overview (Guest always sees overview) -->
            <div class="course-overview">
              <div class="course-hero card-animate" :style="{ 'animation-delay': '0ms' }">
                <div class="course-basic-info">
                  <div class="course-header-info">
                    <h1 class="course-title">{{ course.title }}</h1>
                    <div class="course-meta">
                      <span class="course-code">
                        <i class="fas fa-tag"></i>
                        {{ course.code }}
                      </span>
                      <span class="course-duration">
                        <i class="fas fa-clock"></i>
                        {{ course.duration }} weeks
                      </span>
                      <span class="course-price free">
                        <i class="fas fa-gift"></i>
                        Free Preview
                      </span>
                      <!-- Enrollment badge moved here for mobile alignment -->
                      <span class="enrollment-status-badge-inline guest d-md-none">
                        <i class="fas fa-eye"></i>
                        <span>Guest Preview</span>
                      </span>
                    </div>
                  </div>

                  <!-- Desktop enrollment badge -->
                  <div class="enrollment-status-badge guest d-none d-md-flex">
                    <i class="fas fa-eye"></i>
                    <span>Guest Preview</span>
                  </div>
                </div>

                <div class="course-description">
                  <h4>Course Description</h4>
                  <p>{{ course.description || 'No description available for this course.' }}</p>
                </div>
              </div>

              <div class="course-details-grid">
                <div
                  class="course-info-section card-animate"
                  :style="{ 'animation-delay': '100ms' }"
                >
                  <h4>
                    <i class="fas fa-info-circle"></i>
                    Course Information
                  </h4>
                  <div class="info-grid">
                    <div class="info-item">
                      <label>Duration:</label>
                      <span>{{ course.duration }} weeks</span>
                    </div>
                    <div class="info-item">
                      <label>Total Lessons:</label>
                      <span>{{ course.total_lessons || course.lessons?.length || 0 }} lessons</span>
                    </div>
                    <div class="info-item">
                      <label>Course Level:</label>
                      <span>{{ course.level || 'Beginner' }}</span>
                    </div>
                    <div class="info-item">
                      <label>Teacher:</label>
                      <span>{{ course.teacher_name || 'Instructor' }}</span>
                    </div>
                  </div>
                </div>

                <div
                  class="course-progress-section card-animate"
                  :style="{ 'animation-delay': '200ms' }"
                >
                  <h4>
                    <i class="fas fa-chart-line"></i>
                    <span class="desktop-text">Preview Information</span>
                  </h4>
                  <div class="progress-stats">
                    <div class="progress-circle">
                      <div class="circle" :style="{ '--progress': 0 }">
                        <span class="percentage">0%</span>
                      </div>
                    </div>
                    <div class="progress-details">
                      <p>
                        0 of {{ course.total_lessons || course.lessons?.length || 0 }} lessons
                        completed
                      </p>
                      <div class="progress-bar-container">
                        <div class="progress-bar" :style="{ width: '0%' }"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Course Syllabus -->
              <div
                class="syllabus-section card-animate"
                v-if="course.lessons && course.lessons.length > 0"
                :style="{ 'animation-delay': '300ms' }"
              >
                <h4>
                  <i class="fas fa-list"></i>
                  Course Syllabus (Preview)
                </h4>
                <div class="lessons-preview">
                  <div
                    v-for="(lesson, index) in course.lessons"
                    :key="lesson.id"
                    class="lesson-item card-animate clickable-lesson"
                    :style="{ 'animation-delay': `${400 + index * 100}ms` }"
                    @click="viewLesson(lesson)"
                  >
                    <div class="lesson-content">
                      <h5>{{ lesson.title }}</h5>
                      <p v-if="lesson.description" class="d-none d-md-block">
                        {{ truncateDescription(lesson.description, 100) }}
                      </p>
                      <div class="lesson-meta">
                        <span v-if="lesson.duration">
                          <i class="fas fa-clock"></i>
                          {{ lesson.duration }} min
                        </span>
                        <span class="preview-badge">
                          <i class="fas fa-eye"></i>
                          Preview
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Limited Access Notice -->
                <div
                  v-if="course.lessons && course.total_lessons > course.lessons.length"
                  class="limited-access-notice"
                >
                  <i class="fas fa-info-circle"></i>
                  <p>
                    Preview limited to {{ course.lessons.length }} of
                    {{ course.total_lessons }} lessons.
                    <a href="/signup" class="register-link">Register for full access</a>
                  </p>
                </div>
              </div>

              <!-- Call to Action Section -->
              <div
                class="cta-section card-animate"
                :style="{ 'animation-delay': `${400 + (course.lessons?.length * 100 || 0)}ms` }"
              >
                <div class="enrolled-actions">
                  <button
                    @click="startPreview"
                    class="start-learning-button"
                    :disabled="!course.lessons || course.lessons.length === 0"
                  >
                    <i class="fas fa-play-circle"></i>
                    {{
                      course.lessons && course.lessons.length > 0
                        ? 'Start Preview'
                        : 'No Lessons Available'
                    }}
                  </button>
                  <!-- Hide "Register for Full Access" text on small devices -->
                  <button @click="register" class="view-content-button d-none d-md-inline-flex">
                    <i class="fas fa-user-plus"></i>
                    Register for Full Access
                  </button>
                  <!-- Show "Register" on small devices -->
                  <button @click="register" class="view-content-button d-md-none">
                    <i class="fas fa-user-plus"></i>
                    Register
                  </button>
                </div>

                <p class="guest-notice mt-3">
                  <i class="fas fa-clock"></i>
                  Your preview session will expire in {{ remainingTime }} minutes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGuestStore } from '@/stores/guest'
import { useToast } from 'vue-toastification'
import GuestHeader from '@/components/guest/GuestHeader.vue'
import CourseDetailsSideBarGuest from '@/components/guest/CourseDetailsSidebarGuest.vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const guestStore = useGuestStore()
const toast = useToast()

// Debug mode
const debugMode = ref(true)

// State
const course = ref({})
const loading = ref(false)
const error = ref(null)
const showMobileSidebar = ref(false)

// State for other courses
const otherCourses = ref([])
const loadingOtherCourses = ref(false)
const otherCoursesError = ref(null)

// Computed properties
const remainingTime = computed(() => {
  const minutes = Math.floor(guestStore.remainingTime / 60)
  const seconds = guestStore.remainingTime % 60
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
})

// Debug logging function
const debugLog = (message, data = null) => {
  if (debugMode.value) {
    ;`🔍 [CourseDetailsGuest] ${message}`, data || ''
  }
}

// Helper methods
const truncateDescription = (description, maxLength = 100) => {
  if (!description) return 'No description available'
  return description.length > maxLength ? description.substring(0, maxLength) + '...' : description
}

const handleCourseUpdate = (updatedCourse) => {
  debugLog('Course updated from sidebar', updatedCourse)
  if (updatedCourse.id === course.value.id) {
    course.value = { ...course.value, ...updatedCourse }
  }
}

// Handle sidebar navigation WITHOUT router
const handleSidebarCourseNavigation = async (selectedCourse) => {
  debugLog('Sidebar course navigation requested', {
    course: selectedCourse.title,
    selectedCode: selectedCourse.code,
    currentCode: route.params.courseSlug,
  })

  // Close mobile sidebar on course selection
  if (showMobileSidebar.value) {
    showMobileSidebar.value = false
  }

  // Check if we're already on this course
  if (route.params.courseSlug === selectedCourse.code) {
    debugLog('Already on this course, skipping navigation')
    return
  }

  // Update URL without router navigation
  updateUrlWithoutNavigation(selectedCourse.code)

  // Fetch the new course data
  await loadCourseData(selectedCourse.code)
}

// Update URL without triggering router navigation
const updateUrlWithoutNavigation = (courseSlug) => {
  const newUrl = `/guest/courses/${courseSlug}`

  // Update browser URL without triggering router navigation
  window.history.replaceState({}, '', newUrl)

  // Update route params locally to keep everything in sync
  route.params.courseSlug = courseSlug

  debugLog('URL updated without navigation', newUrl)
}

// Load course data without router navigation
const loadCourseData = async (courseSlug) => {
  loading.value = true
  error.value = null

  try {
    debugLog('Loading course data for', courseSlug)

    // Ensure guest session is active
    if (!guestStore.isGuestMode) {
      const result = await guestStore.startGuestSession()
      if (!result.success) {
        toast.error('Failed to start guest session')
        router.push('/courses')
        return
      }
    }

    // Use guest API endpoint to get course details
    const response = await axios.get(`/api/student/guest/courses/${courseSlug}/detail/`, {
      params: {
        session_id: guestStore.session?.session_id,
      },
    })

    course.value = response.data
    debugLog('Course data loaded', {
      title: course.value.title,
      lessons: course.value.lessons?.length,
    })

    // Publish event to notify sidebar of successful navigation
    if (window.eventBridge) {
      window.eventBridge.publish('guest-course-loaded', {
        courseId: course.value.id,
        courseCode: course.value.code,
        course: course.value,
      })
    }
  } catch (err) {
    console.error('Error loading course data:', err)

    // Revert URL on error
    const originalUrl = `/guest/courses/${route.params.courseSlug}`
    window.history.replaceState({}, '', originalUrl)

    if (err.response?.status === 404) {
      error.value = 'Course not found or not available for preview.'
    } else if (err.response?.status === 403) {
      error.value = 'This course is not available for guest preview.'
    } else if (err.response?.status === 410) {
      error.value = 'Your guest session has expired. Please start a new session.'
      router.push('/courses')
    } else {
      error.value = 'Failed to load course preview. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

// Fetch course details for initial load
const fetchCourseDetails = async () => {
  const courseSlug = route.params.courseSlug
  loading.value = true
  error.value = null

  try {
    debugLog('Fetching initial course details', courseSlug)

    // Ensure guest session is active
    if (!guestStore.isGuestMode) {
      const result = await guestStore.startGuestSession()
      if (!result.success) {
        toast.error('Failed to start guest session')
        router.push('/courses')
        return
      }
    }

    // Use guest API endpoint to get course details
    const response = await axios.get(`/api/student/guest/courses/${courseSlug}/detail/`, {
      params: {
        session_id: guestStore.session?.session_id,
      },
    })

    course.value = response.data
    debugLog('Initial course loaded', {
      title: course.value.title,
      lessons: course.value.lessons?.length,
    })

    // Fetch other courses for sidebar
    await fetchOtherCourses()
  } catch (err) {
    console.error('Error fetching guest course details:', err)
    if (err.response?.status === 404) {
      error.value = 'Course not found or not available for preview.'
    } else if (err.response?.status === 403) {
      error.value = 'This course is not available for guest preview.'
    } else if (err.response?.status === 410) {
      error.value = 'Your guest session has expired. Please start a new session.'
      router.push('/courses')
    } else {
      error.value = 'Failed to load course preview. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

const fetchOtherCourses = async () => {
  loadingOtherCourses.value = true
  otherCoursesError.value = null

  try {
    const coursesData = await guestStore.getGuestCourses()
    otherCourses.value = coursesData.courses || coursesData || []
    debugLog('Other courses loaded', otherCourses.value.length)
  } catch (err) {
    console.error('Error fetching other guest courses:', err)
    otherCoursesError.value = 'Failed to load other courses.'
  } finally {
    loadingOtherCourses.value = false
  }
}

const generateSlug = (title) => {
  if (!title) return ''
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}

const startPreview = async () => {
  if (!course.value.lessons || course.value.lessons.length === 0) {
    toast.error('No lessons available for preview')
    return
  }

  const firstLesson = course.value.lessons[0]

  if (!firstLesson.id || !firstLesson.title) {
    console.error('❌ First lesson has incomplete data:', firstLesson)
    toast.error('Cannot start preview: Lesson data incomplete')
    return
  }

  debugLog('Starting preview with lesson:', firstLesson)

  try {
    const lessonSlug = generateSlug(firstLesson.title)
    console.log('🚀 Navigating to lesson with slug:', {
      courseSlug: route.params.courseSlug,
      lessonSlug: lessonSlug,
      lessonId: firstLesson.id,
      lessonTitle: firstLesson.title,
    })

    await router.push({
      name: 'guest-lesson-detail',
      params: {
        courseSlug: route.params.courseSlug,
        lessonSlug: lessonSlug,
      },
    })
    console.log('✅ Successfully navigated to lesson')
  } catch (error) {
    console.error('❌ Failed to navigate to lesson:', error)
    toast.error('Failed to start lesson preview: ' + (error.message || 'Unknown error'))
  }
}

const viewLesson = (lesson) => {
  debugLog('Viewing lesson', lesson)

  if (!guestStore.timerStarted) {
    guestStore.startTimer()
  }

  if (!lesson.id || !lesson.title) {
    console.error('❌ Invalid lesson data:', lesson)
    toast.error('Cannot open lesson: Invalid lesson data')
    return
  }

  '🚀 Navigating to lesson:',
    {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      courseSlug: route.params.courseSlug,
    }

  const lessonSlug = generateSlug(lesson.title)

  router.push({
    name: 'guest-lesson-detail',
    params: {
      courseSlug: route.params.courseSlug,
      lessonSlug: lessonSlug,
    },
  })
}

const register = () => {
  ;('🚀 GUEST: Redirecting to signup page')

  if (guestStore.endSession) {
    guestStore.endSession()('✅ Guest session ended')
  }

  try {
    ;('📍 Navigating to /signup via router')
    router
      .push('/signup')
      .then(() => {
        ;('✅ Successfully navigated to signup')
      })
      .catch((error) => {
        console.error('❌ Router navigation failed, using fallback:', error)
        window.location.href = '/signup'
      })
  } catch (error) {
    console.error('❌ Router push failed, using window location:', error)
    window.location.href = '/signup'
  }
}

// Watch for manual URL changes (browser back/forward)
watch(
  () => route.params.courseSlug,
  (newCourseSlug, oldCourseSlug) => {
    if (newCourseSlug && newCourseSlug !== oldCourseSlug) {
      debugLog('Route changed manually via browser, fetching new course', {
        from: oldCourseSlug,
        to: newCourseSlug,
      })
      fetchCourseDetails()
    }
  },
)

onMounted(() => {
  debugLog('Component mounted')
  fetchCourseDetails()
})
</script>

<style scoped>
/* All lessons are now clickable on all devices */
.clickable-lesson {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-lesson:hover {
  background-color: rgba(8, 121, 144, 0.05);
  transform: translateX(4px);
}

.clickable-lesson:active {
  background-color: rgba(8, 121, 144, 0.1);
}

/* ============================================
   MOBILE AND TABLET RESPONSIVE STYLES
   (Copied from Student CourseDetail.vue)
   ============================================ */

/* Clickable lesson items on small devices */
@media (max-width: 768px) {
  .clickable-lesson {
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .clickable-lesson:hover {
    background-color: rgba(8, 121, 144, 0.05);
    transform: translateX(4px);
  }

  .clickable-lesson:active {
    background-color: rgba(8, 121, 144, 0.1);
  }
}

/* Enrollment badge alignment for small devices */
@media (max-width: 768px) {
  .enrollment-status-badge-inline {
    display: inline-flex !important;
    align-items: center;
    gap: 0.3rem;
    background: rgba(255, 193, 7, 0.2);
    padding: 0.3rem 0.6rem;
    border-radius: 20px;
    font-size: var(--fs-sm);
    font-weight: 500;
  }

  .course-meta {
    align-items: center;
  }
}

/* Guest-specific badge styling */
.enrollment-status-badge-inline.guest {
  background: rgba(255, 193, 7, 0.2);
  color: white;
}

.enrollment-status-badge.guest {
  background: rgba(255, 193, 7, 0.2);
  color: white !important;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: var(--fs-sm);
  font-weight: 500;
}

/* ============================================
   MAIN LAYOUT STYLES
   ============================================ */

.guest-course-detail {
  margin-top: 0;
  padding-top: 0;
  height: 100vh;
  overflow: hidden;
}

.main-content-with-sidebar {
  display: flex;
  height: calc(100vh - 80px);
}

.sidebar-column {
  width: 240px;
  flex-shrink: 0;
  height: 100%;
  background: var(--sidebar-bg, white);
  border-right: 1px solid var(--border-color, #e2e8f0);
  overflow-y: auto;
  transition: transform 0.3s ease;
}

.content-column {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  background: var(--gray-bg, #f8f9fa);
}

.course-main-content {
  padding: 1rem;
  min-height: 100%;
}

/* Mobile Styles */
@media (max-width: 992px) {
  .sidebar-column {
    position: fixed;
    top: 80px;
    left: 0;
    z-index: 1000;
    transform: translateX(-100%);
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  }

  .sidebar-column.mobile-hidden {
    transform: translateX(-100%);
  }

  .sidebar-column:not(.mobile-hidden) {
    transform: translateX(0);
  }

  .content-column {
    width: 100%;
  }

  .mobile-sidebar-overlay {
    position: fixed;
    top: 80px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }

  .course-main-content {
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .course-main-content {
    padding: 0.75rem;
  }

  .enrollment-status-badge-inline {
    display: none !important;
  }

  .lesson-content p {
    display: none;
  }
}

@media (max-width: 480px) {
  .course-main-content {
    padding: 0.5rem;
  }
}

/* ============================================
   COURSE CONTENT STYLES
   ============================================ */

.section-title {
  font-family: var(--font-heading);
  font-size: var(--fs-lg);
  color: var(--text-color);
  margin: 0 0 14.4px 0;
  font-weight: 600;
  position: relative;
  padding-bottom: 9px;
  text-align: start;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 45px;
  height: 3px;
  background-color: var(--primary-color);
  border-radius: 3px;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-container i {
  font-size: 3rem;
  color: var(--error-color);
  margin-bottom: 1rem;
}

.retry-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  margin-top: 1rem;
}

/* Course Hero */
.course-hero {
  background: linear-gradient(135deg, var(--primary-color), #065e6f);
  color: white;
  padding: 1.2rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.course-basic-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.course-title {
  font-size: var(--fs-2xl);
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  font-family: var(--font-heading);
  color: #fff !important;
}

.course-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.course-meta span {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: var(--fs-sm);
  background: rgba(255, 255, 255, 0.1);
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
}

.course-price.free {
  background: rgba(76, 175, 80, 0.2);
}

.course-description h4 {
  font-size: var(--fs-md);
  margin: 0 0 0.5rem 0;
  opacity: 0.9;
  color: #fff !important;
}

.course-description p {
  font-size: var(--fs-base);
  line-height: 1.6;
  margin: 0;
  opacity: 0.9;
}

/* Course Details Grid */
.course-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.course-info-section,
.course-progress-section {
  background: white;
  padding: 1.2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.course-info-section h4,
.course-progress-section h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--fs-md);
  margin: 0 0 1rem 0;
  color: var(--primary-color);
}

.info-grid {
  display: grid;
  gap: 0.8rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item label {
  font-weight: 600;
  color: var(--secondary-color);
  font-size: var(--fs-sm);
}

.info-item span {
  font-size: var(--fs-sm);
  color: #28a745;
  font-weight: 600;
}

/* Progress Circle */
.progress-stats {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.progress-circle {
  flex-shrink: 0;
}

.circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(var(--primary-color) calc(var(--progress) * 1%), #e0e0e0 0);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.circle::before {
  content: '';
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: white;
  position: absolute;
}

.percentage {
  position: relative;
  z-index: 1;
  font-weight: 700;
  font-size: var(--fs-sm);
  color: var(--primary-color);
}

.progress-details {
  flex: 1;
}

.progress-details p {
  margin: 0 0 0.5rem 0;
  font-size: var(--fs-sm);
  color: var(--secondary-color);
}

.progress-bar-container {
  background: #e0e0e0;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--primary-color);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Syllabus Section */
.syllabus-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.syllabus-section h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--fs-md);
  margin: 0 0 1rem 0;
  color: var(--primary-color);
}

.lessons-preview {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.lesson-item {
  display: flex;
  gap: 0;
  padding: 1rem;
  background: var(--gray-bg);
  border-radius: 6px;
  transition: background-color 0.2s ease;
  border-left: 4px solid transparent;
}

.lesson-item:hover {
  background-color: rgba(8, 121, 144, 0.05);
  transform: translateX(4px);
}

.lesson-content {
  flex: 1;
}

.lesson-content h5 {
  margin: 0 0 0.3rem 0;
  font-size: var(--fs-base);
  color: var(--text-color);
}

.lesson-content p {
  margin: 0 0 0.5rem 0;
  font-size: var(--fs-sm);
  color: var(--secondary-color);
  line-height: 1.4;
}

.lesson-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.lesson-meta span {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: var(--fs-xs);
  color: var(--secondary-color);
}

.preview-badge {
  background: #17a2b8;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.limited-access-notice {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.limited-access-notice i {
  color: #856404;
  font-size: 1.2rem;
}

.register-link {
  color: var(--primary-color);
  font-weight: 600;
}

/* CTA Section */
.cta-section {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.enrolled-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.start-learning-button,
.view-content-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: var(--fs-sm);
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

.view-content-button {
  background: #6c757d;
}

.start-learning-button:hover {
  background: #065e6f;
  border: none !important;
  outline: none !important;
}

.view-content-button:hover {
  background: #5a6268;
}

.guest-notice {
  font-size: 0.875rem;
  color: #6c757d;
  text-align: center;
}

.guest-notice i {
  color: var(--warning-color);
}

/* Card animations */
.card-animate {
  opacity: 0;
  transform: translateY(20px);
  animation: cardSlideIn 0.5s ease forwards;
}

@keyframes cardSlideIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============================================
   RESPONSIVE BREAKPOINTS
   ============================================ */

/* Tablets and above */
@media (min-width: 992px) {
  .course-details-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* Medium devices (tablets, less than 992px) */
@media (max-width: 991px) {
  .course-details-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .progress-stats {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
}

/* Small devices (phones, less than 768px) */
@media (max-width: 767px) {
  .course-hero,
  .course-info-section,
  .course-progress-section {
    padding: 1.5rem;
  }

  .course-basic-info {
    flex-direction: column;
    gap: 1rem;
  }

  .course-title {
    font-size: 1.875rem;
  }

  .course-meta {
    gap: 0.5rem;
  }

  .enrolled-actions {
    flex-direction: column;
    width: 100%;
  }

  .start-learning-button,
  .view-content-button {
    width: 100%;
    justify-content: center;
  }
}

/* Extra small devices (phones, less than 480px) */
@media (max-width: 480px) {
  .course-hero {
    padding: 1rem;
  }

  .course-title {
    font-size: 1.5rem;
  }

  .course-meta {
    flex-direction: flex;
    gap: 0.3rem;
  }

  .course-meta span {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }

  .cta-section {
    padding: 1rem;
  }

  .start-learning-button,
  .view-content-button {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
}

/* Print styles */
@media print {
  .enrolled-actions,
  .cta-section,
  .view-content-button,
  .start-learning-button {
    display: none !important;
  }

  .course-hero {
    background: none !important;
    color: black !important;
    border: 2px solid #ccc;
  }
}
</style>
