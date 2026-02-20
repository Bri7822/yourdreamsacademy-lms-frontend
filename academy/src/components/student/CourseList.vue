<template>
  <div class="dashboard-section" key="courses">
    <div class="section-header">
      <div class="header-main">
        <div>
          <h3 class="section-title">My Courses</h3>
          <p>View and manage your enrolled courses.</p>
        </div>
        <!-- Add this Browse Courses button -->
        <router-link to="/courses" class="more-courses-btn">
          <i class="fas fa-plus"></i> Browse Courses
        </router-link>
      </div>
      <div class="controls">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search courses..."
            @input="filterCourses"
          >
        </div>
        <div class="filter-dropdown">
          <select v-model="filterStatus" @change="filterCourses">
            <option value="all">All Statuses</option>
            <option value="approved">Enrolled</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
          <i class="fas fa-chevron-down"></i>
        </div>
        <div class="sort-dropdown">
          <select v-model="sortBy" @change="sortCourses">
            <option value="progress-desc">Progress: High to Low</option>
            <option value="progress-asc">Progress: Low to High</option>
            <option value="name-asc">Name: A to Z</option>
            <option value="name-desc">Name: Z to A</option>
          </select>
          <i class="fas fa-sort"></i>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading your courses...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
      <button @click="fetchCourses" class="retry-button">Try Again</button>
    </div>

    <!-- Empty state -->
    <div v-else-if="!filteredCourses || filteredCourses.length === 0" class="empty-state">
      <template v-if="courses.length === 0">
        <i class="fas fa-book-open"></i>
        <p>You are not enrolled in any courses yet.</p>
        <!-- You can also update this link to use the same button style -->
        <router-link to="/courses" class="more-courses-btn">
          <i class="fas fa-plus"></i> Browse Available Courses
        </router-link>
      </template>
      <template v-else>
        <i class="fas fa-search"></i>
        <p>No courses match your search criteria.</p>
        <button @click="clearFilters" class="browse-courses-link">Clear Filters</button>
      </template>
    </div>

    <!-- Courses list with animations -->
    <div v-else class="course-list">
      <div
        v-for="(course, index) in filteredCourses"
        :key="`course-${course.id}`"
        class="course-card card-animate"
        :style="{'animation-delay': `${index * 100}ms`}"
      >
        <div class="course-header">
          <i class="fas fa-book"></i>
          <h4>{{ course.title }}</h4>
        </div>
        <div class="course-content">
          <p class="course-description">{{ truncateDescription(course.description) }}</p>
          <div class="progress-container">
            <div class="progress-bar" :style="{ width: getCourseProgress(course) + '%' }"></div>
            <span>{{ getCourseProgress(course) }}% Complete</span>
          </div>
        </div>
        <div class="course-footer">
          <router-link
            :to="`/student/courses/${course.code}`"
            class="course-link"
            @click="handleViewCourse(course)"
          >
            View Course
          </router-link>
          <span class="enrollment-status" :class="course.enrollment_status">
            {{ formatStatus(course.enrollment_status) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Real-time update indicator -->
    <div v-if="lastUpdate" class="update-indicator">
      <i class="fas fa-sync-alt"></i>
      <span>Real-time updates active</span>
      <small>Last: {{ formatTime(lastUpdate) }}</small>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const authStore = useAuthStore()
const progressStore = useProgressStore()
const route = useRoute()
const router = useRouter()

// Remove old progress sync systems
const courses = ref([])
const filteredCourses = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const filterStatus = ref('all')
const sortBy = ref('progress-desc')
const lastUpdate = ref(null)

let unsubscribeGlobal = null
let unsubscribeEventBridge = null

// ✅ NEW: Handle global progress updates
const handleGlobalProgressUpdate = (event) => {
  console.log('🌍 CourseList: Global progress update received', event)

  if (event.type === 'progress-updated') {
    // Update the specific course in our local state
    const course = courses.value.find(c => c.code === event.data.courseCode)
    if (course) {
      course.progress = event.data.progress
      course.completed_lessons = event.data.completedLessons
      course.total_lessons = event.data.totalLessons

      // Update last update time
      lastUpdate.value = Date.now()

      // Re-sort courses to reflect new progress
      sortCourses()

      console.log(`✅ CourseList: Updated ${course.title} to ${event.data.progress}% from global state`)
    }
  } else if (event.type === 'lesson-completed') {
    // Refresh courses when lessons are completed
    console.log('🔔 CourseList: Lesson completed, refreshing courses')
    lastUpdate.value = Date.now()
    fetchCourses()
  } else if (event.type === 'initial-state') {
    // Update all courses from global state
    courses.value.forEach(course => {
      const globalProgress = progressStore.getCourseProgress(course.code)
      if (globalProgress.progress > 0) {
        course.progress = globalProgress.progress
        course.completed_lessons = globalProgress.completedLessons
        course.total_lessons = globalProgress.totalLessons
      }
    })
    sortCourses()
  }
}

// Format enrollment status for display
const formatStatus = (status) => {
  const statusMap = {
    'approved': 'Enrolled',
    'completed': 'Completed',
    'pending': 'Pending',
    'rejected': 'Rejected',
    'not_enrolled': 'Not Enrolled'
  }
  return statusMap[status] || status
}

// Truncate long descriptions
const truncateDescription = (description) => {
  if (!description) return 'No description available'
  const maxLength = 80
  return description.length > maxLength
    ? description.substring(0, maxLength) + '...'
    : description
}

// ✅ FIXED: Get course progress from NEW ProgressStore
const getCourseProgress = (course) => {
  const progressData = progressStore.getCourseProgress(course.code)
  return progressData.progress || course.progress || 0
}

// In the handleViewCourse method
const handleViewCourse = (course) => {
  console.log('\n' + '='.repeat(80))
  console.log('📚 COURSE LIST: Navigating to course detail')
  console.log('Course:', course.title)
  console.log('Code:', course.code)
  console.log('='.repeat(80) + '\n')

  sessionStorage.removeItem('activeCourseSlug')
  sessionStorage.setItem('activeCourseSlug', course.code)

  console.log('✅ Cleared old session data and set new course:', course.code)
}

// Filter courses based on search and status
const filterCourses = () => {
  if (!courses.value.length) return

  let results = [...courses.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    results = results.filter(course =>
      course.title.toLowerCase().includes(query) ||
      (course.description && course.description.toLowerCase().includes(query))
    )
  }

  if (filterStatus.value !== 'all') {
    results = results.filter(course => course.enrollment_status === filterStatus.value)
  }

  results = sortCoursesList(results)
  filteredCourses.value = results
}

// Sort courses based on selected option
const sortCourses = () => {
  filteredCourses.value = sortCoursesList(filteredCourses.value)
}

// Helper function to sort courses
const sortCoursesList = (coursesList) => {
  if (!coursesList.length) return coursesList

  return [...coursesList].sort((a, b) => {
    switch(sortBy.value) {
      case 'progress-desc':
        return getCourseProgress(b) - getCourseProgress(a)
      case 'progress-asc':
        return getCourseProgress(a) - getCourseProgress(b)
      case 'name-asc':
        return a.title.localeCompare(b.title)
      case 'name-desc':
        return b.title.localeCompare(a.title)
      default:
        return 0
    }
  })
}

// Clear all filters
const clearFilters = () => {
  searchQuery.value = ''
  filterStatus.value = 'all'
  sortBy.value = 'progress-desc'
  filteredCourses.value = [...courses.value]
}

// In CourseList.vue - update API calls for dashboard
const fetchCourses = async () => {
  loading.value = true
  error.value = null

  try {
    // ✅ Use dashboard endpoint for enrolled courses only
    const response = await axios.get('/api/student/dashboard/courses/', {
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`
      }
    })

    courses.value = response.data.courses.map(course => ({
      id: course.id,
      title: course.title,
      description: course.description,
      code: course.code,
      progress: course.progress,
      completed_lessons: course.completed_lessons,
      total_lessons: course.total_lessons,
      enrollment_status: course.enrollment_status
    }))

    filteredCourses.value = [...courses.value]
    sortCourses()

    console.log('✅ Dashboard courses loaded:', courses.value.length)
  } catch (err) {
    console.error('Error fetching dashboard courses:', err)
    if (err.response?.status === 401) {
      const refreshed = await authStore.refreshAccessToken()
      if (refreshed) {
        return fetchCourses()
      } else {
        error.value = 'Your session has expired. Please log in again.'
        authStore.logout()
      }
    } else if (err.response?.status === 403) {
      error.value = 'You do not have permission to view courses.'
    } else if (err.response?.data?.detail) {
      error.value = err.response.data.detail
    } else {
      error.value = 'Failed to load courses. Please try again later.'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  console.log('🚀 CourseList mounted with GLOBAL progress tracking')

  // ✅ SUBSCRIBE PERSISTENTLY to global progress state
  if (window.globalProgressEvents) {
    unsubscribeGlobal = window.globalProgressEvents.subscribePersistent(
      'CourseList',
      ['progress-updated', 'lesson-completed'],
      handleGlobalProgressUpdate
    )
  }

  // Also subscribe to EventBridge for compatibility
  if (window.eventBridge) {
    unsubscribeEventBridge = window.eventBridge.subscribe(
      'progress-updated',
      (eventData) => {
        console.log('🔔 CourseList: EventBridge progress update')
        handleGlobalProgressUpdate({
          type: 'progress-updated',
          data: eventData
        })
      },
      'CourseList'
    )
  }

  fetchCourses()
})

onBeforeUnmount(() => {
  // Cleanup
  if (unsubscribeGlobal) {
    unsubscribeGlobal()
  }

  if (unsubscribeEventBridge) {
    unsubscribeEventBridge()
  }

  if (window.eventBridge) {
    window.eventBridge.cleanupComponent('CourseList')
  }
})

// Watch for route changes
watch(() => route.name, (newRouteName) => {
  if (newRouteName === 'student-courses') {
    console.log('🔄 CourseList: Route changed to CourseList')
    setTimeout(() => {
      fetchCourses()
    }, 200)
  }
})

// Watch for route path changes (more reliable)
watch(() => route.path, (newPath, oldPath) => {
  if (newPath === '/student/courses' && oldPath !== newPath) {
    console.log('🔄 CourseList: Route path changed to /student/courses')
    setTimeout(() => {
      fetchCourses()
    }, 300)
  }
})

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

// Expose methods
defineExpose({
  refreshCourses: fetchCourses
})
</script>

<style scoped>

.more-courses-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  /* Reuse the get-started-btn styles */
  background-color: var(--primary-color);
  color: var(--background-color);
  border: none;
  padding: 10px 14.4px !important;
  border-radius: 4.5px;
  font-size: var(--fs-sm);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-family: var(--font-heading);
  letter-spacing: 0.45px;
  margin-top: 1.15rem;
}

.more-courses-btn:hover {
  background-color: #06677e;
  transform: translateY(-1.8px);
  box-shadow: 0 4.5px 13.5px rgba(6, 103, 126, 0.3);
}

.more-courses-btn i {
  font-size: var(--fs-base);
}

/* Responsive adjustments for the More Courses button */
@media (max-width: 768px) {
  .more-courses-container {
    margin-top: 2rem;
    padding-top: 1.5rem;
  }
}

@media (max-width: 480px) {
  .more-courses-btn {
    width: 100%;
    justify-content: center;
    padding: 0.75rem 1rem;
  }
}

.section-header {
  display: flex;
  /* justify-content: space-between; */
  align-items: flex-end;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.controls {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box i {
  position: absolute;
  left: 10px;
  color: #6c757d;
  font-size: 0.9rem;
}

.search-box input {
  padding: 8px 12px 8px 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  min-width: 250px;
  transition: border-color 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: var(--primary-color, #087990);
}

.filter-dropdown, .sort-dropdown {
  position: relative;
  display: flex;
  align-items: center;
}

.filter-dropdown i, .sort-dropdown i {
  position: absolute;
  right: 10px;
  pointer-events: none;
  color: #6c757d;
  font-size: 0.8rem;
}

.filter-dropdown select, .sort-dropdown select {
  padding: 8px 30px 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: white;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.2s;
  min-width: 140px;
}

.filter-dropdown select:focus, .sort-dropdown select:focus {
  outline: none;
  border-color: var(--primary-color, #087990);
}

/* Course List Styles */
.course-list {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

.course-card {
  background-color: var(--card-bg, #ffffff);
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 180px; /* Fixed height for consistent sizing */
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  padding: 12px !important;
  min-height: 12rem;
  margin-bottom: .2rem;
}

.course-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  background-color: rgba(8, 121, 144, 0.03);
  border-bottom: 1px solid var(--border-color, #e9ecef);
  padding: .5rem;
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.course-header i {
  font-size: 1rem;
  color: var(--primary-color, #087990);
  margin-right: 8px;
  flex-shrink: 0;
}

.course-header h4 {
  margin: 0;
  font-size: 0.95rem;
  color: var(--text-color, #333);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.course-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.course-description {
  margin: 0 0 8px;
  color: var(--secondary-color, #6c757d);
  font-size: 0.8rem;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.progress-container {
  margin-top: auto;
}

.progress-bar {
  height: 5px;
  background-color: var(--primary-color, #087990);
  border-radius: 3px;
  margin-bottom: 4px;
  position: relative;
}

.progress-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e9ecef;
  border-radius: 3px;
  z-index: -1;
}

.progress-container span {
  font-size: 0.75rem;
  color: var(--secondary-color, #6c757d);
}

.course-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color, #e9ecef);
}

.course-link {
  color: var(--primary-color, #087990);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.8rem;
  transition: color 0.2s ease;
}

.course-link:hover {
  color: #065e6f;
  text-decoration: underline;
}

.enrollment-status {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.enrollment-status.approved {
  background-color: #e7f4e4;
  color: #2e7d32;
}

.enrollment-status.completed {
  background-color: #e3f2fd;
  color: #1565c0;
}

.enrollment-status.pending {
  background-color: #fff3e0;
  color: #ef6c00;
}

.enrollment-status.rejected {
  background-color: #ffebee;
  color: #c62828;
}

/* Loading styles */
.loading-container {
  text-align: center;
  padding: 2rem;
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

/* Error styles */
.error-container {
  text-align: center;
  padding: 2rem;
  color: #d32f2f;
}

.error-container i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.retry-button {
  background-color: var(--primary-color, #087990);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.retry-button:hover {
  background-color: #065e6f;
}

/* Empty state styles */
.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--secondary-color, #6c757d);
}

.empty-state i {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #bdbdbd;
}

.browse-courses-link {
  display: inline-block;
  margin-top: 1rem;
  padding: 8px 16px;
  background-color: var(--primary-color, #087990);
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
}

.browse-courses-link:hover {
  background-color: #065e6f;
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--fs-lg);
  color: var(--text-color);
  margin: 0 0 8px 0;
  font-weight: 600;
  position: relative;
  padding-bottom: 8px;
  text-align: start;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background-color: var(--primary-color);
  border-radius: 3px;
}

/* Card Animation - Same as DashboardHome */
.card-animate {
  animation: cardAppear 0.4s ease forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes cardAppear {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }

  .controls {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box input {
    width: 100%;
  }

  .filter-dropdown select, .sort-dropdown select {
    width: 100%;
  }

  .course-list {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
  }

  .course-card {
    height: 160px;
    padding: 10px !important;
  }

  .course-header h4 {
    font-size: 0.9rem;
    -webkit-line-clamp: 1;
  }

  .course-description {
    -webkit-line-clamp: 2;
  }

  .course-footer {
    flex-direction: column;
    gap: 6px;
    align-items: flex-start;
  }
}

@media (max-width: 480px) {
  .course-list {
    grid-template-columns: 1fr;
  }

  .course-card {
    height: auto;
    min-height: 140px;
  }
}
</style>