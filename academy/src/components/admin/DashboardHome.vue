<template>
  <div class="dashboard-home">
    <div class="dashboard-greeting">
      <h3>Welcome back, {{ user.first_name }}!</h3>
      <p>{{ welcomeMessage }}</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="fetchData" class="retry-btn">Retry</button>
    </div>

    <!-- Data Container with Loading Overlay -->
    <div v-else class="dashboard-content">
      <!-- Loading Overlay -->
      <div v-if="loading" class="loading-overlay">
        <div class="loader">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading dashboard data...</span>
        </div>
      </div>

      <AdminCards
        :statistics="stats"
        :card-loading-complete="!loading"
      />

      <div class="recent-activity-card">
        <h3 class="section-title">Recent Activity</h3>
        <ul class="activity-list">
          <li v-for="(activity, index) in recentActivities" :key="index" class="activity-item">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminCards from '@/components/admin/AdminCards.vue'
import { useDashboardStats } from '@/composables/useDashboardStats'

const props = defineProps({
  user: {
    type: Object,
    required: true,
    default: () => ({
      first_name: 'Admin',
      last_name: 'User'
    })
  }
})

// Use the composable for real data
const { stats, loading, error, fetchStats } = useDashboardStats()

// Recent activities (keeping static as before)
const recentActivities = ref([
  {
    icon: 'fas fa-user-plus text-success',
    text: 'New teacher account created for Sarah Johnson',
    time: '10 minutes ago'
  },
  {
    icon: 'fas fa-book text-primary',
    text: 'New course "Advanced Data Science" was published',
    time: '1 hour ago'
  },
  {
    icon: 'fas fa-dollar-sign text-warning',
    text: 'Monthly revenue report is ready for review',
    time: 'Yesterday'
  },
  {
    icon: 'fas fa-exclamation-triangle text-danger',
    text: 'System maintenance scheduled for Friday at 2:00 AM',
    time: '2 days ago'
  }
])

const welcomeMessage = computed(() => {
  if (loading.value) {
    return "Loading your dashboard data..."
  }
  if (error.value) {
    return "There was an issue loading dashboard data."
  }
  return "Here's an overview of platform activity and key metrics."
})

const fetchData = async () => {
  await fetchStats()
}

onMounted(() => {
  fetchData()
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

.error-state {
  text-align: center;
  padding: 40px 20px;
  background: #fee;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  margin: 20px 0;
}

.error-state p {
  color: #721c24;
  margin-bottom: 20px;
  font-size: 1.1rem;
}

.retry-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

.retry-btn:hover {
  background: #c82333;
}

/* Dashboard Content Container */
.dashboard-content {
  position: relative;
  min-height: 400px;
  padding: 0 !important;
}

/* Loading Overlay - matches CourseManagement style */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
  z-index: 10;
  border-radius: 8px;
}

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loader i {
  font-size: 2rem;
  color: var(--primary-color, #087990);
}

.loader span {
  color: #6c757d;
  font-weight: 500;
}

.recent-activity-card {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  margin-top: 20px;
}

.section-title {
  font-size: 1.2rem;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.activity-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.3s ease;
}

.activity-item:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 36px;
  height: 36px;
  background: var(--gray-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.activity-icon i {
  font-size: 1rem;
}

.activity-content {
  flex: 1;
}

.activity-text {
  margin: 0;
  font-size: 0.95rem;
}

.activity-time {
  font-size: 0.8rem;
  color: var(--secondary-color);
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

/* Responsive Design */
@media (max-width: 768px) {
  .dashboard-greeting h3 {
    font-size: 1.3rem;
  }

  .recent-activity-card {
    padding: 20px;
    margin-top: 25px;
  }

  .activity-item {
    padding: 14px 0;
  }

  .activity-icon {
    width: 36px;
    height: 36px;
    margin-right: 12px;
  }
}

@media (max-width: 480px) {
  .dashboard-greeting {
    margin-bottom: 20px;
  }

  .dashboard-greeting h3 {
    font-size: 1.2rem;
  }

  .recent-activity-card {
    padding: 16px;
    margin-top: 20px;
  }

  .activity-item {
    padding: 12px 0;
    flex-direction: column;
    align-items: flex-start;
  }

  .activity-icon {
    margin-right: 0;
    margin-bottom: 10px;
  }

  .activity-content {
    width: 100%;
  }

  .error-state {
    padding: 30px 15px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .loading-overlay {
    background: rgba(45, 55, 72, 0.8);
  }

  .loader span {
    color: #a0aec0;
  }
}
</style>