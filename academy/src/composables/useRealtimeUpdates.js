// composables/useRealtimeUpdates.js - ACTUALLY WORKING VERSION
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useLessonStore } from '@/stores/lesson'

/**
 * ✅ WORKING real-time updates composable
 */
export function useRealtimeUpdates() {
  const lessonStore = useLessonStore()
  const lastUpdate = ref(null)
  const updateTrigger = ref(0)
  const callbacks = {}

  // ✅ Listen for global lesson completion events
  const handleLessonCompleted = (event) => {
    const { lessonId, courseCode, timestamp } = event.detail

    console.log('🔔 REALTIME: Component received lesson-completed event:', {
      lessonId,
      courseCode,
      timestamp,
      component: new Error().stack.split('\n')[2]?.trim() // Show which component
    })

    lastUpdate.value = {
      lessonId,
      courseCode,
      timestamp
    }

    // ✅ CRITICAL: Force update trigger
    updateTrigger.value++

    // Trigger callback if registered
    if (callbacks.onLessonCompleted) {
      callbacks.onLessonCompleted(event.detail)
    }
  }

  // Register custom callback
  const onLessonCompleted = (callback) => {
    callbacks.onLessonCompleted = callback
  }

  // Setup listener on mount
  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('lesson-completed', handleLessonCompleted)
      console.log('✅ REALTIME: Event listener registered in component')
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('lesson-completed', handleLessonCompleted)
      console.log('🛑 REALTIME: Event listener removed from component')
    }
  })

  // ✅ Watch store's global completion counter
  watch(() => lessonStore.globalCompletionCounter, (newVal, oldVal) => {
    if (newVal !== oldVal) {
      console.log('📊 REALTIME: Global completion counter changed:', oldVal, '→', newVal)
      updateTrigger.value++
    }
  })

  // ✅ Watch store's reactivity trigger
  watch(() => lessonStore.reactivityTrigger, (newVal, oldVal) => {
    if (newVal !== oldVal) {
      console.log('📊 REALTIME: Store reactivity trigger changed:', oldVal, '→', newVal)
      updateTrigger.value++
    }
  })

  return {
    lastUpdate,
    updateTrigger,
    onLessonCompleted,
    globalCompletionCounter: () => lessonStore.globalCompletionCounter
  }
}

/**
 * ✅ WORKING course progress tracking
 */
export function useCourseProgress(courseCode) {
  const lessonStore = useLessonStore()
  const progress = ref(0)
  const completedLessons = ref(0)
  const totalLessons = ref(0)
  const lastUpdated = ref(null)

  // Update progress from cache or store
  const updateProgress = () => {
    const code = typeof courseCode === 'function' ? courseCode() : courseCode

    if (!code) return

    const cached = lessonStore.courseProgressCache[code]

    if (cached) {
      progress.value = cached.progress
      completedLessons.value = cached.completedLessons
      totalLessons.value = cached.totalLessons
      lastUpdated.value = cached.lastUpdated

      console.log('📊 PROGRESS: Updated from cache:', {
        course: code,
        progress: progress.value,
        completed: completedLessons.value,
        total: totalLessons.value
      })
    } else if (lessonStore.courseData?.code === code) {
      const completed = lessonStore.lessons.filter(l => l.completed).length
      const total = lessonStore.lessons.length
      progress.value = total > 0 ? Math.round((completed / total) * 100) : 0
      completedLessons.value = completed
      totalLessons.value = total
      lastUpdated.value = new Date().toISOString()
    }
  }

  // ✅ Watch for completion events
  watch(() => lessonStore.globalCompletionCounter, () => {
    console.log('🔄 PROGRESS: Global counter changed, updating progress')
    updateProgress()
  })

  // ✅ Watch for reactivity trigger
  watch(() => lessonStore.reactivityTrigger, () => {
    console.log('🔄 PROGRESS: Reactivity trigger changed, updating progress')
    updateProgress()
  })

  // Initial update
  updateProgress()

  return {
    progress,
    completedLessons,
    totalLessons,
    lastUpdated,
    refresh: updateProgress
  }
}