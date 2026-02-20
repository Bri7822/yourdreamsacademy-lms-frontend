// src/stores/progress.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useProgressStore = defineStore('progress', () => {
  // State - Single source of truth
  const courseProgress = ref(new Map()) // courseCode -> progress data
  const version = ref(0) // For optimistic concurrency control
  const eventBuffer = ref([]) // Recent events for replay

  // Getters
  const getCourseProgress = computed(() => (courseCode) => {
    return courseProgress.value.get(courseCode) || {
      progress: 0,
      completedLessons: 0,
      totalLessons: 0,
      lastUpdated: null,
      version: 0
    }
  })

  const getAllProgress = computed(() => {
    return Object.fromEntries(courseProgress.value)
  })

  // Actions
  const updateProgress = (courseCode, data) => {
    const existing = courseProgress.value.get(courseCode) || {}
    const newData = {
      ...existing,
      ...data,
      lastUpdated: Date.now(),
      version: version.value++
    }

    courseProgress.value.set(courseCode, newData)

    // Persist to localStorage
    persistToStorage()

    // ✅ SYNC WITH GLOBAL STATE
    syncWithGlobalState(courseCode, newData)

    // Emit to EventBridge
    if (window.eventBridge) {
      window.eventBridge.emit('progress-updated', {
        courseCode,
        ...newData,
        source: 'ProgressStore'
      })
    }

    return newData
  }

  const bulkUpdateProgress = (progressMap) => {
    Object.entries(progressMap).forEach(([courseCode, data]) => {
      updateProgress(courseCode, data)
    })
  }

  const refreshFromAPI = async (courseCode) => {
    try {
      // Your API call here
      const response = await fetch(`/api/student/courses/${courseCode}/progress/`)
      const data = await response.json()

      updateProgress(courseCode, {
        progress: data.progress,
        completedLessons: data.completed_lessons,
        totalLessons: data.total_lessons
      })

      return data
    } catch (error) {
      console.error('Failed to refresh progress:', error)
      throw error
    }
  }

  // Persistence
  const persistToStorage = () => {
    if (typeof window !== 'undefined') {
      const data = {
        courseProgress: Object.fromEntries(courseProgress.value),
        version: version.value,
        lastPersisted: Date.now()
      }
      localStorage.setItem('progress-store', JSON.stringify(data))
    }
  }

  const restoreFromStorage = () => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('progress-store')
        if (stored) {
          const data = JSON.parse(stored)
          courseProgress.value = new Map(Object.entries(data.courseProgress))
          version.value = data.version || 0
        }
      } catch (error) {
        console.error('Failed to restore progress from storage:', error)
      }
    }
  }

  const syncWithGlobalState = (courseCode, data) => {
    if (window.globalProgressState) {
      window.globalProgressState.updateProgress(courseCode, data)
    }
  }

  getCourseProgress: computed(() => (courseCode) => {
    const progress = courseProgress.value.get(courseCode)
    if (progress) return progress

    // Return default structure to prevent template errors
    return {
      progress: 0,
      completedLessons: 0,
      totalLessons: 0,
      lastUpdated: null,
      version: 0
    }
  }),

  // Initialize
  restoreFromStorage()

  return {
    // State
    courseProgress,

    // Getters
    getCourseProgress,
    getAllProgress,

    // Actions
    updateProgress,
    bulkUpdateProgress,
    refreshFromAPI,
    persistToStorage,
    restoreFromStorage
  }
})