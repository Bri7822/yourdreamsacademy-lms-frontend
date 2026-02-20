<template>
  <div :class="['guest-lessons-sidebar', { 'collapsed': collapsed }]">
    <div class="sidebar-header">
      <div v-if="!collapsed" class="course-info">
        <h2 class="course-title">{{ displayCourseTitle }}</h2>
        <p class="course-subtitle">{{ totalLessons }} Lesson{{ totalLessons !== 1 ? 's' : '' }}</p>
      </div>
      <button
        @click="$emit('toggle-sidebar')"
        class="toggle-btn"
        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <i :class="collapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
      </button>
    </div>

    <div class="lessons-list">
      <div
        v-for="(lesson, index) in displayLessons"
        :key="lesson.id"
        :class="['lesson-item', {
          'active': selectedLessonId === lesson.id,
          'completed': isLessonCompleted(lesson.id)
        }]"
        @click="handleLessonClick(lesson)"
      >
        <div class="lesson-number" :class="{ 'completed': isLessonCompleted(lesson.id) }">
          <i v-if="isLessonCompleted(lesson.id)" class="fas fa-check-circle completed-icon"></i>
          <span v-else>{{ index + 1 }}</span>
        </div>
        <div v-if="!collapsed" class="lesson-content">
          <h4 class="lesson-title">{{ lesson.title }}</h4>
          <div class="lesson-meta">
            <i class="fas fa-clock"></i>
            <span>{{ lesson.duration || '30' }} min</span>
            <span v-if="isLessonCompleted(lesson.id)" class="completed-badge">Completed</span>
            <span v-else class="preview-badge">Preview</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Guest-specific progress section -->
    <div v-if="!collapsed" class="guest-progress-section">
      <div class="progress-stats">
        <div class="progress-item">
          <span class="progress-label">Completed:</span>
          <span class="progress-value">{{ completedLessonsCount }} / {{ totalLessons }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
      </div>
      <div class="time-remaining">
        <i class="fas fa-hourglass-half"></i>
        <span>{{ formattedRemainingTime }} remaining</span>
      </div>
      <button @click="register" class="guest-upgrade-btn">
        <i class="fas fa-rocket"></i>
        Upgrade to Save Progress
      </button>
    </div>
  </div>
</template>

<script>
import { computed, inject, ref, onMounted, onUnmounted, watch } from 'vue'
import { useGuestStore } from '@/stores/guest'

export default {
  name: 'GuestLessonSidebar',
  props: {
    courseData: {
      type: Object,
      default: () => ({})
    },
    selectedLessonId: {
      type: [String, Number],
      default: null
    },
    collapsed: {
      type: Boolean,
      default: false
    },
    lessons: {
      type: Array,
      default: () => []
    }
  },
  emits: ['select-lesson', 'toggle-sidebar'],
  setup(props, { emit }) {
    console.log('🎬 GuestLessonSidebar setup with selectedLessonId:', props.selectedLessonId)

    const guestStore = useGuestStore()
    const guestLessonLayout = inject('guestLessonLayout', {})

    const completedLessons = ref([])
    const storagePollInterval = ref(null)

    const displayCourseTitle = computed(() => {
      return props.courseData?.title || 'Course Preview'
    })

    const displayLessons = computed(() => {
      return props.lessons || []
    })

    const totalLessons = computed(() => displayLessons.value.length)

    const completedLessonsCount = computed(() => {
      return completedLessons.value.length
    })

    const progressPercentage = computed(() => {
      return totalLessons.value > 0 ? Math.round((completedLessonsCount.value / totalLessons.value) * 100) : 0
    })

    const formattedRemainingTime = computed(() => {
      const minutes = Math.floor(guestStore.remainingTime / 60)
      const seconds = guestStore.remainingTime % 60
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    })

    const isLessonCompleted = (lessonId) => {
      return completedLessons.value.includes(parseInt(lessonId))
    }

    // ✅ FIXED: Simplified - just emit to parent, let parent handle navigation
    const handleLessonClick = (lesson) => {
      console.log('👆 GUEST SIDEBAR: Lesson clicked:', lesson.id, lesson.title)

      if (!lesson || !lesson.id) {
        console.error('❌ Invalid lesson data')
        return
      }

      // Simply emit to parent - parent will handle all navigation
      emit('select-lesson', lesson.id)
      console.log('✅ Emitted select-lesson event to parent')
    }

    const register = () => {
      if (guestLessonLayout.register) {
        guestLessonLayout.register()
      }
    }

    const loadCachedCompletions = () => {
      try {
        const courseSlug = guestLessonLayout.courseSlug || props.courseData?.code
        if (!courseSlug) {
          console.log('❌ No course slug available for loading completions')
          return
        }

        const cacheKey = `guest_completed_lessons_${courseSlug}`
        const expiryKey = `${cacheKey}_expiry`

        const cached = localStorage.getItem(cacheKey)
        const expiry = localStorage.getItem(expiryKey)

        if (cached && expiry && Date.now() < parseInt(expiry)) {
          const lessonIds = JSON.parse(cached)
          completedLessons.value = lessonIds
          console.log('✅ GUEST SIDEBAR: Loaded cached completions:', completedLessons.value)
        } else {
          localStorage.removeItem(cacheKey)
          localStorage.removeItem(expiryKey)
          completedLessons.value = []
          console.log('🔄 GUEST SIDEBAR: Cleared expired cache or no cache found')
        }
      } catch (error) {
        console.error('❌ GUEST SIDEBAR: Failed to load cached completions:', error)
        completedLessons.value = []
      }
    }

    const markLessonCompleted = (lessonId) => {
      console.log('🎯 GUEST SIDEBAR: Marking lesson as completed:', lessonId)

      const id = parseInt(lessonId)
      if (!completedLessons.value.includes(id)) {
        completedLessons.value = [...completedLessons.value, id]
        console.log('✅ GUEST SIDEBAR: Added lesson to completed:', id)
        saveCompletionsToCache()
      }
    }

    const saveCompletionsToCache = () => {
      try {
        const courseSlug = guestLessonLayout.courseSlug || props.courseData?.code
        if (!courseSlug) {
          console.log('❌ GUEST SIDEBAR: No course slug available for saving completions')
          return
        }

        const cacheKey = `guest_completed_lessons_${courseSlug}`
        const expiryKey = `${cacheKey}_expiry`

        localStorage.setItem(cacheKey, JSON.stringify(completedLessons.value))

        const expiry = Date.now() + (10 * 60 * 1000)
        localStorage.setItem(expiryKey, expiry.toString())

        console.log('✅ GUEST SIDEBAR: Saved completions to cache:', completedLessons.value)
      } catch (error) {
        console.error('❌ GUEST SIDEBAR: Failed to save completions to cache:', error)
      }
    }

    const handleCompletionEvent = (event) => {
      console.log('📬 GUEST SIDEBAR: Completion event received', event.detail)
      if (event.detail && event.detail.lessonId) {
        markLessonCompleted(event.detail.lessonId)
      }
    }

    const startCompletionPolling = () => {
      storagePollInterval.value = setInterval(() => {
        try {
          const signal = localStorage.getItem('guest_lesson_just_completed')
          if (signal) {
            const data = JSON.parse(signal)
            console.log('⏰ GUEST SIDEBAR: Polling detected completion:', data)
            if (data.lessonId && !completedLessons.value.includes(data.lessonId)) {
              markLessonCompleted(data.lessonId)
            }
            localStorage.removeItem('guest_lesson_just_completed')
          }
        } catch (error) {
          console.error('❌ GUEST SIDEBAR: Polling error:', error)
        }
      }, 500)
    }

    onMounted(() => {
      console.log('🎬 GUEST SIDEBAR: Mounted')

      loadCachedCompletions()

      window.addEventListener('guest-lesson-completed', handleCompletionEvent)
      window.addEventListener('force-sidebar-refresh', handleCompletionEvent)

      startCompletionPolling()

      console.log('✅ GUEST SIDEBAR: Event listeners registered')
    })

    onUnmounted(() => {
      console.log('🛑 GUEST SIDEBAR: Unmounting')

      window.removeEventListener('guest-lesson-completed', handleCompletionEvent)
      window.removeEventListener('force-sidebar-refresh', handleCompletionEvent)

      if (storagePollInterval.value) {
        clearInterval(storagePollInterval.value)
      }
    })

    watch(() => guestLessonLayout.courseSlug, (newSlug) => {
      if (newSlug) {
        console.log('🔄 GUEST SIDEBAR: Course changed, reloading cached completions')
        loadCachedCompletions()
      }
    })

    watch(() => props.lessons, (newLessons) => {
      console.log('🔄 GUEST SIDEBAR: Lessons updated:', newLessons?.length)
      loadCachedCompletions()
    }, { immediate: true })

    watch(() => props.selectedLessonId, (newId) => {
      console.log('🔄 Sidebar: selectedLessonId changed to:', newId)
    })

    return {
      displayCourseTitle,
      displayLessons,
      totalLessons,
      completedLessonsCount,
      progressPercentage,
      formattedRemainingTime,
      isLessonCompleted,
      handleLessonClick,
      register
    }
  }
}
</script>

<style scoped>
/* Your existing styles remain the same */
.lesson-number.completed {
  background: #4CAF50 !important;
  color: white !important;
}

.completed-icon {
  color: white;
}

.completed-badge {
  background: #4CAF50;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: 600;
}

.progress-stats {
  margin-bottom: 15px;
}

.progress-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-label {
  font-size: 0.9em;
  color: #666;
}

.progress-value {
  font-weight: 600;
  color: #4CAF50;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #45a049);
  transition: width 0.3s ease;
}

.guest-lessons-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 250px;
  height: 100vh;
  background-color: var(--background-color);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  overflow: hidden;
  box-shadow: 2px 0 8px var(--shadow-color);
}

.guest-lessons-sidebar.collapsed {
  width: 60px;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 70px;
  background: var(--background-color);
}

.course-info {
  flex: 1;
  overflow: hidden;
}

.course-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: var(--primary-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-heading);
}

.course-subtitle {
  font-size: 0.8rem;
  color: var(--secondary-color);
  margin: 0;
  opacity: 0.8;
  font-family: var(--font-body);
}

.toggle-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
  font-size: 0.9rem;
}

.toggle-btn:hover {
  background-color: rgba(6, 103, 126, 0.1);
}

.lessons-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.lesson-item {
  display: flex;
  align-items: center;
  padding: 0.6rem 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  margin: 0.125rem 0.4rem;
  border-radius: 0.4rem;
}

.lesson-item:hover {
  background-color: rgba(6, 103, 126, 0.05);
}

.lesson-item.active {
  background-color: rgba(6, 103, 126, 0.1);
  border-left-color: var(--primary-color);
}

.lesson-item.completed {
  background-color: rgba(34, 197, 94, 0.05);
}

.lesson-item.completed .lesson-number {
  background-color: #22c55e;
  color: white;
}

.lesson-number {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8rem;
  flex-shrink: 0;
  background: var(--gray-bg);
  border-radius: 0.3rem;
  font-family: var(--font-heading);
  transition: all 0.2s ease;
}

.completed-icon {
  color: white;
  font-size: 0.9rem;
}

.lesson-content {
  margin-left: 0.6rem;
  flex: 1;
  overflow: hidden;
}

.lesson-title {
  font-size: 0.8rem;
  font-weight: 500;
  margin: 0 0 0.2rem 0;
  color: var(--secondary-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-heading);
}

.lesson-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  color: var(--secondary-color);
  opacity: 0.7;
  font-family: var(--font-body);
}

.preview-badge {
  background: var(--primary-color);
  color: white;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 0.65rem;
  font-weight: 600;
}

/* Guest-specific progress section */
.guest-progress-section {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  background: var(--gray-bg);
}

.time-remaining {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.8rem 0;
  padding: 0.6rem;
  background: white;
  border-radius: 0.4rem;
  border-left: 4px solid var(--primary-color);
  font-size: 0.8rem;
  color: var(--secondary-color);
  font-family: var(--font-body);
}

.time-remaining i {
  color: var(--primary-color);
}

.guest-upgrade-btn {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-sec-color) 100%);
  color: white;
  border: none;
  padding: 0.6rem 0.8rem;
  border-radius: 0.4rem;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: all 0.3s;
  font-weight: 600;
  width: 100%;
  justify-content: center;
  font-family: var(--font-heading);
}

.guest-upgrade-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(6, 103, 126, 0.3);
}

.lessons-list::-webkit-scrollbar {
  width: 3px;
}

.lessons-list::-webkit-scrollbar-track {
  background: var(--gray-bg);
}

.lessons-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.lessons-list::-webkit-scrollbar-thumb:hover {
  background: var(--secondary-color);
}

@media (max-width: 1024px) {
  .guest-lessons-sidebar {
    width: 250px;
  }

  .guest-lessons-sidebar.collapsed {
    width: 60px;
  }
}

@media (max-width: 768px) {
  .guest-lessons-sidebar {
    width: 250px;
    transform: translateX(-100%);
  }

  .guest-lessons-sidebar.collapsed {
    transform: translateX(0);
    width: 60px;
  }
}
</style>