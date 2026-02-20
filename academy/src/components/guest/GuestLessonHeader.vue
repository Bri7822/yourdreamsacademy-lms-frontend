<!-- src/components/guest/GuestLessonHeader.vue -->
<template>
  <header class="guest-lesson-header">
    <!-- LEFT SIDE: Lessons Toggle (tablets and mobile) -->
    <div class="header-left">
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
      <!-- Back Arrow — ALWAYS VISIBLE, returns to wherever the user came from -->
      <button
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

          <div v-if="loadingLessons" class="sidebar-loading">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <span class="ms-2">Loading lessons...</span>
          </div>

          <div v-else-if="lessonsError" class="sidebar-error">
            <i class="fas fa-exclamation-triangle text-danger"></i>
            <span class="ms-2">{{ lessonsError }}</span>
          </div>

          <ul v-else-if="lessons.length > 0" class="lessons-list">
            <li
              v-for="(lesson, index) in lessons"
              :key="`header-lesson-${lesson.id}`"
              class="lesson-item"
              :class="{ 'active': isActiveLesson(lesson), 'completed': lesson.completed }"
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
                  <span v-if="lesson.completed" class="completed-badge">Completed</span>
                </div>
              </div>
              <i v-if="isActiveLesson(lesson)" class="fas fa-check text-primary"></i>
            </li>
          </ul>

          <div v-else class="sidebar-empty">
            <i class="fas fa-list-ul text-muted"></i>
            <p class="mb-0 mt-2">No lessons available</p>
          </div>

          <div v-if="lessons.length > 0" class="progress-section">
            <div class="progress-header">
              <i class="fas fa-trophy"></i>
              <h6>Your Progress</h6>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGuestStore } from '@/stores/guest'
import GuestNavigation from '@/utils/navigation'

const props = defineProps({
  notificationCount: { type: Number, default: 0 }
})

const route      = useRoute()
const router     = useRouter()
const guestStore = useGuestStore()

// ── State ────────────────────────────────────────────────────────────────────
const currentCourseTitle = ref('')
const showMobileLessons  = ref(false)
const lessons            = ref([])
const loadingLessons     = ref(false)
const lessonsError       = ref(null)

// ── Helpers ───────────────────────────────────────────────────────────────────
const generateSlug = (title) => {
  if (!title) return ''
  return title.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}

/** Read the full from-route saved by the router afterEach. */
const readFromRoute = () => {
  try {
    const raw = sessionStorage.getItem('guestFromRoute')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// ── Back button label ─────────────────────────────────────────────────────────
const ROUTE_LABELS = {
  'guest-course-detail':  'Back to Course',
  'search-results':       'Back to Search',
  'search-suggestions':   'Back to Search',
  'exercises-overview':   'Back to Exercises',
  'lessons-overview':     'Back to Lessons',
  'home':                 'Back to Home',
  'guest-courses':        'Back to Courses',
  'courses':              'Back to Courses',
  'all-courses':          'Back to Courses',
  'popular-courses':      'Back to Courses',
  'new-courses':          'Back to Courses',
}

const backButtonTitle = computed(() => {
  const from = readFromRoute()
  if (from?.name) return ROUTE_LABELS[from.name] ?? 'Go Back'
  // Fallback to legacy string
  const legacy = GuestNavigation.getSource()
  return ROUTE_LABELS[legacy] ?? 'Go Back'
})

// ── Back navigation ───────────────────────────────────────────────────────────
/**
 * Returns the guest to EXACTLY the page they came from.
 *
 * Priority:
 *  1. Full route object stored by the router afterEach (covers every page)
 *  2. Legacy source string from GuestNavigation (backward compat)
 *  3. Browser history
 *  4. Absolute fallback: /guest/courses
 */
const goBack = () => {
  console.log('⬅️ [GuestLessonHeader] Back button clicked')

  // 1. Full from-route ────────────────────────────────────────────────────────
  const from = readFromRoute()
  if (from?.name) {
    console.log('✅ Returning via stored from-route:', from)

    // Search routes — preserve the query so results are still visible
    if (from.name === 'search-results' || from.name === 'search-suggestions') {
      router.push({ name: from.name, query: from.query })
      return
    }

    // Routes with meaningful params (e.g. guest-course-detail with courseSlug)
    if (from.params && Object.keys(from.params).length > 0) {
      router.push({ name: from.name, params: from.params, query: from.query })
      return
    }

    // Simple named routes (home, courses, etc.)
    router.push({ name: from.name })
    return
  }

  // Has a path but no name
  if (from?.path) {
    router.push(from.path)
    return
  }

  // 2. Legacy source string ───────────────────────────────────────────────────
  const source     = GuestNavigation.getSource()
  const courseSlug = GuestNavigation.getCurrentCourseSlug() || route.params.courseSlug
  console.log('⚠️ Legacy source fallback:', source)

  const legacyMap = {
    'guest-course-detail':  courseSlug
                              ? { name: 'guest-course-detail', params: { courseSlug } }
                              : { name: 'guest-courses' },
    'search-results':       { name: 'search-results' },
    'search-suggestions':   { name: 'search-suggestions' },
    'exercises-overview':   { name: 'exercises-overview' },
    'lessons-overview':     { name: 'lessons-overview' },
    'home':                 { name: 'home' },
    'guest-courses':        { name: 'guest-courses' },
    'courses':              { name: 'courses' },
    'all-courses':          { name: 'all-courses' },
    'popular-courses':      { name: 'popular-courses' },
    'new-courses':          { name: 'new-courses' },
  }

  if (source && legacyMap[source]) {
    router.push(legacyMap[source])
    return
  }

  // 3. Browser history ────────────────────────────────────────────────────────
  if (window.history.length > 2) {
    console.log('⚠️ Using browser history back')
    router.back()
    return
  }

  // 4. Absolute fallback ──────────────────────────────────────────────────────
  console.log('⚠️ No source found — fallback to /guest/courses')
  router.push({ name: 'guest-courses' })
}

// ── Lessons toggle ────────────────────────────────────────────────────────────
const showLessonsToggle = computed(() =>
  !!(route.params.courseSlug && route.params.lessonSlug)
)

const completedLessonsCount = computed(() =>
  lessons.value.filter(l => l.completed === true).length
)

const progressPercentage = computed(() => {
  const total = lessons.value.length
  return total > 0 ? Math.round((completedLessonsCount.value / total) * 100) : 0
})

const isActiveLesson = (lesson) => {
  if (!route.params.lessonSlug) return false
  return route.params.lessonSlug === generateSlug(lesson.title)
}

const toggleMobileLessons = () => {
  showMobileLessons.value = !showMobileLessons.value
  if (showMobileLessons.value && lessons.value.length === 0) fetchLessons()
}

const closeMobileLessons = () => { showMobileLessons.value = false }

const fetchLessons = async () => {
  loadingLessons.value = true
  lessonsError.value   = null
  try {
    const courseSlug = route.params.courseSlug
    if (courseSlug) {
      const [lessonsData, courseData] = await Promise.all([
        guestStore.getGuestCourseLessons(courseSlug),
        guestStore.getGuestCourseDetail(courseSlug),
      ])
      lessons.value            = lessonsData || []
      currentCourseTitle.value = courseData?.title || 'Course Lessons'
    }
  } catch (err) {
    console.error('Error fetching lessons:', err)
    lessonsError.value = 'Failed to load lessons'
  } finally {
    loadingLessons.value = false
  }
}

const selectLesson = (lesson) => {
  showMobileLessons.value = false
  const lessonSlug = generateSlug(lesson.title)
  router.push(`/guest/courses/${route.params.courseSlug}/lessons/${lessonSlug}`)
}

// ── Course title loader ───────────────────────────────────────────────────────
const loadCourseTitle = async () => {
  const courseSlug = GuestNavigation.getCurrentCourseSlug() || route.params.courseSlug
  if (!courseSlug || !guestStore.isGuestMode) return
  try {
    const course = guestStore.currentCourse
    if (course?.title) {
      currentCourseTitle.value = course.title
    } else {
      const cached = sessionStorage.getItem(`guest_course_${courseSlug}`)
      if (cached) currentCourseTitle.value = JSON.parse(cached).title || ''
    }
  } catch (err) {
    console.error('Failed to load course title:', err)
  }
}

// ── Watchers ──────────────────────────────────────────────────────────────────
watch(() => route.name, (newName, oldName) => {
  if (oldName === 'guest-lesson-detail' && newName !== 'guest-lesson-detail') {
    showMobileLessons.value = false
  }
})

watch(() => route.params.courseSlug, (newSlug, oldSlug) => {
  if (newSlug && showLessonsToggle.value) {
    if (oldSlug && oldSlug !== newSlug) lessons.value = []
    loadCourseTitle()
  }
})

// ── Mount ─────────────────────────────────────────────────────────────────────
onMounted(() => {
  console.log('🎬 GuestLessonHeader mounted, route:', route.name)
  if (showLessonsToggle.value && route.params.courseSlug) loadCourseTitle()
})
</script>

<style scoped>
.guest-lesson-header {
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

.lessons-toggle-btn:hover  { background: rgba(8, 121, 144, 0.2) !important; transform: translateX(0) !important; }
.lessons-toggle-btn.active { background: var(--primary-color) !important; color: white !important; }

.lessons-label { font-size: 0.9rem; font-weight: 500; }

.page-title  { flex: 1; min-width: 0; }
.empty-title { width: 1px; }

.header-actions { display: flex; align-items: center; gap: 12px; }

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

.header-action-btn:hover { background-color: rgba(8, 121, 144, 0.1); transform: scale(1.1); }
.header-action-btn.active { color: var(--primary-color); background-color: rgba(8, 121, 144, 0.15); }
.header-action-btn i { font-size: 1.2rem; }

.notification-badge {
  position: absolute;
  top: -5px; right: -5px;
  background-color: var(--error-color);
  color: white;
  border-radius: 50%;
  width: 20px; height: 20px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.7rem; font-weight: bold;
}

.back-btn { display: flex !important; }

/* ── Lessons Sidebar ──────────────────────────────────────────────────────── */
.lessons-sidebar-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
}

.lessons-sidebar-panel {
  width: 320px; max-width: 85vw; height: 100vh;
  background: white;
  box-shadow: 2px 0 10px rgba(0,0,0,0.1);
  display: flex; flex-direction: column; overflow: hidden;
}

.sidebar-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(8, 121, 144, 0.08);
  background: linear-gradient(135deg, rgba(8, 121, 144, 0.05), rgba(8, 121, 144, 0.02));
}

.sidebar-header h6 { margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--primary-color); }

.close-btn {
  background: none; border: none;
  color: var(--secondary-color); font-size: 1.3rem;
  cursor: pointer; padding: 6px;
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 50%;
  transition: all 0.2s ease;
}
.close-btn:hover { background-color: rgba(8, 121, 144, 0.1); color: var(--primary-color); transform: rotate(90deg); }

.sidebar-loading, .sidebar-error, .sidebar-empty {
  padding: 32px 24px; text-align: center;
  color: var(--primary-color); font-size: 0.9rem;
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
.sidebar-error  { color: var(--error-color); }
.sidebar-empty i { font-size: 2.5rem; opacity: 0.3; }

.lessons-list { list-style: none; padding: 8px; margin: 0; overflow-y: auto; flex: 1; }

.lesson-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 3px solid transparent;
  border-radius: 10px; margin-bottom: 4px;
}
.lesson-item:hover { background-color: rgba(8, 121, 144, 0.06); transform: translateX(4px); }
.lesson-item.active {
  background: linear-gradient(135deg, rgba(8, 121, 144, 0.12), rgba(8, 121, 144, 0.08));
  border-left-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(8, 121, 144, 0.1);
}
.lesson-item.active .lesson-name,
.lesson-item.active .lesson-meta { color: var(--primary-color); opacity: 0.9; }
.lesson-item.completed .lesson-number { color: var(--success-color); }

.lesson-number {
  width: 35px; height: 35px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 0.9rem; flex-shrink: 0;
  border-radius: 8px; background: rgba(8, 121, 144, 0.1);
}
.lesson-number i { font-size: 1.2rem; }

.lesson-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }

.lesson-name {
  font-weight: 600; font-size: 0.85rem; color: var(--text-color);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1.3;
}

.lesson-meta { display: flex; align-items: center; gap: 5px; font-size: 0.7rem; color: var(--secondary-color); opacity: 0.8; }

.completed-badge {
  display: inline-flex; align-items: center;
  background-color: var(--success-color); color: white;
  padding: 2px 6px; border-radius: 10px;
  font-size: 0.6rem; font-weight: 600; margin-left: 4px;
}

.progress-section { padding: 16px; border-top: 1px solid rgba(8,121,144,0.1); background: rgba(8,121,144,0.03); }
.progress-header  { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.progress-header i { color: #ffc107; font-size: 1rem; }
.progress-header h6 { font-size: 0.85rem; font-weight: 600; margin: 0; color: var(--secondary-color); }

.progress-bar { height: 6px; background-color: rgba(8,121,144,0.1); border-radius: 3px; overflow: hidden; margin-bottom: 8px; }
.progress-fill { height: 100%; background: linear-gradient(90deg, var(--primary-color), #0a9bb8); transition: width 0.5s ease; border-radius: 3px; }
.progress-text { font-size: 0.75rem; color: var(--secondary-color); margin: 0; text-align: center; opacity: 0.8; }

/* ── Slide animation ─────────────────────────────────────────────────────── */
.slide-left-enter-active, .slide-left-leave-active { transition: all 0.3s ease; }
.slide-left-enter-active .lessons-sidebar-panel,
.slide-left-leave-active .lessons-sidebar-panel { transition: transform 0.3s ease; }
.slide-left-enter-from, .slide-left-leave-to { opacity: 0; }
.slide-left-enter-from .lessons-sidebar-panel,
.slide-left-leave-to   .lessons-sidebar-panel { transform: translateX(-100%); }

/* ── Custom scrollbar ────────────────────────────────────────────────────── */
.lessons-list::-webkit-scrollbar       { width: 6px; }
.lessons-list::-webkit-scrollbar-track { background: transparent; margin: 8px 0; }
.lessons-list::-webkit-scrollbar-thumb { background: linear-gradient(180deg, var(--primary-color), #065e6f); border-radius: 10px; }
.lessons-list::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #065e6f, var(--primary-color)); }

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .guest-lesson-header { padding: 10px; }
  .header-left         { gap: 10px; }
  .header-actions      { gap: 8px; }
  .lessons-label       { display: none; }
  .lessons-toggle-btn  { padding: 8px !important; width: 36px; height: 36px; border-radius: 50% !important; }
  .lessons-sidebar-panel { width: 280px; }
  .lesson-item { height: auto !important; background-color: white; }
}

@media (max-width: 480px) {
  .header-action-btn     { width: 36px; height: 36px; }
  .lessons-sidebar-panel { width: 85vw; }
}

@media (min-width: 1025px) {
  .lessons-toggle-btn { display: none !important; }
}

@media (max-width: 1024px) {
  .lessons-toggle-btn { display: flex !important; }
  .lesson-item        { height: auto !important; background-color: white; }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .guest-lesson-header  { padding: 10px; }
  .header-left          { margin-left: 0.5rem; }
  .lessons-toggle-btn   { display: flex !important; padding-left: 2rem !important; }
  .lessons-sidebar-panel { width: 300px; }
}
</style>