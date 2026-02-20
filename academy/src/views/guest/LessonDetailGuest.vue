<template>
  <div class="lesson-detail-guest">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Loading lesson content...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-card">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Unable to Load Lesson Content</h3>
        <p>{{ error }}</p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="lesson-content-wrapper">
      <div class="content-area">
        <!-- Lesson Header -->
        <div class="content-header">
          <div class="lesson-info">
            <h1 class="lesson-main-title">{{ lessonData?.title || 'Lesson' }}</h1>
            <p class="lesson-main-description">{{ lessonData?.description || 'Loading...' }}</p>
          </div>
          <!-- Enhanced navigation controls -->
          <div class="navigation-controls">
            <button
              @click="previousLesson"
              :disabled="!canNavigatePrevious || loading"
              class="nav-btn prev-btn"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            <span class="lesson-counter">
              {{ currentLessonIndex + 1 }} / {{ (lessons || []).length }}
            </span>
            <button
              @click="handleNextLesson"
              :disabled="!canNavigateNext || loadingNext"
              class="nav-btn next-btn"
            >
              <i class="fas fa-chevron-right"></i>
              <span v-if="loadingNext">...</span>
            </button>
          </div>
        </div>

        <!-- Guest Notice Banner -->
        <div v-if="showGuestNotice" class="guest-notice-banner">
          <div class="banner-content">
            <i class="fas fa-user-clock"></i>
            <div class="banner-text">
              <h3>Guest Preview Mode</h3>
              <p>
                You're viewing this lesson in preview mode.
                <strong>Time remaining: {{ formattedRemainingTime }}</strong
                >. Register to save progress and access all features.
              </p>
            </div>
            <button @click="register" class="upgrade-btn">
              <i class="fas fa-rocket"></i>
              Upgrade to Full Access
            </button>
          </div>
        </div>

        <!-- Session Expired Notice -->
        <div v-if="sessionExpired" class="session-expired-banner">
          <div class="banner-content">
            <i class="fas fa-exclamation-triangle"></i>
            <div class="banner-text">
              <h3>Session Expired</h3>
              <p>Your guest session has expired. Please register to continue learning.</p>
            </div>
            <button @click="register" class="register-btn">
              <i class="fas fa-user-plus"></i>
              Register Now
            </button>
          </div>
        </div>

        <!-- Lesson Content -->
        <div v-if="lessonData?.content" class="lesson-content-section">
          <div class="content-card">
            <div class="content-body" v-html="lessonData.content"></div>
          </div>
        </div>

        <!-- Video Section -->
        <div v-if="lessonData?.video_url" class="video-section">
          <VideoPlayer
            :lesson-id="lessonData.id"
            :video-url="lessonData.video_url"
            :guest-mode="true"
            @progress-update="handleVideoProgress"
            @video-completed="handleVideoCompleted"
          />
        </div>

        <!-- Questions Section -->
        <div v-if="lessonData && hasExercises" class="exercises-section">
          <div class="section-header">
            <i class="fas fa-question-circle"></i>
            <h3>Practice Questions</h3>
            <span class="exercise-progress"
              >({{ completedExercisesCount }}/{{
                (sortedExercises || []).length
              }}
              completed)</span
            >
          </div>

          <!-- Loop through sorted exercises -->
          <div
            v-for="(question, index) in sortedExercises"
            :key="question.id"
            class="exercise-card"
          >
            <div class="exercise-header">
              <h4>Question {{ index + 1 }}: {{ getQuestionTypeName(question.type) }}</h4>
              <span v-if="showResults[question.id]" class="question-status">
                <i v-if="isAnswerCorrect(question)" class="fas fa-check-circle correct-status"></i>
                <i v-else class="fas fa-times-circle incorrect-status"></i>
                {{ isAnswerCorrect(question) ? 'Correct' : 'Incorrect' }}
              </span>
            </div>

            <div class="exercise-content">
              <p class="exercise-question">{{ question.question }}</p>

              <!-- Multiple Choice -->
              <div v-if="question.type === 'multiple-choice'" class="multiple-choice">
                <div
                  v-for="(option, optionIndex) in question.options"
                  :key="optionIndex"
                  :class="[
                    'option',
                    {
                      selected: guestAnswers[question.id] === optionIndex,
                      correct: showResults[question.id] && optionIndex === question.correct,
                      incorrect:
                        showResults[question.id] &&
                        guestAnswers[question.id] === optionIndex &&
                        optionIndex !== question.correct,
                    },
                  ]"
                  @click="selectOption(question.id, optionIndex)"
                >
                  <div class="option-indicator">
                    <i
                      :class="
                        guestAnswers[question.id] === optionIndex
                          ? 'fas fa-dot-circle'
                          : 'far fa-circle'
                      "
                    ></i>
                  </div>
                  <span class="option-text">{{ option }}</span>
                  <span
                    v-if="showResults[question.id] && optionIndex === question.correct"
                    class="correct-indicator"
                  >
                    <i class="fas fa-check"></i>
                  </span>
                </div>
              </div>

              <!-- Fill in the Blank -->
              <div v-else-if="question.type === 'fill-blank'" class="fill-blank">
                <input
                  v-model="guestAnswers[question.id]"
                  type="text"
                  placeholder="Type your answer here..."
                  class="blank-input"
                  :class="{
                    correct: showResults[question.id] && isFillBlankCorrect(question),
                    incorrect: showResults[question.id] && !isFillBlankCorrect(question),
                  }"
                />
              </div>

              <!-- Written Reflection -->
              <div v-else-if="question.type === 'paragraph'" class="paragraph-exercise">
                <div class="reflection-section">
                  <div class="reflection-header">
                    <i class="fas fa-lightbulb"></i>
                    <h4>Reflect on Your Learning</h4>
                  </div>
                  <div class="reflection-card">
                    <div class="reflection-prompt">
                      <h5>What did you learn from this lesson?</h5>
                      <p class="prompt-description">
                        Take a moment to reflect on the key concepts and how you might apply them.
                      </p>
                    </div>
                    <div class="reflection-input-container">
                      <textarea
                        v-model="guestAnswers[question.id]"
                        :placeholder="`Share your thoughts... ${question.word_count?.min ? `(Minimum ${question.word_count.min} words)` : ''}`"
                        class="reflection-textarea"
                        rows="6"
                        maxlength="3000"
                      ></textarea>
                      <div class="reflection-footer">
                        <span class="char-count"
                          >{{ guestAnswers[question.id]?.length || 0 }}/3000</span
                        >
                        <span v-if="question.word_count?.min" class="word-requirement">
                          Minimum {{ question.word_count.min }} words required
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="exercise-actions">
                <button
                  v-if="!showResults[question.id]"
                  @click="checkAnswer(question)"
                  :disabled="!hasValidAnswer(question)"
                  class="check-btn guest-btn"
                >
                  <i class="fas fa-check-circle"></i>
                  Check Answer
                </button>
              </div>

              <!-- Results Display -->
              <div
                v-if="showResults[question.id]"
                :class="[
                  'exercise-result',
                  {
                    correct: isAnswerCorrect(question),
                    incorrect: !isAnswerCorrect(question) && question.type !== 'paragraph',
                    saved: question.type === 'paragraph',
                  },
                ]"
              >
                <div class="result-header">
                  <i
                    :class="
                      question.type === 'paragraph'
                        ? 'fas fa-check-circle'
                        : isAnswerCorrect(question)
                          ? 'fas fa-check-circle'
                          : 'fas fa-times-circle'
                    "
                  ></i>
                  <span>{{
                    question.type === 'paragraph'
                      ? 'Reflection Saved!'
                      : isAnswerCorrect(question)
                        ? 'Correct!'
                        : 'Incorrect'
                  }}</span>
                </div>

                <p v-if="question.explanation" class="explanation">
                  {{ question.explanation }}
                </p>

                <!-- Show correct answer for incorrect attempts -->
                <div
                  v-if="!isAnswerCorrect(question) && question.type !== 'paragraph'"
                  class="correct-answer-display"
                >
                  <strong>Correct answer:</strong> {{ getCorrectAnswerDisplay(question) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Completion button for exercises -->
          <div
            v-if="hasExercises && canCompleteLesson && !lessonCompleted"
            class="completion-section"
          >
            <button @click="markLessonAsCompleted" class="complete-lesson-btn guest-btn enabled">
              <i class="fas fa-flag-checkered"></i>
              Mark Lesson as Complete
            </button>
          </div>
        </div>

        <!-- AUTO-COMPLETION TRIGGER (No exercises) -->
        <div v-else-if="!hasExercises && !lessonCompleted" class="guest-completion-trigger">
          <button @click="markLessonAsCompleted" class="complete-lesson-btn guest-btn enabled">
            <i class="fas fa-flag-checkered"></i>
            Mark Lesson as Complete (No Exercises Required)
          </button>
        </div>

        <!-- GUEST COMPLETION SECTION -->
        <div v-if="lessonCompleted" class="completion-section">
          <div class="completion-card">
            <div class="completion-content">
              <div class="completion-text">
                <h3>Lesson Preview Complete</h3>
                <p>Experience this lesson in guest mode. Register to unlock full features:</p>

                <div class="guest-features-list">
                  <div class="feature-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Save your progress and answers</span>
                  </div>
                  <div class="feature-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Track completion across all lessons</span>
                  </div>
                  <div class="feature-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Earn certificates and achievements</span>
                  </div>
                  <div class="feature-item">
                    <i class="fas fa-check-circle"></i>
                    <span>Access exclusive content and features</span>
                  </div>
                </div>

                <button @click="register" class="complete-upgrade-btn">
                  <i class="fas fa-graduation-cap"></i>
                  Start Learning Journey
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, inject, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGuestStore } from '@/stores/guest'
import { useToast } from 'vue-toastification'
import VideoPlayer from '@/components/student/VideoPlayer.vue'

export default {
  name: 'LessonDetailGuest',
  components: {
    VideoPlayer,
  },
  props: {
    courseSlug: {
      type: String,
      required: true,
    },
    lessonId: {
      type: [String, Number],
      default: null,
    },
    lessonSlug: {
      type: [String, Number],
      required: true,
      default: null,
    },
    selectedLessonId: {
      type: [String, Number],
      default: null,
    },
    sidebarCollapsed: {
      type: Boolean,
      default: false,
    },
    lessons: {
      type: Array,
      default: () => [],
    },
    courseData: {
      type: Object,
      default: () => ({}),
    },
  },

  emits: ['lesson-selected', 'lesson-completed', 'session-expired'],
  setup(props, { emit }) {
    const route = useRoute()
    const router = useRouter()
    const guestStore = useGuestStore()
    const toast = useToast()

    const guestLessonLayout = inject('guestLessonLayout', {
      selectedLessonSlug: { value: null },
      selectedLessonId: { value: null },
      courseData: { value: {} },
      lessons: { value: [] },
      handleLessonSelect: () => {},
      register: () => {},
      courseSlug: props.courseSlug,
    })

    // Local state
    const lessonData = ref({})
    const loading = ref(false)
    const loadingNext = ref(false)
    const error = ref(null)
    const guestAnswers = ref({})
    const showResults = ref({})
    const exerciseResults = ref({})
    const lessonCompleted = ref(false)
    const videoCompleted = ref(false)
    const autoCompletionTriggered = ref(false)
    const sessionExpired = ref(false)

    const selectedLessonId = ref(null)
    const selectedLessonSlug = ref(null)

    const generateSlug = (title) => {
      if (!title) return ''
      return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim()
    }

    const sortedExercises = computed(() => {
      if (!lessonData.value?.exercises) return []

      const exercises = [...lessonData.value.exercises]

      return exercises.sort((a, b) => {
        const order = {
          'multiple-choice': 1,
          'fill-blank': 2,
          'paragraph': 3
        }

        const orderA = order[a.type] || 99
        const orderB = order[b.type] || 99

        return orderA - orderB
      })
    })

    const findLessonBySlug = (slug) => {
      if (!props.lessons || !slug) return null

      const lessonBySlug = props.lessons.find((lesson) => {
        const lessonSlug = generateSlug(lesson.title)
        return lessonSlug === slug
      })

      if (lessonBySlug) return lessonBySlug

      const lessonById = props.lessons.find((lesson) => lesson.id.toString() === slug)
      if (lessonById) return lessonById

      return null
    }

    const initializeSelectedLesson = () => {
      const routeLessonSlug = route.params.lessonSlug
      const propLessonSlug = props.lessonSlug
      const injectedLessonSlug = guestLessonLayout.selectedLessonSlug?.value

      let targetSlug = routeLessonSlug || propLessonSlug || injectedLessonSlug

      if (targetSlug && !isNaN(targetSlug) && targetSlug !== 'undefined') {
        const lesson = props.lessons.find((l) => l.id === parseInt(targetSlug))
        if (lesson) {
          targetSlug = generateSlug(lesson.title)
        }
      }

      if (targetSlug && targetSlug !== 'undefined') {
        selectedLessonSlug.value = targetSlug

        const lesson = findLessonBySlug(targetSlug)
        if (lesson) {
          selectedLessonId.value = lesson.id
          emit('lesson-selected', lesson.id)
        } else {
          error.value = 'Lesson not found'
        }
      }
    }

    const currentLessonIndex = computed(() => {
      if (!props.lessons || !selectedLessonId.value) return -1
      return props.lessons.findIndex((lesson) => lesson.id === selectedLessonId.value)
    })

    const canNavigatePrevious = computed(() => {
      return currentLessonIndex.value > 0
    })

    const canNavigateNext = computed(() => {
      return currentLessonIndex.value < (props.lessons?.length || 0) - 1
    })

    const formattedRemainingTime = computed(() => {
      const minutes = Math.floor(guestStore.remainingTime / 60)
      const seconds = guestStore.remainingTime % 60
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    })

    const hasExercises = computed(() => {
      return lessonData.value?.exercises && lessonData.value.exercises.length > 0
    })

    const completedExercisesCount = computed(() => {
      return Object.keys(showResults.value).filter((key) => showResults.value[key]).length
    })

    const canCompleteLesson = computed(() => {
      if (!hasExercises.value) return true
      return completedExercisesCount.value === lessonData.value.exercises?.length
    })

    const showGuestNotice = computed(() => {
      return !sessionExpired.value && guestStore.isGuestMode
    })

    const loadLessonContent = async () => {
      const targetSlug = selectedLessonSlug.value || props.lessonSlug

      loading.value = true
      error.value = null

      try {
        const data = await guestStore.getGuestLessonDetailBySlug(
          props.courseSlug,
          targetSlug
        )

        lessonData.value = data

        if (data.exercises) {
          data.exercises.forEach(exercise => {
            guestAnswers.value[exercise.id] = ''
            showResults.value[exercise.id] = false
          })
        }

        checkCachedCompletion()
      } catch (err) {
        error.value = err.response?.data?.detail || err.message || 'Failed to load lesson'
        if (err.response?.status === 410) {
          emit('session-expired', { reason: 'session_expired' })
          toast.error('Your guest session has expired. Please register to continue.')
        }
      } finally {
        loading.value = false
      }
    }

    const checkCachedCompletion = () => {
      try {
        const cacheKey = `guest_completed_lessons_${props.courseSlug}`
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const completedLessons = JSON.parse(cached)
          if (completedLessons.includes(selectedLessonId.value)) {
            lessonCompleted.value = true
          }
        }
      } catch (error) {
        console.error('Failed to check cached completion:', error)
      }
    }

    const previousLesson = async () => {
      if (!canNavigatePrevious.value || loading.value) return

      const prevIndex = currentLessonIndex.value - 1
      const prevLesson = props.lessons[prevIndex]

      if (!prevLesson) return

      const prevLessonSlug = generateSlug(prevLesson.title)

      try {
        await router.push({
          name: 'guest-lesson-detail',
          params: {
            courseSlug: props.courseSlug,
            lessonSlug: prevLessonSlug
          }
        })
      } catch (error) {
        toast.error('Failed to navigate to previous lesson')
      }
    }

    const handleNextLesson = async () => {
      if (!canNavigateNext.value || loadingNext.value) return

      loadingNext.value = true

      try {
        const nextIndex = currentLessonIndex.value + 1
        const nextLesson = props.lessons[nextIndex]

        if (!nextLesson) {
          toast.error('No next lesson available')
          return
        }

        const nextLessonSlug = generateSlug(nextLesson.title)

        await router.push({
          name: 'guest-lesson-detail',
          params: {
            courseSlug: props.courseSlug,
            lessonSlug: nextLessonSlug
          }
        })

        await nextTick()

      } catch (error) {
        toast.error('Failed to navigate to next lesson')
      } finally {
        loadingNext.value = false
      }
    }

    const resetLessonState = () => {
      lessonCompleted.value = false
      videoCompleted.value = false
      autoCompletionTriggered.value = false
      guestAnswers.value = {}
      showResults.value = {}
      exerciseResults.value = {}
    }

    const register = () => {
      if (guestLessonLayout.register) {
        guestLessonLayout.register()
      } else {
        router.push('/signup')
      }
    }

    const selectOption = (questionId, optionIndex) => {
      if (showResults.value[questionId] && isAnswerCorrect({ id: questionId })) {
        return
      }

      guestAnswers.value[questionId] = optionIndex

      if (showResults.value[questionId] && !isAnswerCorrect({ id: questionId })) {
        showResults.value[questionId] = false
      }
    }

    const hasValidAnswer = (question) => {
      const answer = guestAnswers.value[question.id]

      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        return answer !== null && answer !== undefined && answer >= 0
      } else if (question.type === 'fill-blank') {
        return answer && String(answer).trim().length > 0
      } else if (question.type === 'paragraph') {
        const wordCount = getWordCount(answer)
        const minWords = question.word_count?.min || 1
        return wordCount >= minWords
      }

      return false
    }

    const getWordCount = (text) => {
      if (!text) return 0
      return text
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0).length
    }

    const checkAnswer = (question) => {
      if (!hasValidAnswer(question)) {
        toast.error('Please provide an answer before checking')
        return
      }

      const answer = guestAnswers.value[question.id]
      const isCorrect = isAnswerCorrect(question)

      exerciseResults.value[question.id] = {
        isCorrect,
        submittedAnswer: answer,
        correctAnswer: question.correct,
        timestamp: new Date().toISOString(),
      }

      showResults.value[question.id] = true

      if (isCorrect) {
        toast.success('Correct answer! 🎉')
      } else {
        toast.error('Incorrect answer. Try again!')
      }

      if (canCompleteLesson.value && !lessonCompleted.value && !autoCompletionTriggered.value) {
        autoCompletionTriggered.value = true
        setTimeout(() => {
          markLessonAsCompleted()
        }, 1500)
      }
    }

    const isAnswerCorrect = (question) => {
      const answer = guestAnswers.value[question.id]

      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        return parseInt(answer) === parseInt(question.correct)
      } else if (question.type === 'fill-blank') {
        return String(answer).trim().toLowerCase() === String(question.correct).trim().toLowerCase()
      } else if (question.type === 'paragraph') {
        return true
      }

      return false
    }

    const isFillBlankCorrect = (question) => {
      const answer = guestAnswers.value[question.id]
      return String(answer).trim().toLowerCase() === String(question.correct).trim().toLowerCase()
    }

    const getCorrectAnswerDisplay = (question) => {
      if (question.type === 'multiple-choice') {
        return question.options[question.correct]
      } else if (question.type === 'true-false') {
        return question.correct === 0 ? 'True' : 'False'
      } else {
        return question.correct
      }
    }

    const markLessonAsCompleted = async () => {
      if (guestStore.remainingTime <= 30) {
        toast.error('Session about to expire. Please register to save progress permanently.')
        return
      }

      if (!canCompleteLesson.value && hasExercises.value) {
        toast.error('Please complete all exercises before marking the lesson as complete')
        return
      }

      lessonCompleted.value = true

      const completionData = {
        lessonId: selectedLessonId.value,
        lessonSlug: selectedLessonSlug.value,
        courseSlug: props.courseSlug,
        completedAt: new Date().toISOString(),
        exercisesCompleted: completedExercisesCount.value,
        totalExercises: lessonData.value.exercises?.length || 0,
        lessonTitle: lessonData.value.title,
      }

      emit('lesson-completed', completionData)
      cacheLessonCompletion()

      toast.success('🎉 Lesson marked as complete!')

      if (canNavigateNext.value) {
        setTimeout(() => {
          handleNextLesson()
        }, 2000)
      } else {
        toast.success('🎉 Course completed! Register to save your progress.')
      }
    }

    const cacheLessonCompletion = () => {
      try {
        const cacheKey = `guest_completed_lessons_${props.courseSlug}`
        const cached = localStorage.getItem(cacheKey)
        const completedLessons = cached ? JSON.parse(cached) : []

        if (!completedLessons.includes(selectedLessonId.value)) {
          completedLessons.push(selectedLessonId.value)
          localStorage.setItem(cacheKey, JSON.stringify(completedLessons))
        }

        const expiry = Date.now() + 10 * 60 * 1000
        localStorage.setItem(`${cacheKey}_expiry`, expiry.toString())
      } catch (error) {
        console.error('Failed to cache lesson completion:', error)
      }
    }

    const handleVideoProgress = (progressData) => {}

    const handleVideoCompleted = () => {
      videoCompleted.value = true
      toast.success('Video completed! 🎬')

      if (!hasExercises.value && !lessonCompleted.value) {
        setTimeout(() => {
          markLessonAsCompleted()
        }, 1000)
      }
    }

    const getQuestionTypeName = (type) => {
      const types = {
        'multiple-choice': 'Multiple Choice',
        'fill-blank': 'Fill in the Blank',
        'true-false': 'True/False',
        paragraph: 'Written Reflection',
      }
      return types[type] || 'Question'
    }

    watch(
      () => route.params.lessonSlug,
      async (newSlug, oldSlug) => {
        if (newSlug && newSlug !== selectedLessonSlug.value && newSlug !== 'undefined') {
          resetLessonState()

          selectedLessonSlug.value = newSlug
          const lesson = findLessonBySlug(newSlug)

          if (lesson) {
            selectedLessonId.value = lesson.id
            emit('lesson-selected', lesson.id)

            await nextTick()
            await loadLessonContent()
          } else {
            error.value = 'Lesson not found'
          }
        }
      },
      { immediate: false }
    )

    watch(
      () => guestLessonLayout.selectedLessonSlug?.value,
      (newSlug) => {
        if (newSlug && newSlug !== selectedLessonSlug.value && newSlug !== 'undefined') {
          selectedLessonSlug.value = newSlug
          const lesson = findLessonBySlug(newSlug)
          if (lesson) {
            selectedLessonId.value = lesson.id
            loadLessonContent()
          }
        }
      }
    )

    watch(
      () => guestLessonLayout.selectedLessonId?.value,
      (newId) => {
        if (newId && newId !== selectedLessonId.value) {
          selectedLessonId.value = newId

          const lesson = props.lessons.find(l => l.id === newId)
          if (lesson) {
            selectedLessonSlug.value = generateSlug(lesson.title)
            loadLessonContent()
          }
        }
      }
    )

    watch(
      () => props.lessons,
      (newLessons) => {
        if (newLessons && newLessons.length > 0) {
          if (selectedLessonId.value && !selectedLessonSlug.value) {
            const lesson = newLessons.find(l => l.id === selectedLessonId.value)
            if (lesson) {
              selectedLessonSlug.value = generateSlug(lesson.title)
              loadLessonContent()
            }
          }
        }
      },
      { immediate: true }
    )

    watch(
      () => guestStore.remainingTime,
      (newTime) => {
        if (newTime <= 0 && lessonCompleted.value) {
          lessonCompleted.value = false
          sessionExpired.value = true
        }
      }
    )

    onMounted(() => {
      initializeSelectedLesson()

      if (selectedLessonSlug.value && selectedLessonSlug.value !== 'undefined') {
        loadLessonContent()
      }
    })

    return {
      lessonData,
      loading,
      loadingNext,
      error,
      guestAnswers,
      showResults,
      exerciseResults,
      lessonCompleted,
      videoCompleted,
      sessionExpired,
      showGuestNotice,
      currentLessonIndex,
      canNavigatePrevious,
      canNavigateNext,
      formattedRemainingTime,
      hasExercises,
      completedExercisesCount,
      canCompleteLesson,
      sortedExercises,
      loadLessonContent,
      previousLesson,
      handleNextLesson,
      register,
      selectOption,
      hasValidAnswer,
      checkAnswer,
      isAnswerCorrect,
      isFillBlankCorrect,
      getCorrectAnswerDisplay,
      markLessonAsCompleted,
      handleVideoProgress,
      handleVideoCompleted,
      getQuestionTypeName,
      getWordCount,
    }
  },
}
</script>

<style scoped>
/* Add to LessonDetailGuest.vue styles */
.edit-answer-btn {
  background: var(--gray-bg);
  color: var(--secondary-color);
  border: 1px solid var(--border-color);
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  transition: all 0.2s ease;
}

.edit-answer-btn:hover {
  background: #e9ecef;
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.question-type-badge {
  background: #e9ecef;
  color: #6c757d;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.exercise-progress-summary {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 0.5rem;
  border-left: 4px solid #667eea;
}

.progress-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar {
  flex: 1;
  background: #e9ecef;
  border-radius: 10px;
  height: 8px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.completed-count {
  font-weight: 600;
  color: #495057;
}

.progress-percentage {
  font-weight: 700;
  color: #667eea;
}

.guest-preview-notice {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  padding: 0.75rem;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #856404;
}

.guest-preview-notice i {
  color: #f39c12;
}

.correct-answer-hint {
  background: #d1ecf1;
  border: 1px solid #bee5eb;
  border-radius: 4px;
  padding: 0.5rem;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #0c5460;
}

.exercise-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.next-question-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.next-question-btn:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
}

.next-question-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

/* Add question IDs for scrolling */
.exercise-card {
  scroll-margin-top: 20px;
}

.guest-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.guest-result {
  background: #f8f9fa;
  border-left: 4px solid #667eea;
}

.preview-badge {
  background: #667eea;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.lesson-detail-guest {
  display: flex;
  min-height: 100vh;
  background-color: var(--gray-bg);
  position: relative;
  width: 100%;
  overflow: hidden;
}

.main-content {
  flex: 1;
  margin-left: 280px;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 100vh;
  overflow: hidden;
  width: calc(100% - 280px);
  will-change: margin-left;
  transform: translateZ(0);
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
}

.main-content.sidebar-collapsed {
  margin-left: 70px;
  width: calc(100% - 70px);
}

/* Scrollable content area below fixed header */
.content-scrollable {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  height: calc(100vh - 60px);
  margin-top: 0 !important;
}

.lesson-container {
  min-height: 100%;
  background-color: var(--gray-bg);
  font-family: var(--font-heading);
}

.content-area {
  padding: 0.5rem;
  margin: 0 auto;
  width: 100%;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: var(--background-color);
  border-radius: 0.75rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 3px var(--shadow-color);
}

.lesson-info {
  flex: 1;
}

.lesson-main-title {
  font-size: var(--fs-xl);
  font-weight: 700;
  color: var(--secondary-color);
  margin: 0 0 0.5rem 0;
  font-family: var(--font-heading);
}

.lesson-main-description {
  font-size: var(--fs-base);
  color: var(--secondary-color);
  margin: 0;
  opacity: 0.8;
  font-family: var(--font-body);
}

.navigation-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-btn {
  background: var(--primary-color);
  border: none;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
  font-size: var(--fs-base);
}

.nav-btn:hover:not(:disabled) {
  background: var(--primary-sec-color);
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.next-btn {
  background: var(--primary-color);
  color: white;
}

.next-btn:hover:not(:disabled) {
  background: var(--primary-sec-color);
}

.lesson-counter {
  font-size: var(--fs-sm);
  color: var(--secondary-color);
  font-weight: 500;
  opacity: 0.8;
  font-family: var(--font-body);
}

/* Guest Notice Banner */
.guest-notice-banner {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-sec-color) 100%);
  color: white;
  border-radius: 0.75rem;
  margin-bottom: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.banner-content i {
  font-size: 2rem;
  opacity: 0.9;
}

.banner-text {
  flex: 1;
}

.banner-text h3 {
  margin: 0 0 0.5rem 0;
  font-size: var(--fs-lg);
  font-weight: 600;
  font-family: var(--font-heading);
  color: #fff !important;
}

.banner-text p {
  margin: 0;
  opacity: 0.9;
  font-size: var(--fs-sm);
  font-family: var(--font-body);
}

.upgrade-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
  white-space: nowrap;
  font-family: var(--font-heading);
  font-size: var(--fs-sm);
}

.upgrade-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

/* Content Sections */
.lesson-content-section {
  margin-bottom: 0.5rem;
}

.content-card {
  background: var(--background-color);
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 1px 3px var(--shadow-color);
  border: 1px solid var(--border-color);
}

.content-body {
  line-height: 1.7;
  color: var(--secondary-color);
  font-family: var(--font-body);
}

.content-body h3 {
  color: var(--secondary-color);
  font-size: var(--fs-xl);
  margin: 0 0 1rem 0;
  font-family: var(--font-heading);
}

.content-body h4 {
  color: var(--secondary-color);
  font-size: var(--fs-lg);
  margin: 1.5rem 0 0.75rem 0;
  font-family: var(--font-heading);
}

.content-body ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.content-body li {
  margin: 0.5rem 0;
}

.video-section {
  margin-bottom: 0.5rem;
}

/* Exercise Styles */
.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.section-header i {
  color: var(--primary-color);
  font-size: var(--fs-lg);
}

.section-header h3 {
  font-size: var(--fs-xl);
  font-weight: 700;
  color: var(--secondary-color);
  margin: 0;
  font-family: var(--font-heading);
}

.exercises-section {
  margin-bottom: 0.5rem;
}

.exercise-card {
  background: var(--background-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 1px 3px var(--shadow-color);
  border: 1px solid var(--border-color);
}

.exercise-header h4 {
  font-size: var(--fs-lg);
  font-weight: 600;
  color: var(--secondary-color);
  margin: 0 0 1.5rem 0;
  font-family: var(--font-heading);
}

.exercise-question {
  font-size: var(--fs-base);
  color: var(--secondary-color);
  margin: 0 0 1.5rem 0;
  font-weight: 500;
  font-family: var(--font-body);
  line-height: 1.6;
}

.multiple-choice {
  margin-bottom: 1.5rem;
}

.option {
  display: flex;
  align-items: center;
  padding: 1rem;
  margin: 0.5rem 0;
  background: var(--gray-bg);
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  gap: 0.75rem;
}

.option:hover {
  background: #e8f4fd;
  border-color: #b3d9f5;
}

.option.selected {
  background: #e8f4fd;
  border-color: var(--primary-color);
}

.option.correct {
  background: #f0fdf4;
  border-color: var(--success-color);
}

.option.incorrect {
  background: #fef2f2;
  border-color: #dc3545;
}

.option-indicator {
  color: var(--secondary-color);
  font-size: var(--fs-base);
  opacity: 0.6;
}

.option.selected .option-indicator {
  color: var(--primary-color);
  opacity: 1;
}

.option-text {
  flex: 1;
  font-size: var(--fs-sm);
  color: var(--secondary-color);
  font-family: var(--font-body);
}

.fill-blank {
  margin-bottom: 1.5rem;
}

.blank-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: var(--fs-base);
  transition: all 0.2s;
  font-family: var(--font-body);
  background: var(--background-color);
}

.blank-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(6, 103, 126, 0.1);
}

.blank-input.correct {
  border-color: var(--success-color);
  background: #f0fdf4;
}

.blank-input.incorrect {
  border-color: #dc3545;
  background: #fef2f2;
}

.paragraph-exercise {
  margin-bottom: 1.5rem;
}

.reflection-section {
  margin-bottom: 2rem;
}

.reflection-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.reflection-header i {
  color: var(--primary-color);
  font-size: var(--fs-lg);
}

.reflection-header h4 {
  font-size: var(--fs-lg);
  font-weight: 600;
  color: var(--secondary-color);
  margin: 0;
  font-family: var(--font-heading);
}

.reflection-card {
  background: var(--gray-bg);
  border-radius: 0.75rem;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
}

.reflection-prompt h5 {
  font-size: var(--fs-base);
  font-weight: 600;
  color: var(--secondary-color);
  margin: 0 0 0.5rem 0;
  font-family: var(--font-heading);
}

.prompt-description {
  font-size: var(--fs-sm);
  color: var(--secondary-color);
  opacity: 0.8;
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
  font-family: var(--font-body);
}

.reflection-input-container {
  position: relative;
}

.reflection-textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: var(--fs-sm);
  line-height: 1.6;
  resize: vertical;
  transition: all 0.2s;
  font-family: var(--font-body);
  min-height: 120px;
  background: var(--background-color);
}

.reflection-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(6, 103, 126, 0.1);
}

.reflection-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.char-count {
  font-size: var(--fs-xs);
  color: var(--secondary-color);
  opacity: 0.7;
  font-family: var(--font-body);
}

.auto-save-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  color: var(--success-color);
  font-size: var(--fs-xs);
  font-family: var(--font-body);
}

.check-btn,
.save-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: var(--fs-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-weight: 600;
  font-family: var(--font-heading);
}

.check-btn:hover:not(:disabled),
.save-btn:hover:not(:disabled) {
  background: var(--primary-sec-color);
  transform: translateY(-2px);
}

.check-btn:disabled,
.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.exercise-result {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 2px solid;
  animation: slideIn 0.3s ease-out;
}

.exercise-result.correct {
  background: #f0fdf4;
  border-color: var(--success-color);
  color: #065f46;
}

.exercise-result.incorrect {
  background: #fef2f2;
  border-color: #dc3545;
  color: #991b1b;
}

.exercise-result.saved {
  background: #f0fdf4;
  border-color: var(--success-color);
  color: #065f46;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-family: var(--font-heading);
}

.explanation {
  margin: 0;
  font-size: var(--fs-sm);
  line-height: 1.5;
  font-family: var(--font-body);
}

.correct-answer {
  margin: 0.5rem 0 0 0;
  font-size: var(--fs-sm);
  font-weight: 600;
  font-family: var(--font-body);
}

/* Guest Completion Section */
.completion-section {
  margin-bottom: 2rem;
}

.completion-card {
  background: var(--background-color);
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: 0 1px 3px var(--shadow-color);
  border: 1px solid var(--border-color);
}

.completion-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.completion-icon i.guest-icon {
  font-size: 3rem;
  color: var(--primary-color);
}

.completion-text h3 {
  font-size: var(--fs-lg);
  color: var(--secondary-color);
  margin: 0 0 0.5rem 0;
  font-family: var(--font-heading);
}

.completion-text p {
  font-size: var(--fs-sm);
  color: var(--secondary-color);
  opacity: 0.7;
  margin: 0 0 1.5rem 0;
  font-family: var(--font-body);
}

.guest-features-list {
  margin-bottom: 2rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  font-size: var(--fs-sm);
  color: var(--secondary-color);
  font-family: var(--font-body);
}

.feature-item i {
  color: var(--success-color);
  font-size: var(--fs-base);
}

.complete-upgrade-btn {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-sec-color) 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  font-size: var(--fs-base);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
  font-weight: 600;
  width: 100%;
  justify-content: center;
  font-family: var(--font-heading);
}

.complete-upgrade-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(6, 103, 126, 0.3);
}

/* Loading States */
.loading-container,
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  width: 100%;
}

.loading-spinner,
.error-card {
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

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-card i {
  font-size: 3rem;
  color: #dc3545;
  margin-bottom: 1rem;
}

.retry-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: var(--fs-sm);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  transition: all 0.2s;
  font-family: var(--font-heading);
}

.retry-btn:hover {
  background: var(--primary-sec-color);
}

.lesson-content-wrapper {
  display: flex;
  width: 100%;
  position: relative;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .main-content {
    margin-left: 280px;
    width: calc(100% - 280px);
  }
  .main-content.sidebar-collapsed {
    margin-left: 70px;
    width: calc(100% - 70px);
  }

  .content-scrollable {
    margin-top: 0px !important;
  }
}

@media (max-width: 768px) {
  .lesson-detail-guest {
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

  .content-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
    padding: 1rem;
  }

  .banner-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .guest-notice-banner {
    padding: 1rem;
  }

  .completion-card {
    padding: 1rem;
  }

  .completion-content {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }

  .reflection-card {
    padding: 1rem;
  }

  .content-card {
    padding: 1rem;
  }

  .exercise-card {
    padding: 1rem;
  }

  .content-area {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .content-header,
  .content-card,
  .exercise-card,
  .completion-card {
    padding: 1rem;
  }

  .lesson-main-title {
    font-size: var(--fs-lg);
  }

  .reflection-card {
    padding: 1rem;
  }

  .banner-content {
    padding: 0.5rem;
  }

  .content-area {
    padding: 0.5rem;
  }
}
</style>
