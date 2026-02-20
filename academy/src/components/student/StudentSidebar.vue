<template>
  <div class="dashboard-sidebar" :class="{ 'collapsed': sidebarCollapsed }">
    <div class="logo-container">
      <h1 class="dashboard-logo ms-1">Your Dreams Academy</h1>
      <button class="sidebar-toggle me-3" @click="$emit('toggle-sidebar')">
        <i :class="sidebarCollapsed ? 'fas fa-bars' : 'fas fa-times'"></i>
      </button>
    </div>

    <div class="user-profile">
      <div class="avatar">
        <span class="avatar-initial">{{ getUserInitials }}</span>
      </div>
      <div class="user-info" v-if="!sidebarCollapsed">
        <h3 class="user-name">{{ user.first_name }} {{ user.last_name }}</h3>
        <span class="user-role">Student</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <ul>
        <li v-for="(item, index) in navItems" :key="index"
            :class="{
              'active': isActiveNavItem(item),
              'under-development': item.underDevelopment
            }">
          <router-link
            :to="item.path"
            class="nav-link"
            @click="handleNavClick($event, item.id)"
          >
            <div class="nav-icon-container">
              <i :class="item.icon"></i>
              <!-- Dot indicator for collapsed sidebar -->
              <span v-if="item.underDevelopment && sidebarCollapsed"
                    class="dev-indicator-dot"></span>
            </div>
            <span v-if="!sidebarCollapsed" class="nav-label">
              {{ item.label }}
              <!-- Badge for expanded sidebar -->
              <span v-if="item.underDevelopment" class="dev-badge">
                <span class="dev-badge-text">Dev</span>
              </span>
            </span>

            <!-- Tooltip for collapsed sidebar -->
            <div v-if="sidebarCollapsed && item.underDevelopment"
                 class="dev-tooltip">
              Under Development
            </div>
          </router-link>
        </li>
      </ul>
    </nav>

    <div class="sidebar-footer">
      <button class="logout-btn" @click="$emit('logout')">
        <i class="fas fa-sign-out-alt"></i>
        <span v-if="!sidebarCollapsed">Logout</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const props = defineProps({
  sidebarCollapsed: Boolean,
  activeNavItem: String,
  user: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['toggle-sidebar', 'logout', 'nav-change'])

const getUserInitials = computed(() => {
  return `${props.user.first_name.charAt(0)}${props.user.last_name.charAt(0)}`
})

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt', path: '/student', underDevelopment: false },
  { id: 'courses', label: 'My Courses', icon: 'fas fa-book', path: '/student/courses', underDevelopment: false },
  { id: 'Lessons', label: 'Lessons', icon: 'fas fa-graduation-cap', path: '/student/view-lessons', underDevelopment: false },
  { id: 'grades', label: 'My Grades', icon: 'fas fa-star', path: '/student/grades', underDevelopment: true },
  { id: 'progress', label: 'My Progress', icon: 'fas fa-chart-line', path: '/student/progress', underDevelopment: true },
  { id: 'notes', label: 'Notes', icon: 'fas fa-sticky-note', path: '/student/notes', underDevelopment: true },
  { id: 'certificates', label: 'Certificates', icon: 'fas fa-certificate', path: '/student/certificates', underDevelopment: true },
  { id: 'settings', label: 'Settings', icon: 'fas fa-cog', path: '/student/settings', underDevelopment: true }
]

// ✅ FIX: Enhanced active detection that handles nested routes correctly
const isActiveNavItem = (item) => {
  const currentPath = route.path

  // Exact match for dashboard (home route)
  if (item.id === 'dashboard') {
    return currentPath === '/student' || currentPath === '/student/'
  }

  // Handle course-related nested routes
  if (item.id === 'courses') {
    // Only activate for courses list and course detail, NOT lesson detail
    return (currentPath === '/student/courses' ||
            currentPath === '/student/courses/' ||
            (currentPath.startsWith('/student/courses/') &&
             !currentPath.includes('/lessons')))
  }

  // Handle lesson-related nested routes
  if (item.id === 'Lessons') {
    // Activate for:
    // 1. /student/view-lessons (main lessons page)
    // 2. /student/courses/:courseSlug/lessons/:lessonId (lesson detail)
    return currentPath === '/student/view-lessons' ||
           currentPath === '/student/view-lessons/' ||
           currentPath.includes('/lessons/')
  }

  // For all other nav items, use exact path matching
  return currentPath === item.path || currentPath === item.path + '/'
}

const handleNavClick = (event, itemId) => {
  const item = navItems.find(navItem => navItem.id === itemId);
  if (item) {
    router.push(item.path);
  }

  // Add null check for event.currentTarget
  if (event && event.currentTarget) {
    event.currentTarget.classList.add('clicking');
    setTimeout(() => {
      if (event.currentTarget) {
        event.currentTarget.classList.remove('clicking');
      }
    }, 200);
  }

  emit('nav-change', itemId);

  // Auto-collapse sidebar on mobile if needed
  if (window.innerWidth < 992 && !props.sidebarCollapsed) {
    emit('toggle-sidebar');
  }
}
</script>

<style scoped>
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
  transition: width 0.3s ease, transform 0.3s ease;
  z-index: 1000;
  overflow: hidden;
}

.dashboard-sidebar.collapsed {
  width: 60px;
}

.logo-container {
  padding: 12px 14px; /* Reduced padding */
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
  min-height: 60px; /* Fixed height for consistency */
}

.dashboard-logo {
  font-family: var(--font-heading);
  font-size: 16px; /* Slightly smaller font */
  font-weight: 600;
  color: var(--primary-color);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.sidebar-toggle {
  background: none;
  border: none;
  color: var(--secondary-color);
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 4px;
}

.sidebar-toggle:hover {
  background-color: rgba(8, 121, 144, 0.1);
}

.user-profile {
  padding: 12px 14px; /* Reduced padding */
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  min-height: 60px; /* Fixed height */
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 13px;
  margin-right: 10px;
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
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.user-role {
  font-size: 12px;
  color: var(--secondary-color);
  display: block;
  line-height: 1.2;
}

.sidebar-nav {
  flex: 1;
  padding: 5px 0; /* Reduced padding */
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-nav li {
  margin: 1px 0; /* Reduced vertical spacing between items */
  position: relative;
}

.sidebar-nav a {
  display: flex;
  align-items: center;
  padding: 10px 14px; /* Reduced padding */
  color: var(--secondary-color);
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  font-size: 13px; /* Smaller font */
  min-height: 40px; /* Reduced height */
  line-height: 1.2;
  position: relative;
}

.sidebar-nav a:hover {
  background-color: rgba(8, 121, 144, 0.05);
  color: var(--primary-color) !important;
}

.sidebar-nav a.router-link-exact-active {
  background-color: rgba(8, 121, 144, 0.05);
  color: var(--primary-color) !important;
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

.sidebar-nav i {
  font-size: 14px; /* Slightly smaller icons */
  margin-right: 12px; /* Reduced spacing */
  width: 16px; /* Fixed width */
  text-align: center;
  flex-shrink: 0;
}

.nav-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
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
  padding: 10px 14px; /* Reduced padding */
  border-top: 1px solid var(--border-color);
  min-height: 50px; /* Fixed height */
}

.logout-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--secondary-color);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-body);
  font-size: 13px; /* Smaller font */
  min-height: 36px; /* Fixed height */
  justify-content: start;
}

.logout-btn:hover {
  background-color: rgba(220, 53, 69, 0.1);
  color: var(--error-color);
  border-color: rgba(220, 53, 69, 0.2);
}

.logout-btn i {
  margin-right: 8px;
  font-size: 13px;
}

/* Animation for clicking effect */
.clicking {
  transform: scale(0.98);
  opacity: 0.9;
  transition: transform 0.1s ease, opacity 0.1s ease;
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

/* Responsive styles */
@media (max-width: 992px) {
  .dashboard-sidebar {
    transform: translateX(-100%);
    width: 240px;
  }

  .dashboard-sidebar.collapsed {
    transform: translateX(0);
    width: 50px;
  }
}

@media (max-width: 576px) {
  .dashboard-sidebar:not(.collapsed) {
    width: 100%;
    max-width: 280px;
  }

  .dashboard-logo {
    font-size: 15px;
  }

  .sidebar-nav a {
    padding: 8px 12px;
    font-size: 12px;
    min-height: 36px;
  }

  .sidebar-nav i {
    font-size: 13px;
    margin-right: 10px;
  }

  .dev-badge {
    font-size: 8px;
    padding: 1px 5px;
  }
}

/* Custom scrollbar for sidebar */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>