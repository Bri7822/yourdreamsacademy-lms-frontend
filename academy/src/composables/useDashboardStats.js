import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

export function useDashboardStats() {
  const stats = ref({
    users: 0,
    courses: 0,
    enrollments: 0,
    revenue: 0
  })

  const loading = ref(false)
  const error = ref(null)
  const authStore = useAuthStore()

  const fetchStats = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await axios.get('/api/admin/dashboard/stats/', {
        headers: {
          'Authorization': `Bearer ${authStore.accessToken}`
        }
      })

      if (response.data) {
        stats.value = {
          users: response.data.total_users || 0,
          courses: response.data.active_courses || 0,
          enrollments: response.data.total_enrollments || 0,
          revenue: 0 // Set to zero as requested
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err)
      error.value = 'Failed to load dashboard statistics'
      // Keep mock data as fallback but with zero revenue
      stats.value = {
        users: 0,
        courses: 0,
        enrollments: 0,
        revenue: 0
      }
    } finally {
      loading.value = false
    }
  }

  return {
    stats: computed(() => stats.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    fetchStats
  }
}