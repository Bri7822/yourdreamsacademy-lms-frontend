<!-- src/components/student/CourseDetailsSidebar.vue -->
<!-- CRITICAL FIX: Remove router-link, use plain <a> tag with @click handler -->

<template>
  <div class="courses-sidebar" :class="{ 'collapsed': sidebarCollapsed }">
    <div class="sidebar-header">
      <h4 class="sidebar-title">{{ sidebarTitle }}</h4>
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
      <p>{{ emptyMessage }}</p>
      <router-link v-if="authStore.isAuthenticated && allCourses.length === 0" to="/student/courses" class="enroll-link">
        Browse Courses
      </router-link>
    </div>

    <div v-else class="courses-nav">
      <ul>
        <li
          v-for="course in allCourses"
          :key="`sidebar-course-${course.id}`"
          :class="{
            'active': isCourseActive(course),
            'enrolled': isCourseEnrolled(course),
            'not-enrolled': !isCourseEnrolled(course) && authStore.isAuthenticated
          }"
        >
          <!-- ✅ FIXED: Use plain <a> tag instead of <router-link> -->
          <a
            href="#"
            class="nav-link"
            @click.prevent="handleCourseClick($event, course)"
          >
            <div class="course-thumbnail">
              <i class="fas fa-book"></i>
              <div v-if="isCourseEnrolled(course)" class="enrollment-badge" title="Enrolled">
              </div>
              <div v-else-if="authStore.isAuthenticated" class="enrollment-badge not-enrolled" title="Not Enrolled">
                <i class="fas fa-lock"></i>
              </div>
            </div>
            <div class="course-info" v-if="!sidebarCollapsed">
              <span class="course-title">{{ course.title }}</span>
              <span v-if="isCourseEnrolled(course)" class="course-progress">
                {{ getCourseProgress(course) }}% complete
              </span>
              <span v-else-if="authStore.isAuthenticated" class="course-preview-badge">
                Not Enrolled
              </span>
              <span v-else class="course-preview-badge">
                Preview
              </span>
            </div>
          </a>
        </li>
      </ul>
    </div>

    <!-- UPDATED: Only show footer for guest users with timer -->
    <div class="sidebar-footer" v-if="!sidebarCollapsed && !authStore.isAuthenticated">
      <div class="guest-session-info">
        <i class="fas fa-clock"></i>
        <span class="timer-text">{{ formattedRemainingTime }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGuestStore } from '@/stores/guest'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'

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

const emit = defineEmits(['refresh-courses', 'course-selected', 'back-to-dashboard', 'update-course'])

const router = useRouter()
const route = useRoute()
const guestStore = useGuestStore()
const authStore = useAuthStore()
const progressStore = useProgressStore()

const localCourses = ref([...props.otherCourses])
const activeCourseId = ref(props.currentCourseId)

// Enhanced computed properties
const sidebarTitle = computed(() => {
  if (!authStore.isAuthenticated) return 'Available Courses'
  return 'My Courses'
})

const emptyMessage = computed(() => {
  if (!authStore.isAuthenticated) return 'No courses available'
  return 'You are not enrolled in any courses yet'
})

const formattedRemainingTime = computed(() => {
  return guestStore.formattedRemainingTime
})

// Enhanced course list with better active course tracking
const allCourses = computed(() => {
  let courses = [...localCourses.value]

  // Add current course if it exists and not already in the list
  if (props.currentCourse && props.currentCourse.id) {
    const currentCourseExists = courses.find(c => c.id === props.currentCourse.id)
    if (!currentCourseExists) {
      courses.push(props.currentCourse)
    } else {
      const index = courses.findIndex(c => c.id === props.currentCourse.id)
      courses[index] = { ...courses[index], ...props.currentCourse }
    }
  }

  // For authenticated users, show ONLY enrolled courses in dashboard sidebar
  if (authStore.isAuthenticated) {
    courses = courses.filter(course => isCourseEnrolled(course))
  }

  return courses.sort((a, b) => a.title.localeCompare(b.title))
})

// SIMPLE and DIRECT active course checking
const isCourseActive = (course) => {
  // Priority 1: Check if this course matches the currentCourseId prop
  if (props.currentCourseId && course.id === props.currentCourseId) {
    return true
  }

  // Priority 2: Check if this course matches the currentCourse prop
  if (props.currentCourse && props.currentCourse.id === course.id) {
    return true
  }

  // Priority 3: Check local activeCourseId state
  if (activeCourseId.value && course.id === activeCourseId.value) {
    return true
  }

  return false
}

// Check if course is enrolled
const isCourseEnrolled = (course) => {
  return course.enrollment_status === 'enrolled' ||
         course.enrollment_status === 'approved' ||
         course.enrollment_status === 'completed'
}

// Get course progress from progress store
const getCourseProgress = (course) => {
  if (!authStore.isAuthenticated) return 0

  const progressData = progressStore.getCourseProgress(course.code)
  return progressData.progress || course.progress || 0
}

// Enhanced course click handler
const handleCourseClick = (event, course) => {
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('clicking')
    setTimeout(() => {
      if (event.currentTarget) {
        event.currentTarget.classList.remove('clicking')
      }
    }, 200)
  }

  console.log('🔄 Sidebar: Course selected', {
    title: course.title,
    id: course.id,
    enrolled: isCourseEnrolled(course)
  })

  // For authenticated users, only allow clicking enrolled courses in dashboard
  if (authStore.isAuthenticated && !isCourseEnrolled(course)) {
    console.log('🔒 Course not enrolled - showing message')
    return
  }

  // Update active course immediately for visual feedback
  activeCourseId.value = course.id

  // Emit the selection
  emit('course-selected', course)
}

// Enhanced event handling for course activation
const handleCourseActivated = (eventData) => {
  console.log('🎯 Sidebar: Course activated event received', eventData)

  if (eventData.courseId) {
    activeCourseId.value = eventData.courseId
    console.log('✅ Active course updated in sidebar:', activeCourseId.value)
  }
}

// Enhanced watchers - SIMPLIFIED
watch(() => props.otherCourses, (newCourses) => {
  localCourses.value = [...newCourses]
}, { deep: true })

// DIRECT current course watching - this is critical
watch(() => props.currentCourse, (newCurrentCourse) => {
  if (newCurrentCourse && newCurrentCourse.id) {
    console.log('🔄 Sidebar: Current course prop updated', newCurrentCourse.title)
    activeCourseId.value = newCurrentCourse.id
  }
}, { immediate: true })

// Watch for currentCourseId prop changes
watch(() => props.currentCourseId, (newId) => {
  console.log('🔄 Sidebar: Current course ID prop updated', newId)
  activeCourseId.value = newId
}, { immediate: true })

onMounted(() => {
  console.log('✅ Sidebar mounted')
  console.log('🎯 Initial active course ID:', activeCourseId.value)

  // Enhanced event subscriptions
  if (window.eventBridge) {
    window.eventBridge.subscribe(
      'course-activated',
      handleCourseActivated,
      'CourseDetailsSidebar'
    )
  }
})

onUnmounted(() => {
  console.log('🛑 Sidebar unmounting')

  if (window.eventBridge) {
    window.eventBridge.cleanupComponent('CourseDetailsSidebar')
  }
})

defineExpose({
  updateCourse: (courseData) => {
    const index = localCourses.value.findIndex(c => c.id === courseData.id)
    if (index !== -1) {
      localCourses.value[index] = { ...localCourses.value[index], ...courseData }
    }
  }
})
</script>

<style scoped>
/* Keep all existing styles - they're fine */
.courses-sidebar {
  width: 280px;
  height: 100vh;
  background-color: var(--sidebar-bg, white);
  box-shadow: 1px 0 5px var(--shadow-color, rgba(0, 0, 0, 0.1));
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  transition: width 0.3s ease, transform 0.3s ease;
  z-index: 1000;
  overflow: hidden;
}

.courses-sidebar.collapsed {
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
  color: var(--primary-color);
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

.course-progress {
  font-size: 12px;
  color: var(--primary-color, #087990);
  font-weight: 500;
  line-height: 1.2;
}

.course-lessons {
  font-size: 11px;
  color: var(--secondary-color, #64748b);
  line-height: 1.2;
}

.sidebar-footer {
  padding: 10px 14px;
  border-top: 1px solid var(--border-color, #e2e8f0);
  min-height: 50px;
}

.guest-session-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(255, 152, 0, 0.1);
  border-radius: 4px;
  color: var(--warning-color, #ff9800);
  font-size: 13px;
  font-weight: 500;
}

.guest-session-info i {
  font-size: 14px;
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

/* Responsive styles - keep all existing media queries */
@media (min-width: 1200px) {
  .courses-sidebar {
    width: 280px;
  }
  .courses-sidebar.collapsed {
    width: 60px;
  }
}

@media (min-width: 992px) and (max-width: 1199px) {
  .courses-sidebar {
    width: 240px;
  }
}

@media (max-width: 992px) {
  .dashboard-main {
    padding-left: 0 !important;
  }
  .courses-sidebar {
    transform: translateX(-100%);
    width: 240px;
  }
  .courses-sidebar.collapsed {
    transform: translateX(0);
    width: 50px;
  }
}

@media (max-width: 576px) {
  .courses-sidebar:not(.collapsed) {
    width: 100%;
    max-width: 280px;
  }
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
</style>