// src/composables/useRealtimeLesson.js
import { ref, onUnmounted, watch, computed } from 'vue'
import { useLessonStore } from '@/stores/lesson'

/**
 * Enhanced composable for handling real-time lesson updates
 * Optimized for performance with minimal reloads
 */
export function useRealtimeLesson(lessonId) {
  const lessonStore = useLessonStore()
  const autoSaveTimers = ref({})
  const isRefreshing = ref(false)
  const lastRefresh = ref(null)

  // Configuration
  const AUTO_SAVE_DELAY = 2000 // 2 seconds
  const MAX_RETRIES = 3
  const MIN_REFRESH_INTERVAL = 1000 // Prevent refresh spam

  /**
   * Smart refresh - only fetches if needed
   * Uses cached data when possible
   */
  const refreshLessonData = async (forceRefresh = false) => {
    if (!lessonId.value || isRefreshing.value) return { success: false, cached: true }

    // Check if we recently refreshed (prevent spam)
    const now = Date.now()
    if (!forceRefresh && lastRefresh.value && (now - lastRefresh.value) < MIN_REFRESH_INTERVAL) {
      return { success: true, cached: true }
    }

    isRefreshing.value = true

    try {
      const result = await lessonStore.loadLessonDetail(lessonId.value)
      lastRefresh.value = now

      if (result.success) {
        console.log('✓ Lesson data refreshed:', lessonId.value)
      }

      return result
    } catch (error) {
      console.warn('✗ Failed to refresh lesson data:', error)
      return { success: false, error }
    } finally {
      isRefreshing.value = false
    }
  }

  /**
   * Auto-save paragraph answer with retry logic and debouncing
   */
  const autoSaveAnswer = async (questionId, answer) => {
    // Clear existing timer for this question
    if (autoSaveTimers.value[questionId]) {
      clearTimeout(autoSaveTimers.value[questionId])
    }

    // Set new timer
    autoSaveTimers.value[questionId] = setTimeout(async () => {
      if (answer && answer.trim().length > 0) {
        let retries = 0
        let success = false

        while (retries < MAX_RETRIES && !success) {
          const result = await lessonStore.saveDraft(questionId, answer)

          if (result.success) {
            success = true
            console.log('✓ Auto-saved answer for question:', questionId)
          } else {
            retries++
            if (retries < MAX_RETRIES) {
              console.log(`⟳ Retry ${retries}/${MAX_RETRIES} for question ${questionId}`)
              await new Promise(resolve => setTimeout(resolve, 1000 * retries))
            }
          }
        }

        if (!success) {
          console.warn('✗ Failed to auto-save after retries:', questionId)
        }
      }
    }, AUTO_SAVE_DELAY)
  }

  /**
   * Update lesson progress in real-time without reload
   */
  const updateLessonProgress = async (lessonId, progressData) => {
    try {
      // Update store directly for instant UI feedback
      const lesson = lessonStore.lessons.find(l => l.id === lessonId)
      if (lesson) {
        lesson.progress = progressData.progress_percentage
        lesson.completed = progressData.lesson_completed
      }

      // Update backend in background
      await lessonStore.updateVideoProgress(lessonId, progressData)

      return { success: true }
    } catch (error) {
      console.warn('Failed to update progress:', error)
      return { success: false, error }
    }
  }

  /**
   * Mark lesson as completed with optimistic update
   */
  const markCompleted = async (reflectionText, score, totalQuestions) => {
    if (!lessonStore.currentLesson) return { success: false }

    const lessonId = lessonStore.currentLesson.id

    // Optimistic update - update UI immediately
    const lesson = lessonStore.lessons.find(l => l.id === lessonId)
    if (lesson) {
      lesson.completed = true
      lesson.completed_at = new Date().toISOString()
      lesson.score = score
    }

    if (lessonStore.currentLesson) {
      lessonStore.currentLesson.completed = true
      lessonStore.currentLesson.completed_at = new Date().toISOString()
      lessonStore.currentLesson.score = score
    }

    try {
      // Send to backend
      const result = await lessonStore.markLessonCompleted(
        reflectionText,
        score,
        totalQuestions
      )

      if (!result.success) {
        // Revert optimistic update on failure
        if (lesson) {
          lesson.completed = false
          lesson.completed_at = null
        }
        if (lessonStore.currentLesson) {
          lessonStore.currentLesson.completed = false
          lessonStore.currentLesson.completed_at = null
        }
      }

      return result
    } catch (error) {
      // Revert optimistic update on error
      if (lesson) {
        lesson.completed = false
        lesson.completed_at = null
      }
      if (lessonStore.currentLesson) {
        lessonStore.currentLesson.completed = false
        lessonStore.currentLesson.completed_at = null
      }

      return { success: false, error }
    }
  }

  /**
   * Submit answer with optimistic update
   */
  const submitAnswerOptimistic = async (question, answer) => {
    const questionId = question.id

    // Store original state
    const originalShowResult = lessonStore.showResults[questionId]
    const originalResult = lessonStore.exerciseResults[questionId]

    // Optimistic update
    lessonStore.showResults[questionId] = true
    lessonStore.submittingAnswers[questionId] = true

    try {
      const result = await lessonStore.submitAnswer(questionId, answer)

      if (!result.success) {
        // Revert on failure
        lessonStore.showResults[questionId] = originalShowResult
        lessonStore.exerciseResults[questionId] = originalResult
      }

      return result
    } catch (error) {
      // Revert on error
      lessonStore.showResults[questionId] = originalShowResult
      lessonStore.exerciseResults[questionId] = originalResult
      return { success: false, error }
    } finally {
      lessonStore.submittingAnswers[questionId] = false
    }
  }

  /**
   * Navigate to lesson with smart caching
   */
  const navigateToLesson = async (newLessonId) => {
    if (newLessonId === lessonId.value) return { success: true, cached: true }

    // Check if lesson data is already in store
    const lesson = lessonStore.lessons.find(l => l.id === newLessonId)

    if (lesson && lesson.content && lesson.exercises) {
      // Use cached data
      lessonStore.setCurrentLesson(newLessonId)
      lessonStore.resetExerciseStates()

      // Refresh in background for latest data
      refreshLessonData(true)

      return { success: true, cached: true }
    } else {
      // Need to load fresh data
      lessonStore.resetExerciseStates()
      const result = await lessonStore.loadLessonDetail(newLessonId)

      if (result.success) {
        lessonStore.setCurrentLesson(newLessonId)
      }

      return result
    }
  }

  /**
   * Clear all auto-save timers
   */
  const clearAutoSaveTimers = () => {
    Object.values(autoSaveTimers.value).forEach(timer => clearTimeout(timer))
    autoSaveTimers.value = {}
  }

  /**
   * Watch for changes in exercise answers (for auto-save)
   */
  watch(
    () => lessonStore.exerciseAnswers,
    (newAnswers, oldAnswers) => {
      if (!lessonStore.currentLesson?.exercises) return

      Object.keys(newAnswers).forEach(questionId => {
        const question = lessonStore.currentLesson.exercises.find(q => q.id == questionId)

        // Only auto-save paragraph type questions
        if (question?.type === 'paragraph' && newAnswers[questionId] !== oldAnswers?.[questionId]) {
          autoSaveAnswer(questionId, newAnswers[questionId])
        }
      })
    },
    { deep: true }
  )

  /**
   * Watch for lesson ID changes - clear timers when switching
   */
  watch(lessonId, (newId, oldId) => {
    if (newId && newId !== oldId) {
      clearAutoSaveTimers()
      lastRefresh.value = null
    }
  })

  /**
   * Computed property to check if lesson is being refreshed
   */
  const isLoading = computed(() => isRefreshing.value || lessonStore.loading)

  /**
   * Cleanup
   */
  onUnmounted(() => {
    clearAutoSaveTimers()
  })

  return {
    // Methods
    autoSaveAnswer,
    clearAutoSaveTimers,
    refreshLessonData,
    updateLessonProgress,
    markCompleted,
    submitAnswerOptimistic,
    navigateToLesson,

    // State
    isRefreshing,
    isLoading,
    lastRefresh
  }
}

/**
 * Debounce utility
 */
export function debounce(fn, delay) {
  let timeoutId
  return function(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn.apply(this, args), delay)
  }
}

/**
 * Throttle utility
 */
export function throttle(fn, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}