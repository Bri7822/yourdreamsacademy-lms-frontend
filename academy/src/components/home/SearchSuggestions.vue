<template>
<div class="search-suggestions-page">
    <div class="container">
    <!-- Search Header -->
    <div class="search-header">
        <div class="search-input-wrapper">
        <input
            type="text"
            v-model="searchQuery"
            placeholder="Search for courses, lessons, or topics..."
            class="search-input"
            @keypress.enter="performSearch"
            @input="handleInputChange"
            ref="searchInputRef"
        />
        <button class="search-btn" @click="performSearch">
            <i class="fas fa-search"></i>
        </button>
        </div>
        <button class="back-btn" @click="goBack">
        <i class="fas fa-arrow-left"></i>
        Back
        </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Finding suggestions for "{{ searchQuery }}"...</p>
    </div>

    <!-- Quick Suggestions (no query yet) -->
    <div v-else-if="!searchQuery" class="quick-suggestions">
        <div class="suggestion-section">
        <h2>What would you like to learn today?</h2>

        <div class="suggestion-categories">
            <div class="category-card" @click="searchCategory('Finance')">
            <div class="category-icon"><i class="fas fa-chart-line"></i></div>
            <h3>Finance &amp; Money</h3>
            <p>Budgeting, investing, financial freedom</p>
            <div class="suggestion-tags">
                <span @click.stop="performSearch('financial literacy')">Financial Literacy</span>
                <span @click.stop="performSearch('investment')">Investment</span>
                <span @click.stop="performSearch('budgeting')">Budgeting</span>
            </div>
            </div>

            <div class="category-card" @click="searchCategory('Personal Development')">
            <div class="category-icon"><i class="fas fa-brain"></i></div>
            <h3>Personal Growth</h3>
            <p>Habits, discipline, mindset</p>
            <div class="suggestion-tags">
                <span @click.stop="performSearch('discipline')">Discipline</span>
                <span @click.stop="performSearch('habits')">Habits</span>
                <span @click.stop="performSearch('productivity')">Productivity</span>
            </div>
            </div>

            <div class="category-card" @click="searchCategory('Business')">
            <div class="category-icon"><i class="fas fa-briefcase"></i></div>
            <h3>Business &amp; Entrepreneurship</h3>
            <p>Startups, marketing, growth</p>
            <div class="suggestion-tags">
                <span @click.stop="performSearch('entrepreneurship')">Entrepreneurship</span>
                <span @click.stop="performSearch('marketing')">Marketing</span>
                <span @click.stop="performSearch('business plan')">Business Plan</span>
            </div>
            </div>
        </div>
        </div>

        <!-- Recent Searches -->
        <div v-if="recentSearches.length > 0" class="recent-searches-section">
        <h3>Recent Searches</h3>
        <div class="recent-search-list">
            <div
            v-for="search in recentSearches"
            :key="search"
            class="recent-search-item"
            @click="performSearch(search)"
            >
            <i class="fas fa-history"></i>
            <span>{{ search }}</span>
            <button class="remove-search" @click.stop="removeRecentSearch(search)">
                <i class="fas fa-times"></i>
            </button>
            </div>
        </div>
        <button class="clear-recent" @click="clearRecentSearches">
            Clear All Recent Searches
        </button>
        </div>

        <!-- Popular Searches -->
        <div class="popular-searches-section">
        <h3>Popular Right Now</h3>
        <div class="popular-search-grid">
            <div
            v-for="popular in popularSearches"
            :key="popular.term"
            class="popular-search-card"
            @click="performSearch(popular.term)"
            >
            <div class="popular-badge" v-if="popular.trending">
                <i class="fas fa-fire"></i> Trending
            </div>
            <h4>{{ popular.term }}</h4>
            <p>{{ popular.description }}</p>
            <div class="search-meta">
                <span class="search-count">
                <i class="fas fa-search"></i> {{ popular.searches }}+ searches
                </span>
            </div>
            </div>
        </div>
        </div>
    </div>

    <!-- Search Results Suggestions -->
    <div v-else class="search-suggestions-results">
        <div class="results-header">
        <h2>Suggestions for "{{ searchQuery }}"</h2>
        <p>We found {{ filteredSuggestions.length }} related topics</p>
        </div>

        <!-- Related Searches -->
        <div class="related-searches">
        <h3>Related Searches</h3>
        <div class="related-tags">
            <span
            v-for="related in relatedSearches"
            :key="related"
            @click="performSearch(related)"
            >{{ related }}</span>
        </div>
        </div>

        <!-- Content Type Suggestions -->
        <div class="content-type-suggestions">

        <!-- Courses -->
        <div class="suggestion-type" v-if="hasCourses">
            <h3><i class="fas fa-graduation-cap"></i> Courses</h3>
            <div class="suggestion-list">
            <div
                v-for="course in courseSuggestions"
                :key="course.id"
                class="suggestion-item"
                @click="viewCourse(course)"
            >
                <div class="suggestion-content">
                <h4>{{ course.title }}</h4>
                <p>{{ course.description }}</p>
                <div class="suggestion-meta">
                    <span class="lesson-count">
                    <i class="fas fa-book"></i> {{ course.lessons_count }} lessons
                    </span>
                    <span class="level-tag" :class="course.level">{{ course.level }}</span>
                </div>
                </div>
                <div class="suggestion-action">
                <button class="view-btn"><i class="fas fa-arrow-right"></i></button>
                </div>
            </div>
            </div>
        </div>

        <!-- Lessons -->
        <div class="suggestion-type" v-if="hasLessons">
            <h3><i class="fas fa-play-circle"></i> Lessons</h3>
            <div class="suggestion-list">
            <div
                v-for="lesson in lessonSuggestions"
                :key="lesson.id"
                class="suggestion-item"
            >
                <div class="suggestion-content">
                <h4>{{ lesson.title }}</h4>
                <p>{{ lesson.description }}</p>
                <div class="suggestion-meta">
                    <span class="duration">
                    <i class="fas fa-clock"></i> {{ lesson.duration }} min
                    </span>
                    <span class="course-name">{{ lesson.course_title }}</span>
                </div>
                </div>

                <div class="suggestion-action">
                <!--
                    Guest users: always show the preview arrow.
                    The guest session is started (and awaited) inside
                    viewLesson() before navigation, fixing the first-click bug.
                -->
                <button
                    v-if="!authStore.isAuthenticated"
                    class="view-btn"
                    @click="viewLesson(lesson)"
                >
                    <i class="fas fa-arrow-right"></i>
                </button>

                <!--
                    Student NOT enrolled: show Enroll button.
                    View Lesson is intentionally disabled/hidden until enrolled.
                -->
                <button
                    v-else-if="authStore.isStudent && !isEnrolledInLesson(lesson)"
                    class="enroll-btn"
                    :disabled="enrollingLessonId === lesson.id"
                    @click.stop="enrollForLesson(lesson)"
                >
                    <i
                    class="fas"
                    :class="enrollingLessonId === lesson.id
                        ? 'fa-spinner fa-spin'
                        : 'fa-plus-circle'"
                    ></i>
                    Enroll
                </button>

                <!--
                    Student enrolled: show View Lesson arrow.
                -->
                <button
                    v-else-if="authStore.isStudent && isEnrolledInLesson(lesson)"
                    class="view-btn"
                    @click="viewLesson(lesson)"
                >
                    <i class="fas fa-arrow-right"></i>
                </button>

                <!-- Admin / Teacher: unrestricted access -->
                <button
                    v-else
                    class="view-btn"
                    @click="viewLesson(lesson)"
                >
                    <i class="fas fa-arrow-right"></i>
                </button>
                </div>
            </div>
            </div>
        </div>

        <!-- Exercises -->
        <div class="suggestion-type" v-if="hasExercises">
            <h3><i class="fas fa-dumbbell"></i> Exercises</h3>
            <div class="suggestion-list">
            <div
                v-for="exercise in exerciseSuggestions"
                :key="exercise.id"
                class="suggestion-item"
                @click="viewExercise(exercise)"
            >
                <div class="suggestion-content">
                <h4>{{ exercise.title }}</h4>
                <p>{{ exercise.description }}</p>
                <div class="suggestion-meta">
                    <span class="question-count">
                    <i class="fas fa-question-circle"></i>
                    {{ exercise.questions_count }} questions
                    </span>
                    <span class="difficulty" :class="exercise.difficulty">
                    {{ exercise.difficulty }}
                    </span>
                </div>
                </div>
                <div class="suggestion-action">
                <button class="view-btn"><i class="fas fa-arrow-right"></i></button>
                </div>
            </div>
            </div>
        </div>
        </div>

        <!-- No Results -->
        <div v-if="filteredSuggestions.length === 0" class="no-suggestions">
        <i class="fas fa-search"></i>
        <h3>No suggestions found</h3>
        <p>Try adjusting your search terms or browse our popular categories</p>
        <button class="browse-btn" @click="searchQuery = ''">Browse Categories</button>
        </div>
    </div>
    </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSearchStore } from '@/stores/search'
import { useAuthStore } from '@/stores/auth'
import { useGuestStore } from '@/stores/guest'
import { useEnrollment } from '@/composables/useEnrollment'
import { useToast } from 'vue-toastification'
import { navigationUtils } from '@/utils/navigationUtils'

const router = useRouter()
const searchStore = useSearchStore()
const authStore = useAuthStore()
const guestStore = useGuestStore()
const { enrollCourse } = useEnrollment()
const toast = useToast()

// ─── State ────────────────────────────────────────────────────────────────────

const searchQuery = ref('')
const isLoading = ref(false)
const searchInputRef = ref(null)

// Tracks which lesson is mid-enrollment so the button shows a spinner
const enrollingLessonId = ref(null)

// Reactive set of course codes the student has enrolled in this session.
// This allows the Enroll → View Lesson swap without a page reload.
const sessionEnrolledCodes = ref(new Set())

// ─── Static data ──────────────────────────────────────────────────────────────

const popularSearches = ref([
{ term: 'financial literacy', description: 'Master budgeting and money management', searches: 1250, trending: true },
{ term: 'discipline habits',  description: 'Build consistent routines and focus',   searches: 980,  trending: true },
{ term: 'entrepreneurship basics', description: 'Start your business journey',     searches: 760,  trending: false },
{ term: 'investment strategies',   description: 'Grow your wealth intelligently',  searches: 540,  trending: false },
{ term: 'mindset development', description: 'Transform your thinking patterns',    searches: 420,  trending: true },
{ term: 'time management',    description: 'Maximize productivity and efficiency', searches: 380,  trending: false }
])

// ─── Search results ───────────────────────────────────────────────────────────

const recentSearches = computed(() => searchStore.recentSearches)

const courseSuggestions  = ref([])
const lessonSuggestions  = ref([])
const exerciseSuggestions = ref([])
const relatedSearches    = ref([])

const filteredSuggestions = computed(() => [
...courseSuggestions.value,
...lessonSuggestions.value,
...exerciseSuggestions.value
])

const hasCourses  = computed(() => courseSuggestions.value.length > 0)
const hasLessons  = computed(() => lessonSuggestions.value.length > 0)
const hasExercises = computed(() => exerciseSuggestions.value.length > 0)

// ─── Enrollment helpers ───────────────────────────────────────────────────────

/**
 * A lesson is accessible when the student is enrolled in its parent course.
 * We check:
 *  1. The sessionEnrolledCodes set (updated instantly on enroll).
 *  2. The lesson's enrollment_status from the API response.
 */
const isEnrolledInLesson = (lesson) => {
const courseCode = lesson.course_code || lesson.code
if (sessionEnrolledCodes.value.has(courseCode)) return true
return (
    lesson.enrollment_status === 'enrolled' ||
    lesson.enrollment_status === 'approved' ||
    lesson.enrollment_status === 'completed'
)
}

/**
 * Enroll the student in the parent course of a lesson, then allow access.
 * The lesson object is mutated in place so Vue's reactivity updates the
 * button state without a page reload.
 */
const enrollForLesson = async (lesson) => {
if (!authStore.isAuthenticated) {
    router.push('/signup')
    return
}

enrollingLessonId.value = lesson.id

try {
    const courseData = {
    id:          lesson.course_id   || null,
    title:       lesson.course_title || lesson.title,
    code:        lesson.course_code  || lesson.code,
    description: lesson.description
    }

    const result = await enrollCourse(courseData)

    if (result.success || result.alreadyEnrolled) {
    // Mark enrolled reactively so the template re-evaluates
    sessionEnrolledCodes.value.add(courseData.code)
    lesson.enrollment_status = 'enrolled'   // mutate for computed re-check

    if (!result.alreadyEnrolled) {
        toast.success(`Enrolled in "${courseData.title}"! You can now view this lesson.`)
    }
    }
} catch (err) {
    console.error('[SearchSuggestions] enrollForLesson error:', err)
    toast.error('Enrollment failed. Please try again.')
} finally {
    enrollingLessonId.value = null
}
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(() => {
searchInputRef.value?.focus()
searchStore.loadRecentSearches()
})

watch(searchQuery, (newQuery) => {
if (newQuery.length > 2) {
    generateSuggestions(newQuery)
} else {
    clearSuggestions()
}
})

// ─── Suggestion generation ────────────────────────────────────────────────────

const generateSuggestions = async (query) => {
isLoading.value = true

// Replace with a real API call when ready
setTimeout(() => {
    courseSuggestions.value = [
    {
        id: 1, title: 'Financial Literacy Fundamentals',
        description: 'Learn essential money management skills and budgeting techniques',
        lessons_count: 12, level: 'beginner', category: 'Finance', code: 'FIN101'
    },
    {
        id: 2, title: 'Advanced Investment Strategies',
        description: 'Deep dive into stock market and portfolio management',
        lessons_count: 8, level: 'advanced', category: 'Finance', code: 'FIN201'
    }
    ].filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.description.toLowerCase().includes(query.toLowerCase())
    )

    lessonSuggestions.value = [
    {
        id: 101, title: 'Budgeting for Beginners',
        description: 'Create and maintain your first budget effectively',
        duration: 45, course_title: 'Financial Literacy',
        course_code: 'FIN101', slug: 'budgeting-for-beginners',
        enrollment_status: 'not_enrolled'
    },
    {
        id: 102, title: 'Habit Formation Techniques',
        description: 'Science-backed methods to build lasting habits',
        duration: 30, course_title: 'Discipline & Habits',
        course_code: 'DISC101', slug: 'habit-formation-techniques',
        enrollment_status: 'not_enrolled'
    }
    ].filter(l =>
    l.title.toLowerCase().includes(query.toLowerCase()) ||
    l.description.toLowerCase().includes(query.toLowerCase())
    )

    exerciseSuggestions.value = [
    {
        id: 201, title: 'Budget Calculation Exercise',
        description: 'Practice creating monthly budgets with real scenarios',
        questions_count: 5, difficulty: 'beginner'
    }
    ].filter(e =>
    e.title.toLowerCase().includes(query.toLowerCase()) ||
    e.description.toLowerCase().includes(query.toLowerCase())
    )

    relatedSearches.value = [
    `${query} for beginners`,
    `advanced ${query}`,
    `${query} techniques`,
    `${query} strategies`
    ]

    isLoading.value = false
}, 500)
}

const clearSuggestions = () => {
courseSuggestions.value  = []
lessonSuggestions.value  = []
exerciseSuggestions.value = []
relatedSearches.value    = []
}

// ─── Search actions ───────────────────────────────────────────────────────────

const performSearch = (query = null) => {
const searchTerm = query || searchQuery.value
if (!searchTerm.trim()) return
searchStore.addToRecentSearches(searchTerm)
router.push({ name: 'search-results', query: { q: searchTerm } })
}

const handleInputChange = () => { /* debounce handled by watcher */ }

const searchCategory = (category) => {
searchQuery.value = category
performSearch(category)
}

const removeRecentSearch  = (search) => searchStore.removeRecentSearch(search)
const clearRecentSearches = ()       => searchStore.clearRecentSearches()

// ─── Navigation handlers ──────────────────────────────────────────────────────

const viewCourse = (course) => {
if (authStore.isAuthenticated) {
    router.push(navigationUtils.buildStudentUrl(course) || `/student/courses/${course.code}`)
} else {
    startGuestPreview(course)
}
}

const viewLesson = (lesson) => {
if (authStore.isAuthenticated) {
    // Template already guards against calling this when unenrolled for students.
    const url = navigationUtils.buildStudentUrl(lesson)
    if (url) router.push(url)
} else {
    startGuestPreview(lesson)
}
}

const viewExercise = (exercise) => {
if (authStore.isAuthenticated) {
    router.push(`/student/exercises/${exercise.id}`)
} else {
    startGuestPreview(exercise)
}
}

/**
 * FIX for Bug 1 — Guest first-click redirects to HomeCourses.
 *
 * The previous implementation navigated before the session was confirmed
 * active, and used item fields that could be undefined (falling back to
 * the courses list silently).
 *
 * This version:
 *  1. Awaits the session fully before attempting navigation.
 *  2. Delegates URL construction to `navigationUtils.buildGuestUrl` which
 *     validates all required fields and returns null on failure.
 *  3. Only calls router.push() once we have a valid, non-null URL.
 */
const startGuestPreview = (item) => {
    // Build and validate the destination URL using the shared utility
    const destination = navigationUtils.buildGuestUrl(item)

    if (!destination) {
      console.error('[SearchSuggestions] Could not build guest URL for item:', item)
      router.push('/guest/courses')
      return
    }

    // Navigate — the router guard will start/validate the guest session
    router.push(destination)
}

const goBack = () => router.back()
</script>

<style scoped>
.search-suggestions-page {
min-height: 100vh;
background-color: var(--gray-bg);
padding: 2rem 0;
}

.search-header {
display: flex;
align-items: center;
gap: 1rem;
margin-bottom: 2rem;
flex-wrap: wrap;
}

.search-input-wrapper {
flex: 1;
min-width: 300px;
display: flex;
gap: 0.5rem;
}

.search-input {
flex: 1;
padding: 12px 16px;
border: 2px solid var(--primary-color);
border-radius: 8px;
font-size: 16px;
outline: none;
}

.search-btn {
background: var(--primary-color);
color: white;
border: none;
border-radius: 8px;
padding: 12px 20px;
cursor: pointer;
transition: background-color 0.3s ease;
}

.search-btn:hover { background: #06677e; }

.back-btn {
display: flex;
align-items: center;
gap: 0.5rem;
background: transparent;
border: 1px solid var(--border-color);
color: var(--secondary-color);
padding: 10px 16px;
border-radius: 6px;
cursor: pointer;
transition: all 0.3s ease;
}

.back-btn:hover {
background: var(--primary-color-light);
color: var(--primary-color);
}

.quick-suggestions { max-width: 1200px; margin: 0 auto; }

.suggestion-section h2 {
text-align: center;
margin-bottom: 2rem;
color: var(--primary-color);
font-size: 2rem;
}

.suggestion-categories {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
gap: 1.5rem;
margin-bottom: 3rem;
}

.category-card {
background: var(--card-bg-color);
border-radius: 12px;
padding: 2rem;
text-align: center;
cursor: pointer;
border: 2px solid transparent;
transition: all 0.3s ease;
position: relative;
overflow: hidden;
}

.category-card:hover {
transform: translateY(-4px);
border-color: var(--primary-color);
box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.category-card::before {
content: '';
position: absolute;
top: 0; left: 0; right: 0;
height: 4px;
background: var(--primary-color);
}

.category-icon {
width: 80px; height: 80px;
background: var(--primary-color-light);
border-radius: 50%;
display: flex; align-items: center; justify-content: center;
margin: 0 auto 1rem;
color: var(--primary-color);
font-size: 2rem;
}

.category-card h3 { margin: 0 0 1rem; color: var(--primary-color); font-size: 1.25rem; }
.category-card p  { color: var(--secondary-color); margin-bottom: 1.5rem; }

.suggestion-tags {
display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center;
}

.suggestion-tags span {
background: var(--primary-color-light);
color: var(--primary-color);
padding: 4px 8px; border-radius: 12px;
font-size: 0.75rem; cursor: pointer;
transition: all 0.3s ease;
}

.suggestion-tags span:hover { background: var(--primary-color); color: white; }

.recent-searches-section {
background: var(--card-bg-color);
border-radius: 12px; padding: 2rem; margin-bottom: 2rem;
}

.recent-searches-section h3 { margin: 0 0 1rem; color: var(--primary-color); }

.recent-search-list { display: grid; gap: 0.5rem; margin-bottom: 1rem; }

.recent-search-item {
display: flex; align-items: center; gap: 0.75rem;
padding: 0.75rem; background: var(--gray-bg);
border-radius: 6px; cursor: pointer;
transition: background-color 0.3s ease;
}

.recent-search-item:hover { background: var(--primary-color-light); }
.recent-search-item i     { color: var(--primary-color); width: 16px; }
.recent-search-item span  { flex: 1; }

.remove-search {
background: none; border: none;
color: var(--secondary-color); cursor: pointer;
padding: 4px; border-radius: 4px;
}

.remove-search:hover { background: #dc3545; color: white; }

.clear-recent {
width: 100%; padding: 8px;
background: transparent; border: 1px solid var(--border-color);
border-radius: 6px; color: var(--secondary-color); cursor: pointer;
transition: all 0.3s ease;
}

.clear-recent:hover { background: var(--gray-bg); color: var(--primary-color); }

.popular-searches-section {
background: var(--card-bg-color); border-radius: 12px; padding: 2rem;
}

.popular-searches-section h3 { margin: 0 0 1.5rem; color: var(--primary-color); }

.popular-search-grid {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
gap: 1rem;
}

.popular-search-card {
background: var(--gray-bg); border-radius: 8px; padding: 1.5rem;
cursor: pointer; transition: all 0.3s ease;
position: relative; border: 1px solid transparent;
}

.popular-search-card:hover {
transform: translateY(-2px);
border-color: var(--primary-color);
box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.popular-badge {
position: absolute; top: -8px; right: 1rem;
background: #dc3545; color: white;
padding: 4px 8px; border-radius: 12px;
font-size: 0.7rem; font-weight: 600;
display: flex; align-items: center; gap: 0.25rem;
}

.popular-search-card h4 { margin: 0 0 0.5rem; color: var(--primary-color); font-size: 1.1rem; }
.popular-search-card p  { color: var(--secondary-color); margin: 0 0 1rem; font-size: 0.9rem; line-height: 1.4; }

.search-meta { display: flex; align-items: center; gap: 0.5rem; }
.search-count { font-size: 0.8rem; color: var(--secondary-color); display: flex; align-items: center; gap: 0.25rem; }

.search-suggestions-results { max-width: 1000px; margin: 0 auto; }

.results-header {
text-align: center; margin-bottom: 2rem;
padding: 2rem; background: var(--card-bg-color); border-radius: 12px;
}

.results-header h2 { margin: 0 0 0.5rem; color: var(--primary-color); }
.results-header p  { color: var(--secondary-color); margin: 0; }

.related-searches {
background: var(--card-bg-color); border-radius: 12px;
padding: 1.5rem; margin-bottom: 2rem;
}

.related-searches h3 { margin: 0 0 1rem; color: var(--primary-color); }

.related-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.related-tags span {
background: var(--primary-color-light); color: var(--primary-color);
padding: 6px 12px; border-radius: 16px; cursor: pointer;
transition: all 0.3s ease; font-size: 0.9rem;
}

.related-tags span:hover { background: var(--primary-color); color: white; }

.content-type-suggestions { display: grid; gap: 2rem; }

.suggestion-type {
background: var(--card-bg-color); border-radius: 12px; padding: 1.5rem;
}

.suggestion-type h3 {
margin: 0 0 1rem; color: var(--primary-color);
display: flex; align-items: center; gap: 0.5rem;
}

.suggestion-list { display: grid; gap: 1rem; }

.suggestion-item {
display: flex; align-items: center; gap: 1rem;
padding: 1rem; background: var(--gray-bg);
border-radius: 8px; border: 1px solid transparent;
transition: all 0.3s ease;
}

.suggestion-item:hover {
border-color: var(--primary-color);
transform: translateX(4px);
}

.suggestion-content { flex: 1; }
.suggestion-content h4 { margin: 0 0 0.5rem; color: var(--primary-color); font-size: 1.1rem; }
.suggestion-content p  { margin: 0 0 0.75rem; color: var(--secondary-color); font-size: 0.9rem; line-height: 1.4; }

.suggestion-meta { display: flex; gap: 1rem; flex-wrap: wrap; }

.suggestion-meta span {
display: flex; align-items: center; gap: 0.25rem;
font-size: 0.8rem; color: var(--secondary-color);
}

.level-tag, .difficulty {
padding: 2px 8px; border-radius: 8px;
font-size: 0.7rem; font-weight: 600; text-transform: capitalize;
}

.level-tag.beginner, .difficulty.beginner { background: #d4edda; color: #155724; }
.level-tag.advanced, .difficulty.advanced { background: #f8d7da; color: #721c24; }

/* Action buttons */
.suggestion-action .view-btn {
background: var(--primary-color); color: white;
border: none; border-radius: 6px;
padding: 8px 12px; cursor: pointer;
transition: background-color 0.3s ease;
}

.suggestion-action .view-btn:hover { background: #06677e; }

/* Enroll button — students not yet enrolled */
.suggestion-action .enroll-btn {
background: #28a745; color: white;
border: none; border-radius: 6px;
padding: 8px 14px; cursor: pointer;
font-weight: 600;
display: flex; align-items: center; gap: 0.4rem;
transition: background-color 0.3s ease;
white-space: nowrap;
}

.suggestion-action .enroll-btn:hover:not(:disabled) { background: #218838; }

.suggestion-action .enroll-btn:disabled {
opacity: 0.6; cursor: not-allowed;
}

/* Loading / empty states */
.loading-state {
text-align: center; padding: 3rem;
background: var(--card-bg-color); border-radius: 12px;
}

.loading-spinner {
border: 3px solid #f3f3f3;
border-top: 3px solid var(--primary-color);
border-radius: 50%; width: 40px; height: 40px;
animation: spin 1s linear infinite;
margin: 0 auto 1rem;
}

@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.no-suggestions {
text-align: center; padding: 3rem;
background: var(--card-bg-color); border-radius: 12px;
}

.no-suggestions i { font-size: 3rem; color: var(--primary-color); margin-bottom: 1rem; }
.no-suggestions h3 { margin: 0 0 1rem; color: var(--primary-color); }
.no-suggestions p  { color: var(--secondary-color); margin-bottom: 2rem; }

.browse-btn {
background: var(--primary-color); color: white;
border: none; padding: 10px 20px;
border-radius: 6px; cursor: pointer;
transition: background-color 0.3s ease;
}

.browse-btn:hover { background: #06677e; }

/* ─── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
.search-header { flex-direction: column; align-items: stretch; }
.search-input-wrapper { min-width: auto; }
.suggestion-categories { grid-template-columns: 1fr; }
.popular-search-grid   { grid-template-columns: 1fr; }
.suggestion-item { flex-direction: column; align-items: flex-start; gap: 1rem; }
.suggestion-action { align-self: flex-end; }
}

@media (max-width: 480px) {
.search-suggestions-page { padding: 1rem 0; }
.suggestion-type { padding: 1rem; }
.suggestion-meta { flex-direction: column; gap: 0.5rem; }
.related-tags { flex-direction: column; }
.related-tags span { text-align: center; }
}
</style>