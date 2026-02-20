<template>
  <div class="guest-lesson-system">
    <!-- Guest Session Timer Banner -->
    <div v-if="showTimerBanner" class="timer-banner" :class="timerBannerClass">
      <div class="banner-content">
        <i class="fas fa-clock"></i>
        <span class="banner-text">{{ timerMessage }}</span>
        <button v-if="showRegisterButton" @click="register" class="register-now-btn">
          <i class="fas fa-user-plus"></i>
          Register Now
        </button>
      </div>
    </div>

    <!-- Session Expired Modal -->
    <div v-if="showExpiredModal" class="expired-modal-overlay">
      <div class="expired-modal">
        <div class="modal-icon">
          <i class="fas fa-hourglass-end"></i>
        </div>
        <h3>Guest Session Expired</h3>
        <p>Your 10-minute guest preview has ended. Register now to continue learning and save your progress.</p>
        <div class="modal-actions">
          <button @click="redirectToSignup" class="primary-btn">
            <i class="fas fa-user-plus"></i>
            Register Now
          </button>
          <button @click="goToCourses" class="secondary-btn">
            <i class="fas fa-home"></i>
            Back to Courses
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading guest preview...</p>
      </div>
    </div>

    <!-- Main Layout -->
    <div v-else class="layout-container">
      <!-- Guest Sidebar - Hidden on tablets and small devices -->
      <GuestLessonSidebar
        v-if="lessons && lessons.length > 0 && !isTablet"
        :courseData="courseData"
        :lessons="lessons"
        :selectedLessonId="selectedLessonId"
        :collapsed="sidebarCollapsed"
        @select-lesson="handleSidebarLessonSelect"
        @toggle-sidebar="toggleSidebar"
      />

      <!-- Main Content Area -->
      <div :class="['main-content', {
        'sidebar-collapsed': sidebarCollapsed,
        'no-sidebar': isTablet
      }]">
        <div class="header-wrapper">
          <GuestLessonHeader
            :showTimerBanner="showTimerBanner"
            class="guest-header"
          />
        </div>

        <div class="content-scrollable">
          <div class="single-lesson-card">
            <LessonDetailGuest
              v-if="selectedLessonId && lessonsLoaded"
              :key="`lesson-${selectedLessonId}-${selectedLessonSlug}`"
              :course-slug="exposedCourseSlug"
              :lesson-id="selectedLessonId"
              :lesson-slug="selectedLessonSlug"
              :selected-lesson-id="selectedLessonId"
              :sidebar-collapsed="sidebarCollapsed"
              :lessons="lessons"
              :course-data="courseData"
              @lesson-selected="handleLessonSelected"
              @lesson-completed="handleLessonCompleted"
              @session-expired="handleSessionExpired"
            />

            <div v-else-if="lessons && lessons.length > 0" class="no-lesson-selected">
              <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <h3>Select a Lesson</h3>
                <p>Choose a lesson from the sidebar to start learning</p>
              </div>
            </div>

            <div v-else class="no-lesson-selected">
              <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <h3>No Lessons Available</h3>
                <p>This course doesn't have any lessons available for preview.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, provide, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGuestStore } from '@/stores/guest'
import { useToast } from 'vue-toastification'
import GuestLessonSidebar from '@/components/guest/GuestLessonSidebar.vue'
import LessonDetailGuest from './LessonDetailGuest.vue'
import GuestLessonHeader from '@/components/guest/GuestLessonHeader.vue'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'GuestLessonLayout',
  components: {
    GuestLessonSidebar,
    LessonDetailGuest,
    GuestLessonHeader,
  },
  props: {
    courseSlug: String,
    lessonSlug: String,
  },
  setup(props) {
    const route = useRoute()
    const router = useRouter()
    const guestStore = useGuestStore()
    const authStore = useAuthStore()
    const toast = useToast()

    const selectedLessonSlug = ref(null)
    const selectedLessonId = ref(null)
    const sidebarCollapsed = ref(false)
    const courseData = ref({})
    const lessons = ref([])
    const loading = ref(true)
    const lessonsLoaded = ref(false)

    const showTimerBanner = ref(false)
    const timerMessage = ref('')
    const timerBannerClass = ref('info')
    const bannerTimeout = ref(null)
    const showExpiredModal = ref(false)
    const isAuthenticating = ref(false)

    const isTablet = ref(false)

    const showRegisterButton = computed(() => {
      return guestStore.remainingTime <= 60
    })

    const isGuestUser = computed(() => {
      return !authStore.isAuthenticated && guestStore.isGuestMode
    })

    const shouldShowTimer = computed(() => {
      return isGuestUser.value && showTimerBanner.value
    })

    const shouldShowExpiredModal = computed(() => {
      return isGuestUser.value && showExpiredModal.value
    })

    const checkIfTablet = () => {
      const width = window.innerWidth
      isTablet.value = width >= 768 && width <= 1024
    }

    const generateSlug = (title) => {
      return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim()
    }

    const findLessonBySlug = (slug) => {
      if (!lessons.value || lessons.value.length === 0) return null

      let lesson = lessons.value.find(l => {
        const lessonSlug = generateSlug(l.title)
        return lessonSlug === slug
      })

      if (!lesson && slug && !isNaN(slug)) {
        lesson = lessons.value.find(l => l.id === parseInt(slug))
      }

      return lesson
    }

    const checkAuthAndRedirect = async () => {
      if (authStore.isAuthenticated) {
        if (guestStore.isGuestMode) {
          guestStore.endSession()
        }

        toast.success('Welcome back! Redirecting to your dashboard...', {
          timeout: 3000
        })

        setTimeout(() => {
          router.push('/student')
        }, 1500)

        return true
      }

      return false
    }

    const initializeGuestSession = async () => {
      const shouldRedirect = await checkAuthAndRedirect()
      if (shouldRedirect) {
        return { success: false, redirecting: true }
      }

      try {
        if (guestStore.isGuestMode && guestStore.session?.session_id) {
          const validation = await guestStore.validateSession()

          if (validation.valid) {
            return { success: true, userType: 'guest', existing: true }
          } else {
            guestStore.endSession()
          }
        }

        const result = await guestStore.startGuestSession()

        if (!result.success) {
          toast.error('Failed to start preview session: ' + result.error)
          return { success: false, error: result.error }
        }

        return { success: true, userType: 'guest', isNew: true }
      } catch (error) {
        return { success: false, error: error.message }
      }
    }

    const loadCourseData = async (courseSlug) => {
      loading.value = true
      lessonsLoaded.value = false

      try {
        const sessionResult = await initializeGuestSession()
        if (sessionResult.redirecting) {
          return
        }

        if (!sessionResult.success) {
          throw new Error('Session initialization failed: ' + (sessionResult.error || 'Unknown error'))
        }

        const courseResult = await guestStore.getGuestCourseDetail(courseSlug)
        courseData.value = courseResult || {}

        const lessonsResult = await guestStore.getGuestCourseLessons(courseSlug)
        lessons.value = lessonsResult || []

        if (lessons.value.length > 0) {
          const routeLessonSlug = props.lessonSlug || route.params.lessonSlug

          let targetLesson = null

          if (routeLessonSlug && routeLessonSlug !== 'undefined' && routeLessonSlug !== 'first') {
            targetLesson = findLessonBySlug(routeLessonSlug)
          }

          if (!targetLesson) {
            targetLesson = lessons.value[0]
          }

          selectedLessonSlug.value = generateSlug(targetLesson.title)
          selectedLessonId.value = targetLesson.id

          const newUrl = `/guest/courses/${props.courseSlug}/lessons/${selectedLessonSlug.value}`
          if (window.location.pathname !== newUrl) {
            window.history.replaceState({}, '', newUrl)
          }

          lessonsLoaded.value = true
        } else {
          selectedLessonSlug.value = null
          selectedLessonId.value = null
          lessonsLoaded.value = true
        }

      } catch (error) {
        if (error.response?.status === 410) {
          showExpiredModal.value = true
        } else {
          toast.error('Failed to load course: ' + (error.message || 'Unknown error'))
        }
        lessonsLoaded.value = true
      } finally {
        loading.value = false
      }
    }

    const handleAuthenticationTransition = async () => {
      if (isAuthenticating.value) return

      isAuthenticating.value = true

      try {
        if (guestStore.isGuestMode) {
          guestStore.endSession()
        }

        try {
          const cacheKey = `guest_completed_lessons_${props.courseSlug}`
          const expiryKey = `${cacheKey}_expiry`
          localStorage.removeItem(cacheKey)
          localStorage.removeItem(expiryKey)
        } catch (e) {}

        toast.success('Welcome back! Your guest session has been cleared.', {
          timeout: 3000
        })

        setTimeout(() => {
          router.push('/student')
        }, 1500)

      } catch (error) {
        console.error('Error during authentication transition:', error)
      } finally {
        isAuthenticating.value = false
      }
    }

    const handleSidebarLessonSelect = async (lessonId) => {
      const lesson = lessons.value.find(l => l.id === lessonId)
      if (!lesson) {
        toast.error('Lesson not found')
        return
      }

      const newSlug = generateSlug(lesson.title)

      selectedLessonSlug.value = newSlug
      selectedLessonId.value = lesson.id

      try {
        await router.push({
          name: 'guest-lesson-detail',
          params: {
            courseSlug: props.courseSlug,
            lessonSlug: newSlug
          }
        })
      } catch (error) {
        const newUrl = `/guest/courses/${props.courseSlug}/lessons/${newSlug}`
        window.history.pushState({}, '', newUrl)
      }

      await nextTick()
    }

    const handleLessonSelected = async (lessonId) => {
      const lesson = lessons.value.find(l => l.id === lessonId)
      if (!lesson) return

      const newSlug = generateSlug(lesson.title)
      selectedLessonSlug.value = newSlug
      selectedLessonId.value = lesson.id

      await nextTick()
    }

    const handleLessonCompleted = (data) => {
      if (guestStore.remainingTime <= 60) {
        toast.warning('Session about to expire - register to save progress permanently')
      }

      cacheLessonCompletion(data.lessonId)

      try {
        window.dispatchEvent(new CustomEvent('force-sidebar-refresh', {
          detail: data
        }))
      } catch (error) {
        console.error('Force refresh event failed:', error)
      }

      if (typeof window !== 'undefined' && window.guestEventBridge) {
        try {
          window.guestEventBridge.emit('guest-lesson-completed', {
            lessonId: data.lessonId,
            courseSlug: props.courseSlug,
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          console.error('Event bridge emission failed:', error)
        }
      }

      try {
        const cacheKey = `guest_completed_lessons_${props.courseSlug}`
        const cached = localStorage.getItem(cacheKey)
        const completedLessons = cached ? JSON.parse(cached) : []

        if (!completedLessons.includes(data.lessonId)) {
          completedLessons.push(data.lessonId)
          localStorage.setItem(cacheKey, JSON.stringify(completedLessons))
        }
      } catch (error) {
        console.error('localStorage update failed:', error)
      }
    }

    const cacheLessonCompletion = (lessonId) => {
      try {
        const cacheKey = `guest_completed_lessons_${props.courseSlug}`
        const cached = localStorage.getItem(cacheKey)
        const completedLessons = cached ? JSON.parse(cached) : []

        if (!completedLessons.includes(lessonId)) {
          completedLessons.push(lessonId)
          localStorage.setItem(cacheKey, JSON.stringify(completedLessons))
        }

        const expiry = Date.now() + (10 * 60 * 1000)
        localStorage.setItem(`${cacheKey}_expiry`, expiry.toString())
      } catch (error) {
        console.error('Failed to cache lesson completion:', error)
      }
    }

    const clearGuestCompletionData = () => {
      try {
        const cacheKey = `guest_completed_lessons_${props.courseSlug}`
        const expiryKey = `${cacheKey}_expiry`
        localStorage.removeItem(cacheKey)
        localStorage.removeItem(expiryKey)
      } catch (error) {
        console.error('Failed to clear guest completion data:', error)
      }
    }

    const toggleSidebar = () => {
      sidebarCollapsed.value = !sidebarCollapsed.value
    }

    const register = () => {
      guestStore.endSession()
      router.push('/signup')
    }

    const redirectToSignup = () => {
      guestStore.endSession()
      router.push('/signup')
    }

    const goToCourses = () => {
      guestStore.endSession()
      router.push('/courses')
    }

    const handleSessionExpired = (data) => {
      if (isGuestUser.value) {
        showExpiredModal.value = true
        clearGuestCompletionData()

        setTimeout(() => {
          if (showExpiredModal.value) {
            redirectToSignup()
          }
        }, 5000)
      }
    }

    const updateTimerBanner = () => {
      if (!isGuestUser.value) {
        showTimerBanner.value = false
        return
      }

      const remainingTime = guestStore.remainingTime

      if (bannerTimeout.value) {
        clearTimeout(bannerTimeout.value)
        bannerTimeout.value = null
      }

      showTimerBanner.value = false

      if (remainingTime <= 0) {
        handleSessionExpired({ reason: 'time_up' })
        return
      }

      if (remainingTime === 600) {
        showTimerBanner.value = true
        timerBannerClass.value = 'info'
        timerMessage.value = 'Guest preview - 10 minutes remaining'
        bannerTimeout.value = setTimeout(() => {
          showTimerBanner.value = false
        }, 10000)
      } else if (remainingTime === 300) {
        showTimerBanner.value = true
        timerBannerClass.value = 'warning'
        timerMessage.value = 'Guest preview - 5 minutes remaining'
        bannerTimeout.value = setTimeout(() => {
          showTimerBanner.value = false
        }, 10000)
      } else if (remainingTime <= 60) {
        showTimerBanner.value = true
        timerBannerClass.value = 'critical'
        const seconds = remainingTime
        timerMessage.value = `Guest session ending in ${seconds} second${seconds !== 1 ? 's' : ''}!`
      }
    }

    const provideGuestLayout = () => {
      provide('guestLessonLayout', {
        sidebarCollapsed,
        selectedLessonId: computed(() => selectedLessonId.value),
        selectedLessonSlug: computed(() => selectedLessonSlug.value),
        courseData: computed(() => courseData.value),
        lessons: computed(() => lessons.value),
        handleLessonSelect: handleSidebarLessonSelect,
        toggleSidebar,
        register,
        courseSlug: props.courseSlug,
      })
    }

    provideGuestLayout()

    watch(() => props.courseSlug, async (newSlug) => {
      if (newSlug) {
        await loadCourseData(newSlug)
      }
    })

    watch(() => authStore.isAuthenticated, async (isAuthenticated, oldValue) => {
      if (isAuthenticated) {
        await handleAuthenticationTransition()
      }
    }, { immediate: true })

    watch(() => guestStore.remainingTime, (newTime) => {
      if (isGuestUser.value) {
        updateTimerBanner()

        if (newTime <= 0) {
          handleSessionExpired({ reason: 'timer_reached_zero' })
        }
      }
    })

    watch(() => route.params.lessonSlug, async (newSlug, oldSlug) => {
      if (newSlug && newSlug !== selectedLessonSlug.value && newSlug !== 'undefined') {
        selectedLessonSlug.value = newSlug
        const lesson = findLessonBySlug(newSlug)

        if (lesson) {
          selectedLessonId.value = lesson.id
          await nextTick()
        }
      }
    })

    onMounted(async () => {
      checkIfTablet()
      window.addEventListener('resize', checkIfTablet)

      const shouldRedirect = await checkAuthAndRedirect()

      if (!authStore.isAuthenticated && !shouldRedirect) {
        if (guestStore.isGuestMode && !guestStore.timerStarted) {
          guestStore.startTimer()
        }

        await loadCourseData(props.courseSlug)
      }
    })

    onUnmounted(() => {
      window.removeEventListener('resize', checkIfTablet)
    })

    return {
      selectedLessonId,
      selectedLessonSlug,
      sidebarCollapsed,
      courseData,
      lessons,
      loading,
      lessonsLoaded,
      timerMessage,
      timerBannerClass,
      showRegisterButton,
      handleSessionExpired,
      handleSidebarLessonSelect,
      toggleSidebar,
      handleLessonSelected,
      handleLessonCompleted,
      register,
      redirectToSignup,
      goToCourses,
      isGuestUser,
      showTimerBanner: shouldShowTimer,
      showExpiredModal: shouldShowExpiredModal,
      exposedCourseSlug: props.courseSlug,
      isTablet,
    }
  }
}
</script>

<style scoped>
.expired-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.expired-modal {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-icon {
  font-size: 3rem;
  color: #ff6b6b;
  margin-bottom: 1rem;
}

.expired-modal h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.5rem;
}

.expired-modal p {
  margin: 0 0 2rem 0;
  color: #666;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.secondary-btn {
  background: #f8f9fa;
  color: #333;
  border: 2px solid #e9ecef;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.secondary-btn:hover {
  background: #e9ecef;
}

.guest-lesson-system {
  display: flex;
  min-height: 100vh;
  background-color: var(--gray-bg);
  position: relative;
  width: 100%;
  overflow: hidden;
}

.layout-container {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

/* Timer Banner */
.timer-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2000;
  padding: 12px 20px;
  color: white;
  font-weight: 600;
  text-align: center;
  animation: slideDown 0.3s ease-out;
  transition: all 0.3s ease;
  height: 50px;
  box-sizing: border-box;
}

.timer-banner.info { background: linear-gradient(135deg, #3498db, #2980b9); }
.timer-banner.warning { background: linear-gradient(135deg, #f39c12, #e67e22); }
.timer-banner.critical {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  animation: pulse 1s infinite;
}

.banner-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
}

.banner-text {
  font-size: 14px;
}

.register-now-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.register-now-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
}

/* Main content */
.main-content {
  flex: 1;
  margin-left: 250px;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 100vh;
  width: calc(100% - 250px);
  display: flex;
  flex-direction: column;
}

.main-content.sidebar-collapsed {
  margin-left: 60px;
  width: calc(100% - 60px);
}

/* No sidebar state for tablets */
.main-content.no-sidebar {
  margin-left: 0 !important;
  width: 100% !important;
}

.header-wrapper {
  position: fixed;
  top: 0;
  left: 250px;
  right: 0;
  z-index: 1000;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 60px;
}

.main-content.sidebar-collapsed .header-wrapper {
  left: 60px;
}

.main-content.no-sidebar .header-wrapper {
  left: 0 !important;
}

.guest-lesson-system:has(.timer-banner) .header-wrapper {
  top: 50px;
}

/* Single card layout */
.single-lesson-card {
  background: white;
  border-radius: 1rem;
  margin: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  max-width: none;
  width: auto;
}

.content-area {
  width: 100%;
  max-width: none;
  padding: 0;
}

.lesson-content-wrapper {
  width: 100%;
  max-width: none;
}

.guest-header {
  width: 100%;
  height: 100%;
}

/* Scrollable content area */
.content-scrollable {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  margin-top: 60px;
  height: calc(100vh - 60px);
  background-color: var(--gray-bg);
  padding-bottom: 1rem;
}

.guest-lesson-system:has(.timer-banner) .content-scrollable {
  margin-top: 110px;
  height: calc(100vh - 110px);
}

/* Loading States */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  background-color: var(--gray-bg);
}

.loading-spinner {
  text-align: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

/* No lesson selected state */
.no-lesson-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
}

.empty-state {
  text-align: center;
  max-width: 400px;
}

.empty-state i {
  font-size: 3rem;
  color: var(--border-color);
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: var(--secondary-color);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--secondary-color);
  opacity: 0.7;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* Tablet range (768px - 1024px) */
@media (max-width: 1024px) and (min-width: 768px) {
  .main-content {
    margin-left: 0;
    width: 100%;
  }

  .main-content.sidebar-collapsed {
    margin-left: 0;
    width: 100%;
  }

  .header-wrapper {
    left: 0 !important;
  }
}

@media (max-width: 768px) {
  .guest-lesson-system {
    flex-direction: column;
  }
  .main-content {
    margin-left: 0;
    width: 100%;
  }
  .main-content.sidebar-collapsed {
    margin-left: 0;
    width: 100%;
  }

  .content-scrollable {
    margin-top: 60px;
    height: calc(100vh - 60px);
  }

  .header-wrapper {
    left: 0;
    right: 0;
  }

  .guest-lesson-system:has(.timer-banner) .content-scrollable {
    margin-top: 110px;
    height: calc(100vh - 110px);
  }

  .single-lesson-card {
    margin: 0.5rem;
  }
}

@media (min-width: 1400px) {
  .single-lesson-card {
    margin: 1rem 2rem;
  }
}

@media (min-width: 1920px) {
  .single-lesson-card {
    margin: 1rem 4rem;
  }
}

@media (min-width: 2560px) {
  .single-lesson-card {
    margin: 1rem auto;
    max-width: 2000px;
  }
}
</style>