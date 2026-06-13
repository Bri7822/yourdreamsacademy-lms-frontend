<template>
  <div class="exercises-overview-page">
    <section class="header-section">
      <div class="container">
        <h1 class="page-title">Course Exercises</h1>
        <p class="page-subtitle">Practice and test your knowledge with comprehensive exercises across all courses</p>
      </div>
    </section>

    <section class="filters-section">
      <div class="container">
        <div class="category-filters">
          <button
            v-for="category in categories"
            :key="category.key"
            @click="activeCategory = category.key"
            class="category-btn"
            :class="{ 'active': activeCategory === category.key }"
          >
            {{ category.label }}
          </button>
        </div>
      </div>
    </section>

    <section class="courses-section">
      <div class="container">
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading courses and exercises...</p>
        </div>

        <div v-if="error" class="error-state">
          <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Unable to Load Courses</h3>
            <p>{{ error }}</p>
            <button @click="loadCoursesWithExercises" class="retry-btn">
              <i class="fas fa-redo"></i> Try Again
            </button>
          </div>
        </div>

        <div v-if="!loading && !error" class="courses-list">
          <div
            v-for="course in filteredCourses"
            :key="course.id"
            class="course-row"
            @click="handleCourseClick(course)"
          >
            <div class="course-left">
              <div class="course-icon-wrapper">
                <div class="course-icon">
                  <i :class="getCourseIcon(course.title)"></i>
                </div>
              </div>
              <div class="course-details">
                <h3 class="course-title">{{ course.title }}</h3>
                <p class="course-description">{{ course.description }}</p>
                <div class="course-meta-inline">
                  <span class="meta-item">
                    <i class="fas fa-dumbbell"></i>
                    {{ getTotalExercises(course) }} {{ getTotalExercises(course) === 1 ? 'exercise' : 'exercises' }}
                  </span>
                  <span class="meta-item">
                    <i class="fas fa-clock"></i>
                    {{ course.duration }} weeks
                  </span>
                  <span class="meta-item free">
                    <i class="fas fa-gift"></i>
                    Free
                  </span>
                  <span v-if="authStore.isAuthenticated && !isCourseEnrolled(course)" class="meta-item not-enrolled">
                    <i class="fas fa-lock"></i>
                    Not Enrolled
                  </span>
                  <span v-else-if="authStore.isAuthenticated && isCourseEnrolled(course)" class="meta-item enrolled">
                    <i class="fas fa-check"></i>
                    Enrolled
                  </span>
                </div>
              </div>
            </div>

            <div class="course-right">
              <div class="progress-section" v-if="authStore.isAuthenticated && isCourseEnrolled(course)">
                <div class="progress-header">
                  <span class="progress-text">Exercise Progress</span>
                  <span class="progress-percent">{{ getExerciseProgress(course) }}%</span>
                </div>
                <div class="progress-bar-mini">
                  <div class="progress-fill-mini" :style="{ width: getExerciseProgress(course) + '%' }"></div>
                </div>
              </div>
              <button
                class="course-action-btn"
                :class="getAccessType(course)"
                @click.stop="handleExerciseAction(course)"
                :disabled="isEnrolling && currentEnrollingCourse === course.id"
              >
                <span v-if="isEnrolling && currentEnrollingCourse === course.id">
                  <i class="fas fa-spinner fa-spin"></i>
                </span>
                <span v-else>{{ getExerciseButtonText(course) }}</span>
                <i v-if="!(isEnrolling && currentEnrollingCourse === course.id)" class="fas fa-arrow-right"></i>
              </button>
            </div>

            <div class="exercises-strip" v-if="getTotalExercises(course) > 0">
              <div class="strip-header">
                <i class="fas fa-dumbbell"></i>
                <span>Exercise Topics ({{ getTotalExercises(course) }} total)</span>
                <span v-if="authStore.isAuthenticated && !isCourseEnrolled(course)" class="enrollment-hint">
                  <i class="fas fa-info-circle"></i>
                  Enroll to track progress
                </span>
              </div>
              <div class="strip-exercises">
                <div
                  v-for="(lesson, index) in getCourseExercisesPreview(course)"
                  :key="lesson.id"
                  class="strip-exercise"
                  :class="{ 'not-enrolled': authStore.isAuthenticated && !isCourseEnrolled(course) }"
                  @click.stop="handleSpecificExerciseClick(course, lesson)"
                >
                  <div class="exercise-dot" :class="getLessonDotClass(lesson, course)"></div>
                  <span class="exercise-name">{{ lesson.title }}</span>
                  <span class="exercise-count">
                    {{ getLessonQuestionCount(lesson) }} {{ getLessonQuestionCount(lesson) === 1 ? 'question' : 'questions' }}
                  </span>
                </div>
                <div v-if="getLessonsWithExercises(course).length > 3" class="more-exercises-indicator">
                  +{{ getLessonsWithExercises(course).length - 3 }} more exercise topics
                </div>
              </div>
            </div>

            <div v-else class="exercises-strip">
              <div class="strip-header">
                <i class="fas fa-dumbbell"></i>
                <span>Exercises</span>
              </div>
              <div class="no-exercises-message">
                <i class="fas fa-info-circle"></i>
                <span>No exercises available for this course yet</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!loading && !error && filteredCourses.length === 0" class="empty-state">
          <div class="empty-illustration"><i class="fas fa-dumbbell"></i></div>
          <h3>No courses found</h3>
          <p>Try selecting a different category or check back later.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGuestStore } from '@/stores/guest'
import { useToast } from 'vue-toastification'
import { useExerciseNavigation } from '@/composables/useExerciseNavigation'
import axios from 'axios'
import GuestNavigation from '@/utils/navigation'
import { generateSlug } from '@/utils/slugUtils'

const router = useRouter()
const authStore = useAuthStore()
const guestStore = useGuestStore()
const toast = useToast()
const { handleExerciseNavigation, isEnrolling, currentEnrollingCourse } = useExerciseNavigation()

const loading = ref(false)
const error = ref(null)
const activeCategory = ref('all')
const courses = ref([])
const lessonsData = ref({})

const categories = ref([
  { key: 'all', label: 'All Courses' },
  { key: 'finance', label: 'Finance' },
  { key: 'personal_development', label: 'Personal Development' },
  { key: 'business', label: 'Business' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'education', label: 'Department of Education' }
])

const filteredCourses = computed(() => {
  if (activeCategory.value === 'all') return courses.value
  return courses.value.filter(course => {
    const cat = (course.category || '').toLowerCase().replace(/ /g, '_')
    const map = {
      finance: 'finance',
      personal_development: 'personal_development',
      business: 'business',
      marketing: 'marketing',
      education: 'department_of_education',
    }
    return cat === (map[activeCategory.value] || activeCategory.value)
  })
})

// ── helpers ──────────────────────────────────────────────────────────────────

const getLessonsWithExercises = (course) => {
  const lessons = lessonsData.value[course.id] || []
  return lessons.filter(l => (l.exercise_count || 0) > 0)
}

const getTotalExercises = (course) =>
  getLessonsWithExercises(course).length

const getLessonQuestionCount = (lesson) =>
  // exercise_count is 1 per lesson that has exercises; show 3 as a UI hint
  (lesson.exercise_count || 0) > 0 ? 3 : 0

const getLessonDotClass = (lesson, course) => {
  if (!authStore.isAuthenticated || !isCourseEnrolled(course)) return 'upcoming'
  return lesson.completed ? 'completed' : 'upcoming'
}

const getCourseExercisesPreview = (course) =>
  getLessonsWithExercises(course).slice(0, 3)

const getExerciseProgress = (course) =>
  (authStore.isAuthenticated && isCourseEnrolled(course)) ? (course.progress || 0) : 0

const isCourseEnrolled = (course) =>
  ['enrolled', 'approved', 'completed'].includes(course.enrollment_status)

const getAccessType = (course) => {
  if (!authStore.isAuthenticated) return 'guest'
  return isCourseEnrolled(course) ? 'enrolled' : 'not-enrolled'
}

const getExerciseButtonText = (course) => {
  const t = getAccessType(course)
  if (t === 'enrolled') return 'Continue Exercises'
  if (t === 'not-enrolled') return 'Enroll & Practice'
  return 'Try Exercises'
}

const getCourseIcon = (title) => {
  const t = (title || '').toLowerCase()
  if (t.includes('finance') || t.includes('money')) return 'fas fa-chart-line'
  if (t.includes('habit') || t.includes('discipline') || t.includes('development')) return 'fas fa-brain'
  if (t.includes('entrepreneur') || t.includes('business')) return 'fas fa-briefcase'
  if (t.includes('marketing')) return 'fas fa-bullhorn'
  if (t.includes('education')) return 'fas fa-graduation-cap'
  return 'fas fa-dumbbell'
}

// ── actions ───────────────────────────────────────────────────────────────────

const handleCourseClick = (course) => {}

const handleExerciseAction = async (course) => {
  try {
    await handleExerciseNavigation(course)
  } catch (err) {
    toast.error('Failed to access exercises. Please try again.')
  }
}

const handleSpecificExerciseClick = async (course, lesson) => {
  if (authStore.isAuthenticated && !isCourseEnrolled(course)) {
    toast.info(`Please enroll in "${course.title}" to access the exercises`, { timeout: 4000 })
    return
  }
  try {
    await handleExerciseNavigation(course, generateSlug(lesson.title))
  } catch (err) {
    toast.error('Failed to access exercise. Please try again.')
  }
}

// ── data fetching ─────────────────────────────────────────────────────────────

const fetchCourses = async () => {
  // Use authenticated courses endpoint when logged in (returns enrollment_status + progress)
  // Fall back to home endpoint for guests
  if (authStore.isAuthenticated) {
    const res = await axios.get('/api/student/courses/')
    const data = res.data
    return Array.isArray(data.courses) ? data.courses
         : Array.isArray(data) ? data
         : []
  } else {
    const res = await axios.get('/api/student/home/courses/')
    const data = res.data
    return Array.isArray(data.courses) ? data.courses
         : Array.isArray(data) ? data
         : []
  }
}

const fetchLessonsForCourse = async (course) => {
  try {
    // Use authenticated lesson endpoint when enrolled (returns exercise_count + completed)
    // Fall back to home endpoint for guests or non-enrolled students
    let response
    if (authStore.isAuthenticated && isCourseEnrolled(course)) {
      try {
        response = await axios.get(`/api/student/courses/${course.code}/lessons/`)
      } catch (e) {
        // Not enrolled or error – fall back to home endpoint
        response = await axios.get(`/api/student/home/courses/${course.code}/lessons/`)
      }
    } else {
      response = await axios.get(`/api/student/home/courses/${course.code}/lessons/`)
    }

    const data = response.data
    // Handle both {lessons:[...]} and plain [...] shapes
    if (Array.isArray(data.lessons)) return data.lessons
    if (Array.isArray(data)) return data
    return []
  } catch (err) {
    console.error(`Failed to fetch lessons for ${course.code}:`, err)
    return []
  }
}

const loadCoursesWithExercises = async () => {
  loading.value = true
  error.value = null

  try {
    // Ensure guest session exists for unauthenticated users
    if (!authStore.isAuthenticated) {
      if (!guestStore.isGuestMode || !guestStore.session?.session_id) {
        const result = await guestStore.startGuestSession()
        if (!result.success) throw new Error('Failed to start guest session')
      }
    }

    const coursesArray = await fetchCourses()
    courses.value = coursesArray.map(course => ({
      ...course,
      enrollment_status: course.enrollment_status || 'not_enrolled',
      category: course.category || 'General',
      progress: course.progress || 0,
      code: course.code || `CRS${course.id}`,
    }))

    // Fetch lessons for all courses in parallel
    await Promise.all(courses.value.map(async (course) => {
      const lessons = await fetchLessonsForCourse(course)
      lessonsData.value[course.id] = lessons
    }))

  } catch (err) {
    error.value = err.response?.data?.detail || err.message || 'Failed to load courses.'
  } finally {
    loading.value = false
  }
}

onMounted(() => loadCoursesWithExercises())

onUnmounted(() => {})
</script>
<style scoped>
/* Your existing CSS with additions */

.meta-item.not-enrolled {
  color: #ff6b6b;
}

.meta-item.not-enrolled i {
  color: #ff6b6b;
}

.meta-item.enrolled {
  color: #28a745;
}

.meta-item.enrolled i {
  color: #28a745;
}

.enrollment-hint {
  font-size: var(--fs-xs);
  color: #6c757d;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.enrollment-hint i {
  color: #ffc107;
}

.strip-exercise.not-enrolled {
  opacity: 0.7;
  background: rgba(108, 117, 125, 0.04);
}

.strip-exercise.not-enrolled:hover {
  background: rgba(108, 117, 125, 0.08);
  cursor: not-allowed;
}

/* Rest of your existing CSS remains the same */
.exercises-overview-page {
  min-height: 100vh;
  background-color: var(--gray-bg);
}

.header-section {
  background-color: var(--gray-bg);
  padding: 2rem 0 1rem;
  margin-top: 2rem;
}

.fa-dumbbell{
  color:var(--primary-color)
}

.page-subtitle {
  text-align: center;
  font-size: var(--fs-md);
  color: var(--secondary-color);
  max-width: 600px;
  margin: 0 auto;
  font-family: var(--font-body);
}

.filters-section {
  background-color: var(--gray-bg);
  padding: 1.5rem 0 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.category-filters {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 900px;
  margin: 0 auto;
}

.category-btn {
  padding: 0.4rem 1rem;
  border: 1.8px solid var(--primary-color);
  border-radius: 20px;
  background-color: transparent;
  color: var(--primary-color);
  font-size: var(--fs-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: var(--font-heading);
  white-space: nowrap;
}

.category-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(8, 121, 144, 0.2);
}

.category-btn.active {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(8, 121, 144, 0.3);
}

.courses-section {
  padding: 1.5rem 0 3rem;
  background-color: var(--gray-bg);
}

.courses-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.course-row {
  background: var(--gray-bg);
  border-radius: 8px;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
}

.course-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.course-left {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}

.course-icon-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.course-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #06677e 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.course-icon i {
  font-size: 1.5rem;
  color: white;
}

.course-details {
  flex: 1;
  min-width: 0;
}

.course-title {
  font-size: var(--fs-lg);
  font-weight: 700;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
  font-family: var(--font-heading);
}

.course-description {
  color: var(--secondary-color);
  font-size: var(--fs-sm);
  line-height: 1.5;
  margin: 0 0 0.75rem 0;
  font-family: var(--font-body);
}

.course-meta-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--fs-sm);
  color: var(--primary-color);
  font-weight: 600;
  font-family: var(--font-body);
}

.meta-item i {
  color: var(--primary-color);
}

.meta-item.free {
  color: #28a745;
}

.meta-item.free i {
  color: #28a745;
}

.course-right {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
  justify-content: center;
  min-width: 160px;
}

.progress-section {
  width: 100%;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.375rem;
  font-size: var(--fs-xs);
  font-family: var(--font-body);
}

.progress-text {
  color: var(--secondary-color);
  font-weight: 500;
}

.progress-percent {
  color: var(--primary-color);
  font-weight: 700;
}

.progress-bar-mini {
  height: 5px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill-mini {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color) 0%, #06677e 100%);
  border-radius: 10px;
  transition: width 0.5s ease;
}

.course-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  font-size: var(--fs-sm);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  font-family: var(--font-heading);
}

.course-action-btn.guest {
  background: var(--primary-color);
  color: white;
}

.course-action-btn.enrolled {
  background: #28a745;
  color: white;
}

.course-action-btn.not-enrolled {
  background: #ffc107;
  color: #212529;
}

.course-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.course-action-btn:not(:disabled):hover {
  transform: translateY(-1.8px);
  box-shadow: 0 4.5px 13.5px rgba(6, 103, 126, 0.3);
}

.course-action-btn i {
  transition: transform 0.3s ease;
}

.course-action-btn:not(:disabled):hover i {
  transform: translateX(4px);
}

.exercises-strip {
  grid-column: 1 / -1;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.strip-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-color);
  font-size: var(--fs-sm);
  font-weight: 600;
  margin-bottom: 0.75rem;
  font-family: var(--font-heading);
}

.strip-exercises {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 0.625rem;
  align-items: center;
}

.strip-exercise {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.875rem;
  background: rgba(8, 121, 144, 0.04);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.strip-exercise:hover {
  background: rgba(8, 121, 144, 0.08);
}

.more-exercises-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 0.875rem;
  background: rgba(8, 121, 144, 0.04);
  border-radius: 6px;
  font-size: var(--fs-xs);
  color: var(--secondary-color);
  font-style: italic;
}

.no-exercises-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: rgba(108, 117, 125, 0.04);
  border-radius: 6px;
  font-size: var(--fs-xs);
  color: var(--secondary-color);
}

.no-exercises-message i {
  color: var(--secondary-color);
}

.exercise-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.exercise-dot.exercise-dot.completed {
  background: #28a745;
  animation: pulse-blue-f9548b91 2s infinite;
}

.exercise-dot.upcoming {
  background: #ffc107;
  animation: pulse-blue-f9548b91 2s infinite;
}

.exercise-name {
  flex: 1;
  font-size: var(--fs-xs);
  color: var(--text-color);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-body);
}

.exercise-count {
  font-size: var(--fs-xs);
  color: var(--secondary-color);
  font-weight: 500;
  flex-shrink: 0;
  font-family: var(--font-body);
}

.loading-state {
  text-align: center;
  padding: 4rem;
}

.loading-spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 4rem;
  color: #d32f2f;
}

.error-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
  font-weight: 600;
  font-family: var(--font-heading);
}

.retry-btn:hover {
  background: #06677e;
}

.empty-state {
  text-align: center;
  padding: 4rem;
  color: var(--secondary-color);
}

.empty-illustration {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.exercises-overview-page {
  min-height: 100vh;
  background-color: var(--gray-bg);
}

.header-section {
  background-color: var(--gray-bg);
  padding: 2rem 0 1rem;
  margin-top: 2rem;
}

.fa-dumbbell{
  color:var(--primary-color)
}

.page-subtitle {
  text-align: center;
  font-size: var(--fs-md);
  color: var(--secondary-color);
  max-width: 600px;
  margin: 0 auto;
  font-family: var(--font-body);
}

.filters-section {
  background-color: var(--gray-bg);
  padding: 1.5rem 0 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.category-filters {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 900px;
  margin: 0 auto;
}

.category-btn {
  padding: 0.4rem 1rem;
  border: 1.8px solid var(--primary-color);
  border-radius: 20px;
  background-color: transparent;
  color: var(--primary-color);
  font-size: var(--fs-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: var(--font-heading);
  white-space: nowrap;
}

.category-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(8, 121, 144, 0.2);
}

.category-btn.active {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(8, 121, 144, 0.3);
}

.courses-section {
  padding: 1.5rem 0 3rem;
  background-color: var(--gray-bg);
}

.courses-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.course-row {
  background: var(--gray-bg);
  border-radius: 8px;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
}

.course-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.course-left {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}

.course-icon-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.course-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #06677e 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.course-icon i {
  font-size: 1.5rem;
  color: white;
}

.course-details {
  flex: 1;
  min-width: 0;
}

.course-title {
  font-size: var(--fs-lg);
  font-weight: 700;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
  font-family: var(--font-heading);
}

.course-description {
  color: var(--secondary-color);
  font-size: var(--fs-sm);
  line-height: 1.5;
  margin: 0 0 0.75rem 0;
  font-family: var(--font-body);
}

.course-meta-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--fs-sm);
  color: var(--primary-color);
  font-weight: 600;
  font-family: var(--font-body);
}

.meta-item i {
  color: var(--primary-color);
}

.meta-item.free {
  color: #28a745;
}

.meta-item.free i {
  color: #28a745;
}

.course-right {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
  justify-content: center;
  min-width: 160px;
}

.progress-section {
  width: 100%;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.375rem;
  font-size: var(--fs-xs);
  font-family: var(--font-body);
}

.progress-text {
  color: var(--secondary-color);
  font-weight: 500;
}

.progress-percent {
  color: var(--primary-color);
  font-weight: 700;
}

.progress-bar-mini {
  height: 5px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill-mini {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color) 0%, #06677e 100%);
  border-radius: 10px;
  transition: width 0.5s ease;
}

.course-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  font-size: var(--fs-sm);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  font-family: var(--font-heading);
}

.course-action-btn.guest {
  background: var(--primary-color);
  color: white;
}

.course-action-btn.enrolled {
  background: #28a745;
  color: white;
}

.course-action-btn.not-enrolled {
  background: #ffc107;
  color: #212529;
}

.course-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.course-action-btn:not(:disabled):hover {
  transform: translateY(-1.8px);
  box-shadow: 0 4.5px 13.5px rgba(6, 103, 126, 0.3);
}

.course-action-btn i {
  transition: transform 0.3s ease;
}

.course-action-btn:not(:disabled):hover i {
  transform: translateX(4px);
}

.exercises-strip {
  grid-column: 1 / -1;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.strip-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-color);
  font-size: var(--fs-sm);
  font-weight: 600;
  margin-bottom: 0.75rem;
  font-family: var(--font-heading);
}

.strip-exercises {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 0.625rem;
  align-items: center;
}

.strip-exercise {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.875rem;
  background: rgba(8, 121, 144, 0.04);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.strip-exercise:hover {
  background: rgba(8, 121, 144, 0.08);
}

.more-exercises-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 0.875rem;
  background: rgba(8, 121, 144, 0.04);
  border-radius: 6px;
  font-size: var(--fs-xs);
  color: var(--secondary-color);
  font-style: italic;
}

.no-exercises-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: rgba(108, 117, 125, 0.04);
  border-radius: 6px;
  font-size: var(--fs-xs);
  color: var(--secondary-color);
}

.no-exercises-message i {
  color: var(--secondary-color);
}

.exercise-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.exercise-dot.completed {
  background: #28a745;
}

.exercise-dot.upcoming {
  background: #ffc107;
}

.exercise-name {
  flex: 1;
  font-size: var(--fs-xs);
  color: var(--text-color);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-body);
}

.exercise-count {
  font-size: var(--fs-xs);
  color: var(--secondary-color);
  font-weight: 500;
  flex-shrink: 0;
  font-family: var(--font-body);
}

.loading-state {
  text-align: center;
  padding: 4rem;
}

.loading-spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 4rem;
  color: #d32f2f;
}

.error-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
  font-weight: 600;
  font-family: var(--font-heading);
}

.retry-btn:hover {
  background: #06677e;
}

.empty-state {
  text-align: center;
  padding: 4rem;
  color: var(--secondary-color);
}

.empty-illustration {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.exercises-overview-page {
  min-height: 100vh;
  background-color: var(--gray-bg);
}

.header-section {
  background-color: var(--gray-bg);
  padding: 2rem 0 1rem;
  margin-top: 2rem;
}

.fa-dumbbell{
  color:var(--primary-color)
}
.page-title {
  text-align: center;
  font-size: var(--fs-2xl);
  margin-bottom: 0.5rem;
  margin-top: .5rem;
  color: var(--primary-color);
  font-family: var(--font-heading);
  font-weight: 700;
}

.page-subtitle {
  text-align: center;
  font-size: var(--fs-md);
  color: var(--secondary-color);
  max-width: 600px;
  margin: 0 auto;
  font-family: var(--font-body);
}

.filters-section {
  background-color: var(--gray-bg);
  padding: 1.5rem 0 1rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.category-filters {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 900px;
  margin: 0 auto;
}

.category-btn {
  padding: 0.4rem 1rem;
  border: 1.8px solid var(--primary-color);
  border-radius: 20px;
  background-color: transparent;
  color: var(--primary-color);
  font-size: var(--fs-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: var(--font-heading);
  white-space: nowrap;
}

.category-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(8, 121, 144, 0.2);
}

.category-btn.active {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(8, 121, 144, 0.3);
}

.courses-section {
  padding: 1.5rem 0 3rem;
  background-color: var(--gray-bg);
}

.courses-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.course-row {
  background: var(--gray-bg);
  border-radius: 8px;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto auto;
  gap: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1.5px solid var(--border-color);
}

.course-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.course-left {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}

.course-icon-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.course-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #06677e 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.course-icon i {
  font-size: 1.5rem;
  color: white;
}

.course-details {
  flex: 1;
  min-width: 0;
}

.course-title {
  font-size: var(--fs-lg);
  font-weight: 700;
  color: var(--primary-color);
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
  font-family: var(--font-heading);
}

.course-description {
  color: var(--secondary-color);
  font-size: var(--fs-sm);
  line-height: 1.5;
  margin: 0 0 0.75rem 0;
  font-family: var(--font-body);
}

.course-meta-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--fs-sm);
  color: var(--primary-color);
  font-weight: 600;
  font-family: var(--font-body);
}

.meta-item i {
  color: var(--primary-color);
}

.meta-item.free {
  color: #28a745;
}

.meta-item.free i {
  color: #28a745;
}

.course-right {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
  justify-content: center;
  min-width: 160px;
}

.progress-section {
  width: 100%;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.375rem;
  font-size: var(--fs-xs);
  font-family: var(--font-body);
}

.progress-text {
  color: var(--secondary-color);
  font-weight: 500;
}

.progress-percent {
  color: var(--primary-color);
  font-weight: 700;
}

.progress-bar-mini {
  height: 5px;
  background: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill-mini {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color) 0%, #06677e 100%);
  border-radius: 10px;
  transition: width 0.5s ease;
}

.course-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  font-size: var(--fs-sm);
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  font-family: var(--font-heading);
}

.course-action-btn.guest {
  background: var(--primary-color);
  color: white;
}

.course-action-btn.enrolled {
  background: #28a745;
  color: white;
}

.course-action-btn.not-enrolled {
  background: #ffc107;
  color: #212529;
}

.course-action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.course-action-btn:not(:disabled):hover {
  transform: translateY(-1.8px);
  box-shadow: 0 4.5px 13.5px rgba(6, 103, 126, 0.3);
}

.course-action-btn i {
  transition: transform 0.3s ease;
}

.course-action-btn:not(:disabled):hover i {
  transform: translateX(4px);
}

.exercises-strip {
  grid-column: 1 / -1;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.strip-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--primary-color);
  font-size: var(--fs-sm);
  font-weight: 600;
  margin-bottom: 0.75rem;
  font-family: var(--font-heading);
}

.strip-exercises {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 0.625rem;
  align-items: center;
}

.strip-exercise {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.875rem;
  background: rgba(8, 121, 144, 0.04);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.strip-exercise:hover {
  background: rgba(8, 121, 144, 0.08);
}

.more-exercises-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 0.875rem;
  background: rgba(8, 121, 144, 0.04);
  border-radius: 6px;
  font-size: var(--fs-xs);
  color: var(--secondary-color);
  font-style: italic;
}

.no-exercises-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: rgba(108, 117, 125, 0.04);
  border-radius: 6px;
  font-size: var(--fs-xs);
  color: var(--secondary-color);
}

.no-exercises-message i {
  color: var(--secondary-color);
}

.exercise-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.exercise-dot.completed {
  background: #28a745;
}

.exercise-dot.upcoming {
  background: #ffc107;
}

.exercise-name {
  flex: 1;
  font-size: var(--fs-xs);
  color: var(--text-color);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-body);
}

.exercise-count {
  font-size: var(--fs-xs);
  color: var(--secondary-color);
  font-weight: 500;
  flex-shrink: 0;
  font-family: var(--font-body);
}

.loading-state {
  text-align: center;
  padding: 4rem;
}

.loading-spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 4rem;
  color: #d32f2f;
}

.error-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
  font-weight: 600;
  font-family: var(--font-heading);
}

.retry-btn:hover {
  background: #06677e;
}

.empty-state {
  text-align: center;
  padding: 4rem;
  color: var(--secondary-color);
}

.empty-illustration {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

@media (max-width: 1024px) {
  .course-row {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
  }

  .course-right {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    min-width: auto;
    width: 100%;
  }

  .progress-section {
    flex: 1;
    max-width: 250px;
  }

  .strip-exercises {
    grid-template-columns: 1fr;
  }
}

/* ===== Responsive Fixes ===== */

/* Large phones (576px – 767px) */
@media (min-width: 576px) and (max-width: 767px) {
  .course-meta-inline {
    flex-direction: flex !important;
    align-items: flex-start;
    gap: 0.4rem;
  }

  .meta-item {
    font-size: calc(var(--fs-xs) - 0.05rem);
  }

  .course-action-btn {
    white-space: normal;        /* allow wrapping */
    padding: 0.5rem 1rem;
    font-size: calc(var(--fs-sm) - 0.1rem);
    min-width: 140px;
    justify-content: center;
  }

  .progress-section {
    max-width: 200px;
  }

  .strip-exercise {
    padding: 0.5rem 0.75rem;
  }

  .exercise-name {
    font-size: calc(var(--fs-xs) - 0.05rem);
  }

  .exercise-count {
    font-size: calc(var(--fs-xs) - 0.1rem);
  }
}

/* Mobile devices (≤ 575px) */
@media (max-width: 575px) {
  .header-section {
    padding: 1rem 0 0.5rem;
    margin-top: 1rem;
  }

  .page-title {
    font-size: var(--fs-xl);           /* scale down from 2xl */
    margin-top: 1rem;
  }

  .page-subtitle {
    font-size: var(--fs-sm);
    padding: 0 0.5rem;
  }

  .filters-section {
    padding: 1rem 0 0.5rem;
  }

  .category-btn {
    padding: 0.25rem 0.6rem;
    font-size: 0.6rem;
    border-width: 1.5px;
  }

  .course-row {
    padding: 1rem;
    gap: 0.75rem;
  }

  /* Stack course left content vertically */
  .course-left {
    flex-direction: column;
    gap: 0.75rem;
  }

  .course-icon-wrapper {
    width: 100%;
    align-items: flex-start;
  }

  .course-icon {
    width: 45px;
    height: 45px;
  }

  .course-icon i {
    font-size: 1.2rem;
  }

  .course-title {
    font-size: var(--fs-md);
    margin-bottom: 0.25rem;
  }

  .course-description {
    font-size: calc(var(--fs-xs) - 0.05rem);
    margin-bottom: 0.5rem;
  }

  .course-meta-inline {
    flex-direction: flex !important;
    align-items: flex-start;
    gap: 0.35rem;
  }

  .meta-item {
    font-size: calc(var(--fs-xs) - 0.1rem);
    gap: 0.25rem;
  }

  .course-right {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .progress-section {
    max-width: none;
    width: 100%;
  }

  .progress-header {
    font-size: calc(var(--fs-xs) - 0.1rem);
  }

  .course-action-btn {
    white-space: normal;
    padding: 0.5rem 0.75rem;
    font-size: calc(var(--fs-sm) - 0.15rem);
    justify-content: center;
    width: 100%;
  }

  /* Exercise strip adjustments */
  .strip-header {
    font-size: calc(var(--fs-sm) - 0.1rem);
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  .enrollment-hint {
    font-size: calc(var(--fs-xs) - 0.1rem);
    margin-left: 0;
  }

  .strip-exercises {
    grid-template-columns: 1fr;         /* ensure single column */
    gap: 0.4rem;
  }

  .strip-exercise {
    padding: 0.4rem 0.6rem;
    gap: 0.4rem;
  }

  .exercise-dot {
    width: 6px;
    height: 6px;
  }

  .exercise-name {
    font-size: calc(var(--fs-xs) - 0.1rem);
    white-space: normal;                /* allow wrapping if needed */
  }

  .exercise-count {
    font-size: calc(var(--fs-xs) - 0.15rem);
  }

  .more-exercises-indicator,
  .no-exercises-message {
    padding: 0.4rem 0.6rem;
    font-size: calc(var(--fs-xs) - 0.1rem);
  }

  /* Loading / error / empty states */
  .loading-state,
  .error-state,
  .empty-state {
    padding: 2rem 1rem;
  }

  .error-state i {
    font-size: 2.5rem;
  }

  .empty-illustration {
    font-size: 3rem;
  }
}

@media (max-width: 480px) {
  .category-filters {
    gap: 0.3rem;
  }

  .category-btn {
    padding: 0.3rem 0.7rem;
    font-size: 0.65rem;
  }

  .course-row {
    padding: 1rem;
    gap: 0.875rem;
  }

  .course-meta-inline {
    flex-direction: flex !important;
    gap: 0.5rem;
  }

  .strip-exercises {
    gap: 0.5rem;
  }
}
</style>