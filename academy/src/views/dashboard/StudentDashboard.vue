<!-- src/views/dashboard/StudentDashboard.vue -->
<template>
  <div class="dashboard-container" :class="{ 'no-sidebar-padding': !showSidebar }">
    <!-- Conditionally render sidebar based on route -->
    <StudentSidebar
      v-if="showSidebar"
      :sidebarCollapsed="sidebarCollapsed"
      :activeNavItem="activeNavItem"
      :user="user"
      @toggle-sidebar="toggleSidebar"
      @logout="handleLogout"
      @nav-change="setActiveNavItem"
    />

    <div class="dashboard-main" :class="{ 'full-width': !showSidebar, 'sidebar-collapsed': sidebarCollapsed }">
      <StudentHeader
        :title="currentPageTitle"
        :notificationCount="notificationCount"
        :context="'student'"
        @toggle-sidebar="toggleSidebar"
      />

      <main class="dashboard-content">
        <!-- ✅ FIXED: Remove transition to prevent reloads -->
        <router-view
          :user="user"
          :statistics="statistics"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import StudentSidebar from '@/components/student/StudentSidebar.vue'
import StudentHeader from '@/components/student/StudentHeader.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// Reactive data
const sidebarCollapsed = ref(false)
const activeNavItem = ref('dashboard')
const notificationCount = ref(3)

// User data
const user = ref({
  id: 1,
  first_name: 'Student',
  last_name: 'User',
  email: 'student@dreamacademy.com',
  user_type: 'student',
  bio: 'Computer Science student passionate about web development',
  avatar: null
})

// Statistics
const statistics = ref({
  courses: 3,
  exercises: 5,
  averageGrade: 88,
  progress: 75
})

// ✅ FIXED: Show sidebar for all dashboard routes except lesson details
const showSidebar = computed(() => {
  // Don't show sidebar on lesson detail pages
  if (route.name === 'student-lesson-detail' || route.name === 'student-course-detail') {
    return false
  }
  return true
})

// Computed properties
const currentPageTitle = computed(() => {
  const routeTitles = {
    'student-dashboard': 'Dashboard',
    'student-courses': 'My Courses',
    'student-course-detail': 'Course Details',
    'student-lesson-detail': 'Lesson',
    'student-exercises': 'Exercises',
    'student-grades': 'My Grades',
    'student-tutorials': 'Tutorials',
    'student-progress': 'Progress Tracker',
    'student-notes': 'Saved Notes',
    'student-certificates': 'Certificates',
    'student-settings': 'Profile Settings',
    'student-Lessons': 'Lessons'
  }
  return routeTitles[route.name] || 'Dashboard'
})

// ✅ FIXED: Watch for route changes to update active nav item
watch(() => route.name, (newRouteName) => {
  console.log('🔄 StudentDashboard: Route changed to', newRouteName)

  if (newRouteName) {
    // Map route names to sidebar items
    const routeToNavItem = {
      'student-dashboard': 'dashboard',
      'student-courses': 'courses',
      'student-course-detail': 'courses',
      'student-lesson-detail': 'courses',
      'student-exercises': 'exercises',
      'student-grades': 'grades',
      'student-progress': 'progress',
      'student-notes': 'notes',
      'student-certificates': 'certificates',
      'student-settings': 'settings',
      'student-Lessons': 'Lessons'
    }

    if (routeToNavItem[newRouteName]) {
      activeNavItem.value = routeToNavItem[newRouteName]
    }
  }
}, { immediate: true })

// Methods
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const setActiveNavItem = async (itemId) => {
  activeNavItem.value = itemId

  // Navigate to the corresponding route
  const pathMap = {
    'dashboard': '/student',
    'courses': '/student/courses',
    'exercises': '/student/exercises',
    'grades': '/student/grades',
    'progress': '/student/progress',
    'notes': '/student/notes',
    'certificates': '/student/certificates',
    'settings': '/student/settings',
    'Lessons': '/student/view-lessons'
  }

  if (pathMap[itemId] && route.path !== pathMap[itemId]) {
    console.log('📤 StudentDashboard: Navigating to', pathMap[itemId])
    await router.push(pathMap[itemId])
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// Initialize user data from auth store
onMounted(() => {
  console.log('🎬 StudentDashboard mounted')

  if (authStore.user) {
    user.value = { ...user.value, ...authStore.user }
  }

  // Set sidebar to collapsed by default on mobile
  if (window.innerWidth < 992) {
    sidebarCollapsed.value = true
  }
})
</script>

<style scoped>
.dashboard-container {
  display: flex;
  height: 100vh;
  background-color: var(--gray-bg);
  font-family: var(--font-body);
}

.full-width {
  margin-left: 0 !important;
  width: 100%;
}

.dashboard-main {
  flex: 1;
  margin-left: 240px;
  transition: margin-left 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow-y: auto;
}

.dashboard-sidebar.collapsed + .dashboard-main {
  margin-left: 60px;
}

/* Add this new style for full-width content */
.dashboard-main.full-width {
  margin-left: 0 !important;
  width: 100%;
}
.dashboard-sidebar {
    width: 240px;
    height: 100vh;
    background-color: var(--sidebar-bg);
    box-shadow: 1px 0 5px var(--shadow-color);
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0;
    top: 0;
    transition: width 0.3s ease, transform 0.3s ease;
    z-index: 1000;
}

.dashboard-sidebar.collapsed {
    width: 60px;
}

.logo-container {
    padding: 18px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-color);
}

.dashboard-logo {
    font-family: var(--font-heading);
    font-size: var(--fs-base);
    font-weight: 600;
    color: var(--primary-color);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sidebar-toggle {
    background: none;
    border: none;
    color: var(--secondary-color);
    cursor: pointer;
    font-size: var(--fs-base);
    padding: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.user-profile {
    padding: 18px 14px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
}

.avatar {
    width: 25px;
    height: 25px;
    border-radius: 50%;
    background-color: var(--primary-color);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: var(--fs-sm);
    margin-right: 9px;
    flex-shrink: 0;
}

.avatar-initial {
    text-transform: uppercase;
}

.user-info {
    overflow: hidden;
}

.user-name {
    margin: 0;
    font-size: var(--fs-sm);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.user-role {
    font-size: var(--fs-xs);
    color: var(--secondary-color);
    display: block;
}

.sidebar-nav {
    flex: 1;
    padding: 9px 0;
    overflow-y: auto;
}

.sidebar-nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.sidebar-nav li {
    margin: 4.5px 0;
}

.sidebar-nav a {
    display: flex;
    align-items: center;
    padding: 7.8px 12px;
    color: var(--secondary-color);
    text-decoration: none;
    transition: all 0.2s ease;
    border-left: 3px solid transparent;
}

.sidebar-nav a:hover {
    background-color: rgba(8, 121, 144, 0.05);
    color: var(--primary-color);
}

.sidebar-nav li.active a {
    background-color: rgba(8, 121, 144, 0.1);
    color: var(--primary-color);
    border-left: 3px solid var(--primary-color);
    font-weight: 500;
}

.sidebar-nav i {
    font-size: var(--fs-base);
    margin-right: 14.4px;
    width: 18px;
    text-align: center;
}

.sidebar-footer {
    padding: 14.4px;
    border-top: 1px solid var(--border-color);
}

.logout-btn {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 9px;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: 4.5px;
    color: var(--secondary-color);
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: var(--font-body);
    font-size: var(--fs-sm);
}

.logout-btn:hover {
    background-color: rgba(220, 53, 69, 0.1);
    color: var(--error-color);
    border-color: rgba(220, 53, 69, 0.2);
}

.logout-btn i {
    margin-right: 9px;
}

.dashboard-main {
    flex: 1;
    margin-left: 240px;
    transition: margin-left 0.3s ease;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow-y: auto;
}

.dashboard-sidebar.collapsed + .dashboard-main {
    margin-left: 60px;
}

.dashboard-header {
    background-color: var(--header-bg);
    padding: 10.3px 15px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-color);
    box-shadow: 0 1px 3px var(--shadow-color);
    position: sticky;
    top: 0;
    z-index: 10;
}

.page-title h2 {
    margin: 0;
    font-family: var(--font-heading);
    font-size: var(--fs-lg);
    font-weight: 600;
    color: var(--primary-color);
    padding-left: 5px;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.notification-btn {
    background: none;
    border: none;
    font-size: var(--fs-base);
    color: var(--primary-color);
    cursor: pointer;
    position: relative;
    padding: 7.5px;
}

.notification-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background-color: var(--error-color);
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: bold;
}

.dashboard-content {
    flex: 1;
    padding: .2rem .9rem;
}

.dashboard-section {
    animation: fadeIn 0.3s ease;
}

.dashboard-greeting {
    margin-bottom: 27px;
}

.dashboard-greeting h3 {
    font-family: var(--font-heading);
    font-size: var(--fs-xl);
    color: var(--text-color);
    margin: 0 0 9px 0;
    font-weight: 600;
}

.dashboard-greeting p {
    color: var(--secondary-color);
    font-size: var(--fs-base);
    margin: 0;
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

.cards-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    margin-bottom: 20px;
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
    display: flex;
    align-items: flex-end;
}

.percent {
    font-size: var(--fs-lg);
    margin-left: 3px;
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
}

.card-footer a:hover {
    color: #065e6f;
    text-decoration: underline;
}

.recent-activity {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    padding: 15px;
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

/* Course List Styles */
.course-list {
    display: grid;
    gap: 15px;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.course-card {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.course-header {
    padding: 12px;
    display: flex;
    align-items: center;
    background-color: rgba(8, 121, 144, 0.03);
    border-bottom: 1px solid var(--border-color);
}

.course-header i {
    font-size: 1.2rem;
    color: var(--primary-color);
    margin-right: 10px;
}

.course-header h4 {
    margin: 0;
    font-size: 1rem;
}

.course-content {
    padding: 12px;
    flex: 1;
}

.course-content p {
    margin: 0 0 10px;
    color: var(--secondary-color);
    font-size: 0.9rem;
}

.progress-container {
    margin-top: 15px;
}

.progress-bar {
    height: 6px;
    background-color: var(--primary-color);
    border-radius: 3px;
    margin-bottom: 5px;
}

.course-footer {
    padding: 10px 12px;
    border-top: 1px solid var(--border-color);
}

.course-link {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9rem;
}

.course-link:hover {
    text-decoration: underline;
}

/* Exercise List Styles */
.exercise-list {
    display: grid;
    gap: 15px;
}

.exercise-card {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    overflow: hidden;
}

.exercise-header {
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: rgba(8, 121, 144, 0.03);
    border-bottom: 1px solid var(--border-color);
}

.exercise-header i {
    font-size: 1.2rem;
    color: var(--primary-color);
    margin-right: 10px;
}

.exercise-header h4 {
    margin: 0;
    font-size: 1rem;
}

.course-name {
    font-size: 0.8rem;
    color: var(--secondary-color);
    display: block;
}

.due-date {
    font-size: 0.8rem;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 12px;
    background-color: #f8f9fa;
}

.due-date.overdue {
    background-color: #fff3cd;
    color: #856404;
}

.exercise-content {
    padding: 12px;
}

.exercise-content p {
    margin: 0 0 10px;
    color: var(--secondary-color);
    font-size: 0.9rem;
}

.exercise-status {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
}

.exercise-status.pending {
    background-color: #e2e3e5;
    color: #383d41;
}

.exercise-status.in-progress {
    background-color: #cce5ff;
    color: #004085;
}

.exercise-status.overdue {
    background-color: #f8d7da;
    color: #721c24;
}

.exercise-status.submitted {
    background-color: #d4edda;
    color: #155724;
}

.exercise-footer {
    padding: 10px 12px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
}

.btn-start, .btn-continue, .btn-view {
    padding: 5px 12px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
    border: none;
    cursor: pointer;
}

.btn-start {
    background-color: var(--primary-color);
    color: white;
}

.btn-continue {
    background-color: #17a2b8;
    color: white;
}

.btn-view {
    background-color: #6c757d;
    color: white;
}

/* Grades Styles */
.grades-summary {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    padding: 15px;
    margin-bottom: 20px;
}

.grade-overview {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 20px;
}

.grade-card {
    background-color: rgba(8, 121, 144, 0.05);
    border-radius: 8px;
    padding: 15px;
    text-align: center;
}

.grade-card h4 {
    margin: 0 0 10px;
    font-size: 1rem;
    color: var(--secondary-color);
}

.grade-percentage {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 5px;
}

.grade-description {
    font-size: 0.8rem;
    color: var(--secondary-color);
}

.grade-distribution {
    padding: 15px;
}

.grade-distribution h4 {
    margin: 0 0 15px;
    font-size: 1rem;
    color: var(--secondary-color);
}

.grade-bars {
    display: grid;
    gap: 10px;
}

.grade-bar {
    display: grid;
    grid-template-columns: 40px 1fr 40px;
    align-items: center;
    gap: 10px;
}

.bar-label {
    font-size: 0.9rem;
    font-weight: 500;
}

.bar-container {
    height: 10px;
    background-color: #e9ecef;
    border-radius: 5px;
    overflow: hidden;
}

.bar-fill {
    height: 100%;
    background-color: var(--primary-color);
}

.bar-count {
    font-size: 0.9rem;
    text-align: right;
}

.course-grades {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    padding: 15px;
}

.grades-table {
    width: 100%;
    border-collapse: collapse;
}

.grades-table th, .grades-table td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
}

.grades-table th {
    font-weight: 600;
    color: var(--secondary-color);
    font-size: 0.9rem;
}

.status-badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
}

.status-badge.excellent {
    background-color: #d4edda;
    color: #155724;
}

.status-badge.good {
    background-color: #cce5ff;
    color: #004085;
}

.status-badge.average {
    background-color: #fff3cd;
    color: #856404;
}

/* Tutorials Styles */
.tutorial-categories {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
}

.category-card {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    padding: 15px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.category-icon {
    width: 50px;
    height: 50px;
    background-color: rgba(8, 121, 144, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
}

.category-icon i {
    font-size: 1.5rem;
    color: var(--primary-color);
}

.category-card h4 {
    margin: 0 0 5px;
    font-size: 1.1rem;
}

.category-card p {
    margin: 0 0 10px;
    font-size: 0.9rem;
    color: var(--secondary-color);
}

.tutorial-count {
    font-size: 0.8rem;
    color: var(--primary-color);
    font-weight: 500;
    margin-bottom: 15px;
}

.btn-explore {
    padding: 5px 15px;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
}

/* Progress Tracker Styles */
.progress-overview {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
}

.progress-chart {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    padding: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.chart-container {
    width: 150px;
    height: 150px;
    position: relative;
    margin-bottom: 15px;
}

.chart-progress {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: conic-gradient(var(--primary-color) 0% var(--progress), #e9ecef var(--progress) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
}

.chart-value {
    width: 100px;
    height: 100px;
    background-color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary-color);
}

.chart-legend {
    display: grid;
    gap: 10px;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
}

.legend-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.legend-color.completed {
    background-color: var(--primary-color);
}

.legend-color.in-progress {
    background-color: #17a2b8;
}

.legend-color.not-started {
    background-color: #e9ecef;
}

.milestones {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    padding: 15px;
}

.milestones h4 {
    margin: 0 0 15px;
    font-size: 1rem;
    color: var(--secondary-color);
}

.milestone-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 10px;
}

.milestone-list li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: 6px;
    background-color: rgba(8, 121, 144, 0.03);
}

.milestone-list li i {
    color: var(--primary-color);
    font-size: 1.1rem;
}

.milestone-list li div {
    display: flex;
    flex-direction: column;
}

.milestone-list li strong {
    font-size: 0.9rem;
}

.milestone-list li span {
    font-size: 0.8rem;
    color: var(--secondary-color);
}

.course-progress {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    padding: 15px;
}

.course-progress h4 {
    margin: 0 0 15px;
    font-size: 1rem;
    color: var(--secondary-color);
}

.progress-cards {
    display: grid;
    gap: 15px;
}

.progress-card {
    padding: 12px;
    border-radius: 6px;
    background-color: rgba(8, 121, 144, 0.03);
}

.progress-card h5 {
    margin: 0 0 10px;
    font-size: 0.9rem;
}

.progress-bar-container {
    height: 6px;
    background-color: #e9ecef;
    border-radius: 3px;
    margin-bottom: 5px;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background-color: var(--primary-color);
}

.progress-details {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--secondary-color);
}

/* Notes Styles */
.notes-container {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 20px;
}

.notes-sidebar {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    padding: 15px;
    display: flex;
    flex-direction: column;
}

.notes-search {
    position: relative;
    margin-bottom: 15px;
}

.notes-search input {
    width: 100%;
    padding: 8px 30px 8px 10px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 0.9rem;
}

.notes-search i {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--secondary-color);
}

.notes-folders {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.folder {
    display: flex;
    align-items: center;
    padding: 8px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
}

.folder:hover {
    background-color: rgba(8, 121, 144, 0.05);
}

.folder.active {
    background-color: rgba(8, 121, 144, 0.1);
    color: var(--primary-color);
    font-weight: 500;
}

.folder i {
    margin-right: 8px;
    font-size: 0.9rem;
}

.note-count {
    margin-left: auto;
    font-size: 0.8rem;
    background-color: rgba(8, 121, 144, 0.1);
    color: var(--primary-color);
    padding: 2px 6px;
    border-radius: 10px;
}

.notes-content {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    padding: 15px;
    display: flex;
    flex-direction: column;
}

.notes-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.btn-new-note {
    padding: 6px 12px;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
}

.notes-filter {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
}

.notes-filter select {
    padding: 5px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 0.9rem;
}

.notes-list {
    display: grid;
    gap: 15px;
}

.note-card {
    padding: 12px;
    border-radius: 6px;
    background-color: rgba(8, 121, 144, 0.03);
    border: 1px solid var(--border-color);
}

.note-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.note-header h5 {
    margin: 0;
    font-size: 0.9rem;
}

.note-date {
    font-size: 0.8rem;
    color: var(--secondary-color);
}

.note-preview {
    font-size: 0.9rem;
    color: var(--secondary-color);
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.note-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.note-course {
    font-size: 0.8rem;
    background-color: rgba(8, 121, 144, 0.1);
    color: var(--primary-color);
    padding: 2px 6px;
    border-radius: 10px;
}

.note-actions {
    display: flex;
    gap: 5px;
}

.btn-edit, .btn-delete {
    width: 25px;
    height: 25px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
}

.btn-edit {
    background-color: rgba(40, 167, 69, 0.1);
    color: #28a745;
}

.btn-delete {
    background-color: rgba(220, 53, 69, 0.1);
    color: #dc3545;
}

/* Certificates Styles */
.certificates-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.certificate-card {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.certificate-preview {
    height: 200px;
    background-color: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid var(--border-color);
}

.certificate-preview img {
    max-width: 100%;
    max-height: 100%;
}

.certificate-details {
    padding: 15px;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.certificate-details h4 {
    margin: 0 0 5px;
    font-size: 1.1rem;
}

.certificate-details p {
    margin: 0 0 15px;
    font-size: 0.9rem;
    color: var(--secondary-color);
}

.certificate-actions {
    display: flex;
    gap: 8px;
    margin-top: auto;
}

.btn-download, .btn-share, .btn-view {
    padding: 6px 12px;
    font-size: 0.9rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
}

.btn-download {
    background-color: var(--primary-color);
    color: white;
}

.btn-share {
    background-color: #6c757d;
    color: white;
}

.btn-view {
    background-color: #17a2b8;
    color: white;
}

/* Settings Styles */
.settings-container {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
}

.settings-tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
}

.tab {
    padding: 12px 20px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: 0.9rem;
    cursor: pointer;
    color: var(--secondary-color);
}

.tab.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
    font-weight: 500;
}

.settings-content {
    padding: 20px;
}

.profile-settings .form-group {
    margin-bottom: 15px;
}

.profile-settings label {
    display: block;
    margin-bottom: 5px;
    font-size: 0.9rem;
    font-weight: 500;
}

.profile-settings input, .profile-settings textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 0.9rem;
}

.profile-settings textarea {
    min-height: 100px;
    resize: vertical;
}

.avatar-upload {
    display: flex;
    align-items: center;
    gap: 15px;
}

.avatar-preview {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    background-color: #f8f9fa;
}

.avatar-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.btn-upload {
    padding: 6px 12px;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
}

.btn-save {
    padding: 8px 16px;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
}

.account-info {
    margin-bottom: 20px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid var(--border-color);
}

.info-label {
    font-weight: 500;
    color: var(--secondary-color);
}

.info-value {
    color: var(--text-color);
}

.info-value.active {
    color: #28a745;
}

.account-actions {
    display: flex;
    gap: 10px;
}

.btn-action {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
}

.btn-action.danger {
    background-color: #f8d7da;
    color: #721c24;
}

.notification-options {
    display: grid;
    gap: 15px;
    margin-bottom: 20px;
}

.option-item {
    display: flex;
    align-items: center;
    gap: 10px;
}

.switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 24px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
}

input:checked + .slider {
    background-color: var(--primary-color);
}

input:checked + .slider:before {
    transform: translateX(26px);
}

.email-frequency {
    display: flex;
    align-items: center;
    gap: 10px;
}

.email-frequency select {
    padding: 5px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 0.9rem;
}

.security-sessions .session-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--border-color);
}

.session-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.session-info i {
    font-size: 1.2rem;
    color: var(--primary-color);
}

.session-info div {
    display: flex;
    flex-direction: column;
}

.session-info strong {
    font-size: 0.9rem;
}

.session-info span {
    font-size: 0.8rem;
    color: var(--secondary-color);
}

.btn-logout {
    padding: 5px 10px;
    background-color: #f8d7da;
    color: #721c24;
    border: none;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

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

.btn-click-animation:active,
.clicking {
    transform: scale(0.97);
}

.dashboard-section {
    transition: opacity 0.3s ease;
}

.dashboard-section.fading {
    opacity: 0;
}

@media (max-width: 1024px) {
    .dashboard-container:not(.no-sidebar-padding) {
      padding-left: 3.2rem !important;
    }
 }

/* Responsive styles */
@media (max-width: 1200px) {
    .cards-container {
        grid-template-columns: repeat(2, 1fr);
    }

    .grade-overview {
        grid-template-columns: 1fr;
    }

    .progress-overview {
        grid-template-columns: 1fr;
    }
}

/* ✅ FIXED: Tablet spacing - remove padding when sidebar is collapsed */
@media (max-width: 992px) {
    .dashboard-sidebar {
        transform: translateX(-100%);
        width: 240px;
    }

    .dashboard-sidebar.collapsed {
        transform: translateX(0);
        width: 50px;
    }

    .dashboard-main {
        margin-left: 0 !important;
        padding-left: 0 !important;
        transition: margin-left 0.3s ease, padding-left 0.3s ease;
    }

    .dashboard-sidebar:not(.collapsed) {
        width: 240px;
        transform: translateX(0);
    }

    .dashboard-content {
        padding: 18px 12px;
    }

    /* Remove padding when sidebar is collapsed on tablets */
    .dashboard-sidebar.collapsed + .dashboard-main {
        padding-left: 0 !important;
    }

    .card-header {
        padding: 8px;
    }

    .card-stat {
        font-size: 1.2rem;
    }

    .notes-container {
        grid-template-columns: 1fr;
    }

    .notes-sidebar {
        display: none;
    }
}

@media (min-width: 1025px){
    .dashboard-content{
        padding: .7rem .9rem;
    }
}

@media (max-width: 768px) {
    .dashboard-header {
        padding: 10.3px 27px;
        flex-direction: row;
        align-items: center;
        gap: 12px;
    }

    .sidebar-nav a {
    padding: 7.8px 12px;
}

    .cards-container {
        grid-template-columns: 1fr;
    }

    .header-actions {
        width: auto;
        justify-content: flex-end;
        margin-top: 0;
    }

    .dashboard-greeting h3 {
        font-size: 1rem;
    }

    .page-title h2 {
        font-size: 1.1rem;
        margin-left: -.4rem !important;
        margin-bottom: 0;
    }

    .card-header h4 {
        font-size: 0.8rem;
    }

    .card-stat {
        font-size: 1rem;
    }
}

@media (max-width: 576px) {
    .dashboard-sidebar:not(.collapsed) {
        width: 100%;
        max-width: 280px;
    }

    /* .dashboard-content {
        padding: 12px;
    } */

    .dashboard-card {
        max-width: 100%;
        padding: 5px;
    }

    .dashboard-header {
        height: auto;
        padding: 10.3px 18px;
    }

    .card-content {
        padding: 8px;
    }

    .card-stat {
        font-size: 0.9rem;
    }

    .section-title {
        font-size: var(--fs-md);
    }

    .dashboard-sidebar.collapsed + .dashboard-main {
        padding-left: 0 !important;
    }

    .dashboard-sidebar.collapsed + .dashboard-main .dashboard-header {
        padding-left: 18px;
    }
}
</style>