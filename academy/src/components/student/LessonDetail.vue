<template>
  <div class="lesson-container">
    <!-- Loading State -->
    <div v-if="lessonStore.loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading lesson...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="lessonStore.error" class="error-container">
      <div class="error-card">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Unable to Load Lesson</h3>
        <p>{{ lessonStore.error }}</p>
        <button @click="loadData" class="retry-btn">
          <i class="fas fa-redo"></i>
          Try Again
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="lesson-content-wrapper">
      <div class="content-area">
        <!-- Header -->
        <div class="content-header">
          <div class="lesson-info">
            <h1 class="lesson-main-title">{{ lessonStore.currentLesson?.title || 'Lesson' }}</h1>
            <p class="lesson-main-description">{{ lessonStore.currentLesson?.description || 'Loading...' }}</p>
          </div>
          <div class="navigation-controls">
            <button
              @click="previousLesson"
              :disabled="!canNavigatePrevious"
              class="nav-btn prev-btn"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            <span class="lesson-counter">{{ currentLessonIndex + 1 }} / {{ lessonStore.lessons.length }}</span>
            <button
              @click="nextLesson"
              :disabled="!canNavigateNext"
              class="nav-btn next-btn"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>

        <!-- Lesson Content -->
        <div v-if="lessonStore.currentLesson?.content" class="lesson-content-section">
          <div class="content-card">
            <div class="content-body" v-html="lessonStore.currentLesson.content"></div>
          </div>
        </div>

        <!-- Video Section -->
        <div v-if="lessonStore.currentLesson?.video_url" class="video-section">
          <VideoPlayer
            :lesson-id="lessonStore.currentLesson.id"
            :video-url="lessonStore.currentLesson.video_url"
            @progress-update="handleVideoProgress"
            @video-completed="handleVideoCompleted"
          />
        </div>

        <!-- Questions Section -->
        <div v-if="lessonStore.currentLesson?.exercises?.length > 0" class="exercises-section">
          <div class="section-header">
            <i class="fas fa-question-circle"></i>
            <h3>Practice Questions</h3>
          </div>

          <div
            v-for="(question, index) in lessonStore.currentLesson.exercises"
            :key="question.id"
            class="exercise-card"
          >
            <div class="exercise-header">
              <h4>Question {{ index + 1 }}: {{ getQuestionTypeName(question.type) }}</h4>
            </div>

            <div class="exercise-content">
              <p class="exercise-question">{{ question.question }}</p>

              <!-- Multiple Choice -->
              <div v-if="question.type === 'multiple-choice'" class="multiple-choice">
                <div
                  v-for="(option, optionIndex) in question.options"
                  :key="optionIndex"
                  :class="['option', {
                    'selected': lessonStore.exerciseAnswers[question.id] === optionIndex,
                    'correct': lessonStore.showResults[question.id] && optionIndex === question.correct,
                    'incorrect': lessonStore.showResults[question.id] && lessonStore.exerciseAnswers[question.id] === optionIndex && optionIndex !== question.correct
                  }]"
                  @click="selectOption(question.id, optionIndex)"
                >
                  <div class="option-indicator">
                    <i :class="lessonStore.exerciseAnswers[question.id] === optionIndex ? 'fas fa-dot-circle' : 'far fa-circle'"></i>
                  </div>
                  <span class="option-text">{{ option }}</span>
                </div>
              </div>

              <!-- Fill in the Blank -->
              <div v-else-if="question.type === 'fill-blank'" class="fill-blank">
                <input
                  v-model="lessonStore.exerciseAnswers[question.id]"
                  type="text"
                  placeholder="Type your answer here..."
                  class="blank-input"
                  :class="{
                    'correct': lessonStore.showResults[question.id] && lessonStore.exerciseResults[question.id]?.isCorrect,
                    'incorrect': lessonStore.showResults[question.id] && !lessonStore.exerciseResults[question.id]?.isCorrect
                  }"
                />
              </div>

              <!-- Paragraph -->
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
                        v-model="lessonStore.exerciseAnswers[question.id]"
                        :placeholder="`Share your thoughts... ${question.word_count?.min ? `(Minimum ${question.word_count.min} words)` : ''}`"
                        class="reflection-textarea"
                        rows="6"
                        maxlength="3000"
                      ></textarea>
                      <div class="reflection-footer">
                        <span class="char-count">{{ lessonStore.exerciseAnswers[question.id]?.length || 0 }}/3000</span>
                      </div>
                      <div v-if="lessonStore.autoSaveStatus[question.id]" class="auto-save-indicator">
                        <i class="fas fa-check-circle"></i>
                        <span>Draft saved</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- True/False -->
              <div v-else-if="question.type === 'true-false'" class="true-false">
                <div
                  v-for="(option, optionIndex) in ['True', 'False']"
                  :key="optionIndex"
                  :class="['option', {
                    'selected': lessonStore.exerciseAnswers[question.id] === optionIndex,
                    'correct': lessonStore.showResults[question.id] && optionIndex === question.correct,
                    'incorrect': lessonStore.showResults[question.id] && lessonStore.exerciseAnswers[question.id] === optionIndex && optionIndex !== question.correct
                  }]"
                  @click="selectOption(question.id, optionIndex)"
                >
                  <div class="option-indicator">
                    <i :class="lessonStore.exerciseAnswers[question.id] === optionIndex ? 'fas fa-dot-circle' : 'far fa-circle'"></i>
                  </div>
                  <span class="option-text">{{ option }}</span>
                </div>
              </div>

              <!-- Submit/Save Buttons -->
              <button
                v-if="question.type !== 'paragraph'"
                @click="submitAnswer(question)"
                :disabled="!hasValidAnswer(question) || lessonStore.submittingAnswers[question.id]"
                class="check-btn"
              >
                <i v-if="lessonStore.submittingAnswers[question.id]" class="fas fa-spinner fa-spin"></i>
                {{ lessonStore.submittingAnswers[question.id] ? 'Checking...' : 'Check Answer' }}
              </button>

              <button
                v-if="question.type === 'paragraph'"
                @click="saveAnswer(question)"
                :disabled="!hasValidAnswer(question) || lessonStore.submittingAnswers[question.id]"
                class="save-btn"
              >
                <i v-if="lessonStore.submittingAnswers[question.id]" class="fas fa-spinner fa-spin"></i>
                {{ lessonStore.submittingAnswers[question.id] ? 'Saving...' : 'Save Answer' }}
              </button>

              <!-- Results -->
              <div
                v-if="lessonStore.showResults[question.id]"
                :class="['exercise-result', {
                  'correct': lessonStore.exerciseResults[question.id]?.isCorrect,
                  'incorrect': !lessonStore.exerciseResults[question.id]?.isCorrect && question.type !== 'paragraph',
                  'saved': question.type === 'paragraph'
                }]"
              >
                <div class="result-header">
                  <i :class="question.type === 'paragraph' ? 'fas fa-check-circle' : (lessonStore.exerciseResults[question.id]?.isCorrect ? 'fas fa-check-circle' : 'fas fa-times-circle')"></i>
                  <span>{{ question.type === 'paragraph' ? 'Saved!' : (lessonStore.exerciseResults[question.id]?.isCorrect ? 'Correct!' : 'Incorrect') }}</span>
                </div>
                <p class="explanation" v-if="question.explanation">
                  {{ question.explanation }}
                </p>
                <p v-if="!lessonStore.exerciseResults[question.id]?.isCorrect && lessonStore.exerciseResults[question.id]?.correctAnswer !== undefined" class="correct-answer">
                  Correct answer: {{
                    question.type === 'multiple-choice'
                      ? question.options[lessonStore.exerciseResults[question.id].correctAnswer]
                      : question.type === 'true-false'
                        ? ['True', 'False'][lessonStore.exerciseResults[question.id].correctAnswer]
                        : lessonStore.exerciseResults[question.id].correctAnswer
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- SYSTEM-DRIVEN COMPLETION SECTION -->
        <div class="completion-section">
          <div class="completion-card">
            <div class="completion-content">
              <div class="completion-text">
                <!-- ✅ COMPLETED STATE -->
                <template v-if="lessonStore.currentLesson?.completed">
                  <h3>Lesson Completed!</h3>
                  <p>Completed on {{ formatDate(lessonStore.currentLesson?.completed_at) }}</p>
                </template>

                <!-- 🔄 AUTO-COMPLETING STATE -->
                <template v-else-if="lessonStore.canCompleteLesson && !isAutoCompleting">
                  <h3>Ready to Complete</h3>
                  <p v-if="lessonStore.currentLesson?.video_url && !lessonStore.currentLesson?.video_completed">
                    📹 Watch the video to complete this lesson
                  </p>
                  <p v-else>
                    System is processing your completion...
                  </p>
                </template>

                <!-- ⏳ PROCESSING STATE -->
                <template v-else-if="isAutoCompleting">
                  <h3>System Processing...</h3>
                  <p>Finalizing your lesson completion...</p>
                </template>

                <!-- 📚 IN PROGRESS STATE -->
                <template v-else>
                  <h3>Lesson In Progress</h3>
                  <p v-if="lessonStore.currentLesson?.video_url">
                    Complete all questions and watch the video to finish.
                  </p>
                  <p v-else>
                    Complete all exercises to finish this lesson.
                  </p>

                  <div class="requirements-list">
                    <!-- Exercise Requirements -->
                    <div
                      v-for="(ex, idx) in lessonStore.currentLesson?.exercises"
                      :key="ex.id"
                      class="requirement-item"
                    >
                      <i :class="lessonStore.showResults[ex.id] && lessonStore.exerciseResults[ex.id]?.isCorrect
                                ? 'fas fa-check-circle complete' : 'far fa-circle incomplete'"></i>
                      <span>Question {{ idx + 1 }}: {{ ex.type }}</span>
                    </div>

                    <!-- Video Requirement (if exists) -->
                    <div
                      v-if="lessonStore.currentLesson?.video_url"
                      class="requirement-item"
                    >
                      <i :class="lessonStore.currentLesson?.video_completed
                                ? 'fas fa-check-circle complete' : 'far fa-circle incomplete'"></i>
                      <span>Watch video</span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useLessonStore } from '@/stores/lesson'
import VideoPlayer from './VideoPlayer.vue'

export default {
  name: 'LessonDetail',
  components: { VideoPlayer },
  props: {
    courseSlug: {
      type: String,
      required: true
    },
    lessonSlug: {
      type: String,
      required: true
    },
    courseId: {
      type: [String, Number],
      required: false
    }
  },
  emits: ['lesson-selected', 'lesson-completed'],

  setup(props, { emit }) {
    const route = useRoute()
    const router = useRouter()
    const toast = useToast()
    const lessonStore = useLessonStore()

    // Local state
    const isLoadingContent = ref(false)
    const isAutoCompleting = ref(false)
    const autoCompletionAttempted = ref(false)
    const currentLessonSlug = ref(null)
    const hasLoadedLessons = ref(false)
    const currentSlug = ref(null)

    // Slug utility
    const generateSlug = (title) => {
      if (!title) return '';
      return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
    }

    // Find lesson by slug
    const findLessonBySlug = (slug) => {
      if (!slug || !lessonStore.lessons.length) return null

      return lessonStore.lessons.find(lesson => {
        const lessonSlug = generateSlug(lesson.title);
        return lessonSlug === slug;
      });
    }

    // Get current lesson ID from slug
    const getCurrentLessonId = computed(() => {
      if (!currentSlug.value || lessonStore.lessons.length === 0) return null

      const lesson = findLessonBySlug(currentSlug.value)
      return lesson ? lesson.id : null
    })

    // Computed
    const currentLessonIndex = computed(() => {
      if (!getCurrentLessonId.value) return -1

      return lessonStore.lessons.findIndex(lesson => lesson.id === getCurrentLessonId.value)
    })

    const canNavigatePrevious = computed(() => currentLessonIndex.value > 0)
    const canNavigateNext = computed(() => currentLessonIndex.value < lessonStore.lessons.length - 1)

    // MAIN LOAD FUNCTION
    const loadData = async () => {
      if (lessonStore.lessons.length === 0) {
        return
      }

      const targetSlug = props.lessonSlug

      if (!targetSlug) {
        return
      }

      const lesson = findLessonBySlug(targetSlug)

      if (!lesson) {
        toast.error('Lesson not found')
        return
      }

      const lessonId = lesson.id

      isLoadingContent.value = true
      autoCompletionAttempted.value = false
      currentSlug.value = targetSlug

      try {
        const result = await lessonStore.loadLessonDetail(lessonId)

        if (result.success) {
          lessonStore.setCurrentLesson(lessonId)
          await nextTick()
          hasLoadedLessons.value = true
        } else {
          toast.error('Failed to load lesson content')
        }
      } catch (error) {
        toast.error('Failed to load lesson data')
      } finally {
        isLoadingContent.value = false
      }
    }

    // Navigation methods
    const selectLesson = (lessonSlug) => {
      emit('lesson-selected', lessonSlug)
    }

    const previousLesson = () => {
      if (canNavigatePrevious.value) {
        const prevIndex = currentLessonIndex.value - 1
        const prevLesson = lessonStore.lessons[prevIndex]
        const prevLessonSlug = generateSlug(prevLesson.title)
        selectLesson(prevLessonSlug)
      }
    }

    const nextLesson = () => {
      if (canNavigateNext.value) {
        const nextIndex = currentLessonIndex.value + 1
        const nextLesson = lessonStore.lessons[nextIndex]
        const nextLessonSlug = generateSlug(nextLesson.title)
        selectLesson(nextLessonSlug)
      }
    }

    // Exercise methods
    const selectOption = (questionId, optionIndex) => {
      lessonStore.setExerciseAnswer(questionId, optionIndex)
    }

    const hasValidAnswer = (question) => {
      const answer = lessonStore.exerciseAnswers[question.id]

      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        return answer !== null && answer !== undefined && answer >= 0
      } else if (question.type === 'fill-blank') {
        return answer && String(answer).trim().length > 0
      } else if (question.type === 'paragraph') {
        const wordCount = getWordCount(answer)
        const minWords = question.word_count?.min || 1
        return wordCount >= minWords
      }

      return answer !== null && answer !== undefined && String(answer).trim().length > 0
    }

    const getWordCount = (text) => {
      if (!text) return 0
      return text.trim().split(/\s+/).filter(word => word.length > 0).length
    }

    const submitAnswer = async (question) => {
      if (!hasValidAnswer(question)) {
        toast.error('Please provide an answer before submitting')
        return
      }

      const answer = lessonStore.exerciseAnswers[question.id]
      const result = await lessonStore.submitAnswer(question.id, answer)

      if (result.success) {
        if (result.isCorrect) {
          toast.success('Correct answer!')
        } else {
          toast.error('Incorrect answer.')
        }

        await nextTick()
        if (!lessonStore.currentLesson?.completed) {
          setTimeout(() => autoCheckCompletion(), 500)
        }
      } else {
        toast.error(result.error || 'Failed to submit answer')
      }
    }

    const saveAnswer = async (question) => {
      if (!hasValidAnswer(question)) {
        toast.error('Please provide an answer before saving')
        return
      }

      const answer = lessonStore.exerciseAnswers[question.id]
      const result = await lessonStore.saveParagraphAnswer(question.id, answer)

      if (result.success) {
        toast.success('Answer saved successfully!')

        await nextTick()
        if (!lessonStore.currentLesson?.completed) {
          setTimeout(() => autoCheckCompletion(), 500)
        }
      } else {
        toast.error(result.error || 'Failed to save answer')
      }
    }

    const autoCheckCompletion = async () => {
      if (isAutoCompleting.value || autoCompletionAttempted.value) return
      if (lessonStore.currentLesson?.completed === true) return
      if (!lessonStore.canCompleteLesson) return

      await nextTick()

      isAutoCompleting.value = true
      autoCompletionAttempted.value = true

      try {
        const result = await lessonStore.checkAndAutoComplete()

        if (result?.success) {
          emit('lesson-completed', {
            lessonId: lessonStore.currentLesson?.id,
            lessonSlug: currentSlug.value,
            completed: true,
            method: 'auto'
          })

          toast.success('Lesson completed!')

          if (canNavigateNext.value) {
            setTimeout(() => {
              nextLesson()
            }, 2000)
          }
        }
      } catch (error) {
        console.error('Auto-completion error:', error)
      } finally {
        isAutoCompleting.value = false
      }
    }

    const handleVideoProgress = (progressData) => {
      console.log('Video progress:', progressData)
    }

    const handleVideoCompleted = () => {
      toast.success('Video completed!')
      lessonStore.setVideoCompleted(lessonStore.currentLesson?.id)
      // ✅ Add this - mark video as completed in the store
      if (lessonStore.currentLesson) {
        lessonStore.currentLesson.video_completed = true
      }

      if (!lessonStore.currentLesson?.completed) {
        setTimeout(() => autoCheckCompletion(), 500)
      }
    }

    const getQuestionTypeName = (type) => {
      const types = {
        'multiple-choice': 'Multiple Choice',
        'fill-blank': 'Fill in the Blank',
        'true-false': 'True/False',
        'paragraph': 'Written Response',
        'short-answer': 'Short Answer'
      }
      return types[type] || 'Question'
    }

    const formatDate = (dateString) => {
      if (!dateString) return ''
      return new Date(dateString).toLocaleDateString()
    }

    // Watchers
    watch(() => props.lessonSlug, async (newSlug, oldSlug) => {
      if (newSlug && newSlug !== oldSlug) {
        autoCompletionAttempted.value = false
        isAutoCompleting.value = false
        await loadData()
      }
    }, { immediate: true })

    watch(() => lessonStore.lessons, (newLessons) => {
      if (newLessons.length > 0 && !hasLoadedLessons.value) {
        setTimeout(() => {
          loadData()
        }, 100)
      }
    }, { deep: true, immediate: true })

    watch(() => lessonStore.canCompleteLesson, async (newVal, oldVal) => {
      if (newVal &&
          !oldVal &&
          !lessonStore.currentLesson?.completed &&
          !autoCompletionAttempted.value) {
        setTimeout(() => autoCheckCompletion(), 1000)
      }
    }, { immediate: false })

    onMounted(() => {
      if (lessonStore.lessons.length > 0 && !hasLoadedLessons.value) {
        loadData()
      }
    })

    return {
      lessonStore,
      isLoadingContent,
      isAutoCompleting,
      currentLessonIndex,
      canNavigatePrevious,
      canNavigateNext,
      loadData,
      selectLesson,
      previousLesson,
      nextLesson,
      selectOption,
      hasValidAnswer,
      getWordCount,
      submitAnswer,
      saveAnswer,
      handleVideoProgress,
      handleVideoCompleted,
      getQuestionTypeName,
      formatDate,
      autoCheckCompletion
    }
  }
}
</script>

<style scoped>
/* Base structure - Guest layout with .content-area parent */
.lesson-container {
  display: flex;
  background-color: var(--gray-bg);
  font-family: var(--font-heading);
  min-height: 100vh;
}

.lesson-content-wrapper {
  display: flex;
  width: 100%;
  position: relative;
}

/* GUEST LAYOUT: .content-area as parent container - RESPONSIVE */
.content-area {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

/* Adjust content-area for different screen sizes */
@media (max-width: 1440px) {
  .content-area {
    max-width: 1200px;
    padding: .5rem;
  }
}

@media (min-width: 1200px) {
  .content-area {
    max-width: 100%;
    padding: .3rem;
  }
}

/* Header - Guest smooth arrangement */
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

.lesson-counter {
  font-size: var(--fs-sm);
  color: var(--secondary-color);
  font-weight: 500;
  opacity: 0.8;
  font-family: var(--font-body);
}

/* Content sections - Guest spacing */
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

/* Exercise section - Guest arrangement */
.exercises-section {
  margin-bottom: 0.5rem;
}

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

.check-btn, .save-btn {
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

/* Completion section - Guest smooth layout */
.completion-section {
  margin-bottom: 2rem;
}

.completion-card {
  background: var(--background-color);
  border-radius: 0.75rem;
  padding: 1rem;
  box-shadow: 0 1px 3px var(--shadow-color);
  border: 1px solid var(--border-color);
}

.completion-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.completion-text h3 {
  font-size: var(--fs-lg);
  color: var(--secondary-color);
  margin: 0 0 0.5rem 0;
  font-family: var(--font-heading);
  padding-top: 1rem;
}

.completion-text p {
  font-size: var(--fs-sm);
  color: var(--secondary-color);
  opacity: 0.7;
  margin: 0 0 1.5rem 0;
  font-family: var(--font-body);
}

.completion-badge span{
  color: #444444 !important;
}

.requirements-list {
  margin-top: 1rem;
}

.requirement-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  font-size: var(--fs-sm);
  color: var(--secondary-color);
  font-family: var(--font-body);
}

.requirement-item i.complete {
  color: var(--success-color);
}

.requirement-item i.incomplete {
  color: var(--border-color);
}

/* Loading States - UPDATED FOR CENTERED SPINNER */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color, #087990);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.error-card {
  text-align: center;
  padding: 2rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

/* ORIGINAL RESPONSIVENESS - NOT CHANGED */
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
  .lesson-container {
    flex-direction: column;
  }

  .content-area {
    padding: 1rem;
    max-width: 100%;
  }

  .content-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
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
}

@media (max-width: 480px) {
  .content-area {
    padding: 0.5rem;
  }

  .content-header,
  .content-card,
  .exercise-card,
  {
    padding: 1rem;
  }

  .lesson-main-title {
    font-size: var(--fs-lg);
  }

  .reflection-card {
    padding: 1rem;
  }
}
</style>