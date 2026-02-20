<template>
  <div class="dashboard-sidebar" :class="{ 'collapsed': sidebarCollapsed }">
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
        <span class="user-role">Administrator</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <ul>
        <li v-for="(item, index) in navItems" :key="index"
            :class="{ 'active': activeNavItem === item.id }">
          <router-link
            :to="{ name: item.route }"
            class="nav-link"
            @click="handleNavClick"
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  sidebarCollapsed: Boolean,
  activeNavItem: String,
  user: {
    type: Object,
    required: true,
    default: () => ({
      first_name: 'Admin',
      last_name: 'User'
    })
  }
})

const emit = defineEmits(['toggle-sidebar', 'logout']);

const isMobile = ref(false);

const checkIfMobile = () => {
  isMobile.value = window.innerWidth < 992;
};

onMounted(() => {
  checkIfMobile();
  window.addEventListener('resize', checkIfMobile);
});

const toggleSidebar = () => {
  emit('toggle-sidebar');
};

const getUserInitials = computed(() => {
  return `${props.user.first_name.charAt(0)}${props.user.last_name.charAt(0)}`;
});

const navItems = ref([
  { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt', route: 'admin-dashboard', underDevelopment: false },
  { id: 'users', label: 'Users', icon: 'fas fa-users', route: 'admin-users', underDevelopment: false },
  { id: 'courses', label: 'Courses', icon: 'fas fa-book', route: 'admin-courses', underDevelopment: false },
  { id: 'enrollments', label: 'Enrollments', icon: 'fas fa-user-graduate', route: 'admin-enrollments', underDevelopment: false },
  { id: 'revenue', label: 'Revenue', icon: 'fas fa-chart-line', route: 'admin-revenue', underDevelopment: true },
  { id: 'reports', label: 'Reports', icon: 'fas fa-chart-pie', route: 'admin-reports', underDevelopment: true },
  { id: 'settings', label: 'Settings', icon: 'fas fa-cog', route: 'admin-settings', underDevelopment: true }
])

const handleNavClick = (event) => {
  // Remove any existing animation classes
  event.currentTarget.classList.remove('clicking')

  // Force reflow to restart animation
  void event.currentTarget.offsetWidth

  // Add animation class
  event.currentTarget.classList.add('clicking')

  // Remove after animation completes
  setTimeout(() => {
    event.currentTarget.classList.remove('clicking')
  }, 200)

  // Auto-collapse sidebar on mobile after click
  if (isMobile.value && !props.sidebarCollapsed) {
    toggleSidebar();
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

/* Make sure under-development items that are active are fully visible */
.sidebar-nav li.under-development.active .nav-link,
.sidebar-nav li.under-development .nav-link.router-link-active {
  opacity: 1;
}

.sidebar-nav li.active .nav-link {
  background-color: rgba(8, 121, 144, 0.1);
  color: var(--primary-color) !important;
  border-left: 3px solid var(--primary-color);
  font-weight: 500;
}

.sidebar-nav {
  flex: 1;
  padding: 8px 0 4px 0; /* Reduced top and bottom padding */
  overflow-y: auto;
}

.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-nav li {
  margin: 2px 0; /* Reduced vertical spacing between items */
  position: relative;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 12px 18px;
  color: var(--secondary-color);
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  font-size: 0.95rem;
  min-height: 44px; /* Consistent touch target size */
  position: relative;
}

.nav-link:hover {
  background-color: rgba(8, 121, 144, 0.05);
  color: var(--primary-color);
}

.nav-link.active {
  background-color: rgba(8, 121, 144, 0.1);
  color: var(--primary-color);
  border-left: 3px solid var(--primary-color);
  font-weight: 500;
}

.nav-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar-nav i {
  font-size: 1.05rem;
  margin-right: 14px;
  width: 20px;
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

.dashboard-sidebar.collapsed li:hover .dev-tooltip {
  opacity: 1;
}

.nav-label {
  display: flex;
  align-items: center;
  flex: 1;
}

.sidebar-footer {
  padding: 8px 14px; /* Tightened footer padding */
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

  .dev-badge {
    font-size: 8px;
    padding: 1px 5px;
  }
}

@media (max-width: 991.98px) {
  .dashboard-sidebar {
    transform: translateX(-100%);
    width: 240px;
    position: fixed;
    z-index: 1050;
  }

  .dashboard-sidebar.collapsed {
    transform: translateX(0);
    width: 60px;
  }

  .dashboard-sidebar:not(.collapsed) {
    transform: translateX(0);
    width: 240px;
  box-shadow: 5px 0 15px rgba(0, 0, 0, 0.1);
  }

  /* Overlay for when sidebar is open */
  .dashboard-sidebar:not(.collapsed)::after {
    content: '';
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 240px;
    background: rgba(0, 0, 0, 0.5);
    z-index: -1;
  }
}

/* Make sure the sidebar is above everything on mobile */
@media (max-width: 991.98px) {
  .dashboard-sidebar {
    z-index: 1050;
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