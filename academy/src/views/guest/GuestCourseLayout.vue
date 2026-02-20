<template>
  <div class="guest-course-layout">
    <!-- Session Expired Modal -->
    <div v-if="showExpiredModal" class="expired-modal-overlay">
      <div class="expired-modal">
        <div class="modal-icon">
          <i class="fas fa-hourglass-end"></i>
        </div>
        <h3>Guest Session Expired</h3>
        <p>
          Your 10-minute guest preview has ended. Register now to continue learning and save your
          progress.
        </p>
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

    <!-- Main Content Area - NO SIDEBAR HERE -->
    <div class="layout-container">
      <!-- Main Content -->
      <div class="layout-main-content">
        <!-- Use keep-alive to preserve component state -->
        <keep-alive>
          <router-view @update-course="handleCourseUpdate" @refresh-courses="fetchOtherCourses" />
        </keep-alive>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGuestStore } from '@/stores/guest'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

export default {
  name: 'GuestCourseLayout',
  setup() {
    const router = useRouter()
    const guestStore = useGuestStore()
    const authStore = useAuthStore()
    const toast = useToast()

    // State for timer and session management
    const showTimerBanner = ref(false)
    const timerMessage = ref('')
    const timerBannerClass = ref('info')
    const showExpiredModal = ref(false)
    const bannerTimeout = ref(null)
    const isAuthenticating = ref(false)

    // Computed properties
    const isGuestUser = computed(() => {
      return !authStore.isAuthenticated && guestStore.isGuestMode
    })

    const shouldShowTimer = computed(() => {
      return isGuestUser.value && showTimerBanner.value
    })

    const shouldShowExpiredModal = computed(() => {
      return isGuestUser.value && showExpiredModal.value
    })

    // ✅ ENHANCED: Check authentication on mount
    const checkAuthAndRedirect = async () => {
      ;('🔐 GuestCourseLayout: Checking authentication status...')

      if (authStore.isAuthenticated) {
        ;('✅ User is authenticated - redirecting to student dashboard')

        // Clear any guest session
        if (guestStore.isGuestMode) {
          guestStore.endSession()
        }

        // Show welcome message
        toast.success('Welcome back! Redirecting to your dashboard...', {
          timeout: 3000,
        })

        // Redirect to student dashboard with a small delay
        setTimeout(() => {
          router.push('/student')
        }, 1500)

        return true
      }

      return false
    }

    // ✅ ENHANCED: Initialize guest session with authentication check
    const initializeGuestSession = async () => {
      ;('🔐 GuestCourseLayout: Initializing guest session...')

      // First check if user is already authenticated
      const isRedirecting = await checkAuthAndRedirect()
      if (isRedirecting) {
        return { success: false, redirecting: true }
      }

      try {
        // Check for existing valid session first
        if (guestStore.isGuestMode && guestStore.session?.session_id) {
          ;('🔍 GuestCourseLayout: Checking existing guest session...')
          const validation = await guestStore.validateSession()

          if (validation.valid) {
            '✅ GuestCourseLayout: Using existing valid guest session:',
              guestStore.session.session_id
            return { success: true, userType: 'guest', existing: true }
          } else {
            '❌ GuestCourseLayout: Existing session invalid:', validation.reason
            guestStore.endSession()
          }
        }

        // Start new session if no valid session exists
        ;('🚀 GuestCourseLayout: Starting new guest session...')
        const result = await guestStore.startGuestSession()

        if (!result.success) {
          console.error('❌ GuestCourseLayout: Failed to start guest session:', result.error)
          return { success: false, error: result.error }
        }

        ;('✅ GuestCourseLayout: Guest session started successfully')
        return { success: true, userType: 'guest', isNew: true }
      } catch (error) {
        console.error('❌ GuestCourseLayout: Session initialization error:', error)
        return { success: false, error: error.message }
      }
    }

    // ✅ ENHANCED: Handle authentication transition
    const handleAuthenticationTransition = async () => {
      if (isAuthenticating.value) return

      isAuthenticating.value = true('🔄 GuestCourseLayout: Handling authentication transition...')

      try {
        // End guest session
        if (guestStore.isGuestMode) {
          guestStore.endSession()
        }

        // Show success message
        toast.success('Welcome back! Your guest session has been cleared.', {
          timeout: 3000,
        })

        // Redirect to student dashboard
        setTimeout(() => {
          router.push('/student')
        }, 1500)
      } catch (error) {
        console.error('❌ GuestCourseLayout: Error during authentication transition:', error)
      } finally {
        isAuthenticating.value = false
      }
    }

    // ✅ Update timer banner
    const updateTimerBanner = () => {
      if (!guestStore.isGuestMode || authStore.isAuthenticated) {
        showTimerBanner.value = false
        return
      }

      const remainingTime = guestStore.remainingTime

      // Clear any existing timeout
      if (bannerTimeout.value) {
        clearTimeout(bannerTimeout.value)
        bannerTimeout.value = null
      }

      // Hide banner initially
      showTimerBanner.value = false

      if (remainingTime <= 0) {
        showTimerBanner.value = false
        return
      }

      // Show warnings and auto-hide after 10 seconds
      if (remainingTime === 600) {
        // 10 minutes
        showTimerBanner.value = true
        timerBannerClass.value = 'info'
        timerMessage.value = 'Guest preview - 10 minutes remaining'
        bannerTimeout.value = setTimeout(() => {
          showTimerBanner.value = false
        }, 10000)
      } else if (remainingTime === 300) {
        // 5 minutes
        showTimerBanner.value = true
        timerBannerClass.value = 'warning'
        timerMessage.value = 'Guest preview - 5 minutes remaining'
        bannerTimeout.value = setTimeout(() => {
          showTimerBanner.value = false
        }, 10000)
      } else if (remainingTime <= 60) {
        // 1 minute
        showTimerBanner.value = true
        timerBannerClass.value = 'critical'
        const seconds = remainingTime
        timerMessage.value = `Guest session ending in ${seconds} second${seconds !== 1 ? 's' : ''}!`
      }
    }

    const redirectToSignup = () => {
      guestStore.endSession()
      router.push('/signup')
    }

    const goToCourses = () => {
      guestStore.endSession()
      router.push('/guest/courses')
    }

    // ✅ Session expiry handler
    const handleSessionExpired = (data) => {
      '🕐 GuestCourseLayout: Session expired event received:', data

      if (!authStore.isAuthenticated && guestStore.isGuestMode) {
        showExpiredModal.value = true

        // Force redirect after 5 seconds if user doesn't act
        setTimeout(() => {
          if (showExpiredModal.value) {
            redirectToSignup()
          }
        }, 5000)
      }
    }

    // ✅ ENHANCED: Watch for authentication changes
    watch(
      () => authStore.isAuthenticated,
      async (isAuthenticated) => {
        '🔐 GuestCourseLayout: Authentication status changed:', isAuthenticated

        if (isAuthenticated) {
          ;('✅ GuestCourseLayout: User authenticated - transitioning from guest to student')
          await handleAuthenticationTransition()
        }
      },
      { immediate: true },
    )

    // ✅ FIXED: Enhanced timer watcher
    watch(
      () => guestStore.remainingTime,
      (newTime, oldTime) => {
        ;`🔍 GuestCourseLayout Timer: ${oldTime}s -> ${newTime}s`

        if (!authStore.isAuthenticated && guestStore.isGuestMode) {
          // Update timer banner UI
          updateTimerBanner()

          // Auto-redirect when time reaches 0
          if (newTime <= 0) {
            ;('⏰ GuestCourseLayout: Timer reached 0 - handling expiry')
            handleSessionExpired({ reason: 'timer_reached_zero' })
          }
        }
      },
    )

    // ✅ ENHANCED: Mounted hook
    onMounted(async () => {
      ;('🎬 GuestCourseLayout: Mounted')

      // Initial auth check
      await checkAuthAndRedirect()

      // Only proceed if user is not authenticated
      if (!authStore.isAuthenticated) {
        // Initialize session
        await initializeGuestSession()

        // Start timer only if guest session is active
        if (guestStore.isGuestMode && !guestStore.timerStarted) {
          guestStore.startTimer()('⏰ GuestCourseLayout: Timer started')
        }
      }
    })

    onUnmounted(() => {
      ;('🛑 GuestCourseLayout: Unmounting')

      // Clear timers
      if (bannerTimeout.value) {
        clearTimeout(bannerTimeout.value)
        bannerTimeout.value = null
      }
    })

    return {
      // Session management
      shouldShowTimer,
      shouldShowExpiredModal,
      timerMessage,
      timerBannerClass,

      // Methods
      redirectToSignup,
      goToCourses,
    }
  },
}
</script>

<style scoped>
.guest-course-layout {
  height: 100vh;
  background-color: var(--gray-bg);
  overflow: hidden;
}

.layout-container {
  display: flex;
  height: 100vh;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.layout-container.with-sidebar {
  margin-left: 280px;
  width: calc(100% - 280px);
}

.layout-container.with-sidebar.sidebar-collapsed {
  margin-left: 70px;
  width: calc(100% - 70px);
}

.layout-main-content {
  flex: 1;
  height: 100vh;
  overflow-y: auto;
  background-color: var(--gray-bg);
}

.layout-main-content.with-header {
  margin-top: 60px;
  height: calc(100vh - 60px);
}

/* Responsive styles */
@media (max-width: 768px) {
  .layout-container.with-sidebar {
    margin-left: 0;
    width: 100%;
  }

  .layout-container.with-sidebar.sidebar-collapsed {
    margin-left: 0;
    width: 100%;
  }
}
</style>
