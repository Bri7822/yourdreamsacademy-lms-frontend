// src/composables/useProgress.js
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useProgressStore } from '@/stores/progress'

export function useProgress(courseCode) {
  const progressStore = useProgressStore()

  // Local state
  const progress = ref(0)
  const completedLessons = ref(0)
  const totalLessons = ref(0)
  const isLoading = ref(false)
  const lastUpdated = ref(null)

  // Update local state from store
  const updateFromStore = () => {
    const storeData = progressStore.getCourseProgress(courseCode)
    progress.value = storeData.progress
    completedLessons.value = storeData.completedLessons
    totalLessons.value = storeData.totalLessons
    lastUpdated.value = storeData.lastUpdated
  }

  // Event handler for real-time updates
  const handleProgressUpdate = (eventData) => {
    if (eventData.courseCode === courseCode || courseCode === '*') {
      console.log(`🔄 useProgress: Update received for ${courseCode}`, eventData)

      // Update store first
      progressStore.updateProgress(eventData.courseCode, {
        progress: eventData.progress,
        completedLessons: eventData.completedLessons,
        totalLessons: eventData.totalLessons
      })

      // Then update local state
      updateFromStore()
    }
  }

  // Refresh from API
  const refresh = async () => {
    if (!courseCode || courseCode === '*') return

    isLoading.value = true
    try {
      await progressStore.refreshFromAPI(courseCode)
      updateFromStore()
    } catch (error) {
      console.error('Failed to refresh progress:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Subscribe to events
  let unsubscribe = null

  onMounted(() => {
    // Initial state from store
    updateFromStore()

    // Subscribe to progress updates
    if (window.eventBridge) {
      unsubscribe = window.eventBridge.subscribe(
        'progress-updated',
        handleProgressUpdate,
        `useProgress-${courseCode}`
      )
    }

    console.log(`✅ useProgress mounted for ${courseCode}`)
  })

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
    }

    // Cleanup event bridge subscriptions
    if (window.eventBridge) {
      window.eventBridge.cleanupComponent(`useProgress-${courseCode}`)
    }
  })

  return {
    progress: computed(() => progress.value),
    completedLessons: computed(() => completedLessons.value),
    totalLessons: computed(() => totalLessons.value),
    lastUpdated: computed(() => lastUpdated.value),
    isLoading: computed(() => isLoading.value),
    refresh
  }
}