<template>
  <div class="dashboard-container">
    <AdminSidebar
      :sidebarCollapsed="sidebarCollapsed"
      :activeNavItem="activeNavItem"
      :user="user"
      @toggle-sidebar="toggleSidebar"
      @logout="handleLogout"
    />

    <!-- Overlay backdrop for mobile when sidebar is open -->
    <div
      class="sidebar-overlay"
      :class="{ active: !sidebarCollapsed }"
      @click="toggleSidebar"
    />

    <div class="dashboard-main" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <AdminHeader
        :user="user"
        :notificationCount="notificationCount"
        @toggle-sidebar="toggleSidebar"
        @logout="handleLogout"
      />

      <main class="dashboard-content">
        <router-view :user="user" />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import AdminHeader from '@/components/admin/AdminHeader.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// User data
const user = ref({
  id: 1,
  first_name: 'Admin',
  last_name: 'User',
  email: 'admin@dreamacademy.com',
  user_type: 'admin',
})

// Animation states
const sidebarCollapsed = ref(false)
const notificationCount = ref(5)

// Admin navigation items
const navItems = ref([
  { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt', route: 'admin-dashboard' },
  { id: 'users', label: 'Users', icon: 'fas fa-users', route: 'admin-users' },
  { id: 'courses', label: 'Courses', icon: 'fas fa-book', route: 'admin-courses' },
  { id: 'enrollments', label: 'Enrollments', icon: 'fas fa-user-graduate', route: 'admin-enrollments' },
  { id: 'revenue', label: 'Revenue', icon: 'fas fa-chart-line', route: 'admin-revenue' },
  { id: 'settings', label: 'Settings', icon: 'fas fa-cog', route: 'admin-settings' }
])

// Computed properties
const currentPageTitle = computed(() => {
  return route.meta.title || 'Dashboard'
})

const activeNavItem = computed(() => {
  return route.name?.replace('admin-', '') || 'dashboard'
})

// Set user from auth store on component mount
onMounted(() => {
  if (authStore.user) {
    user.value = authStore.user
  } else {
    router.push('/login')
  }

  // Set sidebar to collapsed by default on mobile
  if (window.innerWidth < 992) {
    sidebarCollapsed.value = true
  }
})

// Event handlers
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
const statistics = ref({
  users: 587,
  courses: 42,
  enrollments: 2145,
  revenue: 38750
})

const recentActivities = ref([
  {
    icon: 'fas fa-user-plus text-success',
    text: 'New teacher account created for Sarah Johnson',
    time: '10 minutes ago'
  },
  // ... other activities ...
])

const cardLoadingComplete = ref(true)
</script>

<style>
/* Dashboard Layout */
.dashboard-container {
    display: flex;
    height: 100vh;
    background-color: var(--gray-bg);
    font-family: var(--font-body);
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

/* Large screens: main content shifts when sidebar collapses */
.dashboard-main.sidebar-collapsed {
    margin-left: 60px;
}

/* Content Area */
.dashboard-content {
    flex: 1;
    padding: 18px 15px;
}

.dashboard-section {
    animation: fadeIn 0.3s ease;
}

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

/* Fade animations for page transitions */
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

/* Sidebar overlay backdrop (mobile only) */
.sidebar-overlay {
    display: none;
}

/* Responsive styles */
@media (min-width: 768px) and (max-width: 992px) {
  .dashboard-main {
    margin-left: 0 !important;
    padding-left: 50px;
    transition: margin-left 0.3s ease, padding-left 0.3s ease;
  }

  .dashboard-content {
    padding-left: 1.5rem !important;
  }
}

@media (max-width: 767px) {
  /* Main content always fills full width — sidebar floats above it */
  .dashboard-main {
    margin-left: 0 !important;
    padding-left: 0;
    width: 100%;
  }

  .dashboard-content {
    padding-left: 4.3rem !important;
  }

  /* Sidebar overlays the content when expanded */
  .dashboard-container :deep(.dashboard-sidebar),
  .dashboard-container .dashboard-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 1050;
    transform: translateX(0);
    transition: transform 0.3s ease;
  }

  /* Collapsed state: slide sidebar off-screen to the left */
  .dashboard-container :deep(.dashboard-sidebar.collapsed),
  .dashboard-container .dashboard-sidebar.collapsed {
    transform: translateX(-100%);
  }

  /* Dimmed overlay backdrop when sidebar is open */
  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 1040;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .sidebar-overlay.active {
    opacity: 1;
    pointer-events: all;
  }
}
</style>