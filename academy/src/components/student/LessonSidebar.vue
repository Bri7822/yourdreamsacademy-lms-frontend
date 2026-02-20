<template>
  <div :class="['lessons-sidebar', { 'collapsed': collapsed }]">
    <div class="sidebar-header">
      <div v-if="!collapsed" class="course-info">
        <h2 class="course-title">{{ displayCourseTitle }}</h2>
        <p class="course-subtitle">{{ totalLessons }} Lessons</p>
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
        :key="`lesson-${lesson.id}-${updateTrigger}`"
        :class="['lesson-item', {
          'active': isLessonActive(lesson),
          'completed': lesson.completed
        }]"
        @click="handleLessonClick(lesson)"
      >
        <div class="lesson-number">
          <i v-if="lesson.completed" class="fas fa-check-circle"></i>
          <span v-else>{{ index + 1 }}</span>
        </div>
        <div v-if="!collapsed" class="lesson-content">
          <h4 class="lesson-title">{{ lesson.title }}</h4>
          <div class="lesson-meta">
            <i class="fas fa-clock"></i>
            <span>{{ lesson.duration || '30' }} min</span>
            <span v-if="lesson.completed" class="completed-badge">
              Completed
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!collapsed" class="progress-section">
      <div class="progress-header">
        <i class="fas fa-trophy"></i>
        <h4>Your Progress</h4>
      </div>
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>
      <p class="progress-text">
        {{ completedLessonsCount }} of {{ totalLessons }} completed ({{ progressPercentage }}%)
      </p>
    </div>
  </div>
</template>

<script>
import { computed, watch, ref, onMounted, onUnmounted } from 'vue'
import { useLessonStore } from '@/stores/lesson'
import { generateSlug } from '@/utils/slugUtils'

export default {
  name: 'LessonSidebar',
  props: {
    courseData: {
      type: Object,
      default: null
    },
    selectedLessonId: {
      type: [String, Number],
      default: null
    },
    selectedLessonSlug: {
      type: String,
      default: null
    },
    collapsed: {
      type: Boolean,
      default: false
    }
  },
  emits: ['select-lesson', 'toggle-sidebar'],
  setup(props, { emit }) {
    const lessonStore = useLessonStore()
    const updateTrigger = ref(0)
    let unsubscribeGlobal = null
    let unsubscribeEventBridge = null

    const displayCourseTitle = computed(() => {
      if (props.courseData?.title) return props.courseData.title
      if (lessonStore.courseData?.title) return lessonStore.courseData.title
      if (lessonStore.currentLesson?.course_title) return lessonStore.currentLesson.course_title
      return 'Course'
    })

    // ✅ Get the current lesson ID from the store
    const currentLessonId = computed(() => {
      return lessonStore.currentLesson?.id || props.selectedLessonId
    })

    // ✅ Get the current lesson slug from the store
    const currentLessonSlug = computed(() => {
      if (lessonStore.currentLesson?.title) {
        return generateSlug(lessonStore.currentLesson.title)
      }
      return props.selectedLessonSlug
    })

    // ✅ FIXED: Reactive lessons array with proper completion tracking
    const displayLessons = computed(() => {
      // Force reactivity dependency
      const _ = updateTrigger.value

      const lessons = lessonStore.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        description: lesson.description,
        duration: lesson.duration,
        order: lesson.order,
        completed: lesson.completed === true,
        created_at: lesson.created_at,
        // Generate slug for matching
        slug: generateSlug(lesson.title)
      }))

      console.log('🔍 SIDEBAR: Lessons computed', {
        courseTitle: displayCourseTitle.value,
        total: lessons.length,
        completed: lessons.filter(l => l.completed).length,
        currentLessonId: currentLessonId.value,
        currentLessonSlug: currentLessonSlug.value,
        updateTrigger: updateTrigger.value
      })

      return lessons
    })

    const totalLessons = computed(() => lessonStore.lessons.length)

    const completedLessonsCount = computed(() => {
      const _ = updateTrigger.value
      return lessonStore.lessons.filter(l => l.completed === true).length
    })

    const progressPercentage = computed(() => {
      const _ = updateTrigger.value
      const total = lessonStore.lessons.length
      const completed = completedLessonsCount.value
      return total > 0 ? Math.round((completed / total) * 100) : 0
    })

    // ✅ Check if a lesson is active (either by ID or by slug)
    const isLessonActive = (lesson) => {
      // Check by ID first
      if (currentLessonId.value && lesson.id === Number(currentLessonId.value)) {
        return true
      }

      // Check by slug if ID doesn't match
      if (currentLessonSlug.value && lesson.slug === currentLessonSlug.value) {
        return true
      }

      // Check if it's the current lesson in the store
      if (lessonStore.currentLesson?.id === lesson.id) {
        return true
      }

      return false
    }

    // ✅ Debug info
    const debugActiveCheck = computed(() => {
      if (displayLessons.value.length === 0) return 'No lessons'

      const activeLessons = displayLessons.value.filter(isLessonActive)
      return activeLessons.length > 0
        ? `Active: ${activeLessons[0].title} (ID: ${activeLessons[0].id})`
        : 'No active lesson found'
    })

    const handleLessonClick = (lesson) => {
      console.log('👆 SIDEBAR: Lesson clicked:', {
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug
      })

      // Emit the lesson ID to the parent
      emit('select-lesson', lesson.id)
    }

    // ✅ CRITICAL FIX: Handle global progress events
    const handleGlobalProgressEvent = (event) => {
      console.log('🌍 SIDEBAR: Global event received', event)

      const currentCourseCode = lessonStore.courseData?.code

      if (event.type === 'lesson-completed') {
        if (event.data.courseCode === currentCourseCode) {
          console.log(`✅ SIDEBAR: Lesson ${event.data.lessonId} completed in current course`)

          // Force update trigger to refresh the UI
          updateTrigger.value++

          console.log('🔄 SIDEBAR: Update trigger incremented to', updateTrigger.value)
        }
      } else if (event.type === 'progress-updated') {
        if (event.data.courseCode === currentCourseCode) {
          console.log(`📊 SIDEBAR: Progress updated for current course -> ${event.data.progress}%`)

          // Force update trigger
          updateTrigger.value++
        }
      }
    }

    // ✅ Watch for lessons changes
    watch(() => lessonStore.lessons, (newLessons, oldLessons) => {
      if (newLessons.length !== oldLessons?.length) {
        console.log('👀 SIDEBAR: Lessons array length changed')
        updateTrigger.value++
      }

      const newCompleted = newLessons.filter(l => l.completed).length
      const oldCompleted = oldLessons?.filter(l => l.completed).length || 0

      if (newCompleted !== oldCompleted) {
        console.log('👀 SIDEBAR: Completed count changed:', oldCompleted, '→', newCompleted)
        updateTrigger.value++
      }
    }, { deep: true })

    // ✅ Watch for current lesson changes
    watch(() => lessonStore.currentLesson, (newLesson) => {
      if (newLesson) {
        console.log('🎯 SIDEBAR: Current lesson updated:', {
          id: newLesson.id,
          title: newLesson.title
        })
        updateTrigger.value++
      }
    })

    // ✅ Watch for selected lesson ID changes from parent
    watch(() => props.selectedLessonId, (newId) => {
      console.log('🎯 SIDEBAR: Selected lesson ID from parent:', newId)
      updateTrigger.value++
    })

    // ✅ Watch for selected lesson slug changes from parent
    watch(() => props.selectedLessonSlug, (newSlug) => {
      console.log('🎯 SIDEBAR: Selected lesson slug from parent:', newSlug)
      updateTrigger.value++
    })

    onMounted(() => {
      console.log('✅ SIDEBAR: Mounted with global event tracking')
      console.log('Initial state:', {
        selectedLessonId: props.selectedLessonId,
        selectedLessonSlug: props.selectedLessonSlug,
        currentLessonId: currentLessonId.value,
        currentLessonSlug: currentLessonSlug.value
      })

      // ✅ Subscribe to GlobalProgressEvents
      if (window.globalProgressEvents) {
        unsubscribeGlobal = window.globalProgressEvents.subscribePersistent(
          'LessonSidebar',
          ['lesson-completed', 'progress-updated'],
          handleGlobalProgressEvent
        )
      }

      // Also subscribe to EventBridge for compatibility
      if (window.eventBridge) {
        unsubscribeEventBridge = window.eventBridge.subscribe(
          'progress-updated',
          (eventData) => {
            if (eventData.courseCode === lessonStore.courseData?.code) {
              console.log('🔔 SIDEBAR: EventBridge progress update')
              updateTrigger.value++
            }
          },
          'LessonSidebar'
        )
      }
    })

    onUnmounted(() => {
      console.log('🛑 SIDEBAR: Unmounting')

      if (unsubscribeGlobal) {
        unsubscribeGlobal()
      }

      if (unsubscribeEventBridge) {
        unsubscribeEventBridge()
      }

      if (window.eventBridge) {
        window.eventBridge.cleanupComponent('LessonSidebar')
      }
    })

    return {
      lessonStore,
      displayCourseTitle,
      displayLessons,
      totalLessons,
      completedLessonsCount,
      progressPercentage,
      handleLessonClick,
      updateTrigger,
      currentLessonId,
      currentLessonSlug,
      isLessonActive,
      debugActiveCheck
    }
  }
}
</script>

<style scoped>
.lessons-sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 250px;
  min-height: 100vh;
  background-color: #ffffff;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  overflow: hidden;
}

.lessons-sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 80px;
}

.course-info {
  flex: 1;
  overflow: hidden;
}

.course-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 5px 0;
  color: #087990;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-subtitle {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
}

.toggle-btn {
  background: none;
  border: none;
  color: #087990;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.toggle-btn:hover {
  background-color: rgba(8, 121, 144, 0.1);
}

.lessons-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.lesson-item {
  display: flex;
  align-items: center;
  padding: 7px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-left: 3px solid transparent;
}

.lesson-item:hover {
  background-color: rgba(8, 121, 144, 0.05);
}

.lesson-item.active {
  background-color: rgba(8, 121, 144, 0.1);
  border-left-color: #087990;
  font-weight: 600;
}

.lesson-item.active .lesson-title {
  color: #087990;
}

.lesson-item.completed .lesson-number {
  color: #28a745;
}

.lesson-number {
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.lesson-number i {
  font-size: 1.2rem;
}

.lesson-content {
  margin-left: 15px;
  flex: 1;
  overflow: hidden;
}

.lesson-title {
  font-size: 0.7rem;
  font-weight: 500;
  margin: 0 0 5px 0;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lesson-meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.75rem;
  color: #666;
}

/* Completed Badge Styling */
.completed-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: #4CAF50;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.6rem;
  font-weight: 600;
  margin-left: 5px;
}

.completed-badge i {
  font-size: 0.65rem;
}

.progress-section {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  background-color: rgba(8, 121, 144, 0.03);
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.progress-header i {
  color: #ffc107;
  font-size: 1.1rem;
}

.progress-header h4 {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  color: #333;
}

.progress-bar {
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #087990, #0a9bb8);
  transition: width 0.5s ease;
  border-radius: 4px;
}

.progress-text {
  font-size: 0.8rem;
  color: #666;
  margin: 0;
  text-align: center;
}

.lessons-list::-webkit-scrollbar {
  width: 6px;
}

.lessons-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.lessons-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.lessons-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}

@media (max-width: 1024px) {
  .lessons-sidebar {
    width: 250px;
  }

  .lessons-sidebar.collapsed {
    width: 70px;
  }
}

@media (max-width: 768px) {
  .lessons-sidebar {
    transform: translateX(-100%);
  }

  .lessons-sidebar.collapsed {
    transform: translateX(0);
    width: 70px;
  }
}
</style>