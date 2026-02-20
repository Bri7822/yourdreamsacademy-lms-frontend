<template>
  <div class="dashboard-section">
    <div class="dashboard-greeting">
      <h3>Welcome, {{ user.first_name }}!</h3>
      <p>{{ welcomeMessage }}</p>
    </div>

    <div class="cards-container">
      <div v-for="(card, index) in cards" :key="'student-card-'+index"
           class="dashboard-card card-animate"
           :style="{'animation-delay': `${index * 100}ms`}">
        <div class="card-header">
          <i :class="card.icon"></i>
          <h4>{{ card.title }}</h4>
        </div>
        <div class="card-content">
          <div class="card-stat">{{ card.value }}</div>
          <p>{{ card.description }}</p>
        </div>
        <div class="card-footer">
          <a href="#" @click.prevent="handleCardAction(card)">{{ card.actionText }}</a>
        </div>
      </div>
    </div>

    <div class="recent-activity-card">
      <h3 class="section-title">Recent Activity</h3>
      <ul class="activity-list">
        <li v-for="(activity, index) in recentActivities" :key="index"
            class="activity-item">
          <div class="activity-icon">
            <i :class="activity.icon"></i>
          </div>
          <div class="activity-content">
            <p class="activity-text">{{ activity.text }}</p>
            <span class="activity-time">{{ activity.time }}</span>
          </div>
        </li>
      </ul>
    </div>

    <!-- Real-time Update Indicator -->
    <div v-if="lastUpdate" class="update-indicator">
      <i class="fas fa-check-circle"></i>
      <span>Last updated: {{ formatTime(lastUpdate) }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useProgressStore } from '@/stores/progress'
import axios from 'axios'
import { useToast } from 'vue-toastification'

const router = useRouter()
const authStore = useAuthStore()
const progressStore = useProgressStore()
const toast = useToast()

const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  statistics: {
    type: Object,
    default: () => ({
      courses: 0,
      exercises: 0,
      averageGrade: 0,
      progress: 0,
      coursesWithExercises: []
    })
  }
})

const dashboardData = ref({
  totalCourses: 0,
  totalExercises: 0,
  completedCourses: 0,
  averageProgress: 0,
  averageGrade: 0,
  coursesWithExercises: [],
  totalGrades: 0,
  gradedExercises: 0
})

const isLoading = ref(false)
const lastUpdate = ref(null)
let unsubscribeGlobal = null
let unsubscribeEventBridge = null

// ✅ NEW: Handle global progress updates
const handleGlobalProgressUpdate = (event) => {
  console.log('🌍 DashboardHome: Global progress update received', event)

  if (event.type === 'progress-updated' || event.type === 'lesson-completed') {
    console.log('🔄 DashboardHome: Refreshing due to global progress update')
    lastUpdate.value = Date.now()
    fetchDashboardStats()
  }
}

const welcomeMessage = computed(() => {
  return "Track your learning progress and access your courses."
})

const fetchDashboardStats = async () => {
  if (isLoading.value) return

  isLoading.value = true

  try {
    const [coursesResponse, gradesResponse] = await Promise.all([
      axios.get('/api/student/courses-with-exercises/', {
        headers: { 'Authorization': `Bearer ${authStore.accessToken}` }
      }),
      axios.get('/api/student/completed-exercises/', {
        headers: { 'Authorization': `Bearer ${authStore.accessToken}` }
      })
    ])

    const coursesData = coursesResponse.data
    const gradesData = gradesResponse.data

    dashboardData.value.coursesWithExercises = coursesData.courses || []
    dashboardData.value.totalCourses = coursesData.total_courses || 0
    dashboardData.value.completedCourses = coursesData.completed_courses || 0
    dashboardData.value.totalExercises = coursesData.total_exercises || 0
    dashboardData.value.averageProgress = calculateAverageProgress(coursesData.courses || [])

    const calculatedGrade = Number(gradesData.average_grade)
    dashboardData.value.averageGrade = isNaN(calculatedGrade) ? 0 : calculatedGrade
    dashboardData.value.gradedExercises = Number(gradesData.total_completed || 0)
    dashboardData.value.totalGrades = Number(gradesData.statistics?.total_score || 0)

    console.log('✅ Dashboard stats updated:', {
      totalCourses: dashboardData.value.totalCourses,
      averageProgress: dashboardData.value.averageProgress
    })

  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error)
    if (dashboardData.value.totalCourses === 0) {
      console.log('ℹ️ No courses enrolled yet')
    } else {
      toast.error('Failed to load dashboard statistics')
    }

    dashboardData.value.averageGrade = 0
    dashboardData.value.gradedExercises = 0
    dashboardData.value.totalGrades = 0
  } finally {
    isLoading.value = false
  }
}

const calculateAverageProgress = (courses) => {
  if (!courses || courses.length === 0) return 0
  const totalProgress = courses.reduce((sum, course) => {
    // Use global progress state if available, otherwise use course progress
    const globalProgress = progressStore.getCourseProgress(course.code)
    return sum + (globalProgress.progress || course.progress || 0)
  }, 0)
  return Math.round(totalProgress / courses.length)
}

// Data-driven cards with reactive values
const cards = computed(() => [
  {
    icon: 'fas fa-book',
    title: 'My Courses',
    value: dashboardData.value.totalCourses,
    description: 'Active Courses',
    route: 'courses',
    actionText: 'View Courses',
    type: 'navigate'
  },
  {
    icon: 'fas fa-tasks',
    title: 'Pending Exercises',
    value: dashboardData.value.totalExercises,
    description: 'Total Exercises',
    route: 'courses',
    actionText: 'View Exercises',
    type: 'exercises'
  },
  {
    icon: 'fas fa-star',
    title: 'My Grades',
    value: `${dashboardData.value.averageGrade}%`,
    description: 'Average Grade',
    route: 'grades',
    actionText: 'View Grades',
    type: 'navigate'
  },
  {
    icon: 'fas fa-chart-line',
    title: 'Progress',
    value: `${dashboardData.value.averageProgress}%`,
    description: 'Overall Progress',
    route: 'progress',
    actionText: 'View Progress',
    type: 'navigate'
  }
])

const recentActivities = [
  {
    icon: 'fas fa-book text-primary',
    text: 'New material posted for "Advanced Mathematics"',
    time: '1 hour ago'
  },
  {
    icon: 'fas fa-check-circle text-success',
    text: 'Exercise "Introduction to Calculus" submitted',
    time: '3 hours ago'
  },
  {
    icon: 'fas fa-star text-warning',
    text: 'Received grade for "Physics 101" assignment - 92%',
    time: 'Yesterday'
  },
  {
    icon: 'fas fa-certificate text-info',
    text: 'Earned certificate for completing "Web Development Basics"',
    time: '2 days ago'
  }
]

const handleCardAction = async (card) => {
  if (card.type === 'exercises') {
    if (dashboardData.value.totalExercises === 0) {
      toast.info('No pending exercises at the moment')
      router.push({ name: 'student-courses' })
      return
    }

    const courseWithExercises = dashboardData.value.coursesWithExercises.find(
      course => course.total_exercises > 0
    )

    if (courseWithExercises) {
      router.push({
        name: 'student-course-detail',
        params: { courseSlug: courseWithExercises.code }
      })
    } else {
      toast.info('No courses with exercises found')
      router.push({ name: 'student-courses' })
    }
  } else {
    router.push(`/student/${card.route}`)
  }
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString()
}

onMounted(() => {
  console.log('🚀 DashboardHome mounted with GLOBAL progress tracking')

  // ✅ SUBSCRIBE PERSISTENTLY to global progress events
  if (window.globalProgressEvents) {
    unsubscribeGlobal = window.globalProgressEvents.subscribePersistent(
      'DashboardHome',
      ['progress-updated', 'lesson-completed'],
      handleGlobalProgressUpdate
    )
  }

  // Also subscribe to EventBridge for compatibility
  if (window.eventBridge) {
    unsubscribeEventBridge = window.eventBridge.subscribe(
      'progress-updated',
      () => {
        console.log('🔔 DashboardHome: EventBridge progress update')
        lastUpdate.value = Date.now()
        fetchDashboardStats()
      },
      'DashboardHome'
    )
  }

  fetchDashboardStats()
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
    window.eventBridge.cleanupComponent('DashboardHome')
  }
})

defineExpose({
  refreshStats: fetchDashboardStats
})
</script>

<style scoped>
.dashboard-greeting {
  margin-bottom: 30px;
}

.dashboard-greeting h3 {
  font-size: 1.5rem;
  margin-bottom: 8px;
  color: var(--text-color);
}

.dashboard-greeting p {
  color: var(--secondary-color);
}

/* Cards Container */
.cards-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 1rem;
}

.dashboard-card {
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--shadow-color);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 12px;
  display: flex;
  align-items: center;
  background-color: rgba(8, 121, 144, 0.03);
  border-bottom: 1px solid var(--border-color);
}

.card-header i {
  font-size: var(--fs-lg);
  color: var(--primary-color);
  margin-right: 8px;
}

.card-header h4 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}

.card-content {
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.card-stat {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1;
  margin-bottom: 5px;
}

.card-content p {
  margin: 0;
  color: var(--secondary-color);
  font-size: 0.8rem;
}

.card-footer {
  padding: 8px 12px;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.card-footer a {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 500;
  transition: color 0.2s ease;
  cursor: pointer;
}

.card-footer a:hover {
  color: #065e6f;
  text-decoration: underline;
}

/* Recent Activity */
.recent-activity-card {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.section-title {
    font-family: var(--font-heading);
    font-size: var(--fs-lg);
    color: var(--text-color);
    margin: 0 0 14.4px 0;
    font-weight: 600;
    position: relative;
    padding-bottom: 9px;
    text-align:start;
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

.activity-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 36px;
  height: 36px;
  background-color: var(--gray-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.activity-icon i {
  font-size: var(--fs-base);
}

.activity-content {
  flex: 1;
}

.activity-text {
  margin: 0 0 4px;
  font-size: var(--fs-sm);
  line-height: 1.4;
}

.activity-time {
  font-size: var(--fs-xs);
  color: var(--secondary-color);
}

/* Animations */
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

/* Responsive styles */
@media (max-width: 1200px) {
  .cards-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .cards-container {
    grid-template-columns: 1fr;
  }

  .card-header {
    padding: 8px;
  }

  .card-stat {
    font-size: 1.2rem;
  }
}
</style>