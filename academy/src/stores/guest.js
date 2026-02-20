// src/stores/guest.js - Add these missing methods
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export const useGuestStore = defineStore('guest', {
  state: () => ({
    session: null,
    settings: null,
    timer: null,
    remainingTime: 600,
    isActive: false,
    lastActivity: null,
    isLoading: false,
    error: null,
    timerStarted: false,
    redirectTimer: null,
    debugMode: true
  }),

  getters: {
    isGuestMode: (state) => state.isActive && state.session !== null,
    formattedRemainingTime: (state) => {
      const minutes = Math.floor(state.remainingTime / 60)
      const seconds = state.remainingTime % 60
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    },
    shouldRedirect: (state) => state.isActive && state.remainingTime <= 0,
  },

  actions: {
    debugLog(message, data = null) {
      if (this.debugMode) {
        console.log(`🔍 [GuestStore] ${message}`, data || '')
      }
    },

    // ✅ Keep other methods but remove useAuthStore references
    startTimer() {
      if (this.timerStarted) {
        this.debugLog('Timer already running')
        return
      }

      this.debugLog('Starting guest session timer...')
      this.timerStarted = true

      if (this.timer) clearInterval(this.timer)

      this.timer = setInterval(() => {
        if (this.remainingTime > 0) {
          this.remainingTime--

          const stored = localStorage.getItem('guestSession')
          if (stored) {
            const data = JSON.parse(stored)
            data.remainingTime = this.remainingTime
            data.timerStarted = true
            localStorage.setItem('guestSession', JSON.stringify(data))
          }

          this.showTimeWarnings()

          // ✅ CRITICAL FIX: Redirect when time reaches 0
          if (this.remainingTime === 0) {
            this.debugLog('⏰ Timer reached 0 - handling expiry')
            this.handleAutoRedirect()
          }
        } else {
          clearInterval(this.timer)
          this.timer = null
          this.timerStarted = false
        }
      }, 1000)

      const stored = localStorage.getItem('guestSession')
      if (stored) {
        const data = JSON.parse(stored)
        data.timerStarted = true
        localStorage.setItem('guestSession', JSON.stringify(data))
      }
    },

    async handleAuthenticationTransition(userType = 'student') {
      this.debugLog('🔄 Handling authentication transition...', { userType })

      // Clear all guest data
      this.endSession()

      // Clear any completion data from localStorage
      this.clearAllGuestCompletionData()

      // Clear any pending timers or redirects
      if (this.redirectTimer) {
        clearTimeout(this.redirectTimer)
        this.redirectTimer = null
      }

      // Clear all guest-related localStorage items
      const guestKeys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('guest_')) {
          guestKeys.push(key)
        }
      }

      guestKeys.forEach(key => {
        localStorage.removeItem(key)
        this.debugLog(`Removed localStorage key: ${key}`)
      })

      this.debugLog('✅ Authentication transition complete')

      return {
        success: true,
        message: 'Guest session cleared for authenticated user'
      }
    },

    /**
     * Validate if guest session should continue or be cleared
     */
    validateGuestSessionForAuth() {
      const authStore = useAuthStore()

      // If user is authenticated, guest session should not exist
      if (authStore.isAuthenticated) {
        this.debugLog('🚨 Authenticated user detected with guest session - clearing')
        this.endSession()
        return {
          valid: false,
          reason: 'user_authenticated',
          shouldRedirect: true
        }
      }

      // Check session expiry
      if (this.isGuestMode && this.remainingTime <= 0) {
        return {
          valid: false,
          reason: 'session_expired',
          shouldRedirect: true,
          redirectTo: '/signup'
        }
      }

      return {
        valid: true,
        reason: 'valid_guest_session'
      }
    },


    validateSessionForUser() {
      const authStore = useAuthStore()

      // If user is authenticated, clear any guest session
      if (authStore.isAuthenticated) {
        this.debugLog('User is authenticated, clearing guest session')
        this.endSession()
        return { isValid: true, userType: 'authenticated' }
      }

      // If no session exists, user needs to start one
      if (!this.session || !this.isActive) {
        return { isValid: false, userType: 'guest', needsSession: true }
      }

      // Check if session is expired
      if (this.remainingTime <= 0) {
        this.debugLog('Guest session expired')
        return { isValid: false, userType: 'guest', expired: true }
      }

      return { isValid: true, userType: 'guest' }
    },

    // stores/guest.js - Enhanced session management
    async startGuestSession() {
      // ✅ PREVENT MULTIPLE SIMULTANEOUS SESSION CREATION
      if (this.isLoading) {
        this.debugLog('Guest session already loading, waiting...')
        return { success: false, error: 'Session creation in progress' }
      }

      // ✅ CHECK FOR EXISTING VALID SESSION FIRST
      if (this.isGuestMode && this.session?.session_id) {
        const sessionValid = await this.validateSession()
        if (sessionValid.valid) {
          this.debugLog('Using existing valid session:', this.session.session_id)
          return { success: true, session: this.session, existing: true }
        }
      }

      this.isLoading = true
      this.error = null

      try {
        this.debugLog('Starting NEW guest session...')

        // Clear any existing session first
        this.endSession()

        const response = await axios.post('/api/student/guest/session/start/', {}, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        })

        this.debugLog('Guest session API response:', response.data)

        if (response.data && response.data.session) {
          this.session = response.data.session
          this.settings = response.data.settings
          this.remainingTime = this.session.remaining_time || 600
          this.isActive = true
          this.lastActivity = Date.now()
          this.timerStarted = false

          // ✅ ENHANCED: Store session with timestamp
          localStorage.setItem('guestSession', JSON.stringify({
            session: this.session,
            settings: this.settings,
            startTime: Date.now(),
            remainingTime: this.remainingTime,
            timerStarted: false,
            created: new Date().toISOString()
          }))

          this.debugLog('✅ New guest session created:', this.session.session_id)

          // Start timer immediately
          this.startTimer()

          return {
            success: true,
            session: this.session,
            userType: 'guest',
            isNew: true
          }
        } else {
          throw new Error('Invalid response format from server')
        }

      } catch (error) {
        console.error('❌ CRITICAL: Failed to start guest session:', error)

        let errorMessage = 'Failed to start guest session'

        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Connection timeout. Please check your internet connection.'
        } else if (error.response?.status === 403) {
          errorMessage = 'Guest access is currently disabled'
        } else if (error.response?.status === 500) {
          errorMessage = 'Server error. Please try again later.'
        } else if (error.message) {
          errorMessage = error.message
        }

        this.error = errorMessage
        this.endSession()

        return { success: false, error: this.error }
      } finally {
        this.isLoading = false
      }
    },

    // ✅ NEW: Enhanced session validation
    async validateSession() {
      if (!this.session?.session_id) {
        return { valid: false, reason: 'No session ID' }
      }

      try {
        this.debugLog('Validating guest session:', this.session.session_id)

        const response = await axios.get(
          `/api/student/guest/session/${this.session.session_id}/validate/`,
          { timeout: 5000 }
        )

        if (response.data.is_expired) {
          this.debugLog('Session expired during validation')
          this.endSession()
          return { valid: false, reason: 'Session expired' }
        }

        this.debugLog('✅ Session validation successful')
        return { valid: true }

      } catch (error) {
        console.error('Session validation failed:', error)

        // If we get a 410, the session is definitely gone
        if (error.response?.status === 410) {
          this.endSession()
          return { valid: false, reason: 'Session expired (410)' }
        }

        // For other errors, assume session might still be valid
        return { valid: true, warning: 'Validation request failed' }
      }
    },

    async recoverSession() {
      try {
        this.debugLog('Attempting session recovery...')

        // Try to restore from localStorage first
        const restored = this.restoreSession()
        if (restored) {
          this.debugLog('Session restored from localStorage')
          return { success: true, recovered: true }
        }

        // If no session in localStorage, start a new one
        return await this.startGuestSession()

      } catch (error) {
        console.error('Session recovery failed:', error)
        return { success: false, error: error.message }
      }
    },

    // ✅ NEW: Handle auto-redirect when time expires
    handleAutoRedirect() {
      this.debugLog('Guest session expired - handling auto-redirect...')

      // Clear any existing timers
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
        this.timerStarted = false
      }

      if (this.redirectTimer) {
        clearTimeout(this.redirectTimer)
      }

      // Show final warning
      if (window.guestEventBridge) {
        window.guestEventBridge.emit('guest-time-warning', {
          message: 'Your guest session has expired. Redirecting to registration...',
          remainingTime: 0,
          level: 'expired'
        })
      }

      // Wait 2 seconds then redirect
      this.redirectTimer = setTimeout(() => {
        this.debugLog('Executing auto-redirect to signup...')
        this.redirectToRegistration()
      }, 2000)
    },

    handleSessionExpiry() {
      this.debugLog('Handling session expiry...')

      // Clear timers
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }

      this.timerStarted = false
      this.isActive = false

      // ✅ CLEAR ALL GUEST COMPLETION DATA
      this.clearAllGuestCompletionData()

      // Show expired modal in UI
      if (window.guestEventBridge) {
        window.guestEventBridge.emit('guest-session-expired', {
          message: 'Your guest session has expired',
          timestamp: new Date().toISOString()
        })
      }

      this.debugLog('Session expiry handled completely')
    },

    // ✅ NEW: Clear all guest completion data
    clearAllGuestCompletionData() {
      try {
        // Clear all guest completion data from localStorage
        const keysToRemove = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith('guest_completed_lessons_')) {
            keysToRemove.push(key)
          }
        }

        keysToRemove.forEach(key => {
          localStorage.removeItem(key)
          const expiryKey = `${key}_expiry`
          localStorage.removeItem(expiryKey)
        })

        // Also clear any completion signals
        localStorage.removeItem('guest_lesson_just_completed')

        this.debugLog(`✅ Cleared ${keysToRemove.length} guest completion data entries`)
      } catch (error) {
        console.error('❌ Failed to clear guest completion data:', error)
      }
    },

    // ✅ ENHANCED: End session with completion data cleanup
    endSession() {
      this.debugLog('Ending guest session completely...')

      // Clear timers
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }

      if (this.redirectTimer) {
        clearTimeout(this.redirectTimer)
        this.redirectTimer = null
      }

      // ✅ CLEAR COMPLETION DATA
      this.clearAllGuestCompletionData()

      // Reset all state
      this.session = null
      this.settings = null
      this.isActive = false
      this.remainingTime = 600
      this.lastActivity = null
      this.error = null
      this.timerStarted = false

      // Clear localStorage
      localStorage.removeItem('guestSession')

      this.debugLog('Guest session ended and all data reset completely')
    },

    // Add to the guest store actions
    handleLayoutSessionExpiry() {
      this.debugLog('Handling layout session expiry...')

      // Clear timers
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }

      this.timerStarted = false
      this.isActive = false

      // Show expired modal in UI
      if (window.guestEventBridge) {
        window.guestEventBridge.emit('guest-session-expired', {
          message: 'Your guest session has expired',
          timestamp: new Date().toISOString(),
          context: 'layout'
        })
      }

      this.debugLog('Layout session expiry handled')
    },

    // ✅ FIXED: Enhanced redirect method
    redirectToRegistration() {
      this.debugLog('Redirecting to registration page...')

      // End session first
      this.endSession()

      // Use Vue Router if available, otherwise window.location
      try {
        const router = useRouter()
        router.push('/signup')
      } catch (error) {
        console.log('Router not available, using window.location')
        window.location.href = '/signup'
      }
    },

    // NEW: Enhanced guest API methods
    async getGuestCourses() {
      try {
        this.debugLog('Fetching guest courses...')
        const response = await axios.get('/api/student/guest/courses/')
        this.debugLog('Guest courses response:', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to fetch guest courses:', error)
        throw error
      }
    },

    async getGuestCourseDetail(courseCode) {
      try {
        this.debugLog('Fetching guest course detail:', courseCode)
        const response = await axios.get(
          `/api/student/guest/courses/${courseCode}/detail/`,
          {
            params: {
              session_id: this.session?.session_id
            }
          }
        )
        this.debugLog('Guest course detail response:', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to fetch guest course detail:', error)
        throw error
      }
    },

    async getGuestCourseLessons(courseCode) {
      try {
        this.debugLog('Fetching guest course lessons:', courseCode)
        const response = await axios.get(
          `/api/student/guest/courses/${courseCode}/lessons/`,
          {
            params: {
              session_id: this.session?.session_id
            }
          }
        )
        this.debugLog('Guest course lessons response:', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to fetch guest course lessons:', error)
        throw error
      }
    },

    async getGuestLessonDetailById(lessonId) {
      try {
        this.debugLog('Fetching guest lesson detail by ID:', lessonId)

        const response = await axios.get(
          `/api/student/guest/lessons/${lessonId}/`,
          {
            params: {
              session_id: this.session?.session_id
            }
          }
        )

        this.debugLog('✅ Guest lesson detail loaded successfully by ID')
        return response.data

      } catch (error) {
        console.error('❌ Failed to fetch guest lesson detail by ID:', error)
        throw error
      }
    },

    async getGuestLessonDetailBySlug(courseSlug, lessonSlug) {
      console.log(`📖 Fetching guest lesson: ${courseSlug}/${lessonSlug}`)

      try {
        // Ensure we have a session
        if (!this.session?.session_id) {
          console.log("No session, starting one...")
          const result = await this.startGuestSession()
          if (!result.success) {
            throw new Error('Failed to start guest session')
          }
        }

        // Use the slug-based endpoint
        const response = await axios.get(
          `/api/student/guest/courses/${courseSlug}/lessons/${lessonSlug}/`,
          {
            params: {
              session_id: this.session.session_id
            },
            timeout: 10000
          }
        )

        console.log('✅ Lesson loaded successfully')
        return response.data

      } catch (error) {
        console.error('❌ Failed to load lesson:', error)

        // Try fallback - get course lessons and find the right one
        if (error.response?.status === 404 || error.response?.status === 500) {
          try {
            console.log('🔄 Trying fallback method...')
            const lessons = await this.getGuestCourseLessons(courseSlug)
            const lesson = lessons.find(l => {
              // Generate slug from title for comparison
              const slug = l.title.toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^\w-]/g, '')
              return slug === lessonSlug
            })

            if (lesson) {
              console.log('✅ Found lesson via fallback')
              return lesson
            }
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError)
          }
        }

        throw new Error('Could not load lesson: ' + (error.message || 'Unknown error'))
      }
    },

    async getGuestLessonDetail(courseSlug, lessonSlugOrId) {
        console.log(`📖 Fetching guest lesson detail: ${courseSlug}/${lessonSlugOrId}`)

        try {
            // Ensure we have a valid session
            if (!this.session?.session_id) {
                const result = await this.startGuestSession()
                if (!result.success) {
                    throw new Error('Failed to start guest session')
                }
            }

            // ✅ Use the unified endpoint
            const response = await axios.get(
                `/api/student/guest/lessons/${lessonSlugOrId}/`,
                {
                    params: {
                        session_id: this.session.session_id,
                        course_slug: courseSlug  // Always pass course_slug (required for slug-based lookups)
                    }
                }
            )

            console.log('✅ Guest lesson detail loaded via unified endpoint')
            return response.data

        } catch (error) {
            console.error('❌ Failed to load guest lesson detail:', error)

            // Try direct slug endpoint as fallback
            if (error.response?.status === 404 || error.response?.status === 500) {
                console.log('🔄 Trying direct slug endpoint as fallback...')
                try {
                    const fallbackResponse = await axios.get(
                        `/api/student/guest/courses/${courseSlug}/lessons/${lessonSlugOrId}/`,
                        {
                            params: {
                                session_id: this.session.session_id
                            }
                        }
                    )
                    console.log('✅ Fallback successful')
                    return fallbackResponse.data
                } catch (fallbackError) {
                    console.error('❌ Fallback also failed:', fallbackError)
                }
            }

            throw error
        }
    },

    async submitGuestExercise(lessonId, exerciseId, answer) {
      try {
        this.debugLog('Submitting guest exercise:', { lessonId, exerciseId, answer })
        const response = await axios.post(
          `/api/student/guest/lessons/${lessonId}/exercises/${exerciseId}/submit/`,
          {
            session_id: this.session.session_id,
            answer: answer
          }
        )
        this.debugLog('Guest exercise submission response:', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to submit guest exercise:', error)
        throw error
      }
    },

    showTimeWarnings() {
      switch (this.remainingTime) {
        case 300: // 5 minutes
          if (window.guestEventBridge) {
            window.guestEventBridge.emit('guest-time-warning', {
              message: 'Your guest session will expire in 5 minutes. Register to save your progress!',
              remainingTime: this.remainingTime,
              level: 'warning'
            })
          }
          break
        case 120: // 2 minutes
          if (window.guestEventBridge) {
            window.guestEventBridge.emit('guest-time-warning', {
              message: 'Your guest session will expire in 2 minutes. Register now to continue learning!',
              remainingTime: this.remainingTime,
              level: 'warning'
            })
          }
          break
        case 60: // 1 minute
          if (window.guestEventBridge) {
            window.guestEventBridge.emit('guest-time-warning', {
              message: 'Your guest session will expire in 1 minute. Please register to save your progress!',
              remainingTime: this.remainingTime,
              level: 'urgent'
            })
          }
          break
        case 30: // 30 seconds
          if (window.guestEventBridge) {
            window.guestEventBridge.emit('guest-time-warning', {
              message: 'Your guest session will expire in 30 seconds. Redirecting to registration...',
              remainingTime: this.remainingTime,
              level: 'critical'
            })
          }
          break
      }
    },

    handleSessionExpiration() {
      this.debugLog('Session expired, preparing redirect...')

      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }

      if (window.guestEventBridge) {
        window.guestEventBridge.emit('guest-time-warning', {
          message: 'Your guest session has expired. Redirecting to registration...',
          remainingTime: 0,
          level: 'expired'
        })
      }

      this.redirectTimer = setTimeout(() => {
        this.redirectToRegistration()
      }, 2000)
    },

    async loadGuestCourse(courseSlug) {
      try {
        this.debugLog('Loading guest course:', courseSlug)
        const response = await this.getGuestCourseDetail(courseSlug)
        this.courseData = response
        return { success: true, data: response }
      } catch (error) {
        console.error('Failed to load guest course:', error)
        return { success: false, error: error.message }
      }
    },

    async loadGuestLessons(courseSlug) {
      try {
        this.debugLog('Loading guest lessons:', courseSlug)
        const response = await this.getGuestCourseLessons(courseSlug)
        this.lessons = response
        return { success: true, data: response }
      } catch (error) {
        console.error('Failed to load guest lessons:', error)
        return { success: false, error: error.message }
      }
    },

    async loadGuestLessonDetail(lessonId) {
      try {
        this.debugLog('Loading guest lesson detail:', lessonId)
        const response = await this.getGuestLessonDetail(lessonId)
        this.currentLesson = response
        return { success: true, data: response }
      } catch (error) {
        console.error('Failed to load guest lesson detail:', error)
        return { success: false, error: error.message }
      }
    },

    // Mock methods to match original store interface
    setCurrentLesson(lessonId) {
      this.currentLesson = this.lessons.find(lesson => lesson.id === lessonId) || null
    },

    setExerciseAnswer(questionId, answer) {
      if (!this.exerciseAnswers) this.exerciseAnswers = {}
      this.exerciseAnswers[questionId] = answer
    },

    async submitGuestAnswer(questionId, answer) {
      try {
        // For guest mode, we simulate submission without saving
        const question = this.currentLesson?.exercises?.find(q => q.id === questionId)
        if (!question) {
          throw new Error('Question not found')
        }

        const isCorrect = this.checkAnswer(question, answer)

        // Store result temporarily
        if (!this.exerciseResults) this.exerciseResults = {}
        if (!this.showResults) this.showResults = {}

        this.exerciseResults[questionId] = {
          isCorrect,
          correctAnswer: question.correct,
          explanation: question.explanation
        }
        this.showResults[questionId] = true

        return {
          success: true,
          isCorrect,
          message: isCorrect ? 'Correct!' : 'Incorrect. Try again!'
        }
      } catch (error) {
        console.error('Failed to submit guest answer:', error)
        return { success: false, error: error.message }
      }
    },

    checkAnswer(question, userAnswer) {
      switch (question.type) {
        case 'multiple-choice':
        case 'true-false':
          return parseInt(userAnswer) === parseInt(question.correct)
        case 'fill-blank':
          return String(userAnswer).trim().toLowerCase() === String(question.correct).trim().toLowerCase()
        case 'paragraph':
          return true // Always "correct" for reflections in guest mode
        default:
          return false
      }
    },

    restoreSession() {
      try {
        const stored = localStorage.getItem('guestSession')
        if (stored) {
          const data = JSON.parse(stored)
          const elapsed = Math.floor((Date.now() - data.startTime) / 1000)
          const remaining = Math.max(0, (data.remainingTime || 600) - elapsed)

          if (remaining > 0) {
            this.session = data.session
            this.settings = data.settings
            this.isActive = true
            this.remainingTime = remaining
            this.lastActivity = Date.now()
            this.timerStarted = data.timerStarted || false

            if (this.timerStarted) {
              this.startTimer()
            }

            this.debugLog('Guest session restored:', this.session.session_id)
            return true
          } else {
            localStorage.removeItem('guestSession')
          }
        }
      } catch (error) {
        console.error('Failed to restore guest session:', error)
        localStorage.removeItem('guestSession')
      }
      return false
    },

    updateActivity() {
      this.lastActivity = Date.now()
    }
  }
})