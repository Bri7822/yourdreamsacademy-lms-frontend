<template>
  <div class="search-results-page">
    <!-- Search Header -->
    <div class="search-header">
      <div class="container">
        <div class="search-container-results">
          <div class="search-input-wrapper">
            <input
              type="text"
              v-model="searchStore.searchQuery"
              placeholder="Search for courses, lessons, or topics..."
              class="search-input"
              :class="{ 'focus-active': isSearchFocused }"
              @focus="isSearchFocused = true"
              @blur="isSearchFocused = false"
              @keypress.enter="performSearch"
              @input="handleSearchInput"
            >
            <div class="search-icon" @click="performSearch">
              <i class="fas fa-search"></i>
            </div>
          </div>
        </div>

        <!-- Search Stats -->
        <div class="search-stats" v-if="!searchStore.isLoading">
          <p v-if="searchStore.searchQuery && accessibleResults.length > 0">
            Found {{ accessibleResults.length }} results for "{{ searchStore.searchQuery }}"
          </p>
          <p v-else-if="searchStore.searchQuery && accessibleResults.length === 0">
            No results found for "{{ searchStore.searchQuery }}"
          </p>
          <p v-else class="initial-prompt">Enter a search term to find content</p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container">
      <div class="search-content">
        <!-- Filters Sidebar -->
        <div class="filters-sidebar">
          <div class="filter-group">
            <h3>Filters</h3>

            <div class="filter-item">
              <label>Content Type</label>
              <select v-model="searchStore.filters.type" @change="applyFilters">
                <option value="all">All Types</option>
                <option value="course">Courses</option>
                <option value="lesson">Lessons</option>
              </select>
            </div>

            <div class="filter-item">
              <label>Category</label>
              <select v-model="searchStore.filters.category" @change="applyFilters">
                <option value="all">All Categories</option>
                <option value="Finance">Finance</option>
                <option value="Personal Development">Personal Development</option>
                <option value="Business">Business</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Results Section -->
        <div class="results-section">
          <!-- Loading State -->
          <div v-if="searchStore.isLoading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Searching for "{{ searchStore.searchQuery }}"...</p>
          </div>

          <!-- Error State -->
          <div v-else-if="searchStore.error" class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Search Failed</h3>
            <p>{{ searchStore.error }}</p>
            <button @click="performSearch" class="retry-btn">
              Try Again
            </button>
          </div>

          <!-- No Results -->
          <div v-else-if="accessibleResults.length === 0 && searchStore.searchQuery" class="no-results">
            <i class="fas fa-search"></i>
            <h3>No results found</h3>
            <p>Try adjusting your search terms or filters</p>
            <div class="search-suggestions">
              <h4>Try searching for:</h4>
              <div class="suggestion-tags">
                <span @click="handleQuickSearch('financial literacy')">Financial Literacy</span>
                <span @click="handleQuickSearch('discipline habits')">Discipline &amp; Habits</span>
                <span @click="handleQuickSearch('entrepreneurship')">Entrepreneurship</span>
                <span @click="handleQuickSearch('budgeting')">Budgeting</span>
                <span @click="handleQuickSearch('productivity')">Productivity</span>
              </div>
            </div>
          </div>

          <!-- Results Grid -->
          <div v-else-if="accessibleResults.length > 0" class="results-horizontal">
            <div
              v-for="result in accessibleResults"
              :key="result.id"
              class="result-card-horizontal"
            >
              <div class="result-header">
                <span class="result-type" :class="result.type">{{ result.type }}</span>
                <span v-if="result.is_new" class="new-badge">New</span>
                <span v-if="result.is_popular" class="popular-badge">Popular</span>
              </div>

              <h3
                class="result-title"
                v-html="highlightText(result.title, searchStore.searchQuery)"
              ></h3>

              <p
                class="result-description"
                v-html="highlightText(getResultDescription(result), searchStore.searchQuery)"
              ></p>

              <div class="result-meta">
                <span v-if="result.duration" class="meta-item">
                  <i class="fas fa-clock"></i> {{ result.duration }}
                </span>
                <span v-if="result.category" class="meta-item">
                  <i class="fas fa-tag"></i> {{ result.category }}
                </span>

                <!-- Enrollment status badge — courses AND lessons (students only) -->
                <span
                  v-if="authStore.isAuthenticated && authStore.isStudent && (result.type === 'course' || result.type === 'lesson')"
                  class="meta-item enrollment-status"
                  :class="resolvedEnrollmentStatus(result)"
                >
                  <i class="fas" :class="getEnrollmentIcon(resolvedEnrollmentStatus(result))"></i>
                  {{ getEnrollmentText(resolvedEnrollmentStatus(result)) }}
                </span>

                <!-- Lesson: parent-course pill — same blue as course type badge -->
                <span
                  v-if="result.type === 'lesson' && result.course_title"
                  class="meta-item course-pill"
                >
                  <i class="fas fa-graduation-cap"></i> {{ result.course_title }}
                </span>
              </div>

              <!-- ─── Action buttons ─────────────────────────────────── -->
              <div class="result-actions">

                <!-- Guest / unauthenticated: sign-up prompt -->
                <button
                  v-if="!result.accessible && result.promptSignup"
                  class="signup-prompt-btn"
                  @click="handleSignupPrompt(result)"
                >
                  <i class="fas fa-lock"></i>
                  Sign Up to Access
                </button>

                <!-- Guest with preview access -->
                <button
                  v-else-if="!result.accessible && result.allowPreview"
                  class="preview-btn"
                  @click="handlePreview(result)"
                >
                  <i class="fas fa-eye"></i>
                  Preview
                </button>

                <!-- ── Student-specific buttons ── -->
                <template v-else-if="authStore.isAuthenticated && authStore.isStudent">

                  <!--
                    LESSON — not enrolled in parent course:
                    Show Enroll button; View Lesson is hidden until enrolled.
                  -->
                  <button
                    v-if="result.type === 'lesson' && !isEnrolledForLesson(result)"
                    class="enroll-btn"
                    :disabled="enrollingResultId === result.id"
                    @click.stop="enrollForLesson(result)"
                  >
                    <i
                      class="fas"
                      :class="enrollingResultId === result.id
                        ? 'fa-spinner fa-spin'
                        : 'fa-plus-circle'"
                    ></i>
                    {{ enrollingResultId === result.id ? 'Enrolling…' : 'Enroll' }}
                  </button>

                  <!--
                    LESSON — enrolled: show View Lesson.
                  -->
                  <button
                    v-else-if="result.type === 'lesson' && isEnrolledForLesson(result)"
                    class="access-btn student-access-btn"
                    @click="handleStudentAccess(result)"
                  >
                    <i class="fas fa-play"></i>
                    View Lesson
                  </button>

                  <!--
                    COURSE — not enrolled: Enroll Now.
                    COURSE — enrolled: Continue Course.
                    EXERCISE and other types.
                  -->
                  <button
                    v-else
                    class="access-btn student-access-btn"
                    :disabled="isEnrolling && currentEnrollingResult === result.id"
                    @click="handleStudentAccess(result)"
                  >
                    <i
                      class="fas"
                      :class="isEnrolling && currentEnrollingResult === result.id
                        ? 'fa-spinner fa-spin'
                        : 'fa-play'"
                    ></i>
                    {{ getStudentActionText(result) }}
                  </button>

                </template>

                <!-- Admin / Teacher: unrestricted access -->
                <button
                  v-else
                  class="access-btn"
                  @click="handleAccess(result)"
                >
                  <i class="fas fa-play"></i>
                  {{ getActionText(result) }}
                </button>

              </div>
            </div>
          </div>

          <!-- Initial State -->
          <div v-else class="initial-state">
            <i class="fas fa-search"></i>
            <h3>Search Our Content</h3>
            <p>Find courses, lessons, and exercises that match your interests</p>

            <div class="search-suggestions">
              <h4>Try searching for:</h4>
              <div class="suggestion-tags">
                <span @click="handleQuickSearch('financial literacy')">Financial Literacy</span>
                <span @click="handleQuickSearch('discipline habits')">Discipline &amp; Habits</span>
                <span @click="handleQuickSearch('entrepreneurship')">Entrepreneurship</span>
                <span @click="handleQuickSearch('budgeting')">Budgeting</span>
                <span @click="handleQuickSearch('productivity')">Productivity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/search'
import { useAuthStore } from '@/stores/auth'
import { useGuestStore } from '@/stores/guest'
import { searchUtils } from '@/utils/searchUtils'
import { useToast } from 'vue-toastification'
import { useEnrollment } from '@/composables/useEnrollment'

const searchStore = useSearchStore()
const authStore   = useAuthStore()
const guestStore  = useGuestStore()
const route  = useRoute()
const router = useRouter()
const toast  = useToast()
const { enrollCourse } = useEnrollment()

// ─── Local state ──────────────────────────────────────────────────────────────

const isSearchFocused        = ref(false)
const searchTimeout          = ref(null)
const isEnrolling            = ref(false)
const currentEnrollingResult = ref(null)

// Tracks course codes that the student enrolled in during THIS session so the
// Enroll → View Lesson swap is instant without a page reload.
const sessionEnrolledCodes = ref(new Set())

// Tracks which lesson result is mid-enrollment (spinner state).
const enrollingResultId = ref(null)

// ─── Computed ─────────────────────────────────────────────────────────────────

const accessibleResults = computed(() => {
  try {
    return searchStore.accessibleResults ?? []
  } catch (error) {
    console.error('❌ Error in accessibleResults computed:', error)
    return []
  }
})

// ─── Enrollment helpers ───────────────────────────────────────────────────────

/**
 * A lesson is accessible when the student is enrolled in its parent course.
 * Checks:
 *  1. sessionEnrolledCodes (instant, set on enroll success this session).
 *  2. enrollment_status returned by the search API.
 */
const isEnrolledForLesson = (result) => {
  if (result.type !== 'lesson') return true // non-lessons don't need this check

  const courseCode = result.course_code || result.code
  if (courseCode && sessionEnrolledCodes.value.has(courseCode)) return true

  return (
    result.enrollment_status === 'enrolled'  ||
    result.enrollment_status === 'approved'  ||
    result.enrollment_status === 'completed'
  )
}

/**
 * Enroll student in the parent course of a lesson result, then allow access
 * in real time without a page reload.
 */
const enrollForLesson = async (result) => {
  if (!authStore.isAuthenticated) {
    router.push('/signup')
    return
  }

  enrollingResultId.value = result.id

  try {
    const courseData = {
      id:          result.course_id    || null,
      title:       result.course_title || result.title,
      code:        result.course_code  || result.code,
      description: result.description  || ''
    }

    // skipNavigation: true — prevents the composable from also pushing to the
    // course page; we handle all navigation here so the student lands on the
    // lesson they clicked, not on the course overview.
    const enrollResult = await enrollCourse(courseData, { skipNavigation: true })

    if (enrollResult.success || enrollResult.alreadyEnrolled) {
      // Update reactive set so template re-evaluates immediately
      sessionEnrolledCodes.value.add(courseData.code)

      // Mutate so the store-computed getter sees it enrolled
      result.enrollment_status = 'enrolled'

      if (!enrollResult.alreadyEnrolled) {
        toast.success(`Enrolled in "${courseData.title}"! Taking you to the lesson…`)
      }

      // Navigate straight to the lesson — no detour via course page
      const lessonSlug = result.slug || generateSlug(result.title)
      const courseCode = result.course_code || result.code
      router.push(`/student/courses/${courseCode}/lessons/${lessonSlug}`)
    }
  } catch (err) {
    console.error('[SearchResults] enrollForLesson error:', err)
    toast.error('Enrollment failed. Please try again.')
  } finally {
    enrollingResultId.value = null
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
  searchStore.loadRecentSearches()
  if (route.query.q) {
    searchStore.searchQuery = route.query.q
    performSearch()
  }
})

watch(() => route.query.q, (newQuery) => {
  if (newQuery && newQuery !== searchStore.searchQuery) {
    searchStore.searchQuery = newQuery
    performSearch()
  }
})

// ─── Search ───────────────────────────────────────────────────────────────────

const performSearch = async () => {
  if (!searchStore.searchQuery.trim()) {
    searchStore.clearSearch()
    return
  }
  await searchStore.searchAllData(searchStore.searchQuery)
}

const handleSearchInput = () => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
  searchTimeout.value = setTimeout(() => {
    if (searchStore.searchQuery.trim()) {
      performSearch()
    } else {
      searchStore.clearSearch()
    }
  }, 800)
}

const applyFilters = () => { /* filter state is reactive via store */ }

// ─── Display helpers ──────────────────────────────────────────────────────────

const highlightText = (text, query) => searchUtils.highlightText(text, query)

const getResultDescription = (result) => {
  if (result.description) return result.description
  if (result.content) return searchUtils.extractSnippet(result.content, searchStore.searchQuery)
  return 'No description available'
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

const getActionText = (result) => {
  switch (result.type) {
    case 'course':
      return result.enrollment_status === 'enrolled' ? 'Continue Course' : 'View Course'
    case 'lesson':
      return 'View Lesson'
    case 'exercise':
      return 'Try Exercise'
    default:
      return 'View'
  }
}

const getStudentActionText = (result) => {
  switch (result.type) {
    case 'course':
      return (
        result.enrollment_status === 'enrolled' ||
        result.enrollment_status === 'approved' ||
        result.enrollment_status === 'completed'
      ) ? 'Continue Course' : 'Enroll Now'
    case 'exercise':
      return 'Try Exercise'
    default:
      return 'View Content'
  }
}

/**
 * Returns the effective enrollment status for a result, accounting for
 * enrollments made this session (sessionEnrolledCodes) that haven't yet
 * been written back to the result object by the store.
 */
const resolvedEnrollmentStatus = (result) => {
  const code = result.course_code || result.code
  if (code && sessionEnrolledCodes.value.has(code)) return 'enrolled'
  return result.enrollment_status || 'not_enrolled'
}

const getEnrollmentIcon = (status) => {
  switch (status) {
    case 'enrolled':
    case 'approved':
    case 'completed': return 'fa-check-circle'
    case 'pending':   return 'fa-clock'
    default:          return 'fa-plus-circle'
  }
}

const getEnrollmentText = (status) => {
  switch (status) {
    case 'enrolled':  return 'Enrolled'
    case 'approved':  return 'Approved'
    case 'completed': return 'Completed'
    case 'pending':   return 'Pending'
    default:          return 'Not Enrolled'
  }
}

// ─── Navigation handlers ──────────────────────────────────────────────────────

const handleSignupPrompt = () => router.push('/signup')

/**
 * Guest / unauthenticated preview.
 *
 * We do NOT call startGuestSession() here — the router guard on
 * guest-lesson-detail now handles starting a session when one doesn't exist.
 * Calling it here AND in the guard caused the first-click race:
 *   1. Component starts session (async, not yet in store state)
 *   2. router.push fires
 *   3. Guard runs, sees isGuestMode=false (state not settled), redirects away
 *
 * Now the guard is authoritative: it starts the session if needed before
 * calling next(), so the component arriving at the lesson is guaranteed to
 * have an active session.
 */
const handlePreview = (result) => {
  if (result.type === 'lesson') {
    const lessonSlug = result.slug || generateSlug(result.title)
    const courseCode = result.course_code || result.code
    router.push(`/guest/courses/${courseCode}/lessons/${lessonSlug}`)
  } else {
    router.push(result.actionUrl)
  }
}

const handleAccess = (result) => {
  if (result.type === 'lesson') {
    const lessonSlug = result.slug || generateSlug(result.title)
    const courseCode = result.course_code || result.code
    // Use guest path for unauthenticated users — guard will start session
    const basePath = authStore.isAuthenticated ? '/student' : '/guest'
    router.push(`${basePath}/courses/${courseCode}/lessons/${lessonSlug}`)
  } else {
    router.push(result.actionUrl)
  }
}

/**
 * Student-specific access handler.
 * Lessons are already guarded by the template (only reachable when enrolled).
 * Courses handle enrollment inline.
 */
const handleStudentAccess = async (result) => {
  // Lessons: student is enrolled (template guard), navigate directly.
  if (result.type === 'lesson') {
    const lessonSlug = result.slug || generateSlug(result.title)
    const courseCode = result.course_code || result.code
    router.push(`/student/courses/${courseCode}/lessons/${lessonSlug}`)
    return
  }

  // Courses: handle enrollment if not yet enrolled.
  if (result.type === 'course') {
    const alreadyEnrolled =
      result.enrollment_status === 'enrolled'  ||
      result.enrollment_status === 'approved'  ||
      result.enrollment_status === 'completed'

    if (!alreadyEnrolled) {
      isEnrolling.value            = true
      currentEnrollingResult.value = result.id

      try {
        const courseData = {
          id:          result.id,
          title:       result.title,
          code:        result.code,
          description: result.description
        }

        const enrollResult = await enrollCourse(courseData, { skipNavigation: true })

        if (enrollResult.success) {
          result.enrollment_status = 'enrolled'
          sessionStorage.setItem('activeCourseSlug', result.code)
          sessionStorage.setItem('newlyEnrolledCourse', result.code)

          if (window.eventBridge) {
            window.eventBridge.emit('course-activated', {
              courseId:   result.id,
              courseCode: result.code,
              course:     courseData,
              source:     'search-enrollment'
            })
          }

          toast.success(`Successfully enrolled in "${result.title}"!`)
          setTimeout(() => {
            router.push({ path: `/student/courses/${result.code}`, query: { newly_enrolled: 'true' } })
          }, 1500)
        } else {
          toast.error(enrollResult.error || 'Failed to enroll in course')
        }
      } catch (error) {
        console.error('❌ Enrollment error:', error)
        toast.error('An error occurred during enrollment')
      } finally {
        isEnrolling.value            = false
        currentEnrollingResult.value = null
      }
    } else {
      sessionStorage.setItem('activeCourseSlug', result.code)
      sessionStorage.setItem('activeCourseId',   result.id)
      router.push(`/student/courses/${result.code}`)
    }
    return
  }

  // Exercises and other types.
  router.push(result.actionUrl)
}

const handleQuickSearch = (query) => {
  searchStore.searchQuery = query
  performSearch()
}
</script>

<style scoped>
/* ── Access control buttons ────────────────────────────────────────────────── */

/* Enroll button — student not yet enrolled in lesson's course */
.enroll-btn {
  background: #28a745;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: background-color 0.3s ease;
  white-space: nowrap;
}

.enroll-btn:hover:not(:disabled) {
  background: #218838;
}

.enroll-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.student-access-btn {
  background: #28a745;
}

.student-access-btn:hover {
  background: #218838;
}

/* ── Enrollment status meta badge ──────────────────────────────────────────── */
.enrollment-status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 10px;
}

/* Green — actively enrolled */
.enrollment-status.enrolled,
.enrollment-status.approved,
.enrollment-status.completed {
  background: #d4edda;
  color: #155724;
}

/* Yellow/amber — awaiting admin approval */
.enrollment-status.pending {
  background: #fff3cd;
  color: #856404;
}

/* ✅ Orange-red warning — not yet enrolled */
.enrollment-status.not_enrolled {
  background: #ffe5d0;
  color: #c0440a;
}

/* ✅ Lesson's parent-course pill — same blue as result-type.course */
.course-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: #e3f2fd;
  color: #1976d2;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 600;
}

/* ── Base layout ───────────────────────────────────────────────────────────── */
.search-results-page {
  min-height: 100vh;
  background-color: var(--gray-bg);
}

.search-header {
  background: var(--card-bg-color);
  border-bottom: 1px solid var(--border-color);
  padding: 1.5rem 0 1rem;
  margin-top: 2rem;
}

.search-container-results {
  position: relative;
  max-width: 600px;
  margin: 0 auto 0.5rem;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  margin-top: 3rem;
}

.search-input {
  width: 100%;
  padding: 10.8px 18px;
  border: 2px solid #e2e8f0;
  border-radius: 50px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: white;
  border-color: var(--primary-color);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(8, 121, 144, 0.1);
}

.search-input.focus-active { border-color: var(--primary-color); }

.search-icon {
  position: absolute;
  right: 15px;
  color: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: var(--fs-lg);
  transform: translateY(-50%);
}

.search-stats {
  text-align: center;
  margin-top: 0.1rem;
  margin-bottom: 0.1rem;
  color: var(--secondary-color);
  font-size: var(--fs-sm);
}

.search-stats .initial-prompt { margin: 0; padding: 0; }

.search-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  padding: 2rem 0;
  min-height: 600px;
}

/* ── Filters sidebar ───────────────────────────────────────────────────────── */
.filters-sidebar {
  background: var(--card-bg-color);
  border-radius: 8px;
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 2rem;
  max-height: calc(100vh - 4rem);
  overflow-y: auto;
  z-index: 10;
}

.filter-group h3 { margin-bottom: 1rem; color: var(--primary-color); }

.filter-item { margin-bottom: 1rem; }

.filter-item label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--secondary-color);
}

.filter-item select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: white;
}

.clear-filters {
  width: 100%;
  padding: 8px;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--secondary-color);
  cursor: pointer;
  margin-top: 1rem;
}

.clear-filters:hover { background: var(--gray-bg); }

/* ── Results section ───────────────────────────────────────────────────────── */
.results-section { min-height: 400px; }

.loading-state,
.error-state,
.no-results,
.initial-state {
  text-align: center;
  padding: 3rem;
  background: var(--card-bg-color);
  border-radius: 8px;
}

.loading-state i,
.error-state i,
.no-results i,
.initial-state i {
  font-size: 3rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
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

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.retry-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
}

/* ── Result cards ──────────────────────────────────────────────────────────── */
.results-horizontal {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.result-card-horizontal {
  background: var(--card-bg-color);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--border-color);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.result-card-horizontal:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.result-type {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}

.result-type.course   { background: #e3f2fd; color: #1976d2; }
.result-type.lesson   { background: #f3e5f5; color: #7b1fa2; }
.result-type.exercise { background: #e8f5e8; color: #388e3c; }

.new-badge     { background: #fff3cd; color: #856404; padding: 2px 6px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; }
.popular-badge { background: #d4edda; color: #155724; padding: 2px 6px; border-radius: 8px; font-size: 0.7rem; font-weight: 600; }

.result-title {
  margin: 0 0 1rem 0;
  color: var(--primary-color);
  font-size: 1.25rem;
}

.result-title :deep(mark) { background: yellow; padding: 2px; }

.result-description {
  color: var(--secondary-color);
  line-height: 1.5;
  margin-bottom: 1rem;
}

.result-description :deep(mark) { background: yellow; padding: 2px; }

.result-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--secondary-color);
}

.result-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.signup-prompt-btn,
.preview-btn,
.access-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.3s ease;
}

.signup-prompt-btn { background: #dc3545; color: white; }
.preview-btn       { background: #ffc107; color: #212529; }
.access-btn        { background: var(--primary-color); color: white; }

.signup-prompt-btn:hover,
.preview-btn:hover,
.access-btn:hover { opacity: 0.9; }

/* ── Suggestions / quick search ────────────────────────────────────────────── */
.search-suggestions { margin-top: 1.5rem; }

.search-suggestions h4 {
  text-align: center;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.suggestion-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 1rem;
}

.suggestion-tags span {
  background: var(--primary-color-light);
  color: var(--primary-color);
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.suggestion-tags span:hover {
  background: var(--primary-color);
  color: white;
}

/* ── Responsive ────────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .search-content {
    grid-template-columns: 1fr;
  }

  .filters-sidebar {
    position: static;
    max-height: none;
    padding: 1rem;
  }

  /* Mobile: Filters in horizontal row */
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .filter-group h3 {
    display: none; /* Hide "Filters" heading on mobile */
  }

  .filter-item {
    margin-bottom: 0;
  }

  .filter-item label {
    display: none; /* Hide labels on mobile, rely on select placeholders */
  }

  .filter-item select {
    padding: 6px 10px;
    font-size: 0.875rem;
  }

  /* Horizontal layout for filter selects */
  @supports (display: grid) {
    .filter-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      align-items: start;
    }
  }

  .result-meta { flex-direction: flex; gap: 0.8rem; }
  .result-actions { flex-direction: column; }

  .search-container-results { margin: 0 auto 0.25rem; }

  .search-input {
    padding: 10px 45px 10px 15px;
    font-size: 14px;
  }

  .search-icon {
    width: 35px;
    height: 35px;
    right: 10px;
  }

  .search-header {
    padding: 1rem 0 0.5rem;
    margin-top: 1rem;
  }
}

@media (max-width: 480px) {
  .search-header { padding: 0.5rem 0; }

  .result-card-horizontal {
    padding: 15px;
    margin: 0 10px;
  }

  .suggestion-tags {
    flex-direction: column;
    align-items: center;
  }
}
</style>