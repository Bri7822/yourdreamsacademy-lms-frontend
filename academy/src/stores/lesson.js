// stores/lesson.js - FIXED with proper global event emission
import { defineStore } from 'pinia'
import axios from 'axios'

const API_BASE = 'http://localhost:8000/api'

export const useLessonStore = defineStore('lesson', {
  state: () => ({
    // Course management
    courses: new Map(),
    currentCourseCode: null,

    // Current lesson state
    currentLesson: null,

    // Exercise state
    exerciseAnswers: {},
    exerciseResults: {},
    showResults: {},
    submittingAnswers: {},
    autoSaveStatus: {},

    // UI state
    loading: false,
    error: null,

    // Internal state
    lastUpdated: null,
    _currentLessonId: null,
    _completionAttempts: {},
  }),

  getters: {
    getLessonBySlug: (state) => (slug) => {
      return findLessonBySlug(state.lessons, slug)
    },

    // Add getter to find lesson by ID (for backward compatibility)
    getLessonById: (state) => (id) => {
      const numericId = parseInt(id)
      return state.lessons.find(lesson => lesson.id === numericId)
    },

    lessons: (state) => {
      if (!state.currentCourseCode) return []
      const course = state.courses.get(state.currentCourseCode)
      return course?.lessons || []
    },

    courseData: (state) => {
      if (!state.currentCourseCode) return null
      const course = state.courses.get(state.currentCourseCode)
      return course?.courseData || null
    },

    completedLessonsCount: (state) => {
      const lessons = state.lessons
      return lessons.filter(lesson => lesson.completed === true).length
    },

    progressPercentage: (state) => {
      const lessons = state.lessons
      if (lessons.length === 0) return 0
      const completed = lessons.filter(l => l.completed === true).length
      return Math.round((completed / lessons.length) * 100)
    },

    currentLessonScore: (state) => {
      if (!state.currentLesson?.exercises) return 0
      return state.currentLesson.exercises.filter(
        question => state.showResults[question.id] &&
        (state.exerciseResults[question.id]?.isCorrect || question.type === 'paragraph')
      ).length
    },

    totalQuestions: (state) => {
      return state.currentLesson?.exercises?.length || 0
    },

    canCompleteLesson: (state) => {
      if (state.currentLesson?.completed) return false

      const hasQuestions = state.currentLesson?.exercises && state.currentLesson.exercises.length > 0
      if (hasQuestions) {
        const exercises = state.currentLesson.exercises
        const totalQuestions = exercises.length
        let completedCount = 0

        exercises.forEach(question => {
          const hasResult = state.showResults[question.id] === true
          const result = state.exerciseResults[question.id]

          if (hasResult && result) {
            if (question.type === 'paragraph' || result.isCorrect === true) {
              completedCount++
            }
          }
        })

        return completedCount === totalQuestions
      }
      return true
    }
  },

  actions: {
    setCurrentCourse(courseCode) {
      this.currentCourseCode = courseCode
      console.log(`🔄 Set current course to: ${courseCode}`)
    },

    async loadCourse(courseSlug) {
      const existingCourse = this.courses.get(courseSlug)
      if (existingCourse?.isCourseLoaded) {
        this.setCurrentCourse(courseSlug)
        return { success: true, data: existingCourse.courseData, cached: true }
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_BASE}/student/courses/${courseSlug}/`)

        if (!this.courses.has(courseSlug)) {
          this.courses.set(courseSlug, {
            courseData: response.data,
            lessons: [],
            isCourseLoaded: true,
            areLessonsLoaded: false,
            lastUpdated: null
          })
        } else {
          const course = this.courses.get(courseSlug)
          course.courseData = response.data
          course.isCourseLoaded = true
        }

        this.setCurrentCourse(courseSlug)
        return { success: true, data: response.data }
      } catch (error) {
        this.error = error.response?.data?.detail || 'Failed to load course'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async loadLessons(courseSlug) {
      const course = this.courses.get(courseSlug)
      if (course?.areLessonsLoaded) {
        this.setCurrentCourse(courseSlug)
        return { success: true, data: course.lessons, cached: true }
      }

      this.loading = true
      this.error = null

      try {
        const response = await axios.get(`${API_BASE}/student/courses/${courseSlug}/lessons/`)

        if (response.data.lessons && response.data.lessons.length > 0) {
          const lessons = response.data.lessons.map(lesson => ({
            ...lesson,
            completed: lesson.completed === true
          }))

          if (!this.courses.has(courseSlug)) {
            this.courses.set(courseSlug, {
              courseData: null,
              lessons: lessons,
              isCourseLoaded: false,
              areLessonsLoaded: true,
              lastUpdated: new Date().toISOString()
            })
          } else {
            const course = this.courses.get(courseSlug)
            course.lessons = lessons
            course.areLessonsLoaded = true
            course.lastUpdated = new Date().toISOString()
          }

          this.setCurrentCourse(courseSlug)

          console.log('✅ LESSONS LOADED FOR COURSE:', {
            course: courseSlug,
            total: lessons.length,
            completed: lessons.filter(l => l.completed).length
          })

          return { success: true, data: lessons }
        } else {
          this.error = 'No lessons available for this course'
          return { success: false, error: this.error }
        }
      } catch (error) {
        this.error = error.response?.data?.detail || 'Failed to load lessons'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async markLessonCompleted(reflection = '', score = 0, totalQuestions = 0) {
      if (!this.currentLesson) {
        return { success: false, error: 'No lesson selected' }
      }

      const lessonId = this.currentLesson.id
      const courseCode = this.courseData?.code

      console.log('🎯 ATTEMPTING TO COMPLETE LESSON:', { lessonId, courseCode })

      try {
        const response = await axios.post(
          `${API_BASE}/student/lessons/${lessonId}/complete/`,
          { reflection: reflection.trim(), score, total_questions: totalQuestions }
        )

        const serverData = response.data

        // ✅ CRITICAL FIX: Update lessons in the store
        if (serverData.updated_lessons && Array.isArray(serverData.updated_lessons)) {
          const course = this.courses.get(courseCode)
          if (course) {
            course.lessons = serverData.updated_lessons.map(lesson => ({
              ...lesson,
              completed: lesson.completed === true
            }))
            course.lastUpdated = new Date().toISOString()
          }

          // Update current lesson
          this.currentLesson = {
            ...this.currentLesson,
            completed: true,
            completed_at: serverData.completed_at || new Date().toISOString()
          }

          this.lastUpdated = new Date().toISOString()

          // ✅ CRITICAL: Emit GLOBAL events
          const completed = course.lessons.filter(l => l.completed).length
          const total = course.lessons.length
          const progress = total > 0 ? Math.round((completed / total) * 100) : 0

          console.log('🌍 EMITTING GLOBAL EVENTS:', {
            courseCode,
            lessonId,
            progress,
            completed,
            total
          })

          // Emit via GlobalProgressEvents
          if (window.globalProgressEvents) {
            window.globalProgressEvents.emitLessonCompleted(lessonId, courseCode)
            window.globalProgressEvents.emitProgressUpdated(courseCode, progress, completed, total)
          }

          // Also update GlobalProgressState
          if (window.globalProgressState) {
            window.globalProgressState.updateProgress(courseCode, {
              progress,
              completedLessons: completed,
              totalLessons: total
            })
          }

          // Update ProgressStore
          if (window.progressStore) {
            window.progressStore.updateProgress(courseCode, {
              progress,
              completedLessons: completed,
              totalLessons: total
            })
          }

          console.log('✅ COMPLETION SUCCESSFUL - All systems notified')

          return {
            success: true,
            score: serverData.score || score,
            totalQuestions: serverData.total_questions || totalQuestions,
            data: serverData
          }
        } else {
          console.error('❌ SERVER DID NOT RETURN updated_lessons')
          return { success: false, error: 'Backend did not return updated lessons' }
        }

      } catch (error) {
        console.error('❌ COMPLETION FAILED:', error.response?.data || error.message)
        return {
          success: false,
          error: error.response?.data?.detail || 'Failed to mark lesson complete'
        }
      }
    },

    // In your lesson store (lesson.js)
    setVideoCompleted(lessonId) {
      const lesson = this.lessons.find(l => l.id === lessonId)
      if (lesson) lesson.video_completed = true
      if (this.currentLesson?.id === lessonId) {
        this.currentLesson.video_completed = true
      }
    },

    async checkAndAutoComplete() {
      const lessonId = this.currentLesson?.id

      if (!lessonId || this.currentLesson.completed) {
        return { success: false, error: 'Already completed' }
      }

      if (this._completionAttempts[lessonId]) {
        console.log('⏸️ Completion already attempted for this lesson')
        return { success: false, error: 'Already attempted' }
      }

      if (!this.canCompleteLesson) {
        return { success: false, error: 'Requirements not met' }
      }

      this._completionAttempts[lessonId] = true

      let reflectionText = ''
      if (this.currentLesson?.exercises) {
        const paragraphQuestion = this.currentLesson.exercises.find(ex => ex.type === 'paragraph')
        if (paragraphQuestion) {
          reflectionText = this.exerciseAnswers[paragraphQuestion.id] || ''
        }
      }

      const result = await this.markLessonCompleted(
        reflectionText,
        this.currentLessonScore,
        this.totalQuestions
      )

      if (!result.success) {
        delete this._completionAttempts[lessonId]
      }

      return result
    },

    // stores/lesson.js - FIXED loadLessonDetail function
    async loadLessonDetail(lessonId) {
      try {
        console.log(`📖 Loading lesson ${lessonId} details...`)

        // ✅ Get courseSlug from currentCourseCode
        const courseSlug = this.currentCourseCode

        if (!courseSlug) {
          console.error('❌ No course slug available for loading lesson')
          return { success: false, error: 'Course not loaded' }
        }

        // ✅ Use the slug-based endpoint
        const response = await axios.get(
          `${API_BASE}/student/courses/${courseSlug}/lessons/${lessonId}/`
        )

        const lessonDetail = response.data

        const completeLesson = {
          id: lessonDetail.id,
          title: lessonDetail.title,
          description: lessonDetail.description,
          content: lessonDetail.content,
          video_url: lessonDetail.video_url,
          exercises: lessonDetail.exercises || [],
          completed: lessonDetail.completed === true,
          completed_at: lessonDetail.completed_at,
          duration: lessonDetail.duration,
          order: lessonDetail.order,
          course_title: lessonDetail.course_title,
          course_code: lessonDetail.course_code
        }

        // Update lessons array for current course
        if (this.currentCourseCode) {
          const course = this.courses.get(this.currentCourseCode)
          if (course) {
            course.lessons = course.lessons.map(lesson => {
              if (lesson.id === lessonId) {
                return { ...lesson, ...completeLesson }
              }
              return lesson
            })
          }
        }

        this.currentLesson = completeLesson
        this.exerciseAnswers = {}
        this.exerciseResults = {}
        this.showResults = {}
        this.submittingAnswers = {}

        if (completeLesson.exercises && completeLesson.exercises.length > 0) {
          completeLesson.exercises.forEach(question => {
            this.exerciseAnswers[question.id] =
              question.type === 'multiple-choice' || question.type === 'true-false' ? null : ''
            this.submittingAnswers[question.id] = false
          })
        }

        return { success: true, data: lessonDetail }
      } catch (error) {
        console.error('Failed to load lesson detail:', error)
        return {
          success: false,
          error: error.response?.data?.detail || 'Failed to load lesson',
          fullError: error
        }
      }
    },

    async submitAnswer(questionId, answer) {
      this.submittingAnswers = { ...this.submittingAnswers, [questionId]: true }

      try {
        const response = await axios.post(
          `${API_BASE}/student/lessons/${this.currentLesson.id}/exercises/${questionId}/submit/`,
          { answer }
        )

        const result = response.data

        this.showResults = { ...this.showResults, [questionId]: true }
        this.exerciseResults = {
          ...this.exerciseResults,
          [questionId]: {
            isCorrect: result.is_correct,
            correctAnswer: result.correct_answer
          }
        }

        return { success: true, isCorrect: result.is_correct }
      } catch (error) {
        this.showResults = { ...this.showResults, [questionId]: false }
        this.exerciseResults = { ...this.exerciseResults, [questionId]: null }
        return { success: false, error: error.response?.data?.detail || 'Failed to submit answer' }
      } finally {
        this.submittingAnswers = { ...this.submittingAnswers, [questionId]: false }
      }
    },

    async saveParagraphAnswer(questionId, answer) {
      this.submittingAnswers = { ...this.submittingAnswers, [questionId]: true }

      try {
        await axios.post(
          `${API_BASE}/student/lessons/${this.currentLesson.id}/exercises/${questionId}/submit/`,
          { answer }
        )

        this.showResults = { ...this.showResults, [questionId]: true }
        this.exerciseResults = {
          ...this.exerciseResults,
          [questionId]: { isCorrect: true, savedAnswer: answer }
        }

        return { success: true }
      } catch (error) {
        return { success: false, error: error.response?.data?.detail || 'Failed to save answer' }
      } finally {
        this.submittingAnswers = { ...this.submittingAnswers, [questionId]: false }
      }
    },

    setCurrentLesson(lessonId) {
      if (this._currentLessonId !== lessonId) {
        console.log(`🔄 Switching to lesson ${lessonId}`)
        this._currentLessonId = lessonId
      }

      const lesson = this.lessons.find(l => l.id === lessonId)
      if (lesson) {
        this.currentLesson = lesson
      }
    },

    setExerciseAnswer(questionId, answer) {
      this.exerciseAnswers = { ...this.exerciseAnswers, [questionId]: answer }
    },

    clearCourseData(courseCode) {
      if (this.courses.has(courseCode)) {
        this.courses.delete(courseCode)
        console.log(`🧹 Cleared data for course: ${courseCode}`)
      }

      if (this.currentCourseCode === courseCode) {
        this.resetCurrentCourse()
      }
    },

    resetCurrentCourse() {
      this.currentCourseCode = null
      this.currentLesson = null
      this.exerciseAnswers = {}
      this.exerciseResults = {}
      this.showResults = {}
      this.submittingAnswers = {}
      this.autoSaveStatus = {}
      this.loading = false
      this.error = null
      console.log('🧹 LessonStore: Reset current course data')
    },

    clearError() {
      this.error = null
    },

    reset() {
      this.courses.clear()
      this.resetCurrentCourse()
      this.lastUpdated = null
      this._currentLessonId = null
      this._completionAttempts = {}
      console.log('🧹 Completely reset lesson store')
    }
  }
})