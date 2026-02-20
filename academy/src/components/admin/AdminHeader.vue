<template>
  <header class="admin-header">
    <div class="header-left">
      <!-- <h2 class="page-title">{{ currentRouteTitle }}</h2> -->
    </div>
    
    <div class="header-actions">
      <router-link to="/" class="header-action-btn" title="Home">
        <i class="fas fa-home"></i>
      </router-link>
      
      <div class="notifications">
        <button class="header-action-btn" title="Notifications">
          <i class="fas fa-bell"></i>
          <span v-if="notificationCount > 0" class="notification-badge">
            {{ notificationCount }}
          </span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const props = defineProps({
  user: {
    type: Object,
    required: true,
    default: () => ({
      first_name: 'Admin',
      last_name: 'User'
    })
  },
  notificationCount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['logout'])

const dropdownOpen = ref(false)

const userInitials = computed(() => {
  return `${props.user.first_name.charAt(0)}${props.user.last_name.charAt(0)}`
})

const currentRouteTitle = computed(() => {
  return route.meta.title || 'Dashboard'
})

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const logout = () => {
  emit('logout')
}
</script>

<style scoped>
.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 25px;
  background: white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.sidebar-toggle {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-color);
}

.page-title {
  margin: 0;
  font-size: 1.3rem;
  color: var(--text-color);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  color: var(--text-color);
  font-size: 1.1rem;
  text-decoration: none;
  position: relative;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
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
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.15); }
}

.header-action-btn.pulse {
    animation: gentle-pulse 0.5s ease;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  cursor: pointer;
}

.avatar {
  width: 32px;
  height: 32px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.user-name {
  font-weight: 500;
}

.dropdown-menu {
  position: absolute;
  right: 20px;
  top: 60px;
  background: white;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  min-width: 180px;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  text-decoration: none;
  color: var(--text-color);
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-item i {
  width: 20px;
  text-align: center;
}

.admin-header {
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

.header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.sidebar-toggle {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-color);
}

.page-title h2 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--fs-lg);
  font-weight: 600;
  color: var(--primary-color);
  padding-left: 5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-icon {
  color: var(--text-color);
  font-size: 1.1rem;
  text-decoration: none;
  position: relative;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  cursor: pointer;
}

.avatar {
  width: 32px;
  height: 32px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.user-name {
  font-weight: 500;
}

.dropdown-menu {
  position: absolute;
  right: 20px;
  top: 60px;
  background: white;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  min-width: 180px;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  text-decoration: none;
  color: var(--text-color);
  background: none;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-item i {
  width: 20px;
  text-align: center;
}

/* Responsive styles */
@media (max-width: 768px) {
  .page-title h2 {
    font-size: 1.1rem;
  }
  
  .header-right {
    gap: 15px;
  }
}
</style>