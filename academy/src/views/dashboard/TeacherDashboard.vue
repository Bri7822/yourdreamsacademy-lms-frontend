<template>
  <div class="dashboard-container">
    <div class="dashboard-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="logo-container">
        <h1 class="dashboard-logo ms-1">Your Dreams Academy</h1>
        <button class="sidebar-toggle me-3" @click="toggleSidebar">
          <i :class="sidebarCollapsed ? 'fas fa-bars' : 'fas fa-times'"></i>
        </button>
      </div>

      <div class="user-profile">
        <div class="avatar">
          <span class="avatar-initial">{{ getUserInitials }}</span>
        </div>
        <div class="user-info" v-if="!sidebarCollapsed">
          <h3 class="user-name">{{ user.first_name }} {{ user.last_name }}</h3>
          <span class="user-role">Teacher</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <ul>
          <li
            v-for="(item, index) in navItems"
            :key="index"
            :class="{
              active: activeNavItem === item.id,
              'under-development': item.underDevelopment,
            }"
          >
            <a
              href="#"
              @click.prevent="handleNavClick(item.id, $event)"
              :class="getButtonClass(activeNavItem === item.id)"
            >
              <div class="nav-icon-container">
                <i :class="item.icon"></i>
                <!-- Dot indicator for collapsed sidebar -->
                <span
                  v-if="item.underDevelopment && sidebarCollapsed"
                  class="dev-indicator-dot"
                ></span>
              </div>
              <span v-if="!sidebarCollapsed" class="nav-label">
                {{ item.label }}
                <!-- Badge for expanded sidebar -->
                <span v-if="item.underDevelopment" class="dev-badge">
                  <span class="dev-badge-text">Dev</span>
                </span>
              </span>

              <!-- Tooltip for collapsed sidebar -->
              <div v-if="sidebarCollapsed && item.underDevelopment" class="dev-tooltip">
                Under Development
              </div>
            </a>
          </li>
        </ul>
      </nav>

      <div class="sidebar-footer">
        <button class="logout-btn" @click="handleLogout">
          <i class="fas fa-sign-out-alt"></i>
          <span v-if="!sidebarCollapsed">Logout</span>
        </button>
      </div>
    </div>

    <div class="dashboard-main">
      <header class="dashboard-header">
        <div class="page-title">
          <!-- <h2>{{ currentPageTitle }}</h2> -->
        </div>
        <div class="header-actions">
          <router-link to="/" class="header-action-btn" title="Home" exact-active-class="active">
            <i class="fas fa-home"></i>
          </router-link>

          <!-- Notification Bell -->
          <button class="header-action-btn notification-btn" title="Notifications">
            <i class="fas fa-bell"></i>
            <span class="notification-badge" v-if="notificationCount > 0">
              {{ notificationCount }}
            </span>
          </button>
        </div>
      </header>

      <main class="dashboard-content">
        <!-- Use Vue transition for page changes -->
        <Transition name="fade" mode="out-in">
          <!-- Dashboard - Home -->
          <div
            v-if="activeNavItem === 'dashboard'"
            class="dashboard-section"
            key="dashboard"
            :class="{ fading: pageTransitioning }"
          >
            <div class="dashboard-greeting">
              <h3>Welcome back, {{ user.first_name }}!</h3>
              <p>{{ welcomeMessage }}</p>
            </div>

            <div class="cards-container">
              <div
                v-for="(item, index) in 4"
                :key="'teacher-card-' + index"
                :class="getCardClass(index)"
                :style="getCardStyle(index)"
              >
                <!-- Card 1 - My Courses -->
                <div v-if="index === 0" class="card-header">
                  <i class="fas fa-book"></i>
                  <h4>My Courses</h4>
                </div>
                <div v-if="index === 0" class="card-content">
                  <div class="card-stat">{{ statistics.courses }}</div>
                  <p>Active Courses</p>
                </div>
                <div v-if="index === 0" class="card-footer">
                  <a href="#" @click.prevent="setActiveNavItem('courses')">Manage Courses</a>
                </div>

                <!-- Card 2 - Students -->
                <div v-if="index === 1" class="card-header">
                  <i class="fas fa-users"></i>
                  <h4>Students</h4>
                </div>
                <div v-if="index === 1" class="card-content">
                  <div class="card-stat">{{ statistics.students }}</div>
                  <p>Total Students</p>
                </div>
                <div v-if="index === 1" class="card-footer">
                  <a href="#" @click.prevent="setActiveNavItem('students')">View Students</a>
                </div>

                <!-- Card 3 - Enrollments -->
                <div v-if="index === 2" class="card-header">
                  <i class="fas fa-user-graduate"></i>
                  <h4>Enrollments</h4>
                </div>
                <div v-if="index === 2" class="card-content">
                  <div class="card-stat">{{ statistics.enrollments }}</div>
                  <p>Total Enrollments</p>
                </div>
                <div v-if="index === 2" class="card-footer">
                  <a href="#" @click.prevent="setActiveNavItem('enrollments')">View Details</a>
                </div>

                <!-- Card 4 - Earnings -->
                <div v-if="index === 3" class="card-header">
                  <i class="fas fa-chart-line"></i>
                  <h4>Earnings</h4>
                </div>
                <div v-if="index === 3" class="card-content">
                  <div class="card-stat">${{ statistics.earnings.toLocaleString() }}</div>
                  <p>Monthly Earnings</p>
                </div>
                <div v-if="index === 3" class="card-footer">
                  <a href="#" @click.prevent="setActiveNavItem('earnings')">View Reports</a>
                </div>
              </div>
            </div>

            <div class="recent-activity">
              <h3 class="section-title">Recent Activity</h3>
              <ul class="activity-list">
                <li
                  v-for="(activity, index) in recentActivities"
                  :key="index"
                  class="activity-item"
                >
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
          </div>

          <!-- Courses Management Section -->
          <div v-else-if="activeNavItem === 'courses'" class="dashboard-section" key="courses">
            <h3 class="section-title">Course Management</h3>
            <p>View, create, and manage all your courses.</p>
            <!-- Courses content placeholder -->
            <div class="admin-content-placeholder">
              <p>Course management interface would display here, including:</p>
              <ul>
                <li>Your course listing with filters and search</li>
                <li>Course creation and editing tools</li>
                <li>Content management</li>
                <li>Course analytics and student performance</li>
              </ul>
            </div>
          </div>

          <!-- Students Section -->
          <div v-else-if="activeNavItem === 'students'" class="dashboard-section" key="students">
            <h3 class="section-title">Student Management</h3>
            <p>View and manage students enrolled in your courses.</p>
            <!-- Students content placeholder -->
            <div class="admin-content-placeholder">
              <p>Student management interface would display here, including:</p>
              <ul>
                <li>Student listing with filters and search</li>
                <li>Student progress tracking</li>
                <li>Communication tools</li>
                <li>Performance analytics</li>
              </ul>
            </div>
          </div>

          <!-- Enrollments Section -->
          <div
            v-else-if="activeNavItem === 'enrollments'"
            class="dashboard-section"
            key="enrollments"
          >
            <h3 class="section-title">Enrollment Management</h3>
            <p>View and manage enrollments in your courses.</p>
            <!-- Enrollments content placeholder -->
            <div class="admin-content-placeholder">
              <p>Enrollment management interface would display here, including:</p>
              <ul>
                <li>Enrollment statistics and trends</li>
                <li>Enrollment approval workflows</li>
                <li>Course completion tracking</li>
                <li>Student engagement metrics</li>
              </ul>
            </div>
          </div>

          <!-- Earnings Reports Section -->
          <div v-else-if="activeNavItem === 'earnings'" class="dashboard-section" key="earnings">
            <h3 class="section-title">Earnings Analytics</h3>
            <p>Track your earnings and generate reports.</p>
            <!-- Earnings content placeholder -->
            <div class="admin-content-placeholder">
              <p>Earnings analytics interface would display here, including:</p>
              <ul>
                <li>Earnings by course and time period</li>
                <li>Payment history</li>
                <li>Withdrawal management</li>
                <li>Revenue forecasting</li>
              </ul>
            </div>
          </div>

          <!-- Settings Section -->
          <div v-else-if="activeNavItem === 'settings'" class="dashboard-section" key="settings">
            <h3 class="section-title">Teacher Settings</h3>
            <p>Configure your teacher profile and preferences.</p>
            <!-- Settings content placeholder -->
            <div class="admin-content-placeholder">
              <p>Teacher settings interface would display here, including:</p>
              <ul>
                <li>Profile configuration</li>
                <li>Notification settings</li>
                <li>Payment preferences</li>
                <li>Account security</li>
              </ul>
            </div>
          </div>
        </Transition>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// User data (mock data that would come from your auth store)
const user = ref({
  id: 1,
  first_name: 'Teacher',
  last_name: 'User',
  email: 'teacher@dreamacademy.com',
  user_type: 'teacher',
})

// Mock statistics for Teacher dashboard
const statistics = ref({
  courses: 8,
  students: 215,
  enrollments: 587,
  earnings: 8750,
})

// Animation states
const cardLoadingComplete = ref(false)
const pageTransitioning = ref(false)

// Set user from auth store on component mount
onMounted(() => {
  if (authStore.user) {
    user.value = authStore.user
  } else {
    // Redirect to login if no user in auth store
    router.push('/login')
  }

  // Add click event listener to document for closing dropdown
  document.addEventListener('click', handleDocumentClick)

  // Initialize card animations with staggered delay
  initCardAnimations()

  // Set sidebar to collapsed by default on mobile
  if (window.innerWidth < 992) {
    sidebarCollapsed.value = true
  }
})

onUnmounted(() => {
  // Remove event listeners on component unmount
  document.removeEventListener('click', handleDocumentClick)
})

// Initialize card animations
const initCardAnimations = () => {
  // Use setTimeout to simulate jQuery's delayed animations
  setTimeout(() => {
    cardLoadingComplete.value = true
  }, 100)
}

// Navigation state
const sidebarCollapsed = ref(false)
const activeNavItem = ref('dashboard')
const showUserDropdown = ref(false)
const userDropdown = ref(null)
const notificationCount = ref(3)

// Teacher navigation items - Added underDevelopment property
const navItems = ref([
  { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt', underDevelopment: true },
  { id: 'courses', label: 'My Courses', icon: 'fas fa-book', underDevelopment: true },
  { id: 'students', label: 'Students', icon: 'fas fa-users', underDevelopment: true },
  { id: 'enrollments', label: 'Enrollments', icon: 'fas fa-user-graduate', underDevelopment: true },
  { id: 'earnings', label: 'Earnings', icon: 'fas fa-chart-line', underDevelopment: true },
  { id: 'settings', label: 'Settings', icon: 'fas fa-cog', underDevelopment: true },
])

// Mock recent activities
const recentActivities = ref([
  {
    icon: 'fas fa-user-plus text-success',
    text: 'New student enrolled in "Advanced Data Science"',
    time: '30 minutes ago',
  },
  {
    icon: 'fas fa-comment text-primary',
    text: 'New question posted in "Python Fundamentals" discussion',
    time: '2 hours ago',
  },
  {
    icon: 'fas fa-dollar-sign text-warning',
    text: 'New payment received for "Web Development Bootcamp"',
    time: 'Yesterday',
  },
  {
    icon: 'fas fa-check-circle text-info',
    text: 'Student completed "JavaScript Masterclass" course',
    time: '2 days ago',
  },
])

// Computed properties
const currentPageTitle = computed(() => {
  const current = navItems.value.find((item) => item.id === activeNavItem.value)
  return current ? current.label : 'Dashboard'
})

const welcomeMessage = computed(() => {
  return "Here's an overview of your teaching activity and key metrics."
})

const getUserInitials = computed(() => {
  return `${user.value.first_name.charAt(0)}${user.value.last_name.charAt(0)}`
})

// Card animation classes
const getCardClass = () => {
  return {
    'dashboard-card': true,
    'card-animate': cardLoadingComplete.value,
    'card-delay': true,
  }
}

const getCardStyle = (index) => {
  return {
    animationDelay: `${index * 100}ms`,
  }
}

// Event handlers
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const setActiveNavItem = async (itemId) => {
  // Use Vue's transition approach
  pageTransitioning.value = true

  // Short delay to allow CSS transition to happen
  setTimeout(() => {
    activeNavItem.value = itemId

    // Reset transition state after content has changed
    nextTick(() => {
      pageTransitioning.value = false
    })
  }, 150)

  // Close user dropdown if open
  showUserDropdown.value = false
}

const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value
}

const handleDocumentClick = (event) => {
  if (userDropdown.value && !userDropdown.value.contains(event.target)) {
    showUserDropdown.value = false
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// Button animation classes
const getButtonClass = (isActive) => {
  return {
    active: isActive,
    'btn-click-animation': true,
  }
}

// Handle button click animation
const handleButtonClick = (event) => {
  const button = event.currentTarget
  button.classList.add('clicking')
  setTimeout(() => {
    button.classList.remove('clicking')
  }, 200)
}

// ADD THIS RIGHT BELOW IT:
const handleNavClick = (itemId, event) => {
  setActiveNavItem(itemId)
  handleButtonClick(event)
}
</script>

<style>
/* Additional specific Teacher dashboard styles */
.admin-content-placeholder {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 18px;
  margin-top: 18px;
  box-shadow: 0 2px 4px var(--shadow-color);
}

.admin-content-placeholder p {
  margin-bottom: 10px;
  font-weight: 500;
}

.admin-content-placeholder ul {
  padding-left: 18px;
}

.admin-content-placeholder ul li {
  margin-bottom: 8px;
  color: var(--secondary-color);
}

/* Dashboard Layout */
.dashboard-container {
  display: flex;
  height: 100vh;
  background-color: var(--gray-bg);
  font-family: var(--font-body);
}

/* Sidebar Styles */
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
  transition:
    width 0.3s ease,
    transform 0.3s ease;
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
  position: relative;
}

.sidebar-nav a {
  display: flex;
  align-items: center;
  padding: 10.8px 18px;
  color: var(--secondary-color);
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  position: relative;
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

/* Under development items styling */
.sidebar-nav li.under-development a {
  opacity: 0.85;
}

.sidebar-nav li.under-development a:hover {
  opacity: 1;
}

.sidebar-nav li.under-development.active a {
  opacity: 1;
}

.nav-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-nav i {
  font-size: var(--fs-base);
  margin-right: 14.4px;
  width: 18px;
  text-align: center;
  flex-shrink: 0;
}

/* Development badge for expanded sidebar */
.dev-badge {
  margin-left: 8px;
  padding: 2px 6px;
  background: linear-gradient(135deg, #ff9800, #ff5722);
  color: white;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  animation: pulse 2s infinite;
  box-shadow: 0 2px 4px rgba(255, 87, 34, 0.3);
}

.dev-badge-text {
  position: relative;
  top: -0.5px;
}

/* Dot indicator for collapsed sidebar */
.dev-indicator-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #ff9800, #ff5722);
  border-radius: 50%;
  border: 2px solid var(--sidebar-bg);
  animation: pulse 2s infinite;
  z-index: 2;
}

/* Tooltip for collapsed sidebar */
.dev-tooltip {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-left: 12px;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dev-tooltip::before {
  content: '';
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: transparent rgba(0, 0, 0, 0.85) transparent transparent;
}

.dashboard-sidebar.collapsed li.under-development:hover .dev-tooltip {
  opacity: 1;
}

.nav-label {
  display: flex;
  align-items: center;
  flex: 1;
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

/* Pulsing animation for dev indicators */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.7);
  }
  70% {
    box-shadow: 0 0 0 4px rgba(255, 152, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0);
  }
}

/* Main Content Area */
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

/* Header Styles */
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
  /* margin-left: -.7rem !important; */
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
  color: var(--secondary-color);
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

/* Content Area */
.dashboard-content {
  flex: 1;
  padding: 18px 15px;
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
}

/* Cards */
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
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
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

/* Recent Activity */
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

/* Add transitions for sidebar and content */
.dashboard-sidebar {
  transition:
    width 0.3s ease,
    transform 0.3s ease;
}

.dashboard-main {
  transition: margin-left 0.3s ease;
}

/* Animation classes */
.card-hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.button-click {
  transform: scale(0.98);
}

/* Fade animations for page transitions */
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

/* Button click animation */
.btn-click-animation:active,
.clicking {
  transform: scale(0.97);
}

/* Page transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.dashboard-section {
  transition: opacity 0.3s ease;
}

.dashboard-section.fading {
  opacity: 0;
}

/* Sidebar transition */
.dashboard-sidebar {
  transition:
    width 0.3s ease,
    transform 0.3s ease;
}

.dashboard-main {
  transition: margin-left 0.3s ease;
}

/* Animation delays for cards */
.card-delay:nth-child(1) {
  animation-delay: 0ms;
}
.card-delay:nth-child(2) {
  animation-delay: 100ms;
}
.card-delay:nth-child(3) {
  animation-delay: 200ms;
}

.nav-link-custom.router-link-active[href='/dashboard'] {
  color: #087990;
  font-weight: 500;
}

.nav-link-custom.router-link-active[href='/dashboard'] i {
  color: #087990;
}
.header-action-btn {
  /* Layout */
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;

  /* Appearance */
  background: none;
  border: none;
  border-radius: 50%;
  color: var(--primary-color);
  cursor: pointer;
  text-decoration: none;

  /* Animation */
  transition: all 0.2s ease;
}

/* Hover & Active States */
.header-action-btn:hover {
  background-color: rgba(8, 121, 144, 0.1);
  color: var(--primary-color);
  transform: scale(1.1);
}

.header-action-btn.active {
  color: var(--primary-color);
  background-color: rgba(8, 121, 144, 0.15);
}

/* Icon Styling */
.header-action-btn i {
  font-size: 1.2rem;
}

/* Pulse Animation (for both) */
@keyframes gentle-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
  }
}

.header-action-btn.pulse {
  animation: gentle-pulse 0.5s ease;
}

/* Key frame animations */
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
@media (max-width: 1440px) {
  .cards-container {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Responsive styles */
@media (max-width: 1200px) {
  .cards-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

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
    padding-left: 50px; /* Matches sidebar width */
    transition:
      margin-left 0.3s ease,
      padding-left 0.3s ease;
  }

  .dashboard-sidebar:not(.collapsed) {
    width: 240px;
    transform: translateX(0);
  }

  .dashboard-content {
    padding: 18px 12px;
  }

  /* Add space between sidebar and content when collapsed on mobile */
  .dashboard-sidebar.collapsed + .dashboard-main {
    padding-left: 70px;
  }

  .card-header {
    padding: 8px;
  }

  .card-stat {
    font-size: 1.2rem;
  }

  .cards-container {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-header {
    padding: 10.3px 12px; /* Reduced padding to be closer to sidebar */
    flex-direction: row; /* Keep horizontal layout */
    align-items: center;
    justify-content: space-between;
  }

  .header-actions {
    width: auto;
    justify-content: flex-end;
    margin-top: 0;
  }

  .page-title h2 {
    font-size: 1.1rem;
    margin: 0;
    /* Alignment with content below */
    padding-left: 0;
  }

  /* For tablets specifically - ensure proper spacing when sidebar is collapsed */
  .dashboard-sidebar.collapsed + .dashboard-main .dashboard-header {
    padding-left: 12px; /* Consistent padding */
  }
}

/* Tablet styles (768px - 992px) */
@media (min-width: 768px) and (max-width: 992px) {
  .cards-container {
    grid-template-columns: repeat(2, 1fr);
    grid-template-areas:
      'card1 card2'
      'card3 card4'
      'activity activity';
  }

  .dashboard-card:nth-child(1) {
    grid-area: card1;
  }
  .dashboard-card:nth-child(2) {
    grid-area: card2;
  }
  .dashboard-card:nth-child(3) {
    grid-area: card3;
  }
  .dashboard-card:nth-child(4) {
    grid-area: card4;
  }

  .recent-activity {
    grid-area: activity;
    margin-top: 15px;
  }
}

@media (min-width: 600px) and (max-width: 992px) {
  .cards-container {
    grid-template-columns: repeat(2, 1fr) !important;
    grid-template-areas:
      'card1 card2'
      'card3 card4'
      'activity activity' !important;
    margin-right: 1rem !important;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    padding: 10.3px 27px; /* Consistent padding */
    flex-direction: row; /* Keep horizontal layout */
    align-items: center;
    gap: 12px;
  }

  .cards-container {
    grid-template-columns: 1fr;
    grid-template-areas:
      'card1'
      'card2'
      'card3'
      'card4'
      'activity';
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
    margin-left: -0.4rem !important;
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

  .dashboard-content {
    padding: 12px;
  }

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

  /* Ensure space between collapsed sidebar and content on small screens */
  .dashboard-sidebar.collapsed + .dashboard-main {
    padding-left: 50px;
  }

  .dashboard-sidebar.collapsed + .dashboard-main .dashboard-header {
    padding-left: 18px;
  }

  /* Responsive adjustments for dev badges */
  .dev-badge {
    font-size: 8px;
    padding: 1px 5px;
  }
}
</style>
