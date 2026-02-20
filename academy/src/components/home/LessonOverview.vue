<template>
  <div class="lessons-overview-page">
    <!-- Header Section -->
    <section class="header-section">
      <div class="container">
        <h1 class="page-title">Course Lessons</h1>
        <p class="page-subtitle">Explore comprehensive lessons across all courses to build your skills and knowledge</p>
      </div>
    </section>

    <!-- Category Filters Section -->
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

    <!-- Courses List Section -->
    <section class="courses-section">
      <div class="container">
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Loading courses and lessons...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
          <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Unable to Load Courses</h3>
            <p>{{ error }}</p>
            <button @click="loadCoursesWithLessons" class="retry-btn">
              <i class="fas fa-redo"></i>
              Try Again
            </button>
          </div>
        </div>

        <!-- Courses List -->
        <div v-else-if="!loading && !error" class="courses-list">
          <div
            v-for="course in filteredCourses"
            :key="course.id"
            class="course-row"
            @click="openCourseOverview(course)"
          >
            <!-- Left: Course Icon & Info -->
            <div class="course-left">
              <div class="course-icon-wrapper">
                <div class="course-icon">
                  <i :class="getCourseIcon(course.title)"></i>
                </div>
                <!-- ✅ FIXED: Video badge - ALWAYS SHOWS if video_count > 0 -->
                <div v-if="getVideoCount(course) > 0" class="course-video-badge" title="Contains videos">
                  <i class="fas fa-video"></i>
                  <span>{{ getVideoCount(course) }}</span>
                </div>
              </div>

              <div class="course-details">
                <h3 class="course-title">{{ course.title }}</h3>
                <p class="course-description">{{ course.description }}</p>

                <div class="course-meta-inline">
                  <!-- existing items -->
                  <span class="meta-item">
                    <i class="fas fa-book-open"></i>
                    {{ getTotalLessons(course) }} lessons
                    <span class="video-count" :class="{ 'has-videos': getVideoCount(course) > 0 }">
                      • {{ getVideoCount(course) }} videos
                    </span>
                  </span>
                  <span class="meta-item">
                    <i class="fas fa-clock"></i>
                    {{ course.duration }} weeks
                  </span>
                  <span class="meta-item free">
                    <i class="fas fa-gift"></i>
                    Free
                  </span>

                  <!-- ✅ NEW: Not enrolled badge (only for authenticated unenrolled users) -->
                  <span v-if="authStore.isAuthenticated && !isCourseEnrolled(course)" class="meta-item not-enrolled">
                    <i class="fas fa-lock"></i>
                    Not Enrolled
                  </span>
                </div>
              </div>
            </div>

            <!-- Right: Progress & Action -->
            <div class="course-right">
              <div class="progress-section">
                <div class="progress-header">
                  <span class="progress-text">Progress</span>
                  <span class="progress-percent">{{ getCourseProgress(course) }}%</span>
                </div>
                <div class="progress-bar-mini">
                  <div
                    class="progress-fill-mini"
                    :style="{ width: getCourseProgress(course) + '%' }"
                  ></div>
                </div>
              </div>

              <button
                class="course-action-btn"
                :class="getAccessType(course)"
                @click.stop="handleCourseAction(course)"
                :disabled="isEnrolling && currentEnrollingCourse === course.id"
              >
                <span v-if="isEnrolling && currentEnrollingCourse === course.id">
                  <i class="fas fa-spinner fa-spin"></i>
                </span>
                <span v-else>{{ getAccessButtonText(course) }}</span>
                <i v-if="!(isEnrolling && currentEnrollingCourse === course.id)" class="fas fa-arrow-right"></i>
              </button>
            </div>

            <!-- Bottom: Lesson Preview Strip - UPDATED: Always show lessons if they exist -->
            <div class="lessons-strip" v-if="course.lessons && course.lessons.length > 0">
              <div class="strip-header">
                <i class="fas fa-list-ul"></i>
                <span>Lessons Preview</span>
                <!-- PERMANENT VIDEO COUNT IN HEADER -->
                <span class="total-count-badge">
                  Total: {{ getTotalLessons(course) }} lessons
                  <span class="video-count-header" :class="{ 'has-videos': getVideoCount(course) > 0 }">
                    • {{ getVideoCount(course) }} videos
                  </span>
                </span>
              </div>
              <div class="strip-lessons">
                <div
                  v-for="lesson in getCourseLessonsPreview(course)"
                  :key="lesson.id"
                  class="strip-lesson"
                  :class="{
                    'has-video': hasVideo(lesson),
                    'disabled': !isCourseEnrolled(course) && authStore.isAuthenticated,
                    'guest-preview': !authStore.isAuthenticated
                  }"
                  @click.stop="handleLessonClick(course, lesson)"
                >
                  <div class="lesson-dot" :class="getLessonStatus(lesson, course)"></div>
                  <span class="lesson-name">{{ lesson.title }}</span>
                  <span class="lesson-time">{{ lesson.duration || '30' }}m</span>

                  <!-- ✅ FIXED: Video indicator - ALWAYS shows for lessons with videos -->
                  <span v-if="hasVideo(lesson)" class="video-indicator active" :title="`Video: ${lesson.video_url}`">
                    <i class="fas fa-video"></i>
                  </span>
                  <span v-else class="video-indicator inactive" title="No video">
                    <i class="fas fa-video-slash"></i>
                  </span>

                  <!-- ✅ FIXED: Link indicator - ALWAYS shows for lessons with video URLs -->
                  <span v-if="hasVideo(lesson)" class="link-indicator" :title="`Video URL: ${lesson.video_url}`">
                    <i class="fas fa-link"></i>
                  </span>

                  <!-- Enrollment lock indicator for unenrolled courses -->
                  <span
                    v-if="!isCourseEnrolled(course) && authStore.isAuthenticated"
                    class="enrollment-lock"
                    title="Enroll to access this lesson"
                  >
                    <i class="fas fa-lock"></i>
                  </span>
                </div>
                <div v-if="getTotalLessons(course) > 3" class="more-lessons-indicator">
                  +{{ getTotalLessons(course) - 3 }} more lessons
                </div>
              </div>
            </div>

            <!-- No Lessons State - ONLY show when there are truly no lessons -->
            <div v-else class="lessons-strip">
              <div class="strip-header">
                <i class="fas fa-list-ul"></i>
                <span>Lessons</span>
                <span class="total-count-badge">
                  Total: {{ getTotalLessons(course) }} lessons
                </span>
              </div>
              <div class="no-lessons-message">
                <i class="fas fa-info-circle"></i>
                <span>No lessons available yet</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && !error && filteredCourses.length === 0" class="empty-state">
          <div class="empty-illustration">
            <i class="fas fa-book-open"></i>
          </div>
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
import { useEnrollment } from '@/composables/useEnrollment'
import axios from 'axios'
import GuestNavigation from '@/utils/navigation'
import { generateSlug } from '@/utils/slugUtils'

const router = useRouter()
const authStore = useAuthStore()
const guestStore = useGuestStore()
const toast = useToast()
const { enrollCourse, isEnrolling, loadHomeCourses } = useEnrollment()

// State
const loading = ref(false)
const error = ref(null)
const activeCategory = ref('all')
const courses = ref([])
const currentEnrollingCourse = ref(null)
const lessonsData = ref({})
const videoCounts = ref({})
const courseTotalLessons = ref({})
const showDebug = ref(true)

// Categories matching HomeCourses
const categories = ref([
  { key: 'all', label: 'All Courses' },
  { key: 'finance', label: 'Finance' },
  { key: 'personal_development', label: 'Personal Development' },
  { key: 'business', label: 'Business' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'education', label: 'Department of Education' }
])

// ✅ FIXED: Computed property - enrolled courses first, then others
const filteredCourses = computed(() => {
  let filtered = courses.value

  if (activeCategory.value !== 'all') {
    filtered = filtered.filter(course => {
      const category = course.category ? course.category.toLowerCase().replace(/ /g, '_') : ''

      switch (activeCategory.value) {
        case 'finance':
          return category === 'finance'
        case 'personal_development':
          return category === 'personal_development'
        case 'business':
          return category === 'business'
        case 'marketing':
          return category === 'marketing'
        case 'education':
          return category === 'department_of_education'
        default:
          return true
      }
    })
  }

  // ✅ CRITICAL FIX: Sort enrolled courses first
  if (authStore.isAuthenticated) {
    return filtered.sort((a, b) => {
      const aEnrolled = isCourseEnrolled(a)
      const bEnrolled = isCourseEnrolled(b)

      if (aEnrolled && !bEnrolled) return -1
      if (!aEnrolled && bEnrolled) return 1
      return 0 // Keep original order for same enrollment status
    })
  }

  return filtered
})

const navigateToGuestLesson = (courseSlug, lesson) => {
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim()
  }

  const lessonSlug = generateSlug(lesson.title)

  const routeName = router.currentRoute.value.name
  GuestNavigation.setSource(routeName)

  router.push({
    name: 'guest-lesson-detail',
    params: {
      courseSlug,
      lessonSlug  // ✅ Use lesson slug instead of ID
    }
  })
}

// Methods
const getCourseIcon = (courseTitle) => {
  const icons = {
    'Financial Literacy': 'fas fa-chart-line',
    'Discipline, Habits & Focus': 'fas fa-brain',
    'Entrepreneurship Fundamentals': 'fas fa-rocket',
    'Finance': 'fas fa-chart-line',
    'Personal Development': 'fas fa-brain',
    'Business': 'fas fa-briefcase',
    'Marketing': 'fas fa-bullhorn',
    'Department of Education': 'fas fa-graduation-cap'
  }

  if (icons[courseTitle]) {
    return icons[courseTitle]
  }

  const lowerTitle = courseTitle.toLowerCase()
  if (lowerTitle.includes('finance') || lowerTitle.includes('money')) return 'fas fa-chart-line'
  if (lowerTitle.includes('development') || lowerTitle.includes('habit')) return 'fas fa-brain'
  if (lowerTitle.includes('business') || lowerTitle.includes('entrepreneur')) return 'fas fa-briefcase'
  if (lowerTitle.includes('marketing')) return 'fas fa-bullhorn'
  if (lowerTitle.includes('education')) return 'fas fa-graduation-cap'

  return 'fas fa-book'
}

// ✅ NEW: Check if course has lessons (either loaded or from backend count)
const hasLessons = (course) => {
  const hasLoadedLessons = course.lessons && course.lessons.length > 0
  const hasBackendLessons = getTotalLessons(course) > 0
  console.log(`📚 Course ${course.title}: hasLoadedLessons=${hasLoadedLessons}, hasBackendLessons=${hasBackendLessons}, total=${getTotalLessons(course)}`)
  return hasLoadedLessons || hasBackendLessons
}

const getCourseLessonsPreview = (course) => {
  const lessons = course.lessons || lessonsData.value[course.id] || []
  console.log(`🔍 Getting preview for ${course.title}: ${lessons.length} lessons available`)
  return lessons.slice(0, 3)
}

// ✅ UPDATED: Get lesson status considering enrollment
const getLessonStatus = (lesson, course) => {
  if (!authStore.isAuthenticated) return 'guest'
  if (!isCourseEnrolled(course)) return 'locked'
  return lesson.completed ? 'completed' : 'upcoming'
}

// ✅ FIXED: Check if a lesson has video - works for BOTH guests and registered users
const hasVideo = (lesson) => {
  if (!lesson) return false

  // ✅ PRIMARY CHECK: video_url field
  if (lesson.video_url &&
      typeof lesson.video_url === 'string' &&
      lesson.video_url.trim() !== '' &&
      lesson.video_url !== 'null' &&
      lesson.video_url !== 'undefined') {
    return true
  }

  // ✅ SECONDARY CHECK: video_config object
  if (lesson.video_config && typeof lesson.video_config === 'object') {
    if (lesson.video_config.url && lesson.video_config.url.trim() !== '') {
      return true
    }
    if (Object.keys(lesson.video_config).length > 0) {
      return true
    }
  }

  // ✅ TERTIARY CHECK: has_video flag
  if (lesson.has_video === true) {
    return true
  }

  return false
}

// Get total lessons count
const getTotalLessons = (course) => {
  if (course.total_lessons !== undefined && course.total_lessons !== null) {
    return course.total_lessons
  }
  if (courseTotalLessons.value[course.id] !== undefined) {
    return courseTotalLessons.value[course.id]
  }
  if (course.lessons_count !== undefined) {
    return course.lessons_count
  }
  const lessons = course.lessons || lessonsData.value[course.id] || []
  return lessons.length
}

// ✅ FIXED: Get video count - works for BOTH guests and registered users
const getVideoCount = (course) => {
  const courseId = course.id

  // ✅ PRIORITY 1: Use backend video_count field (works for guests!)
  if (course.video_count !== undefined && course.video_count !== null) {
    videoCounts.value[courseId] = course.video_count
    return course.video_count
  }

  // Return cached count if valid
  if (videoCounts.value[courseId] !== undefined) {
    return videoCounts.value[courseId]
  }

  // ✅ FALLBACK: Calculate from loaded lessons
  const lessons = course.lessons || lessonsData.value[courseId] || []
  if (lessons.length === 0) {
    videoCounts.value[courseId] = 0
    return 0
  }

  // Count videos using hasVideo()
  const videoLessons = lessons.filter(lesson => hasVideo(lesson))
  const count = videoLessons.length

  videoCounts.value[courseId] = count
  return count
}

const getCourseProgress = (course) => {
  if (course.progress !== undefined) {
    return course.progress
  }

  const lessons = course.lessons || lessonsData.value[course.id] || []
  if (lessons.length === 0) return 0

  const completedLessons = lessons.filter(lesson => lesson.completed).length
  return Math.round((completedLessons / lessons.length) * 100)
}

const getAccessType = (course) => {
  if (!authStore.isAuthenticated) return 'guest'
  return isCourseEnrolled(course) ? 'enrolled' : 'not-enrolled'
}

const getAccessButtonText = (course) => {
  const accessType = getAccessType(course)
  switch (accessType) {
    case 'enrolled':
      return 'Continue'
    case 'not-enrolled':
      return 'Enroll'
    case 'guest':
      return 'View Lessons'
    default:
      return 'Try Lessons'
  }
}

const isCourseEnrolled = (course) => {
  return course.enrollment_status === 'enrolled' ||
         course.enrollment_status === 'approved' ||
         course.enrollment_status === 'completed'
}

const handleLessonClick = async (course, lesson) => {
  console.log('🎯 Lesson clicked:', {
    course: course.title,
    lesson: lesson.title,
    enrolled: isCourseEnrolled(course),
    authenticated: authStore.isAuthenticated
  })

  // For authenticated but not enrolled users, show enrollment message
  if (authStore.isAuthenticated && !isCourseEnrolled(course)) {
    console.log('🔒 Student not enrolled, showing enrollment message')
    toast.info(`Please enroll in "${course.title}" to access the lessons`, {
      timeout: 4000,
      closeOnClick: true,
      pauseOnFocusLoss: true,
      pauseOnHover: true,
      draggable: true,
      draggablePercent: 0.6,
      showCloseButtonOnHover: false,
      hideProgressBar: false,
      closeButton: "button",
      icon: true,
      rtl: false
    })
    return
  }

  // For enrolled users or guests, proceed with navigation
  try {
    await handleCourseAction(course, lesson)
  } catch (err) {
    console.error('❌ Error handling lesson click:', err)
    toast.error('Failed to access lesson. Please try again.')
  }
}

// Update handleCourseAction to use slugs
const handleCourseAction = async (course, specificLesson = null) => {
  console.log('🎯 Course action clicked for:', course.title, 'lesson:', specificLesson?.title)

  if (!authStore.isAuthenticated) {
    await startGuestSessionAndRedirect(course, specificLesson)
  } else if (isCourseEnrolled(course)) {
    // Navigate to specific lesson or course overview
    if (specificLesson) {
      // Generate slug for the lesson
      const lessonSlug = generateSlug(specificLesson.title)
      router.push(`/student/courses/${course.code}/lessons/${lessonSlug}`)
    } else {
      router.push(`/student/courses/${course.code}`)
    }
  } else {
    await enrollStudent(course)
  }
}

// Update startGuestSessionAndRedirect to use slugs
const startGuestSessionAndRedirect = async (course, specificLesson = null) => {
  try {
    console.log('🚀 Starting guest session for course:', course.title, 'lesson:', specificLesson?.title)

    if (!guestStore.isGuestMode) {
      const result = await guestStore.startGuestSession()
      if (!result.success) {
        toast.error('Failed to start preview session')
        return
      }
    }

    // Navigate to specific lesson or course overview in guest mode
    if (specificLesson) {
      const lessonSlug = generateSlug(specificLesson.title)
      router.push(`/guest/courses/${course.code}/lessons/${lessonSlug}`)
    } else {
      router.push(`/guest/courses/${course.code}`)
    }

  } catch (err) {
    console.error('Failed to start guest preview:', err)
    toast.error('Failed to access course preview')
  }
}

const enrollStudent = async (course) => {
  console.log('🎯 Enrolling student in course:', course.title)

  if (isCourseEnrolled(course)) {
    console.log('ℹ️ Course already enrolled - no action needed')
    return
  }

  currentEnrollingCourse.value = course.id
  const result = await enrollCourse(course)
  currentEnrollingCourse.value = null

  if (result.success) {
    if (result.alreadyEnrolled || result.newlyEnrolled) {
      course.enrollment_status = 'enrolled'
      console.log(`✅ Updated enrollment status for ${course.title}`)
      router.push(`/student/courses/${course.code}`)
    }
  } else {
    console.log('❌ Enrollment failed:', result.error)
  }
}

const openCourseOverview = (course) => {
  const accessType = getAccessType(course)
  if (accessType === 'guest' || accessType === 'enrolled') {
    handleCourseAction(course)
  }
}

// ✅ FIXED: Use HOME endpoint for LessonOverview (gets ALL courses)
const fetchCourses = async () => {
  try {
    console.log('📚 Fetching ALL courses from HOME endpoint...')
    console.log(`🔐 Auth Status: ${authStore.isAuthenticated ? 'AUTHENTICATED' : 'GUEST'}`)

    let response

    // ✅ CRITICAL FIX: Use HOME endpoint for LessonOverview
    const endpoint = '/api/student/home/courses/'
    console.log(`🎯 Calling HOME endpoint: ${endpoint}`)
    response = await axios.get(endpoint)

    console.log('✅ Home courses API response:', response.data)

    let coursesArray = []
    if (response.data && Array.isArray(response.data.courses)) {
      coursesArray = response.data.courses
    } else if (response.data && Array.isArray(response.data)) {
      coursesArray = response.data
    } else if (response.data?.courses && typeof response.data.courses === 'object') {
      coursesArray = Object.values(response.data.courses)
    }

    console.log(`📊 Total courses received: ${coursesArray.length}`)

    // ✅ Log video counts for debugging
    coursesArray.forEach((course, index) => {
      console.log(`📹 Course ${index + 1}: "${course.title}"`)
      console.log(`   - video_count: ${course.video_count}`)
      console.log(`   - total_lessons: ${course.total_lessons}`)
      console.log(`   - enrollment_status: ${course.enrollment_status}`)
    })

    return coursesArray

  } catch (err) {
    console.error('❌ Failed to fetch home courses:', err)
    throw err
  }
}

// ✅ FIXED: Use HOME endpoint for lessons
const fetchLessonsForCourse = async (course) => {
  try {
    console.log(`📖 Fetching lessons for course: ${course.code} (Enrolled: ${isCourseEnrolled(course)})`)

    let response

    // ✅ CRITICAL FIX: Use HOME endpoint for LessonOverview
    console.log(`👤 Using HOME endpoint for ${course.code}`)
    response = await axios.get(`/api/student/home/courses/${course.code}/lessons/`)
    console.log(`✅ Successfully fetched lessons via HOME endpoint for ${course.code}`)

    console.log(`✅ Lessons API response for ${course.code}:`, response.data)

    let lessons = []
    // ✅ FIXED: Remove duplicate condition
    if (Array.isArray(response.data.lessons)) {
      lessons = response.data.lessons
    } else if (response.data && Array.isArray(response.data)) {
      lessons = response.data
    } else if (response.data && response.data.results) {
      lessons = response.data.results
    }

    // ✅ Log lesson video data
    console.log(`🎬 VIDEO DATA for ${course.code}:`)
    lessons.forEach((lesson, index) => {
      const hasVid = hasVideo(lesson)
      console.log(`   Lesson ${index + 1}: "${lesson.title}"`)
      console.log(`      - has video: ${hasVid}`)
      console.log(`      - video_url: ${lesson.video_url}`)
    })

    return lessons

  } catch (err) {
    console.error(`❌ Failed to fetch lessons for ${course.code}:`, err.response?.data || err.message)
    return []
  }
}

// ✅ FIXED: Load ALL courses with proper enrollment sorting
const loadCoursesWithLessons = async () => {
  loading.value = true
  error.value = null

  try {
    if (!authStore.isAuthenticated) {
      console.log('🔐 Starting guest session for unauthenticated user...')
      if (!guestStore.isGuestMode || !guestStore.session?.session_id) {
        const result = await guestStore.startGuestSession()
        if (!result.success) {
          throw new Error('Failed to start guest session')
        }
      }
    }

    // ✅ Fetch ALL courses from HOME endpoint
    const coursesArray = await fetchCourses()

    // Enhance course data
    courses.value = coursesArray.map(course => {
      const originalTotalLessons = course.total_lessons || course.lessons_count || 0
      const videoCount = course.video_count || 0

      courseTotalLessons.value[course.id] = originalTotalLessons

      if (videoCount > 0) {
        videoCounts.value[course.id] = videoCount
        console.log(`✅ Backend video count for ${course.title}: ${videoCount}`)
      }

      return {
        ...course,
        total_lessons: originalTotalLessons,
        lessons_count: originalTotalLessons,
        video_count: videoCount,
        _original_total_lessons: originalTotalLessons,
        _original_lessons_count: originalTotalLessons,
        enrollment_status: course.enrollment_status || 'not_enrolled',
        category: course.category || 'General',
        progress: course.progress || 0,
        code: course.code || `CRS${course.id}`
      }
    })

    console.log(`✅ Loaded ${courses.value.length} courses (ALL courses, enrolled + not enrolled)`)

    // ✅ CRITICAL: Fetch lessons for ALL courses - using HOME endpoints
    const lessonPromises = courses.value.map(async (course) => {
      try {
        console.log(`📖 Fetching lessons for course: ${course.title} (Enrolled: ${isCourseEnrolled(course)})`)
        const lessons = await fetchLessonsForCourse(course)
        course.lessons = lessons
        lessonsData.value[course.id] = lessons
        console.log(`✅ ${course.title}: Loaded ${lessons.length} lessons (Videos: ${course.video_count || 'N/A'})`)
        return { courseId: course.id, lessons, success: true }
      } catch (error) {
        console.error(`⚠️ Failed to load lessons for ${course.code}:`, error)
        course.lessons = []
        lessonsData.value[course.id] = []
        return { courseId: course.id, lessons: [], success: false, error }
      }
    })

    await Promise.all(lessonPromises)

    console.log('\n' + '='.repeat(80))
    console.log('🎯 FINAL COURSE DATA SUMMARY:')
    console.log('='.repeat(80))

    courses.value.forEach(course => {
      const realTotal = courseTotalLessons.value[course.id] || course.total_lessons
      const loadedLessons = course.lessons?.length || 0
      const videoCount = getVideoCount(course)

      console.log(`\n📊 ${course.title}:`)
      console.log(`   Enrolled: ${isCourseEnrolled(course)}`)
      console.log(`   Total Lessons: ${realTotal}`)
      console.log(`   Loaded Lessons: ${loadedLessons}`)
      console.log(`   Total Videos: ${videoCount}`)
      console.log(`   Will show lessons: ${hasLessons(course)}`)
    })
    console.log('='.repeat(80) + '\n')

  } catch (err) {
    console.error('❌ Failed to load courses with lessons:', err)
    error.value = err.response?.data?.detail || err.message || 'Failed to load courses. Please try again.'
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  console.log('🎓 LessonsOverview mounted - loading ALL courses')
  loadCoursesWithLessons()
})

// Cleanup
onUnmounted(() => {
  console.log('🧹 LessonsOverview unmounted')
})
</script>

<style scoped>
/* ✅ UPDATED: Disabled lesson styling */
.strip-lesson.disabled {
  opacity: 0.6;
  background: rgba(108, 117, 125, 0.1);
  cursor: not-allowed;
  border-left: 3px solid #ffc107;
}

.fa-book-open{
  color: var(--primary-color);
}

.strip-lesson.disabled:hover {
  background: rgba(108, 117, 125, 0.15);
  transform: none;
}

.strip-lesson.guest-preview {
  opacity: 0.8;
  background: rgba(8, 121, 144, 0.05);
  border-left: 3px solid var(--primary-color);
}

.strip-lesson.guest-preview:hover {
  background: rgba(8, 121, 144, 0.1);
}

/* ✅ NEW: Enrollment lock indicator */
.enrollment-lock {
  margin-left: 0.5rem;
  color: #ffc107;
  font-size: 0.8rem;
}

.lesson-dot.locked {
  background: #ffc107;
  animation: pulse-yellow 2s infinite;
}

.lesson-dot.guest {
  background: #ffc107;;
  animation: pulse-blue 2s infinite;
}

.lesson-dot.lesson-dot.completed {
  background: #28a745;
  animation: pulse-yellow 2s infinite;
}

@keyframes pulse-yellow {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.4);
  }
  70% {
    box-shadow: 0 0 0 5px rgba(255, 193, 7, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 193, 7, 0);
  }
}

@keyframes pulse-blue {
  0% {
    box-shadow: 0 0 0 0 rgba(8, 121, 144, 0.4);
  }
  70% {
    box-shadow: 0 0 0 5px rgba(8, 121, 144, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(8, 121, 144, 0);
  }
}

/* ✅ FIXED: Video and link indicator styling */
.video-indicator {
  font-size: 0.8rem;
  margin-left: 0.25rem;
  padding: 0.2rem 0.4rem;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.video-indicator.active {
  color: #28a745;
  background: rgba(40, 167, 69, 0.1);
  animation: pulse-green 2s infinite;
}

.video-indicator.inactive {
  color: #6c757d;
  background: rgba(108, 117, 125, 0.1);
  opacity: 0.6;
}

/* ✅ NEW: Link indicator styling */
.link-indicator {
  font-size: 0.7rem;
  margin-left: 0.25rem;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  color: #007bff;
  background: rgba(0, 123, 255, 0.1);
  transition: all 0.3s ease;
  cursor: help;
}

.link-indicator:hover {
  background: rgba(0, 123, 255, 0.2);
  transform: scale(1.1);
}

@keyframes pulse-green {
  0% {
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4);
  }
  70% {
    box-shadow: 0 0 0 5px rgba(40, 167, 69, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
  }
}

/* Video styling with green indicators */
.course-video-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #28a745;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  animation: pulse-green 2s infinite;
}

.course-icon-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.video-count {
  font-size: 0.85em;
  margin-left: 0.25rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.video-count.has-videos {
  color: #28a745;
  background: rgba(40, 167, 69, 0.1);
  font-weight: 700;
}

.video-count:not(.has-videos) {
  color: #6c757d;
  background: rgba(108, 117, 125, 0.1);
}

.video-count-header.has-videos {
  color: #28a745;
  font-weight: 600;
}

.strip-lesson.has-video {
  border-left: 3px solid #28a745;
  background: rgba(40, 167, 69, 0.02);
}

/* Base styles */
.lessons-overview-page {
  min-height: 100vh;
  background-color: var(--gray-bg);
}

.header-section {
  background-color: var(--gray-bg);
  padding: 2rem 0 1rem;
  margin-top: 2rem;
}

.page-title {
  text-align: center;
  font-size: var(--fs-2xl);
  margin-bottom: 0.5rem;
  margin-top: 0.5rem;
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
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.course-left {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
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

.lessons-strip {
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
  justify-content: space-between;
}

.total-count-badge {
  font-size: var(--fs-xs);
  color: var(--secondary-color);
  font-weight: 500;
  background: rgba(8, 121, 144, 0.08);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  margin-left: auto;
}

.strip-lessons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 0.625rem;
  align-items: center;
}

.strip-lesson {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 0.875rem;
  background: rgba(8, 121, 144, 0.04);
  border-radius: 6px;
  transition: all 0.2s ease;
  position: relative;
  cursor: pointer;
}

.strip-lesson:hover {
  background: rgba(8, 121, 144, 0.08);
}

.more-lessons-indicator {
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

.no-lessons-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  background: rgba(108, 117, 125, 0.04);
  border-radius: 6px;
  font-size: var(--fs-xs);
  color: var(--secondary-color);
}

.no-lessons-message i {
  color: var(--secondary-color);
}

.lesson-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.lesson-dot.completed {
  background: #28a745;
}

.lesson-dot.upcoming {
  background: #ffc107;
}

.lesson-name {
  flex: 1;
  font-size: var(--fs-xs);
  color: var(--text-color);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-body);
}

.lesson-time {
  font-size: var(--fs-xs);
  color: var(--secondary-color);
  font-weight: 600;
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

/* Not enrolled badge styling */
.meta-item.not-enrolled {
  color: #ff6b6b;
}

.meta-item.not-enrolled i {
  color: #ff6b6b;
}

/* Force .course-meta-inline to remain row (override any column stacking) */
.course-meta-inline {
  flex-direction: row !important;
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

.course-video-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #28a745;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  animation: pulse-green 2s infinite;
}

/* Responsive styles */
@media (max-width: 768px) {
  .course-row {
    grid-template-columns: 1fr;
  }

  .page-title {
        margin-top: 1rem;
  }

  .course-video-badge {
  width: 20px;
  height: 20px;
  font-size: 0.6rem;
  top: -4px;
  right: -4px;
}

  .course-right {
    align-items: stretch;
  }

  .strip-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .total-count-badge {
    margin-left: 0;
    align-self: flex-start;
  }

  .strip-lessons {
    grid-template-columns: 1fr;
  }
}

/* ===== LessonOverview Responsive Fixes ===== */

/* Large phones (576px – 767px) */
@media (min-width: 576px) and (max-width: 767px) {
  .course-right {
    flex-direction: row !important;        /* side-by-side on larger phones */
    align-items: center !important;
    justify-content: space-between !important;
    width: 100%;
    min-width: 0;
  }

  .progress-section {
    flex: 1;
    max-width: 200px;
    margin-right: 0.75rem;
  }

  .course-action-btn {
    white-space: normal;                   /* allow text wrap */
    padding: 0.5rem 1rem;
    font-size: calc(var(--fs-sm) - 0.1rem);
    min-width: 120px;
    justify-content: center;
    text-align: center;
  }

  .course-meta-inline {
    gap: 0.5rem;
  }
}

/* Mobile devices (≤ 575px) */
@media (max-width: 575px) {
  .header-section {
    padding: 1rem 0 0.5rem;
    margin-top: 1rem;
  }

  .page-title {
    font-size: var(--fs-xl);
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
  }

  .course-row {
    padding: 1rem;
    gap: 0.75rem;
  }

  .course-left {
    flex-direction: column;
    gap: 0.75rem;
  }

  .course-icon-wrapper {
    width: min-content;
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
    flex-direction: row !important;        /* keep row, but allow wrapping */
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .meta-item {
    font-size: calc(var(--fs-xs) - 0.05rem);
    gap: 0.25rem;
  }

  .video-count {
    display: inline;                       /* keep inline on very small screens */
    margin-left: 0.25rem;
    font-size: 0.7rem;
  }

  .course-right {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    min-width: 0;
  }

  .progress-section {
    width: 100%;
    margin-bottom: 0.5rem;
  }

  .progress-header {
    font-size: calc(var(--fs-xs) - 0.1rem);
  }

  .course-action-btn {
    white-space: normal;                   /* wrap long text */
    padding: 0.5rem 0.75rem;
    font-size: calc(var(--fs-sm) - 0.15rem);
    justify-content: center;
    width: 100%;
    min-width: 0;
  }

  /* Lesson strip adjustments */
  .strip-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    font-size: calc(var(--fs-sm) - 0.1rem);
  }

  .total-count-badge {
    margin-left: 0;
    font-size: calc(var(--fs-xs) - 0.1rem);
    padding: 0.2rem 0.4rem;
  }

  .strip-lessons {
    grid-template-columns: 1fr;            /* single column */
    gap: 0.4rem;
  }

  .strip-lesson {
    padding: 0.4rem 0.6rem;
    gap: 0.4rem;
  }

  .lesson-dot {
    width: 6px;
    height: 6px;
  }

  .lesson-name {
    font-size: calc(var(--fs-xs) - 0.1rem);
    white-space: normal;
  }

  .lesson-time {
    font-size: calc(var(--fs-xs) - 0.15rem);
  }

  .video-indicator {
    font-size: 0.7rem;
    padding: 0.15rem 0.3rem;
  }

  .link-indicator {
    font-size: 0.6rem;
    padding: 0.1rem 0.25rem;
  }

  .enrollment-lock {
    font-size: 0.7rem;
    margin-left: 0.25rem;
  }

  .more-lessons-indicator,
  .no-lessons-message {
    padding: 0.4rem 0.6rem;
    font-size: calc(var(--fs-xs) - 0.1rem);
  }

  /* Loading/error states */
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
  .video-count {
    display: block;
    margin-left: 0;
    margin-top: 0.25rem;
  }

  .category-btn {
    font-size: 0.75rem;
    padding: 0.3rem 0.8rem;
  }

  .link-indicator {
    font-size: 0.65rem;
    padding: 0.1rem 0.3rem;
  }

  .enrollment-lock {
    font-size: 0.7rem;
    margin-left: 0.25rem;
  }
}
</style>