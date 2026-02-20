<template>
  <div class="lesson-system">
    <LessonSidebar
      v-if="lessonStore.lessons.length > 0 && !isTablet"
      :courseData="lessonStore.courseData"
      :selectedLessonId="selectedLessonId"
      :selectedLessonSlug="selectedLessonSlug"
      :collapsed="sidebarCollapsed"
      @select-lesson="selectLesson"
      @toggle-sidebar="toggleSidebar"
    />

    <div :class="['main-content', { 'sidebar-collapsed': sidebarCollapsed, 'no-sidebar': isTablet }]">
      <template v-if="selectedLessonSlug">
        <component
          :is="LessonDetail"
          :key="`${courseSlug}-${selectedLessonSlug}`"
          :course-slug="courseSlug"
          :lesson-slug="selectedLessonSlug"
          :course-id="courseId"
          @lesson-selected="handleLessonSelected"
          @lesson-completed="handleLessonCompleted"
        />
      </template>
      <div v-else class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading lesson...</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, onBeforeMount, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLessonStore } from '@/stores/lesson'
import LessonSidebar from '@/components/student/LessonSidebar.vue'
import LessonDetail from '@/components/student/LessonDetail.vue'
import { generateSlug, findLessonBySlug, findLessonById } from '@/utils/slugUtils'

export default {
  name: 'LessonDetailParent',
  components: { LessonSidebar, LessonDetail },
  props: {
    courseSlug: String,
    courseId:   [String, Number],
    lessonSlug: String,
  },
  setup(props) {
    const route       = useRoute()
    const router      = useRouter()
    const lessonStore = useLessonStore()

    const selectedLessonSlug = ref(null)
    const sidebarCollapsed   = ref(false)
    const isNavigating       = ref(false)
    const currentCourseSlug  = ref(null)
    const isTablet           = ref(false)

    const checkIfTablet = () => {
      const w = window.innerWidth
      isTablet.value = w >= 768 && w <= 1024
    }

    const getLessonBySlug = (slug) => findLessonBySlug(lessonStore.lessons, slug)
    const getLessonById   = (id)   => findLessonById(lessonStore.lessons, id)

    const selectedLessonId = computed(() => {
      if (!selectedLessonSlug.value || !lessonStore.lessons.length) return null
      const lesson = getLessonBySlug(selectedLessonSlug.value)
      return lesson ? lesson.id : null
    })

    const getBackRoute = () => {
      try {
        const sourceData = JSON.parse(sessionStorage.getItem('lessonNavSource') || 'null')
        if (!sourceData) return null
        switch (sourceData.source) {
          case 'exercises-overview':   return { name: 'exercises-overview' }
          case 'lessons-overview':     return { name: 'lessons-overview' }
          case 'student-Lessons':      return { name: 'student-Lessons' }
          case 'student-course-detail': {
            const slug = sourceData.params?.courseSlug || props.courseSlug
            return slug ? { name: 'student-course-detail', params: { courseSlug: slug } } : null
          }
          case 'guest-course-detail': {
            const guestSlug = sourceData.params?.courseSlug || props.courseSlug
            return guestSlug
              ? { name: 'guest-course-detail', params: { courseSlug: guestSlug } }
              : { name: 'guest-courses' }
          }
          default: return null
        }
      } catch { return null }
    }

    const handleHeaderBack = () => {
      const backRoute = getBackRoute()
      if (backRoute) router.push(backRoute)
      else router.back()
    }

    const loadCourseData = async (courseSlug) => {
      try {
        await lessonStore.loadCourse(courseSlug)
        const result = await lessonStore.loadLessons(courseSlug)

        if (result.success && lessonStore.lessons.length > 0) {
          const routeLessonSlug = props.lessonSlug || route.params.lessonSlug

          if (routeLessonSlug === 'first' || !routeLessonSlug) {
            selectedLessonSlug.value = generateSlug(lessonStore.lessons[0].title)
          } else {
            const lesson = getLessonBySlug(routeLessonSlug)
            if (lesson) {
              selectedLessonSlug.value = generateSlug(lesson.title)
            } else {
              const numericId = parseInt(routeLessonSlug)
              if (!isNaN(numericId)) {
                const byId = getLessonById(numericId)
                if (byId) selectedLessonSlug.value = generateSlug(byId.title)
              }
            }
          }

          if (selectedLessonSlug.value) {
            const lesson = getLessonBySlug(selectedLessonSlug.value)
            if (lesson) lessonStore.setCurrentLesson(lesson.id)
          }
        }
      } catch (error) {
        console.error('❌ Failed to load course:', error)
      }
    }

    const selectLesson = (lessonIdentifier) => {
      if (!lessonIdentifier || isNavigating.value) return

      let lessonSlug = null
      const numericId = parseInt(lessonIdentifier)

      if (!isNaN(numericId)) {
        const lesson = lessonStore.lessons.find(l => l.id === numericId)
        if (lesson) lessonSlug = generateSlug(lesson.title)
      } else {
        const lesson = getLessonBySlug(lessonIdentifier)
        if (lesson) lessonSlug = generateSlug(lesson.title)
        else { console.warn('⚠️ Lesson not found:', lessonIdentifier); return }
      }

      if (!lessonSlug || lessonSlug === selectedLessonSlug.value) return

      selectedLessonSlug.value = lessonSlug
      window.history.replaceState({}, '', `/student/courses/${props.courseSlug}/lessons/${lessonSlug}`)
    }

    const handleLessonSelected  = (lessonSlug) => selectLesson(lessonSlug)

    const handleLessonCompleted = async (data) => {
      console.log('✅ PARENT: Lesson completed', data)

      // Small delay so store has settled
      await new Promise(resolve => setTimeout(resolve, 100))

      // Nudge reactivity if the store exposes a trigger counter
      if (typeof lessonStore.reactivityTrigger !== 'undefined') {
        lessonStore.reactivityTrigger++
      }

      console.log('✓ Completion handled — completed lessons:',
        lessonStore.lessons.filter(l => l.completed).length
      )
    }

    const toggleSidebar = () => { sidebarCollapsed.value = !sidebarCollapsed.value }

    // ── watchers ──────────────────────────────────────────────────────────────
    watch(() => props.courseSlug, async (newSlug, oldSlug) => {
      if (newSlug && newSlug !== oldSlug) {
        currentCourseSlug.value = newSlug
        lessonStore.reset()
        await loadCourseData(newSlug)
      }
    }, { immediate: false })

    watch(() => route.params.lessonSlug, (newLessonSlug) => {
      if (!newLessonSlug || !lessonStore.lessons.length) return
      const slug = newLessonSlug === 'first'
        ? generateSlug(lessonStore.lessons[0]?.title)
        : newLessonSlug
      if (slug && slug !== selectedLessonSlug.value) selectedLessonSlug.value = slug
    })

    watch(() => props.lessonSlug, async (newSlug, oldSlug) => {
      if (newSlug && newSlug !== oldSlug) {
        const slug = newSlug === 'first' ? generateSlug(lessonStore.lessons[0].title) : newSlug
        lessonStore.setCurrentLesson(slug)
        await lessonStore.loadLessonDetail(slug)
      }
    }, { immediate: false })

    watch(() => lessonStore.lessons, (newVal, oldVal) => {
      const nc = newVal.filter(l => l.completed).length
      const oc = oldVal.filter(l => l.completed).length
      if (nc !== oc) console.log('✅ PARENT: Completed count changed:', oc, '→', nc)
    }, { deep: true })

    // ── lifecycle ─────────────────────────────────────────────────────────────
    onBeforeMount(async () => {
      currentCourseSlug.value = props.courseSlug
      await loadCourseData(props.courseSlug)
    })

    onMounted(() => {
      if (props.courseSlug)        sessionStorage.setItem('currentCourseSlug', props.courseSlug)
      if (selectedLessonSlug.value) sessionStorage.setItem('currentLessonSlug', selectedLessonSlug.value)
      checkIfTablet()
      window.addEventListener('resize', checkIfTablet)
    })

    onUnmounted(() => {
      sessionStorage.removeItem('currentCourseSlug')
      sessionStorage.removeItem('currentLessonSlug')
      window.removeEventListener('resize', checkIfTablet)
    })

    return {
      lessonStore,
      selectedLessonSlug, selectedLessonId,
      sidebarCollapsed, isTablet,
      courseSlug: props.courseSlug,
      selectLesson, toggleSidebar,
      handleLessonSelected, handleLessonCompleted, handleHeaderBack,
      LessonDetail,
    }
  }
}
</script>

<style scoped>
.lesson-system {
  display: flex;
  min-height: 100vh;
  background-color: #f5f5f5;
  position: relative;
  width: 100%;
  overflow: hidden;
}

.main-content {
  flex: 1;
  margin-left: 250px;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  width: calc(100% - 250px);
  will-change: margin-left;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.main-content.sidebar-collapsed { margin-left: 80px; width: calc(100% - 80px); }
.main-content.no-sidebar         { margin-left: 0 !important; width: 100% !important; }

@media (max-width: 1024px) and (min-width: 768px) {
  .main-content, .main-content.sidebar-collapsed { margin-left: 0; width: 100%; }
}

@media (max-width: 768px) {
  .lesson-system  { flex-direction: column; }
  .main-content, .main-content.sidebar-collapsed { margin-left: 0; width: 100%; order: 1; }
}

.loading-state {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 3rem; text-align: center;
}

.loading-spinner {
  width: 40px; height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color, #087990);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>