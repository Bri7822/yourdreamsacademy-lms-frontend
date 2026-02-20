<!-- src/components/student/CourseDetail.vue -->
<template>
  <div class="course-detail-container">
    <h3 class="section-title">{{ course.title || 'Course Details' }}</h3>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading course details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button @click="fetchCourseDetails" class="retry-button">Try Again</button>
    </div>

    <!-- Course Content -->
    <div v-else-if="course.id" class="course-content">

      <!-- Course Overview (Not Enrolled or First Time) -->
      <div v-if="!isEnrolled || showOverview" class="course-overview">
        <div class="course-hero card-animate" :style="{'animation-delay': '0ms'}">
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
                <span class="course-price" v-if="course.price > 0">
                  <i class="fas fa-dollar-sign"></i>
                  ${{ course.price }}
                </span>
                <span class="course-price free" v-else>
                  <i class="fas fa-gift"></i>
                  Free
                </span>
                <!-- Enrollment badge moved here for mobile alignment -->
                <span class="enrollment-status-badge-inline d-md-none" v-if="isEnrolled">
                  <i class="fas fa-check-circle"></i>
                  <span>Enrolled</span>
                </span>
              </div>
            </div>

            <!-- Desktop enrollment badge -->
            <div class="enrollment-status-badge d-none d-md-flex" v-if="isEnrolled">
              <i class="fas fa-check-circle"></i>
              <span>Enrolled</span>
            </div>
          </div>

          <div class="course-description">
            <h4>Course Description</h4>
            <p>{{ course.description || 'No description available for this course.' }}</p>
          </div>
        </div>

        <div class="course-details-grid">
          <div class="course-info-section card-animate" :style="{'animation-delay': '100ms'}">
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
                <span>{{ course.total_lessons || 0 }} lessons</span>
              </div>
              <div class="info-item">
                <label>Course Level:</label>
                <span>{{ course.level || 'Beginner' }}</span>
              </div>
              <div class="info-item">
                <label>Exercises:</label>
                <span>{{ course.total_exercises || 0 }} exercises</span>
              </div>
            </div>
          </div>

          <div class="course-progress-section card-animate" v-if="isEnrolled" :style="{'animation-delay': '200ms'}">
            <h4>
              <i class="fas fa-chart-line"></i>
              <span class="desktop-text">Your Progress</span>
              <span class="mobile-text">Your Progress</span>
            </h4>
            <div class="progress-stats">
              <div class="progress-circle">
                <div class="circle" :style="{ '--progress': computedProgress }">
                  <span class="percentage">{{ computedProgress }}%</span>
                </div>
              </div>
              <div class="progress-details">
                <p>{{ computedCompletedLessons }} of {{ course.total_lessons || 0 }} lessons completed</p>
                <div class="progress-bar-container">
                  <div class="progress-bar" :style="{ width: computedProgress + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Course Syllabus -->
        <div class="syllabus-section card-animate" v-if="course.lessons && course.lessons.length > 0" :style="{'animation-delay': '300ms'}">
          <h4>
            <i class="fas fa-list"></i>
            Course Syllabus
          </h4>
          <div class="lessons-preview">
            <div
              v-for="(lesson, index) in course.lessons"
              :key="lesson.id"
              class="lesson-item card-animate clickable-lesson"
              :class="{
                'completed': isLessonCompleted(lesson.id),
                'debug-completed': isLessonCompleted(lesson.id)
              }"
              :style="{'animation-delay': `${400 + (index * 100)}ms`}"
              @click="handleSyllabusClick(lesson)"
            >
              <div
                class="lesson-number"
                :class="{ 'completed': isLessonCompleted(lesson.id) }"
                :data-lesson-id="lesson.id"
              >
                <i v-if="isLessonCompleted(lesson.id)" class="fas fa-check"></i>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <div class="lesson-content">
                <h5>{{ lesson.title }}</h5>
                <p v-if="lesson.description" class="d-none d-md-block">{{ truncateDescription(lesson.description, 100) }}</p>
                <div class="lesson-meta">
                  <span v-if="lesson.duration">
                    <i class="fas fa-clock"></i>
                    {{ lesson.duration }} min
                  </span>
                  <span v-if="isLessonCompleted(lesson.id)" class="completed-badge-green">
                    Completed
                  </span>
                  <span v-if="lesson.exercise_count > 0" class="exercise-badge">
                    <i class="fas fa-dumbbell"></i>
                    {{ lesson.exercise_count }} exercise{{ lesson.exercise_count !== 1 ? 's' : '' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Call to Action -->
        <div class="cta-section card-animate" :style="{'animation-delay': `${400 + (course.lessons?.length * 100 || 0)}ms`}">
          <button
            v-if="!isEnrolled"
            @click="enrollInCourse"
            class="enroll-button"
            :disabled="enrolling"
          >
            <i class="fas fa-plus-circle"></i>
            {{ enrolling ? 'Enrolling...' : 'Enroll in Course' }}
          </button>

          <div v-else class="enrolled-actions">
            <button
              @click="startLearning"
              class="start-learning-button"
            >
              <i class="fas fa-play-circle"></i>
              {{ computedProgress > 0 ? 'Continue Learning' : 'Start Learning' }}
            </button>
            <!-- Hide "View Course Content" on small devices -->
            <button
              v-if="computedProgress > 0"
              @click="showOverview = false"
              class="view-content-button d-none d-md-inline-flex"
            >
              <i class="fas fa-list"></i>
              View Course Content
            </button>
            <!-- Show "Course Content" on small devices -->
            <button
              v-if="computedProgress > 0"
              @click="showOverview = false"
              class="view-content-button d-md-none"
            >
              <i class="fas fa-list"></i>
              Course Content
            </button>
          </div>
        </div>
      </div>

      <!-- Course Content (Enrolled Students) -->
      <div v-else class="course-modules">
        <div class="content-header card-animate" :style="{'animation-delay': '0ms'}">
          <div class="course-progress-summary">
            <h4>Progress</h4>
            <div class="progress-summary">
              <div class="progress-bar-container">
                <div class="progress-bar" :style="{ width: computedProgress + '%' }"></div>
              </div>
              <span class="progress-text">{{ computedProgress }}% ({{ computedCompletedLessons }}/{{ course.total_lessons }})</span>
            </div>
          </div>
          <div class="exercise-summary" v-if="course.total_exercises > 0">
            <i class="fas fa-dumbbell"></i>
            <span>{{ course.total_exercises }} exercises</span>
          </div>
          <div class="header-actions">
            <button @click="startLearning" class="start-learning-button-compact">
              <i class="fas fa-play-circle"></i>
              Start Learning
            </button>
            <button @click="showOverview = true" class="overview-button">
              <i class="fas fa-info-circle"></i>
              Overview Content
            </button>
          </div>
        </div>

        <div class="modules-list" v-if="course.lessons && course.lessons.length > 0">
          <div
            v-for="(lesson, index) in course.lessons"
            :key="lesson.id"
            class="module-card card-animate"
            :class="{
              'completed': isLessonCompleted(lesson.id),
              'current': currentLessonId === lesson.id
            }"
            :style="{'animation-delay': `${100 + (index * 100)}ms`}"
          >
            <div class="module-header" @click="toggleModule(lesson.id)">
              <div class="module-info">
                <div class="module-number" :data-lesson-id="lesson.id">{{ index + 1 }}</div>
                <div class="module-title">
                  <h5>{{ lesson.title }}</h5>
                  <p v-if="lesson.description" class="d-none d-md-block">{{ truncateDescription(lesson.description, 80) }}</p>
                </div>
              </div>
              <div class="module-status">
                <span v-if="lesson.exercise_count > 0" class="exercise-indicator" title="Contains exercises">
                  <i class="fas fa-dumbbell"></i>
                  <span class="exercise-count">{{ lesson.exercise_count }}</span>
                </span>
                <span v-if="isLessonCompleted(lesson.id)" class="completed-icon">
                  <i class="fas fa-check-circle"></i>
                </span>
                <span v-else class="incomplete-icon">
                  <i class="fas fa-circle"></i>
                </span>
              </div>
            </div>

            <div v-if="expandedModules.includes(lesson.id)" class="module-content">
              <div class="module-details">
                <p v-if="lesson.description">{{ lesson.description }}</p>
                <div v-if="lesson.exercise_count > 0" class="exercise-details">
                  <i class="fas fa-dumbbell"></i>
                  <span>This lesson contains {{ lesson.exercise_count }} exercise{{ lesson.exercise_count !== 1 ? 's' : '' }}</span>
                </div>
                <div class="lesson-actions">
                  <button
                    @click="startSpecificLesson(lesson)"
                    class="start-lesson-button"
                  >
                    <i class="fas fa-play"></i>
                    {{ isLessonCompleted(lesson.id) ? 'Review Lesson' : 'Start Lesson' }}
                  </button>
                  <span v-if="lesson.duration" class="lesson-duration">
                    <i class="fas fa-clock"></i>
                    {{ lesson.duration }} min
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-content card-animate" :style="{'animation-delay': '100ms'}">
          <i class="fas fa-book-open"></i>
          <p>This course doesn't have any lessons yet.</p>
          <p class="text-muted small mt-2">Please check back later or contact your instructor.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useLessonStore } from '@/stores/lesson'
import { useProgressStore } from '@/stores/progress'
import axios from 'axios'
import { useToast } from 'vue-toastification'
import { generateSlug } from '@/utils/slugUtils'

const props = defineProps({
  courseSlug: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['course-loaded', 'set-active-course'])

const toast = useToast()
const router = useRouter()
const authStore = useAuthStore()
const lessonStore = useLessonStore()
const progressStore = useProgressStore()

const course = ref({})
const loading = ref(false)
const error = ref(null)
const enrolling = ref(false)
const showOverview = ref(true)
const expandedModules = ref([])
const currentLessonId = ref(null)

// Real-time completion tracking
const courseCompletionMaps = ref(new Map())
const completionUpdateTrigger = ref(0)

let unsubscribeGlobal = null
let unsubscribeEventBridge = null

const getCompletionMap = () => {
  const courseCode = course.value.code
  if (!courseCode) return new Map()

  if (!courseCompletionMaps.value.has(courseCode)) {
    courseCompletionMaps.value.set(courseCode, new Map())
    console.log(`🗺️ Created completion map for course: ${courseCode}`)
  }
  return courseCompletionMaps.value.get(courseCode)
}

const handleGlobalProgressEvent = (event) => {
  try {
    console.log('🌍 CourseDetail: Global progress event received', event)

    if (event.type === 'lesson-completed' && event.data.courseCode === course.value.code) {
      console.log(`🎯 GLOBAL: Lesson ${event.data.lessonId} completed for current course`)

      const completionMap = getCompletionMap()
      completionMap.set(event.data.lessonId, true)
      completionUpdateTrigger.value++

      if (course.value.lessons) {
        const lesson = course.value.lessons.find(l => l.id === event.data.lessonId)
        if (lesson) {
          lesson.completed = true
        }
      }

      console.log(`✅ CourseDetail: Updated lesson ${event.data.lessonId} completion status from global event`)
    } else if (event.type === 'progress-updated' && event.data.courseCode === course.value.code) {
      console.log(`📈 GLOBAL: Progress updated for current course -> ${event.data.progress}%`)
      forceRefreshCompletionStatus()
    }
  } catch (error) {
    console.error('❌ Error in global progress event handler:', error)
  }
}

const computedCompletedLessons = computed(() => {
  if (!course.value.lessons) return 0

  const completionMap = getCompletionMap()
  const completedCount = course.value.lessons.filter(lesson =>
    isLessonCompleted(lesson.id)
  ).length

  console.log(`📊 CourseDetail [${course.value.code}]: ${completedCount}/${course.value.lessons?.length || 0} lessons completed`)
  return completedCount
})

const computedProgress = computed(() => {
  const progressData = progressStore.getCourseProgress(course.value?.code)
  if (progressData.progress > 0) {
    console.log(`📊 Using progress store: ${progressData.progress}%`)
    return progressData.progress
  }

  if (course.value.progress > 0) {
    console.log(`📊 Using course API progress: ${course.value.progress}%`)
    return course.value.progress
  }

  if (!course.value.total_lessons || course.value.total_lessons === 0) return 0
  const progress = Math.round((computedCompletedLessons.value / course.value.total_lessons) * 100)
  console.log(`📊 Calculated progress: ${progress}% from ${computedCompletedLessons.value}/${course.value.total_lessons}`)
  return progress
})

const isEnrolled = computed(() => {
  return course.value.enrollment_status === 'approved' || course.value.enrollment_status === 'completed'
})

const isLessonCompleted = (lessonId) => {
  const completionMap = getCompletionMap()

  const _ = completionUpdateTrigger.value
  const __ = course.value.lessons?.length
  const ___ = lessonStore.lessons.length
  const ____ = lessonStore.lastUpdated

  const sources = [
    completionMap.get(lessonId),
    lessonStore.lessons.find(l => l.id === lessonId)?.completed,
    course.value.lessons?.find(l => l.id === lessonId)?.completed,
    progressStore.getCourseProgress(course.value.code)?.completedLessons > 0
  ]

  const isCompleted = sources.some(status => status === true)

  if (isCompleted) {
    console.log(`✅ Course ${course.value.code} - Lesson ${lessonId} marked as completed`)
  }

  return isCompleted
}

const syncCompletionStatus = async () => {
  if (!course.value.lessons) return

  const completionMap = getCompletionMap()
  let hasChanges = false

  if (lessonStore.currentCourseCode !== course.value.code) {
    console.log(`🔄 Course mismatch: Store=${lessonStore.currentCourseCode}, Current=${course.value.code}`)

    if (lessonStore.lessons.length === 0 || lessonStore.currentCourseCode !== course.value.code) {
      console.log(`🔄 Loading lessons for correct course: ${course.value.code}`)
      await lessonStore.loadLessons(course.value.code)
    }
  }

  if (lessonStore.currentCourseCode === course.value.code && lessonStore.lessons.length > 0) {
    console.log(`🔄 Syncing ${lessonStore.lessons.length} lessons from store for course ${course.value.code}`)

    lessonStore.lessons.forEach(storeLesson => {
      if (storeLesson.completed === true) {
        const wasCompleted = completionMap.get(storeLesson.id)
        if (!wasCompleted) {
          completionMap.set(storeLesson.id, true)
          hasChanges = true
          console.log(`✅ Marked lesson ${storeLesson.id} as completed from store`)
        }
      }
    })
  }

  course.value.lessons.forEach(courseLesson => {
    if (courseLesson.completed === true) {
      const wasCompleted = completionMap.get(courseLesson.id)
      if (!wasCompleted) {
        completionMap.set(courseLesson.id, true)
        hasChanges = true
        console.log(`✅ Marked lesson ${courseLesson.id} as completed from course API data`)
      }
    }
  })

  if (hasChanges) {
    completionUpdateTrigger.value++
    await nextTick()
  }
}

const forceRefreshCompletionStatus = () => {
  console.log('🔄 FORCE refreshing completion status for course:', course.value.code)
  const completionMap = getCompletionMap()
  completionMap.clear()
  syncCompletionStatus()
  completionUpdateTrigger.value++
}

const truncateDescription = (description, maxLength = 100) => {
  if (!description) return 'No description available'
  return description.length > maxLength
    ? description.substring(0, maxLength) + '...'
    : description
}

const handleSyllabusClick = (lesson) => {
  const isMobile = window.innerWidth < 768
  if (isMobile) {
    startSpecificLesson(lesson)
  }
}

const toggleModule = (lessonId) => {
  const index = expandedModules.value.indexOf(lessonId)
  if (index > -1) {
    expandedModules.value.splice(index, 1)
  } else {
    expandedModules.value.push(lessonId)
  }
}

const fetchCourseDetails = async () => {
  if (!props.courseSlug) {
    console.warn('⚠️ No course slug provided')
    return
  }

  loading.value = true
  error.value = null

  try {
    console.log('📚 Fetching course details for:', props.courseSlug)

    const response = await axios.get(`/api/student/courses/${props.courseSlug}/`, {
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`
      }
    })

    course.value = response.data
    console.log('✅ Course loaded:', course.value.title)

    getCompletionMap()

    // Emit the course to parent layout
    emit('course-loaded', course.value)
    emit('set-active-course', course.value)

    // Load lessons into store
    await lessonStore.loadLessons(props.courseSlug)

    setTimeout(() => {
      forceRefreshCompletionStatus()
    }, 200)

    if (isEnrolled.value && computedProgress.value > 0) {
      showOverview.value = false
    }

  } catch (err) {
    console.error('Error fetching course details:', err)
    if (err.response?.status === 404) {
      error.value = 'Course not found.'
    } else if (err.response?.status === 403) {
      error.value = 'You do not have permission to view this course.'
    } else {
      error.value = 'Failed to load course details. Please try again.'
    }
  } finally {
    loading.value = false
  }
}

const enrollInCourse = async () => {
  enrolling.value = true

  try {
    await axios.post(`/api/student/courses/${course.value.code}/enroll/`, {}, {
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`
      }
    })

    await fetchCourseDetails()

  } catch (err) {
    console.error('Enrollment error:', err)
    error.value = err.response?.data?.detail || 'Failed to enroll in course.'
  } finally {
    enrolling.value = false
  }
}

const startLearning = () => {
  console.log('🚀 Starting learning for course:', course.value.code)

  sessionStorage.setItem('activeCourseSlug', course.value.code)

  router.push({
    name: 'student-lesson-detail',
    params: {
      courseSlug: props.courseSlug,
      lessonSlug: 'first'
    }
  })
}

const startSpecificLesson = (lesson) => {
  console.log('📖 Starting specific lesson:', lesson.title)

  sessionStorage.setItem('activeCourseSlug', course.value.code)

  const lessonSlug = generateSlug(lesson.title)

  router.push({
    name: 'student-lesson-detail',
    params: {
      courseSlug: props.courseSlug,
      lessonSlug: lessonSlug
    }
  })
}

// Watch for course slug changes
watch(() => props.courseSlug, (newSlug) => {
  if (newSlug) {
    console.log('🔄 Course slug changed to:', newSlug)
    fetchCourseDetails()
  }
}, { immediate: true })

watch(() => lessonStore.lessons, () => {
  console.log('🔄 CourseDetail: Lesson store updated, syncing completion status')
  setTimeout(() => {
    syncCompletionStatus()
  }, 100)
}, { deep: true })

watch(() => course.value.lessons, (newLessons) => {
  if (newLessons && newLessons.length > 0) {
    console.log('🔄 CourseDetail: Course lessons loaded, syncing completion status')
    setTimeout(() => {
      syncCompletionStatus()
    }, 150)
  }
}, { deep: true })

onMounted(() => {
  console.log('🚀 CourseDetail mounted with course slug:', props.courseSlug)

  if (window.globalProgressEvents) {
    unsubscribeGlobal = window.globalProgressEvents.subscribePersistent(
      'CourseDetail',
      ['lesson-completed', 'progress-updated'],
      handleGlobalProgressEvent
    )
  }

  if (window.eventBridge) {
    unsubscribeEventBridge = window.eventBridge.subscribe(
      'progress-updated',
      (eventData) => {
        if (eventData.courseCode === course.value.code) {
          console.log('🔔 CourseDetail: EventBridge progress update')
          forceRefreshCompletionStatus()
        }
      },
      'CourseDetail'
    )
  }

  fetchCourseDetails()
})

onUnmounted(() => {
  if (unsubscribeGlobal) {
    unsubscribeGlobal()
  }
  if (unsubscribeEventBridge) {
    unsubscribeEventBridge()
  }
  if (window.eventBridge) {
    window.eventBridge.cleanupComponent('CourseDetail')
  }
})
</script>

<style scoped>
/* ============================================
   CONTENT HEADER - ONE LINE LAYOUT (LARGE DEVICES)
   ============================================ */
.course-detail-container {
  width: 100%;
  min-height: 100vh;
}

/* NEW: Completed Badge with Green Background */
.completed-badge-green {
  background-color: #4CAF50 !important;
  color: white !important;
  padding: 4px 10px !important;
  border-radius: 12px !important;
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  display: inline-flex !important;
  align-items: center !important;
  gap: 4px !important;
  /* border: 1px solid #c3e6cb !important; */
}

.completed-badge-green i {
  font-size: 0.75rem !important;
  background: #4CAF50;
}

/* Content Header - Flexbox layout for one-line display on large devices */
.content-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Course Progress Summary - Flex item with auto width */
.course-progress-summary {
  flex: 0 1 auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.row {
  margin: 0 !important;
}

/* Progress Title - Compact */
.course-progress-summary h4 {
  margin: 0;
  font-size: var(--fs-base, 0.875rem);
  color: var(--primary-color);
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Progress Summary Container - Horizontal layout */
.progress-summary {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

/* Progress Bar Container - Compact width for one-line layout */
.progress-bar-container {
  background: #e0e0e0;
  height: 10px;
  border-radius: 5px;
  overflow: hidden;
  width: 200px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  flex-shrink: 0;
}

/* Progress Bar - Enhanced visual */
.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), #0a9eb5);
  border-radius: 5px;
  transition: width 0.5s ease;
  position: relative;
  box-shadow: 0 1px 3px rgba(8, 121, 144, 0.3);
}

/* Add shimmer effect */
.progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/* Progress Text - Compact */
.progress-text {
  font-size: var(--fs-sm, 0.8rem);
  color: var(--secondary-color, #64748b);
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

/* Exercise Summary - Compact inline display */
.exercise-summary {
  background-color: #f3f4f6;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #4b5563;
  font-size: 0.8rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.exercise-summary i {
  color: #10b981;
  font-size: 0.9rem;
}

/* Header Actions - Compact buttons in one line */
.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-shrink: 0;
}

/* Compact buttons */
.start-learning-button-compact,
.overview-button {
  background: var(--primary-color);
  color: white;
    border: none !important;
    padding: 0.5rem;
    border-radius: 6px;
    font-size: var(--fs-sm) !important;
    font-weight: 500 !important;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    transition: background-color 0.2s ease
}

.overview-button {
  background: #6c757d;
}

.start-learning-button-compact:hover {
  background: var(--primary-sec-color);
  transform: translateY(-1px);
  border: none;
}

.overview-button:hover {
  background: #5a6268;
  border: none;
}

/* ============================================
   RESPONSIVE BREAKPOINTS
   ============================================ */

/* Extra Large devices (desktops, 1400px and up) - Maximum visibility */
@media (min-width: 1400px) {
  .content-header {
    padding: 1.2rem 2rem;
    gap: 2rem;
  }

  .course-main-content {
    padding: 1.5rem 2.5rem;
  }

  .progress-bar-container {
    width: 420px;
  }

  .course-progress-summary h4 {
    font-size: var(--fs-md, 1rem);
  }

  .progress-text {
    font-size: var(--fs-base, 0.875rem);
  }

  .start-learning-button-compact,
  .overview-button {
    padding: 0.6rem 1.25rem;
    font-size: var(--fs-base, 0.875rem);
  }
}

/* Large devices (desktops, 1200px to 1399px) */
@media (min-width: 1200px) and (max-width: 1399px) {
  .progress-bar-container {
    width: 220px;
  }

  .course-main-content {
    padding: 1.5rem 2rem;
  }
}

/* Medium devices (tablets, 992px to 1199px) */
@media (min-width: 992px) and (max-width: 1199px) {
  .content-header {
    gap: 1.25rem;
    padding: 1rem 1.25rem;
  }

  .progress-bar-container {
    width: 180px;
  }

  .course-progress-summary {
    gap: 0.75rem;
  }

  .course-main-content {
    padding: 1rem 1.5rem;
  }
}

@media (min-width: 768px) and (max-width: 991px) {
  .content-header {
    gap: 1rem;
  }

  /* Title and progress on one line */
  .course-progress-summary h4 {
    font-size: 0.85rem; /* Slightly smaller title */
    margin-right: 0.5rem;
  }

  .course-progress-summary {
    flex: 1 1 auto; /* Allow to grow */
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
    min-width: 0; /* Allow shrinking */
  }

  .progress-summary {
    flex: 1 1 auto;
    flex-direction: row;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
  }

  .progress-bar-container {
    flex: 1 1 auto; /* Let it grow to fill available space */
    max-width: 220px; /* But limit maximum */
    min-width: 140px; /* And minimum */
  }

  /* Compact progress text */
  .progress-text {
    flex: 0 0 auto; /* Don't grow or shrink */
    font-size: 0.7rem;
    white-space: nowrap;
  }

  .exercise-summary {
    flex: 0 0 auto;
    font-size: 0.75rem;
    padding: 0.4rem 0.8rem;
  }

  .header-actions {
    flex: 0 0 auto;
    margin-left: auto;
    gap: 0.5rem;
  }

  .course-main-content {
    padding: 1rem;
  }

  .start-learning-button-compact,
  .overview-button {
    flex-shrink: 0;
    white-space: nowrap;
    padding: 0.45rem 0.75rem;
    font-size: 0.8rem;
  }
}



/* Small devices (phones, less than 768px) - Vertical stack */
@media (max-width: 767px) {
  .content-header {
    flex-direction: column;
    padding: 1rem;
    gap: 1rem;
    align-items: stretch;
  }

  .course-main-content {
    padding: 0.5rem;
  }

  .course-progress-summary {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .course-progress-summary h4 {
    font-size: var(--fs-md, 1rem);
    text-align: center;
  }

  .progress-summary {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .progress-bar-container {
    width: 100%;
    height: 10px;
  }

  .progress-text {
    text-align: center;
    font-size: var(--fs-sm, 0.75rem);
  }

  .exercise-summary {
    justify-content: center;
    width: 100%;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .start-learning-button-compact,
  .overview-button {
    width: 100%;
    justify-content: center;
  }
}

/* Extra small devices (phones, less than 576px) */
@media (max-width: 576px) {
  .progress-bar-container {
    height: 8px;
  }

  .progress-text {
    font-size: var(--fs-xs, 0.7rem);
  }

  .exercise-summary {
    padding: 0.4rem 0.8rem;
    font-size: 0.7rem;
  }

  .start-learning-button-compact,
  .overview-button {
    padding: 0.6rem 1rem;
    font-size: var(--fs-sm, 0.75rem);
  }

  .course-main-content {
    padding: 0.25rem;
  }
}

/* ============================================
   EXISTING STYLES (Keep as is)
   ============================================ */

/* Responsive padding fixes */
@media (max-width: 768px) {
  .course-main-content {
    padding: 0.2rem;
    padding-left: 0;
  }

  .sm-padding {
    padding-left: 0rem !important;
  }
}

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
    background: rgba(76, 175, 80, 0.2);
    padding: 0.3rem 0.6rem;
    border-radius: 20px;
    font-size: var(--fs-sm);
    font-weight: 500;
  }

  .course-meta {
    align-items: center;
  }
}

/* Exercise badge styles */
.exercise-badge {
  background-color: #e8f5e9;
  color: #2e7d32;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.exercise-indicator {
  background-color: #d1fae5;
  color: #065f46;
  padding: 4px 8px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  margin-right: 8px;
}

.exercise-indicator .exercise-count {
  font-weight: bold;
}

.exercise-details {
  background-color: #f0fdf4;
  padding: 8px 12px;
  border-radius: 6px;
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #166534;
  font-size: 0.875rem;
}

/* Completion status styles */
.lesson-item.completed .lesson-number {
  background-color: #28a745 !important;
  color: white !important;
}

.module-card.completed .module-number {
  background-color: #28a745 !important;
  color: white !important;
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
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  transition: all 0.3s ease;
}

.module-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--fs-base);
  flex-shrink: 0;
  transition: all 0.3s ease;
}

@media (max-width: 768px) {
  .enrollment-status-badge-inline {
    display: none !important;
  }

  .lesson-content p {
    display: none;
  }

  .module-title p {
    display: none;
  }
}

/* Rest of existing styles */
:root {
  --primary-color: #3b82f6;
  --primary-dark: #2563eb;
  --success-color: #10b981;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.container-fluid {
  padding: 0;
  width: 100%;
  margin: 0;
}

.section-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 1.5rem;
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
  border-top: 4px solid var(--primary-color, #087990);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}


@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

.enrollment-status-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(76, 175, 80, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: var(--fs-sm);
  font-weight: 500;
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
  gap: 1rem;
  padding: 1rem;
  background: var(--gray-bg);
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.lesson-item.completed {
  border-left: 4px solid #4caf50;
}

.lesson-item.completed .lesson-number {
  background: #4caf50 !important;
  color: white !important;
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

.completed-badge {
  color: white !important;
  font-weight: 500;
}

.cta-section {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.enroll-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 6px;
  font-size: var(--fs-base);
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

.enroll-button:hover:not(:disabled) {
  background: #065e6f;
}

.enroll-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.modules-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.module-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}

.module-card.completed {
  border-left: 4px solid #4caf50;
}

.module-card.current {
  border-left: 4px solid var(--primary-color);
  box-shadow: 0 4px 8px rgba(8, 121, 144, 0.15);
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.module-header:hover {
  background: var(--gray-bg);
}

.module-info {
  display: flex;
  gap: 1rem;
  flex: 1;
}

.module-card.completed .module-number {
  background: #4caf50;
}

.module-title h5 {
  margin: 0.3rem 0 0.3rem 0;
  font-size: var(--fs-base);
  color: var(--text-color);
}

.module-title p {
  margin: 0;
  font-size: var(--fs-sm);
  color: var(--secondary-color);
  line-height: 1.4;
}

.module-status {
  flex-shrink: 0;
  margin-left: 1rem;
}

.completed-icon {
  color: #4caf50;
  font-size: 1.2rem;
}

.incomplete-icon {
  color: #bdbdbd;
  font-size: 1.2rem;
}

.module-content {
  padding: 0 1.2rem 1.2rem 1.2rem;
  border-top: 1px solid var(--border-color);
}

.module-details p {
  margin: 0 0 1rem 0;
  font-size: var(--fs-sm);
  color: var(--secondary-color);
  line-height: 1.5;
}

.lesson-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.start-lesson-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  font-size: var(--fs-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

.start-lesson-button:hover {
  background: #065e6f;
}

.lesson-duration {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: var(--fs-sm);
  color: var(--secondary-color);
}

.no-content {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.no-content i {
  font-size: 3rem;
  color: #bdbdbd;
  margin-bottom: 1rem;
}

.no-content p {
  margin: 0;
  color: var(--secondary-color);
  font-size: var(--fs-base);
}

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

@media (min-width: 768px) and (max-width: 991px){
  .ps-md-0 {
    padding-left: 0px !important;
  }

  .course-main-content {
    padding-left: 0 !important;
  }
}

@media (max-width: 992px) {
  .dashboard-main {
    padding-left: 0px !important;
  }

  .course-main-content {
  padding-left: 0.2rem !important;
}

  .course-details-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .progress-stats {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .enrolled-actions {
    flex-direction: column;
    gap: 0.8rem;
  }

  .module-header {
    padding: 1rem;
  }

  .module-info {
    gap: 0.8rem;
  }
}

@media (max-width:1024px){
  .start-learning-button,
  .view-content-button,
  .enroll-button {
    width: 100%;
    justify-content: center;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
}

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

  .module-info {
    flex-direction: flex;
    gap: 0.5rem;
  }

  .module-number {
    width: 32px;
    height: 32px;
    font-size: 0.875rem;
  }

  .cta-section {
    padding: 1rem;
  }

}

@media (prefers-color-scheme: dark) {
  .course-info-section,
  .course-progress-section,
  .syllabus-section,
  .cta-section,
  .module-card,
  .no-content {
    background: #2d3748;
    color: white;
  }

  .course-info-section h4,
  .course-progress-section h4,
  .syllabus-section h4 {
    color: #63b3ed;
  }

  .info-item label {
    color: #a0aec0;
  }

  .lesson-item,
  .module-header:hover {
    background: #4a5568;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card-animate {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .loading-spinner {
    animation-duration: 2s;
  }
}

button:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

@media print {
  .enrolled-actions,
  .cta-section,
  .overview-button,
  .start-learning-button,
  .view-content-button,
  .enroll-button {
    display: none !important;
  }

  .course-details-layout {
    grid-template-columns: 1fr;
  }

  .course-hero {
    background: none !important;
    color: black !important;
    border: 2px solid #ccc;
  }
}

a.nav-link:active {
  border: none;
}

.course-main-content {
  min-width: 0;
  width: 100%;
}
</style>