<template>
  <section class="home-courses">
    <div class="container">
      <h2 class="section-title">Our Courses</h2>
      <p class="section-subtitle">Build wealth and a healthy mind with our comprehensive courses designed for real transformation</p>

      <!-- Search and Filter Section - Centered and Compact -->
      <div class="search-filter-section">
        <div class="search-container">
          <input
            type="text"
            v-model="searchQuery"
            class="search-input"
            :class="{ 'focus-active': isSearchFocused }"
            placeholder="Search courses..."
            @focus="isSearchFocused = true"
            @blur="isSearchFocused = false"
          >
          <div class="search-icon">
            <i class="fas fa-search"></i>
          </div>
        </div>

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

      <!-- Real Courses Grid -->
      <div v-if="!loading && !error && courses.length > 0" class="courses-grid">
        <div
          class="course-col"
          v-for="course in filteredCourses"
          :key="course.id"
        >
          <div class="course-card">
            <div class="course-card-header">
              <h3 class="course-card-title">{{ course.title }}</h3>
              <span v-if="course.is_new" class="course-tag new">New</span>
              <span class="course-code">{{ course.code }}</span>
            </div>
            <p class="course-card-content">{{ shortenDescription(course.description) }}</p>
            <div class="course-meta">
              <span><i class="fas fa-clock"></i> {{ course.duration }} weeks</span>
              <span class="course-price free">
                <i class="fas fa-gift"></i> Free
              </span>
            </div>
            <div class="course-actions">
              <!-- Continue Button (for enrolled courses) -->
              <button
                v-if="isCourseEnrolled(course)"
                class="view-course-btn continue-btn"
                @click="viewCourse(course)"
              >
                Continue
              </button>

              <!-- View Course Button (for non-enrolled courses) -->
              <button
                v-else
                class="view-course-btn"
                @click="viewCourse(course)"
              >
                View Course
              </button>

              <!-- Enrolled Button (disabled, for enrolled courses) -->
              <button
                v-if="isCourseEnrolled(course)"
                class="enroll-btn"
                disabled
              >
                Enrolled
              </button>

              <!-- Enroll Now Button (for non-enrolled courses) -->
              <button
                v-else
                class="enroll-btn"
                @click="handleEnrollNow(course)"
                :disabled="isEnrolling && currentEnrollingCourse === course.id"
              >
                <span v-if="isEnrolling && currentEnrollingCourse === course.id">
                  <i class="fas fa-spinner fa-spin"></i>
                </span>
                <span v-else>
                  Enroll Now
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading courses...</p>
      </div>

      <!-- Error State -->
      <div v-if="error" class="error-state">
        <div class="error-content">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Unable to Load Courses</h3>
          <p>{{ error }}</p>
          <div class="error-actions">
            <button @click="loadCourses" class="retry-btn">
              <i class="fas fa-redo"></i>
              Try Again
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!loading && !error && courses.length === 0" class="empty-state">
        <i class="fas fa-search"></i>
        <h3>No courses available</h3>
        <p>There are no courses available for preview at the moment.</p>
        <button @click="loadCourses" class="retry-btn">
          <i class="fas fa-redo"></i>
          Check Again
        </button>
      </div>

      <!-- Guest CTA Banner -->
      <div v-if="!isAuthenticated && !loading && !error && courses.length > 0" class="guest-cta-banner">
        <div class="cta-content">
          <i class="fas fa-rocket"></i>
          <div class="cta-text">
            <h4>Not ready to enroll?</h4>
            <p>Start a free guest session to preview courses and try exercises...</p>
          </div>
          <button @click="startGuestSession" class="cta-button">
            Start Free Preview
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGuestStore } from '@/stores/guest'
import { useToast } from 'vue-toastification'
import { useEnrollment } from '@/composables/useEnrollment'
import { useGuestSession } from '@/composables/useGuestSession'

import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const guestStore = useGuestStore()
const toast = useToast()
const { enrollCourse, isEnrolling } = useEnrollment()
const { handleCourseAccess } = useGuestSession()

const courses = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')
const activeCategory = ref('all')
const currentEnrollingCourse = ref(null)
const enrollmentStatuses = ref({})
const isSearchFocused = ref(false)

// Updated categories with Department of Education
const categories = ref([
  { key: 'all', label: 'All Courses' },
  { key: 'finance', label: 'Finance' },
  { key: 'personal_development', label: 'Personal Development' },
  { key: 'business', label: 'Business' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'education', label: 'Department of Education' }
])

// Fixed description shortening function
const shortenDescription = (description) => {
  if (!description) return 'No description available.'
  if (description.length > 75) {
    return description.substring(0, 75).trim() + '...'
  }
  return description
}

const isAuthenticated = computed(() => authStore.isAuthenticated)

const filteredCourses = computed(() => {
  let filtered = courses.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(course =>
      course.title.toLowerCase().includes(query) ||
      course.description.toLowerCase().includes(query) ||
      (course.category && course.category.toLowerCase().includes(query))
    )
  }

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

  return filtered
})

// Check if course is enrolled
const isCourseEnrolled = (course) => {
  const status = enrollmentStatuses.value[course.id] || course.enrollment_status
  return status === 'enrolled' || status === 'approved' || status === 'completed'
}

const loadCourses = async () => {
  loading.value = true
  error.value = null

  try {
    console.log('📚 Loading home courses...')

    let response
    try {
      // ✅ Use home endpoint for all courses
      response = await axios.get('/api/student/home/courses/')
      console.log('✅ Home courses API response:', response.data)

      if (response.data && Array.isArray(response.data.courses)) {
        courses.value = response.data.courses
      } else if (response.data && Array.isArray(response.data)) {
        courses.value = response.data
      } else if (response.data?.courses && typeof response.data.courses === 'object') {
        courses.value = Object.values(response.data.courses)
      } else {
        courses.value = []
      }

    } catch (homeError) {
      console.error('❌ Home endpoint failed:', homeError)
      throw new Error('Could not load courses from home endpoint')
    }

    if (courses.value && courses.value.length > 0) {
      courses.value = courses.value.map(course => ({
        ...course,
        is_popular: course.is_popular || false,
        is_new: course.is_new || false,
        teacher_name: course.teacher_name || 'Instructor',
        duration: course.duration || 4,
        lessons_count: course.lessons_count || 0,
        price: course.price || 0,
        enrollment_status: 'not_enrolled',
        category: course.category || 'General'
      }))
    }

    // If user is authenticated, load their enrollment statuses
    if (isAuthenticated.value) {
      await loadEnrollmentStatuses()
    }

  } catch (err) {
    console.error('Failed to load courses:', err)
    error.value = err.message || 'Failed to load courses. Please try again later.'
  } finally {
    loading.value = false
  }
}

const loadEnrollmentStatuses = async () => {
  try {
    console.log('📊 Loading enrollment statuses...')
    const response = await axios.get('/api/student/courses/', {
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`
      }
    })

    if (response.data && response.data.courses) {
      response.data.courses.forEach(enrolledCourse => {
        const course = courses.value.find(c => c.id === enrolledCourse.id || c.code === enrolledCourse.code)
        if (course) {
          enrollmentStatuses.value[course.id] = enrolledCourse.enrollment_status || 'enrolled'
          console.log(`✅ Found enrolled course: ${course.title} (${enrolledCourse.enrollment_status})`)
        }
      })

      console.log(`📊 Total enrolled courses: ${Object.keys(enrollmentStatuses.value).length}`)
    }
  } catch (error) {
    console.error('Failed to load enrollment statuses:', error)
  }
}

const handleEnrollNow = async (course) => {
  console.log('🎯 Enroll Now clicked for:', course.title)

  if (isCourseEnrolled(course)) {
    console.log('ℹ️ Course already enrolled - no action needed')
    return
  }

  currentEnrollingCourse.value = course.id
  const result = await enrollCourse(course)
  currentEnrollingCourse.value = null

  if (result.success) {
    if (result.alreadyEnrolled || result.newlyEnrolled) {
      enrollmentStatuses.value[course.id] = 'enrolled'
      console.log(`✅ Updated enrollment status for ${course.title}`)
    }
  } else {
    console.log('❌ Enrollment failed:', result.error)
  }
}

const viewCourse = async (course) => {
  try {
    const result = await handleCourseAccess(course)
    router.push(result.route)
  } catch (error) {
    toast.error('Failed to access course: ' + error.message)
  }
}

const startGuestPreview = async (course) => {
  try {
    console.log('🎯 Starting guest preview for:', course.title)

    // ✅ FIXED: Check authentication first
    if (authStore.isAuthenticated) {
      console.log('✅ User is authenticated, using regular course access')
      router.push(`/student/courses/${course.code}`)
      return
    }

    // Only start guest session for non-authenticated users
    if (!guestStore.isGuestMode) {
      const result = await guestStore.startGuestSession()
      if (!result.success) {
        toast.error('Failed to start preview session')
        return
      }
    }

    router.push(`/guest/courses/${course.code}`)

  } catch (err) {
    console.error('Failed to start guest preview:', err)
    toast.error('Failed to access course preview')
  }
}

const startGuestSession = async () => {
  console.log('🚀 Starting guest session from CTA...')

  // ✅ FIXED: Check authentication first
  if (authStore.isAuthenticated) {
    toast.info('You are already signed in! Explore courses with full access.')
    router.push('/student/courses')
    return
  }

  const result = await guestStore.startGuestSession()
  if (result.success) {
    toast.success('Guest session started! Explore available courses.')
    router.push('/guest/courses')
  } else {
    toast.error('Failed to start guest session: ' + (result.error || 'Unknown error'))
  }
}

onMounted(() => {
  console.log('🏠 HomeCourses mounted - loading courses...')
  loadCourses()
})
</script>

<style scoped>

.home-courses {
  padding: 2.5rem 0;
  background-color: var(--gray-bg);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

.section-title {
  text-align: center !important;
  font-size: var(--fs-2xl) !important;
  margin-bottom: 0.5rem;
  color: var(--primary-color);
  font-family: var(--font-heading);
  font-weight: 700;
}

.section-subtitle {
  text-align: center;
  font-size: var(--fs-md);
  color: var(--secondary-color);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 0 !important;
}

/* Search and Filter Section */
.search-filter-section {
  max-width: 1200px;
  margin: 0 auto 2rem;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.search-container {
  position: relative;
  max-width: 450px;
  width: 100%;
  margin: 1.3rem auto;
}

.search-input {
  width: 100%;
  padding: 10.8px 18px;
  padding-right: 45px;
  font-size: var(--fs-base);
  border: 1.8px solid var(--primary-color);
  border-radius: 27px;
  outline: none;
  font-family: var(--font-body);
  background-color: rgba(255, 255, 255, 0.9);
  transition: all 0.27s ease;
}

.search-input:focus,
.search-input.focus-active {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1.8px var(--primary-color-light);
  background-color: white;
}

.search-icon {
  position: absolute;
  right: 13.5px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--primary-color);
  font-size: var(--fs-lg);
  cursor: pointer;
}

/* Category Filters */
.category-filters {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
  max-width: 800px;
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

/* Courses Grid Layout - MATCHING HOME COMPONENT */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 2rem;
}

.course-col {
  display: flex;
}

.course-card {
  background: var(--card-bg-color);
  border-radius: 8px;
  padding: 1.5rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  border: 1.5px solid var(--border-color);
  transition: all 0.3s ease;
}

.course-card:hover {
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.course-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
  gap: 0.5rem;
}

.course-card-title {
  font-size: var(--fs-lg);
  color: var(--primary-color);
  margin: 0;
  flex: 1;
}

.course-tag {
  padding: 0.25rem 0.25rem;
  border-radius: 12px;
  font-size: var(--fs-xs);
  font-weight: 500;
}

.course-tag.new {
  background: #e3f2fd;
  color: #1976d2;
}

.course-code {
  background: #e9ecef;
  color: var(--primary-color);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.course-card-content {
  flex-grow: 1;
  color: var(--secondary-color);
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.course-meta {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.2rem;
  flex-wrap: wrap;
}

.course-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: var(--fs-sm);
  color: var(--primary-color);
}

.course-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.view-course-btn, .enroll-btn {
  flex: 1;
  text-align: center;
  padding: 7.2px 14.4px;
  border-radius: 4.5px;
  font-size: var(--fs-sm);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-family: var(--font-heading);
  letter-spacing: 0.45px;
  border: none;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-course-btn {
  background-color: var(--primary-color);
  color: white;
}

.view-course-btn:hover {
  background-color: #06677e;
  transform: translateY(-1.8px);
  box-shadow: 0 4.5px 13.5px rgba(6, 103, 126, 0.3);
}

.enroll-btn {
  background-color: transparent;
  color: var(--primary-color);
  border: 1.8px solid var(--primary-color);
}

.enroll-btn:hover {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-1.8px);
}

.enroll-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.enroll-btn:disabled:hover {
  transform: none;
  background-color: transparent;
  color: var(--primary-color);
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 2rem;
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

/* Error State */
.error-state {
  text-align: center;
  padding: 2rem;
  color: #d32f2f;
}

.error-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  justify-content: center;
}

.retry-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
}

.retry-btn:hover {
  background: #06677e;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--secondary-color);
}

.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* Guest CTA Banner */
.guest-cta-banner {
  background: linear-gradient(135deg, var(--primary-color) 0%, #06677e 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 8px;
  margin-top: 2rem;
  box-shadow: 0 4px 15px rgba(6, 103, 126, 0.2);
}

.cta-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.cta-content i {
  font-size: 2rem;
  color: white;
}

.cta-text {
  flex: 1;
}

.cta-text h4 {
  margin: 0 0 0.5rem 0;
  font-size: var(--fs-lg);
  color: white !important;
  font-weight: 600;
}

.cta-text p {
  margin: 0;
  opacity: 0.9;
  color: white;
  font-size: var(--fs-sm);
}

.cta-button {
  background: white;
  color: var(--primary-color);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: var(--fs-sm);
  white-space: nowrap;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/* Responsive Design */
@media (max-width: 768px) {
  .home-courses {
    padding: 2rem 0;
  }

  .section-title {
    font-size: var(--fs-xl);
  }

  .search-filter-section {
    margin-bottom: 1.5rem;
  }

  .category-filters {
    gap: 0.4rem;
  }

  .category-btn {
    padding: 0.35rem 0.8rem;
    font-size: var(--fs-xs);
  }

  .courses-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .course-card {
    padding: 1.25rem;
  }

  .course-actions {
    flex-direction: row;
  }

  .guest-cta-banner {
    padding: 1.25rem;
  }

  .cta-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
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

  .search-input {
    padding: 7.2px 15px;
    padding-right: 40px;
  }

  .course-meta {
    flex-direction: flex;
    gap: 0.5rem;
  }

  .course-actions {
    flex-direction: column;
  }
}
</style>