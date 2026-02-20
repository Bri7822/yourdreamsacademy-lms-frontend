<template>
  <div class="courses-sidebar guest-sidebar" :class="{ 'collapsed': sidebarCollapsed }">
    <div class="sidebar-header">
      <h4 class="sidebar-title">Available Courses</h4>
      <button
        @click="$emit('refresh-courses')"
        class="refresh-button"
        :disabled="loadingOtherCourses"
        title="Refresh courses"
      >
        <i class="fas" :class="loadingOtherCourses ? 'fa-spinner fa-spin' : 'fa-sync-alt'"></i>
      </button>
    </div>

    <div v-if="loadingOtherCourses" class="sidebar-loading">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Loading courses...</p>
    </div>

    <div v-else-if="otherCoursesError" class="sidebar-error">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ otherCoursesError }}</p>
      <button @click="$emit('refresh-courses')" class="retry-button small">Try Again</button>
    </div>

    <div v-else-if="allCourses.length === 0" class="sidebar-empty">
      <i class="fas fa-book"></i>
      <p>No courses available</p>
    </div>

    <div v-else class="courses-nav">
      <ul>
        <li
          v-for="course in allCourses"
          :key="`sidebar-course-${course.id}`"
          :class="{ 'active': isCourseActive(course) }"
        >
          <a
            href="#"
            class="nav-link"
            @click.prevent="navigateToCourse(course)"
            :data-course-slug="course.code"
          >
            <div class="course-thumbnail">
              <i class="fas fa-book"></i>
            </div>
            <div class="course-info" v-if="!sidebarCollapsed">
              <span class="course-title">{{ course.title }}</span>
              <span class="course-preview-badge">
                Preview
              </span>
            </div>
          </a>
        </li>
      </ul>
    </div>

    <div class="sidebar-footer" v-if="!sidebarCollapsed">
      <div class="guest-session-info">
        <i class="fas fa-clock"></i>
        <span class="timer-text">{{ formattedRemainingTime }}</span>
      </div>
      <a href="/courses" class="back-btn" @click.prevent="goToCourses">
        <i class="fas fa-arrow-left"></i>
        <span class="back-text">Back to Courses</span>
      </a>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGuestStore } from '@/stores/guest'

const props = defineProps({
  otherCourses: {
    type: Array,
    required: true,
    default: () => []
  },
  currentCourse: {
    type: Object,
    default: () => ({})
  },
  loadingOtherCourses: {
    type: Boolean,
    default: false
  },
  otherCoursesError: {
    type: String,
    default: null
  },
  currentCourseId: {
    type: [String, Number],
    default: null
  },
  sidebarCollapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh-courses', 'course-selected', 'back-to-dashboard', 'update-course', 'course-navigate'])

const route = useRoute()
const router = useRouter()
const guestStore = useGuestStore()

const localCourses = ref([...props.otherCourses])

const allCourses = computed(() => {
  const courses = [...localCourses.value]

  if (props.currentCourse && props.currentCourse.id) {
    const currentCourseExists = courses.find(c => c.id === props.currentCourse.id)
    if (!currentCourseExists) {
      courses.push(props.currentCourse)
    } else {
      const index = courses.findIndex(c => c.id === props.currentCourse.id)
      courses[index] = { ...courses[index], ...props.currentCourse }
    }
  }

  return courses.sort((a, b) => a.title.localeCompare(b.title))
})

const formattedRemainingTime = computed(() => {
  return guestStore.formattedRemainingTime
})

const isCourseActive = (course) => {
  const currentCourseSlug = route.params.courseSlug
  return currentCourseSlug === course.code || course.id === props.currentCourseId
}

const navigateToCourse = async (course) => {
  console.log('🎯 Sidebar: Navigating to course', course.title)

  // Add visual feedback
  const event = window.event
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('clicking')
    setTimeout(() => {
      if (event.currentTarget) {
        event.currentTarget.classList.remove('clicking')
      }
    }, 200)
  }

  // Check if we're already on this course
  if (route.params.courseSlug === course.code) {
    console.log('✅ Already on this course')
    return
  }

  try {
    // Use emit to trigger parent navigation WITHOUT router navigation
    emit('course-navigate', course)

  } catch (error) {
    console.error('❌ Navigation error:', error)
  }
}

const goToCourses = () => {
  console.log('🔙 Sidebar: Going back to courses')
  router.push('/courses')
}

watch(() => props.otherCourses, (newCourses) => {
  localCourses.value = [...newCourses]
  console.log('📚 Guest Sidebar: Courses updated', newCourses.length)
}, { deep: true })

watch(() => props.currentCourse, (newCurrentCourse) => {
  if (newCurrentCourse && newCurrentCourse.id) {
    const index = localCourses.value.findIndex(c => c.id === newCurrentCourse.id)
    if (index !== -1) {
      localCourses.value[index] = { ...localCourses.value[index], ...newCurrentCourse }
    }
  }
}, { deep: true })

// Handle course updates via EventBridge for real-time updates
const handleCourseUpdate = (eventData) => {
  console.log('🔔 Guest Sidebar: Course update received', eventData)

  if (eventData.courseId || eventData.courseCode) {
    const courseId = eventData.courseId
    const courseCode = eventData.courseCode

    // Update the course in local state
    const course = localCourses.value.find(c =>
      c.id === courseId || c.code === courseCode
    )
    if (course) {
      Object.assign(course, eventData)
      console.log(`✅ Guest Sidebar updated ${course.title}`)
    }

    // Also update current course if it matches
    if (props.currentCourse &&
        (props.currentCourse.id === courseId || props.currentCourse.code === courseCode)) {
      emit('update-course', {
        ...props.currentCourse,
        ...eventData
      })
    }
  }
}

let unsubscribe = null

onMounted(() => {
  console.log('✅ Guest Sidebar mounted')

  // Subscribe to course updates via EventBridge for real-time updates
  if (window.eventBridge) {
    unsubscribe = window.eventBridge.subscribe(
      'course-updated',
      handleCourseUpdate,
      'CourseDetailsSidebarGuest'
    )
  }
})

onUnmounted(() => {
  console.log('🛑 Guest Sidebar unmounting')

  // Cleanup subscription
  if (unsubscribe) {
    unsubscribe()
  }

  if (window.eventBridge) {
    window.eventBridge.cleanupComponent('CourseDetailsSidebarGuest')
  }
})

const updateCourse = (courseData) => {
  const index = localCourses.value.findIndex(c => c.id === courseData.id)
  if (index !== -1) {
    localCourses.value[index] = { ...localCourses.value[index], ...courseData }
  }
}

defineExpose({
  updateCourse
})
</script>

<style scoped>
.courses-sidebar.guest-sidebar {
width: 240px;
height: 100vh;
background-color: var(--sidebar-bg, white);
box-shadow: 1px 0 5px var(--shadow-color, rgba(0, 0, 0, 0.1));
display: flex;
flex-direction: column;
position: fixed;
left: 0;
top: 0;
transition: width 0.3s ease, transform 0.3s ease;
z-index: 1021;
overflow: hidden;
}

.courses-sidebar.guest-sidebar.collapsed {
width: 60px;
}

.sidebar-header {
padding: 12px 14px;
display: flex;
align-items: center;
justify-content: space-between;
border-bottom: 1px solid var(--border-color, #e2e8f0);
min-height: 60px;
}

.sidebar-title {
font-family: var(--font-heading, inherit);
font-size: 16px;
font-weight: 600;
color: var(--primary-color, #087990);
margin: 0;
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
line-height: 1.2;
}

.refresh-button {
background: none;
border: none;
color: var(--secondary-color, #64748b);
cursor: pointer;
font-size: 16px;
padding: 4px;
display: flex;
align-items: center;
justify-content: center;
width: 30px;
height: 30px;
border-radius: 4px;
transition: all 0.2s ease;
}

.refresh-button:hover:not(:disabled) {
background-color: rgba(8, 121, 144, 0.1);
color: var(--primary-color, #087990);
}

.refresh-button:disabled {
opacity: 0.6;
cursor: not-allowed;
}

.sidebar-loading,
.sidebar-error,
.sidebar-empty {
text-align: center;
padding: 20px 14px;
color: var(--secondary-color, #64748b);
flex: 1;
display: flex;
flex-direction: column;
justify-content: center;
align-items: center;
}

.sidebar-loading i,
.sidebar-error i,
.sidebar-empty i {
font-size: 24px;
margin-bottom: 8px;
display: block;
}

.sidebar-error {
color: var(--error-color, #d32f2f);
}

.retry-button.small {
padding: 4px 8px;
font-size: var(--fs-xs, 12px);
margin-top: 8px;
background: var(--primary-color, #087990);
color: white;
border: none;
border-radius: 4px;
cursor: pointer;
}

.courses-nav {
flex: 1;
padding: 5px 0;
overflow-y: auto;
overflow-x: hidden;
}

.courses-nav ul {
list-style: none;
padding: 0;
margin: 0;
}

.courses-nav li {
margin: 1px 0;
}

.courses-nav a {
display: flex;
align-items: center;
padding: 10px 14px;
color: var(--secondary-color, #64748b);
text-decoration: none;
transition: all 0.2s ease;
border-left: 3px solid transparent;
font-size: 13px;
min-height: 40px;
line-height: 1.2;
gap: 12px;
border-bottom: none !important;
}

.courses-nav a:hover {
background-color: rgba(8, 121, 144, 0.05);
color: var(--primary-color, #087990) !important;
}

.courses-nav li.active a {
background-color: rgba(8, 121, 144, 0.1);
color: var(--primary-color, #087990) !important;
border-left: 3px solid var(--primary-color, #087990);
font-weight: 500;
border-top: none !important;
border-right: none !important;
border-bottom: none !important;
}

.course-thumbnail {
width: 32px;
height: 32px;
border-radius: 6px;
background: var(--primary-color, #087990);
color: white;
display: flex;
align-items: center;
justify-content: center;
flex-shrink: 0;
font-size: 14px;
}

.course-info {
flex: 1;
min-width: 0;
display: flex;
flex-direction: column;
gap: 2px;
}

.course-title {
font-weight: 600;
color: inherit;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
line-height: 1.2;
}

.course-preview-badge {
font-size: 11px;
color: #17a2b8;
font-weight: 500;
line-height: 1.2;
}

.sidebar-footer {
padding: 10px 14px;
border-top: 1px solid var(--border-color, #e2e8f0);
display: flex;
flex-direction: column;
gap: 8px;
min-height: 50px;
}

.guest-session-info {
display: flex;
align-items: center;
gap: 8px;
padding: 8px;
background: rgba(255, 193, 7, 0.1);
border-radius: 4px;
font-size: 12px;
color: #856404;
}

.guest-session-info i {
color: #ff9800;
}

.timer-text {
font-weight: 600;
}

.back-btn {
display: flex;
align-items: center;
width: 100%;
padding: 8px;
background: none;
border: 1px solid var(--border-color, #e2e8f0);
border-radius: 4px;
color: var(--secondary-color, #64748b);
cursor: pointer;
transition: all 0.2s ease;
font-family: var(--font-body, inherit);
font-size: 13px;
min-height: 36px;
justify-content: start;
gap: 8px;
text-decoration: none;
}

.back-btn:hover {
background-color: rgba(8, 121, 144, 0.1);
color: var(--primary-color, #087990);
border-color: rgba(8, 121, 144, 0.2);
}

.back-btn i {
font-size: 13px;
}

/* Animation for clicking effect */
.clicking {
transform: scale(0.98);
opacity: 0.9;
transition: transform 0.1s ease, opacity 0.1s ease;
}

/* Custom scrollbar for sidebar */
.courses-nav::-webkit-scrollbar {
width: 4px;
}

.courses-nav::-webkit-scrollbar-track {
background: transparent;
}

.courses-nav::-webkit-scrollbar-thumb {
background: rgba(0, 0, 0, 0.2);
border-radius: 2px;
}

.courses-nav::-webkit-scrollbar-thumb:hover {
background: rgba(0, 0, 0, 0.3);
}

/* Responsive styles */
@media (max-width: 992px) {
.courses-sidebar.guest-sidebar {
  transform: translateX(-100%);
  width: 240px;
}

.courses-sidebar.guest-sidebar.collapsed {
  transform: translateX(0);
  width: 50px;
}
}

@media (max-width: 768px) {
.sidebar-title {
  font-size: 15px;
}

.courses-nav a {
  padding: 8px 12px;
  font-size: 12px;
  min-height: 36px;
}

.course-thumbnail {
  width: 28px;
  height: 28px;
  font-size: 13px;
}
}

@media (max-width: 576px) {
.courses-sidebar.guest-sidebar:not(.collapsed) {
  width: 100%;
  max-width: 280px;
}
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
.courses-sidebar.guest-sidebar {
  background: #2d3748;
  color: white;
}

.sidebar-title {
  color: #63b3ed;
}

.courses-nav a:hover {
  background: #4a5568;
}

.courses-nav li.active a {
  background: rgba(99, 179, 237, 0.1);
}
}

/* Focus styles for accessibility */
.courses-nav a:focus {
outline-offset: 2px;
}

/* Print styles */
@media print {
.courses-sidebar.guest-sidebar {
  display: none !important;
}
}
</style>