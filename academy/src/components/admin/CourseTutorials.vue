<template>
  <div class="admin-dashboard">
    <!-- Enhanced Navbar Header with StudentHeader properties -->
    <header class="dashboard-header">
      <!-- LEFT SIDE: Courses Toggle Button (aligned with other action buttons) -->
      <div class="header-left">
        <button
          class="header-action-btn courses-toggle-btn"
          :class="{ 'active': isSidebarOpen }"
          @click="toggleSidebar"
          title="My Courses"
        >
          <i class="fas fa-book"></i>
        </button>
      </div>

      <!-- CENTER: Page Title - Hidden, keeping space only -->
      <div class="page-title-header">
        <!-- Course title removed as requested -->
      </div>

      <!-- RIGHT SIDE: Actions -->
      <div class="header-actions">
        <!-- Back Arrow -->
        <button
          @click="goBackToCourses"
          class="header-action-btn back-btn"
          title="Back to courses"
        >
          <i class="fas fa-arrow-left"></i>
        </button>

        <!-- Dashboard Icon -->
        <router-link
          to="/dashboard"
          class="header-action-btn"
          title="Dashboard"
          exact-active-class="active"
        >
          <i class="fas fa-tachometer-alt"></i>
        </router-link>

        <!-- Home Icon -->
        <router-link
          to="/"
          class="header-action-btn"
          title="Home"
          exact-active-class="active"
        >
          <i class="fas fa-home"></i>
        </router-link>

        <!-- Notifications -->
        <button class="header-action-btn notification-btn" title="Notifications">
          <i class="fas fa-bell"></i>
          <span class="notification-badge" v-if="notificationCount > 0">
            {{ notificationCount }}
          </span>
        </button>
      </div>

      <!-- Expanded Courses Sidebar (slides from left) -->
      <transition name="slide-left">
        <div v-if="isSidebarOpen" class="courses-sidebar-overlay" @click="closeSidebar">
          <div class="courses-sidebar-panel" @click.stop>
            <div class="sidebar-header">
              <h6>My Courses</h6>
              <button @click="closeSidebar" class="close-btn">
                <i class="fas fa-times"></i>
              </button>
            </div>

            <!-- Loading State -->
            <div v-if="loading" class="sidebar-loading">
              <div class="spinner-border spinner-border-sm text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <span class="ms-2">Loading courses...</span>
            </div>

            <!-- Error State -->
            <div v-else-if="coursesError" class="sidebar-error">
              <i class="fas fa-exclamation-triangle text-danger"></i>
              <span class="ms-2">{{ coursesError }}</span>
            </div>

            <!-- Courses List -->
            <ul v-else-if="courses.length > 0" class="courses-list">
              <li
                v-for="course in sortedCourses"
                :key="`header-course-${course.id}`"
                class="course-item"
                :class="{
                  'active': activeCourseId === course.id,
                  'inactive': !course.is_active
                }"
                @click="handleCourseClick(course)"
              >
                <div class="course-icon">
                  <i class="fas fa-book"></i>
                </div>
                <div class="course-info">
                  <span class="course-name">{{ course.title }}</span>
                  <span class="course-code">{{ course.code }}</span>
                </div>
                <i v-if="activeCourseId === course.id" class="fas fa-check text-success"></i>
              </li>
            </ul>

            <!-- Empty State -->
            <div v-else class="sidebar-empty">
              <i class="fas fa-book-open text-muted"></i>
              <p class="mb-0 mt-2">No courses available</p>
            </div>
          </div>
        </div>
      </transition>
    </header>

    <div class="dashboard-container">
      <!-- Fixed Sidebar for Desktop (≥992px) -->
      <div class="sidebar-desktop shadow">
        <div class="sidebar-content">
          <div class="sidebar-section">
            <div class="sidebar-section-header">
              <h4 class="p-3 py-2">Courses</h4>
              <span class="sidebar-badge m-3">{{ courses.length }}</span>
            </div>
            <div v-if="loading" class="sidebar-loading">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div v-else-if="courses.length === 0" class="sidebar-empty">No courses yet</div>
            <ul v-else class="sidebar-courses">
              <li
                v-for="course in sortedCourses"
                :key="course.id"
                class="sidebar-course-item coursetutorials-item"
                :class="{
                  active: activeCourseId === course.id,
                  inactive: !course.is_active
                }"
                @click="handleCourseClick(course)"
              >
                <div class="course-details">
                  <i class="fas fa-book"></i>
                  <span class="course-title">{{ course.title }}</span>
                  <span v-if="!course.is_active" class="course-status-indicator">Inactive</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <div class="header-left adminmanagement-header">
          <h3 class="page-title">{{ activeCourse.title }}</h3>
        </div>

        <div class="content-header">
          <div class="search-filter">
            <div class="input-group">
              <input
                type="text"
                v-model="searchQuery"
                placeholder="Search lessons..."
                @input="handleSearch"
                class="search-input"
              />
              <i class="fas fa-search"></i>
            </div>

            <div class="filter-group">
              <button @click="toggleSortOrder" class="sort-btn">
                <i class="fas" :class="sortAsc ? 'fa-sort-amount-up' : 'fa-sort-amount-down'"></i>
                <span class="sort-text">{{ sortAsc ? 'Ascending' : 'Descending' }}</span>
              </button>
              <button @click="showBulkActions = !showBulkActions" class="bulk-btn">
                <i class="fas fa-layer-group"></i>
                <span class="bulk-text">Bulk</span>
              </button>
              <button
                @click="toggleLessonForm"
                class="add-lesson-btn"
                :class="{ active: showLessonForm }"
                :disabled="loading || (filteredLessons.length === 0 && !showLessonForm)"
              >
                <i class="fas fa-plus"></i>
                <span class="add-lesson-text-full">{{ showLessonForm ? 'Cancel' : 'Add New Lesson' }}</span>
                <span class="add-lesson-text-short">{{ showLessonForm ? 'Cancel' : 'New Lesson' }}</span>
              </button>
            </div>
          </div>

          <!-- Bulk Actions -->
          <div class="bulk-actions" v-if="showBulkActions || selectedLessons.length > 0">
            <button @click="applyBulkAction('activate')" class="bulk-action-btn">
              <i class="fas fa-check-circle"></i> Activate
            </button>
            <button @click="applyBulkAction('deactivate')" class="bulk-action-btn">
              <i class="fas fa-times-circle"></i> Deactivate
            </button>
            <button @click="applyBulkAction('delete')" class="bulk-action-btn danger">
              <i class="fas fa-trash"></i> Delete
            </button>
            <span class="selected-count">{{ selectedLessons.length }} selected</span>
            <button @click="clearSelection" class="bulk-action-btn clear-btn">
              <i class="fas fa-times"></i> Clear
            </button>
          </div>
        </div>

        <div class="content-body">
          <!-- Empty state when no lessons -->
          <div class="empty-state-container" v-if="!loading && filteredLessons.length === 0 && !showLessonForm">
            <div class="empty-state-content">
              <i class="fas fa-book-open"></i>
              <h4>No Lessons Found</h4>
              <p v-if="searchQuery">Your search didn't match any lessons</p>
              <p v-else>This course doesn't have any lessons yet</p>
              <button @click="toggleLessonForm" class="add-lesson-btn">
                <i class="fas fa-plus"></i> Create First Lesson
              </button>
            </div>
          </div>

          <!-- Lessons table when there are results -->
          <div v-else class="lesson-content">
            <div v-if="(!loading && filteredLessons.length === 0) || showLessonForm">
              <Transition name="slide-fade">
                <div class="lesson-form-container" v-if="showLessonForm">
                  <form @submit.prevent="handleLessonSubmit" class="lesson-form">
                    <div class="form-header">
                      <h4>{{ isEditingLesson ? 'Edit Lesson' : 'Create New Lesson' }}</h4>
                      <p>
                        {{
                          isEditingLesson
                            ? 'Update lesson information below.'
                            : 'Add a new lesson to this course.'
                        }}
                      </p>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="lesson-title">Lesson Title</label>
                        <input
                          id="lesson-title"
                          v-model="lessonForm.title"
                          required
                          :class="{ error: formErrors.title }"
                        />
                        <span class="error-message" v-if="formErrors.title">
                          {{ formErrors.title }}
                        </span>
                      </div>
                      <div class="form-group">
                        <label for="lesson-order">Order</label>
                        <input
                          id="lesson-order"
                          v-model.number="lessonForm.order"
                          type="number"
                          min="1"
                          required
                          :class="{ error: formErrors.order }"
                        />
                        <span class="error-message" v-if="formErrors.order">
                          {{ formErrors.order }}
                        </span>
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="lesson-description">Description</label>
                        <textarea
                          id="lesson-description"
                          v-model="lessonForm.description"
                          rows="3"
                          :class="{ error: formErrors.description }"
                        ></textarea>
                        <span class="error-message" v-if="formErrors.description">
                          {{ formErrors.description }}
                        </span>
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <!-- Video Upload Component -->
                        <VideoUploader
                          ref="videoUploadRef"
                          v-model="lessonForm.video_url"
                          :course-id="activeCourseId"
                          :lesson-id="lessonForm.id"
                          :is-editing="isEditingLesson"
                          @video-uploaded="handleVideoUploaded"
                          @video-url-saved="handleVideoUrlSaved"
                        />
                        <span class="error-message" v-if="formErrors.video_url">
                          {{ formErrors.video_url }}
                        </span>
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label for="lesson-content">Content</label>
                        <textarea
                          id="lesson-content"
                          v-model="lessonForm.content"
                          rows="5"
                          :class="{ error: formErrors.content }"
                        ></textarea>
                        <span class="error-message" v-if="formErrors.content">
                          {{ formErrors.content }}
                        </span>
                        <small class="hint">Markdown is supported</small>
                      </div>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label>Status</label>
                        <div class="status-toggle">
                          <label :class="{ active: lessonForm.is_active }">
                            <input type="checkbox" v-model="lessonForm.is_active" hidden />
                            <span class="toggle-switch"></span>
                            {{ lessonForm.is_active ? 'Active' : 'Inactive' }}
                          </label>
                        </div>
                      </div>
                    </div>

                    <ExerciseComponent
                      :key="exerciseFormKey"
                      :lessonId="lessonForm.id"
                      :initialExercise="currentExercise"
                      @exercise-saved="handleExerciseSaved"
                      @exercise-updated="handleExerciseUpdated"
                      @exercise-deleted="handleExerciseDeleted"
                      @cancel-exercise="cancelExercise"
                      v-model:showExerciseForm="showExerciseForm"
                      ref="exerciseFormRef"
                    />

                    <div class="form-row">
                      <div class="form-group">
                        <button
                          type="button"
                          @click="toggleExerciseForm"
                          class="toggle-exercise-btn"
                        >
                          <i class="fas" :class="showExerciseForm ? 'fa-minus' : 'fa-plus'"></i>
                          {{ showExerciseForm ? 'Hide Exercise' : 'Add Exercise' }}
                        </button>
                      </div>
                    </div>

                    <div class="form-actions">
                      <button type="button" @click="cancelLessonEdit" class="cancel-btn">
                        Cancel
                      </button>
                      <button type="submit" class="submit-btn" :disabled="formSubmitting">
                        <i class="fas fa-spinner fa-spin" v-if="formSubmitting"></i>
                        {{ isEditingLesson ? 'Update Lesson' : 'Create Lesson' }}
                      </button>
                    </div>
                  </form>
                </div>
              </Transition>
            </div>

            <div class="lessons-list-container" v-if="!showLessonForm && filteredLessons.length > 0">
              <div class="table-responsive">
                <table class="lessons-table">
                  <thead>
                    <tr>
                      <th class="select-column">
                        <label class="lesson-checkbox">
                          <input
                            type="checkbox"
                            v-model="selectAllLessons"
                            @change="toggleSelectAllLessons"
                          />
                          <span class="checkmark"></span>
                        </label>
                      </th>
                      <th class="order-column">Order</th>
                      <th class="lesson-column">Lesson</th>
                      <th class="exercise-column">Exercise</th>
                      <th class="video-column">Video</th>
                      <th class="status-column">Status</th>
                      <th class="actions-column">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="lesson in filteredLessons"
                      :key="`${lesson.id}-${lesson.updated_at || lesson.is_active}`"
                      :class="{
                        inactive: !lesson.is_active,
                        selected: selectedLessons.includes(lesson.id),
                      }"
                    >
                      <td class="select-column">
                        <label class="lesson-checkbox">
                          <input
                            type="checkbox"
                            v-model="selectedLessons"
                            :value="lesson.id"
                            @click.stop
                          />
                          <span class="checkmark"></span>
                        </label>
                      </td>
                      <td class="order-column">
                        <span class="order-badge">{{ lesson.order }}</span>
                      </td>
                      <td class="lesson-column">
                        <div class="lesson-info">
                          <div class="details">
                            <div class="lesson-title">{{ lesson.title }}</div>
                            <div class="lesson-description">
                              {{ truncateDescription(lesson.description) }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="exercise-column">
                        <div v-if="lesson.exercise" class="exercise-available text-success">
                          <i class="fas fa-check-circle"></i>
                          <span>Available</span>
                        </div>
                        <div v-else class="no-exercise text-danger">
                          <i class="fas fa-times-circle"></i>
                          <span>No exercise</span>
                        </div>
                      </td>
                      <td class="video-column">
                        <div v-if="lesson.video_url" class="video-available text-success">
                          <i class="fas fa-video"></i>
                          <span>Available</span>
                        </div>
                        <div v-else class="no-video text-danger">
                          <i class="fas fa-video-slash"></i>
                          <span>No video</span>
                        </div>
                      </td>
                      <td class="status-column">
                        <span class="lesson-status" :class="{ active: lesson.is_active }">
                          {{ lesson.is_active ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td class="actions-column">
                        <div class="lesson-actions">
                          <button @click="editLesson(lesson)" class="action-btn edit-btn">
                            <i class="fas fa-edit" title="Edit lesson"></i>
                          </button>
                          <button
                            @click="toggleLessonStatus(lesson)"
                            class="action-btn status-btn"
                            :class="{ active: lesson.is_active }"
                          >
                            <i
                              class="fas"
                              :class="
                                lesson.is_active
                                  ? 'fa-toggle-on text-success'
                                  : 'fa-toggle-off text-secondary'
                              "
                              :title="lesson.is_active ? 'Deactivate course' : 'Activate course'"
                            ></i>
                          </button>
                          <button
                            @click="confirmDeleteLesson(lesson)"
                            class="action-btn delete-btn"
                          >
                            <i class="fas fa-trash" title="delete lesson"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useToast } from 'vue-toastification'
import { debounce } from 'lodash'
import ExerciseComponent from '../admin/ExerciseComponent.vue'
import VideoUploader from '../admin/VideoUploader.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const exerciseFormRef = ref(null)
const exerciseFormKey = ref(0)
const videoUploadRef = ref(null)

// State variables
const activeCourse = ref({
  id: null,
  title: '',
  code: '',
})

const currentExercise = ref(null)
const showExerciseForm = ref(false)
const courses = ref([])
const lessons = ref([])
const loading = ref(false)
const formSubmitting = ref(false)
const showLessonForm = ref(false)
const isEditingLesson = ref(false)
const formErrors = ref({})
const sortAsc = ref(true)
const activeLessonId = ref(null)
const activeCourseId = ref(null)
const searchQuery = ref('')
const filterStatus = ref('')
const selectedLessons = ref([])
const selectAllLessons = ref(false)
const showBulkActions = ref(false)
const isSidebarOpen = ref(false)
const coursesError = ref(null)
const notificationCount = ref(0)

// Form data
const lessonForm = ref({
  id: null,
  title: '',
  order: 1,
  description: '',
  content: '',
  video_url: '',
  is_active: true,
  course_id: null,
  exercise: null
})

onMounted(async () => {
  try {
    await fetchCourses()

    if (route.params.courseSlug) {
      const course = currentCourse.value
      if (course) {
        await setActiveCourse(course)
      } else if (courses.value.length > 0) {
        await handleCourseClick(courses.value[0])
      }
    } else if (courses.value.length > 0) {
      await handleCourseClick(courses.value[0])
    }
  } catch (error) {
    console.error('Initialization error:', error)
    toast.error('Failed to initialize component')
  }
})

const generateCourseSlug = (title) => {
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const initializeForm = (lesson = null) => {
  if (lesson) {
    lessonForm.value = {
      id: lesson.id,
      title: lesson.title,
      order: lesson.order,
      description: lesson.description,
      content: lesson.content,
      video_url: lesson.video_url || '',
      is_active: lesson.is_active,
      course_id: activeCourseId.value,
      exercise: lesson.exercise || null
    }

    currentExercise.value = lesson.exercise ? { ...lesson.exercise } : null
    isEditingLesson.value = true
  } else {
    const maxOrder = lessons.value.reduce((max, lesson) => Math.max(max, lesson.order), 0)
    lessonForm.value = {
      id: null,
      title: '',
      order: maxOrder + 1,
      description: '',
      content: '',
      video_url: '',
      is_active: true,
      course_id: activeCourseId.value,
      exercise: null
    }

    currentExercise.value = null
    isEditingLesson.value = false
  }

  formErrors.value = {}
  exerciseFormKey.value++
}

const resetLessonForm = () => {
  if (videoUploadRef.value) {
    videoUploadRef.value.resetComponent()
  }
}

const toggleExerciseForm = () => {
  showExerciseForm.value = !showExerciseForm.value
  if (showExerciseForm.value) {
    if (lessonForm.value.exercise) {
      currentExercise.value = { ...lessonForm.value.exercise }
    } else {
      currentExercise.value = null
    }
  }
}

// Computed properties
const sortedCourses = computed(() => {
  return [...courses.value].sort((a, b) => a.title.localeCompare(b.title))
})

const sortedLessons = computed(() => {
  return [...lessons.value].sort((a, b) => {
    return sortAsc.value ? a.order - b.order : b.order - a.order
  })
})

const filteredLessons = computed(() => {
  return sortedLessons.value.filter((lesson) => {
    const matchesSearch =
      searchQuery.value === '' ||
      lesson.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (lesson.description &&
        lesson.description.toLowerCase().includes(searchQuery.value.toLowerCase()))

    const matchesStatus =
      filterStatus.value === '' || lesson.is_active.toString() === filterStatus.value

    return matchesSearch && matchesStatus
  })
})

const currentCourse = computed(() => {
  if (!route.params.courseSlug) return null
  return courses.value.find(course =>
    generateCourseSlug(course.title) === route.params.courseSlug
  )
})

const setActiveCourse = async (course) => {
  try {
    if (activeCourseId.value === course.id) {
      return
    }

    activeCourseId.value = course.id
    activeCourse.value = { ...course }
    lessonForm.value.course_id = course.id

    showLessonForm.value = false
    selectedLessons.value = []
    selectAllLessons.value = false
    showBulkActions.value = false
    resetLessonForm()

    await fetchLessons()

  } catch (error) {
    console.error('Error switching course:', error)
    toast.error('Failed to load course lessons')
  }
}

const handleCourseClick = async (course) => {
  const courseSlug = generateCourseSlug(course.title)

  await setActiveCourse(course)

  if (route.params.courseSlug !== courseSlug) {
    await router.push({
      name: 'course-lessons',
      params: { courseSlug: courseSlug }
    })
  }

  isSidebarOpen.value = false
}

const fetchLessons = async () => {
  if (!activeCourseId.value) return

  try {
    const isInitialLoad = lessons.value.length === 0
    if (isInitialLoad) {
      loading.value = true
    }

    const response = await axios.get(`/api/admin/courses/${activeCourseId.value}/lessons/`)
    lessons.value = response.data

  } catch (error) {
    console.error('Error fetching lessons:', error)
    toast.error('Failed to load lessons')
    lessons.value = []
  } finally {
    if (loading.value) {
      loading.value = false
    }
  }
}

const createLesson = async (lessonData) => {
  const response = await axios.post(
    `/api/admin/courses/${activeCourseId.value}/lessons/`,
    lessonData
  )
  return response.data
}

const updateLesson = async (lessonId, lessonData) => {
  const response = await axios.put(
    `/api/admin/courses/${activeCourseId.value}/lessons/${lessonId}/`,
    lessonData
  )
  return response.data
}

const deleteLesson = async (lessonId) => {
  await axios.delete(`/api/admin/courses/${activeCourseId.value}/lessons/${lessonId}/`)
}

const toggleLessonStatus = async (lesson) => {
  try {
    const newStatus = !lesson.is_active

    const lessonIndex = lessons.value.findIndex(l => l.id === lesson.id)
    if (lessonIndex !== -1) {
      lessons.value[lessonIndex] = { ...lesson, is_active: newStatus }
    }

    await updateLesson(lesson.id, { ...lesson, is_active: newStatus })

    toast.success(`Lesson ${newStatus ? 'activated' : 'deactivated'} successfully`)

  } catch (error) {
    console.error('Error updating lesson status:', error)

    const lessonIndex = lessons.value.findIndex(l => l.id === lesson.id)
    if (lessonIndex !== -1) {
      lessons.value[lessonIndex] = { ...lesson }
    }

    toast.error('Failed to update lesson status')
  }
}

const toggleLessonForm = () => {
  showLessonForm.value = !showLessonForm.value
  if (showLessonForm.value) {
    initializeForm()
  } else {
    resetLessonForm()
  }
}

const validateLessonForm = () => {
  const errors = {}

  if (!lessonForm.value.title.trim()) {
    errors.title = 'Title is required'
  }

  if (!lessonForm.value.order || lessonForm.value.order < 1) {
    errors.order = 'Order must be at least 1'
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleVideoUploaded = (data) => {
  if (data.lesson_id && !lessonForm.value.id) {
    lessonForm.value.id = data.lesson_id
  }
  toast.success('Video uploaded successfully')
}

const handleVideoUrlSaved = (data) => {
  if (data.lesson_id && !lessonForm.value.id) {
    lessonForm.value.id = data.lesson_id
  }
}

const handleLessonSubmit = async () => {
  if (!validateLessonForm()) return

  formSubmitting.value = true

  try {
    const lessonData = {
      title: lessonForm.value.title,
      order: lessonForm.value.order,
      description: lessonForm.value.description,
      content: lessonForm.value.content,
      video_url: lessonForm.value.video_url,
      is_active: lessonForm.value.is_active,
      course_id: activeCourseId.value
    }

    if (showExerciseForm.value && exerciseFormRef.value) {
      const exerciseData = exerciseFormRef.value.getCurrentExerciseData()
      if (exerciseData) {
        lessonData.exercise = exerciseData
      }
    }

    let updatedLesson
    if (isEditingLesson.value) {
      updatedLesson = await updateLesson(lessonForm.value.id, lessonData)

      const lessonIndex = lessons.value.findIndex(l => l.id === lessonForm.value.id)
      if (lessonIndex !== -1) {
        lessons.value[lessonIndex] = { ...updatedLesson }
      }

      toast.success('Lesson updated successfully')
    } else {
      updatedLesson = await createLesson(lessonData)
      lessons.value.push(updatedLesson)
      lessonForm.value.id = updatedLesson.id
      toast.success('Lesson created successfully')
    }

    resetLessonForm()
    showLessonForm.value = false

  } catch (error) {
    console.error('Error saving lesson:', error)
    await fetchLessons()
    toast.error(error.response?.data?.detail || 'Failed to save lesson')
  } finally {
    formSubmitting.value = false
  }
}

const editLesson = (lesson) => {
  initializeForm(lesson)
  showLessonForm.value = true
  showExerciseForm.value = !!lesson.exercise

  if (lesson.exercise) {
    currentExercise.value = { ...lesson.exercise }
  } else {
    currentExercise.value = null
  }
}

const cancelLessonEdit = () => {
  resetLessonForm()
  showLessonForm.value = false
}

const confirmDeleteLesson = async (lesson) => {
  try {
    const confirm = window.confirm(`Delete "${lesson.title}" permanently? This cannot be undone.`)

    if (confirm) {
      const lessonIndex = lessons.value.findIndex(l => l.id === lesson.id)
      const originalLessons = [...lessons.value]

      if (lessonIndex !== -1) {
        lessons.value.splice(lessonIndex, 1)
      }

      try {
        await deleteLesson(lesson.id)
        toast.success('Lesson deleted successfully')
      } catch (error) {
        lessons.value = originalLessons
        throw error
      }
    }
  } catch (error) {
    console.error('Error deleting lesson:', error)
    toast.error('Failed to delete lesson')
  }
}

const fetchCourses = async () => {
  try {
    loading.value = true
    const response = await axios.get('/api/admin/courses/')
    courses.value = response.data
  } catch (error) {
    console.error('Error fetching courses:', error)
    coursesError.value = 'Failed to load courses'
    toast.error('Failed to load courses')
  } finally {
    loading.value = false
  }
}

const handleExerciseSaved = (exerciseData) => {
  lessonForm.value.exercise = exerciseData
  currentExercise.value = exerciseData
  fetchLessons()
  toast.success('Exercise saved successfully')
}

const handleExerciseUpdated = (exerciseData) => {
  lessonForm.value.exercise = exerciseData
  currentExercise.value = exerciseData
  fetchLessons()
  toast.success('Exercise updated successfully')
}

const handleExerciseDeleted = async () => {
  try {
    lessonForm.value.exercise = null
    currentExercise.value = null
    await fetchLessons()
    toast.success('Exercise deleted successfully')
  } catch (error) {
    console.error('Error deleting exercise:', error)
    toast.error('Failed to delete exercise')
  }
}

const cancelExercise = () => {
  showExerciseForm.value = false
  if (isEditingLesson.value && currentExercise.value) {
    lessonForm.value.exercise = { ...currentExercise.value }
  } else {
    lessonForm.value.exercise = null
  }
}

const truncateDescription = (text, length = 50) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const toggleSortOrder = () => {
  sortAsc.value = !sortAsc.value
}

const toggleSelectAllLessons = () => {
  if (selectAllLessons.value) {
    selectedLessons.value = filteredLessons.value.map((lesson) => lesson.id)
  } else {
    selectedLessons.value = []
  }
}

const clearSelection = () => {
  selectedLessons.value = []
  selectAllLessons.value = false
  showBulkActions.value = false
}

const applyBulkAction = async (action) => {
  if (selectedLessons.value.length === 0) {
    toast.warning('Please select at least one lesson')
    return
  }

  try {
    loading.value = true

    if (action === 'delete') {
      const confirmDelete = confirm(
        `Are you sure you want to delete ${selectedLessons.value.length} lesson(s)? This cannot be undone.`,
      )
      if (!confirmDelete) return
    }

    await axios.post(`/api/admin/courses/${activeCourseId.value}/lessons/bulk_actions/`, {
      action: action,
      lesson_ids: selectedLessons.value,
    })

    await fetchLessons()
    clearSelection()

    toast.success(`Bulk ${action} completed successfully`)
  } catch (error) {
    console.error('Error applying bulk action:', error)
    toast.error(`Failed to ${action} lessons`)
  } finally {
    loading.value = false
  }
}

const goBackToCourses = () => {
  router.push('/admin/courses')
}

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
  if (isSidebarOpen.value && courses.value.length === 0) {
    fetchCourses()
  }
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

const handleSearch = debounce(() => {
  // Search is handled in the computed property
}, 300)

watch(
  () => route.params.courseSlug,
  async (newSlug, oldSlug) => {
    if (newSlug && newSlug !== oldSlug && courses.value.length) {
      const course = currentCourse.value
      if (course && course.id !== activeCourseId.value) {
        await setActiveCourse(course)
      }
    }
  },
  { immediate: true }
)

watch(
  selectedLessons,
  (newVal) => {
    selectAllLessons.value =
      newVal.length === filteredLessons.value.length && filteredLessons.value.length > 0
  },
  { deep: true }
)
</script>

<style scoped>
/* ==================== Enhanced Header Styles (from StudentHeader) ==================== */
.dashboard-header {
  background-color: var(--header-bg, #fff);
  padding: 10.3px 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color, #dee2e6);
  box-shadow: 0 1px 3px var(--shadow-color, rgba(0, 0, 0, 0.1));
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.courses-toggle-btn {
  /* Match the exact styling of other header action buttons */
  position: relative;
  width: 40px;
  height: 40px;
  display: flex !important;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 50% !important;
  color: var(--primary-color, #087990);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0 !important;
}

.courses-toggle-btn:hover {
  background-color: rgba(8, 121, 144, 0.1) !important;
  color: var(--primary-color, #087990);
  transform: scale(1.1) !important;
}

.courses-toggle-btn.active {
  background-color: rgba(8, 121, 144, 0.15) !important;
  color: var(--primary-color, #087990) !important;
}

.courses-toggle-btn i {
  font-size: 1.2rem;
}

.courses-label {
  font-size: 0.9rem;
  font-weight: 500;
  display: none; /* Hidden as requested */
}

.page-title-header {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.lessons-title {
  font-size: var(--fs-lg, 1.25rem) !important;
  font-weight: 700;
  color: var(--secondary-color, #333);
  margin: 0;
  font-family: var(--font-heading, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.header-action-btn {
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 50%;
  color: var(--primary-color, #087990);
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.header-action-btn:hover {
  background-color: rgba(8, 121, 144, 0.1);
  color: var(--primary-color, #087990);
  transform: scale(1.1);
}

.header-action-btn.active {
  color: var(--primary-color, #087990);
  background-color: rgba(8, 121, 144, 0.15);
}

.header-action-btn i {
  font-size: 1.2rem;
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: var(--error-color, #dc3545);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
}

/* ==================== Courses Sidebar Styles ==================== */
.courses-sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
}

.courses-sidebar-panel {
  width: 320px;
  max-width: 85vw;
  height: 100vh;
  background: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid rgba(8, 121, 144, 0.08);
  background: linear-gradient(135deg, rgba(8, 121, 144, 0.05), rgba(8, 121, 144, 0.02));
}

.sidebar-header h6 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary-color, #087990);
}

.close-btn {
  background: none;
  border: none;
  color: var(--secondary-color, #6c757d);
  font-size: 1.3rem;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: rgba(8, 121, 144, 0.1);
  color: var(--primary-color, #087990);
  transform: rotate(90deg);
}

.sidebar-loading,
.sidebar-error,
.sidebar-empty {
  padding: 32px 24px;
  text-align: center;
  color: var(--primary-color, #087990);
  font-size: 0.9rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.sidebar-error {
  color: var(--error-color, #dc3545);
}

.sidebar-empty i {
  font-size: 2.5rem;
  opacity: 0.3;
}

.courses-list {
  list-style: none;
  padding: 8px;
  margin: 0;
  overflow-y: auto;
  flex: 1;
}

.course-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 12px;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border-left: 3px solid transparent;
  border-radius: 10px;
  margin-bottom: 4px;
  background: white;
}

.course-item:hover {
  background-color: rgba(8, 121, 144, 0.06);
  transform: translateX(4px);
}

.course-item.active {
  background: linear-gradient(135deg, rgba(8, 121, 144, 0.12), rgba(8, 121, 144, 0.08));
  border-left-color: var(--primary-color, #087990);
  box-shadow: 0 2px 8px rgba(8, 121, 144, 0.1);
}

.course-item.inactive {
  opacity: 0.7;
}

.course-item.active .course-name {
  color: var(--primary-color);
  font-weight: 700;
}

.course-item.active .course-code {
  color: var(--primary-color);
  opacity: 0.9;
}




/* Set 7% height for tablets and below */
@media (max-width: 991px) {
  .course-item {
    height: 7vh;
    min-height: 50px; /* Prevent too small on very short screens */
  }
}

.course-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary-color, #087990), #065e6f);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.1rem;
  box-shadow: 0 4px 12px rgba(8, 121, 144, 0.2);
}

.course-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.course-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-color, #333);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.course-code {
  font-size: 0.75rem;
  color: var(--secondary-color, #6c757d);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  opacity: 0.8;
}

/* ==================== Slide Left Animation ==================== */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-left-enter-active .courses-sidebar-panel,
.slide-left-leave-active .courses-sidebar-panel {
  transition: transform 0.3s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  opacity: 0;
}

.slide-left-enter-from .courses-sidebar-panel {
  transform: translateX(-100%);
}

.slide-left-leave-to .courses-sidebar-panel {
  transform: translateX(-100%);
}

/* ==================== Custom Scrollbar ==================== */
.courses-list::-webkit-scrollbar {
  width: 6px;
}

.courses-list::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 0;
}

.courses-list::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--primary-color, #087990), #065e6f);
  border-radius: 10px;
}

.courses-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #065e6f, var(--primary-color, #087990));
}

/* ==================== Desktop Sidebar Styles ==================== */
/* Desktop sidebar - hidden on mobile/tablet, visible on desktop */


.sidebar-desktop {
  width: 230px;
  background-color: #fff;
  border-right: 1px solid #dee2e6;
  height: 100vh;            /* Full viewport height — on top of navbar */
  position: fixed;
  top: 0;                   /* Starts at very top, overlaps navbar */
  left: 0;
  overflow-y: auto;
  z-index: 200;             /* Higher than navbar's z-index: 100 */
  display: none;
}

.sidebar-content {
  width: 100%;
  margin: 0 auto;
}

.sidebar-section {
  width: 100%;
}

.sidebar-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid #e9ecef;
}

.sidebar-section-header h4 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
}

.sidebar-badge {
  background-color: #e9ecef;
  color: #6c757d;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 10px;
}

.sidebar-courses {
  display: flex;
  flex-wrap: wrap;
  gap: 0.1rem;
  padding: 0;
  margin: 0;
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;
  list-style: none;
}

.sidebar-courses::-webkit-scrollbar {
  height: 5px;
}

.sidebar-courses::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.sidebar-courses::-webkit-scrollbar-thumb {
  background: #087990;
  border-radius: 10px;
}

.sidebar-courses::-webkit-scrollbar-thumb:hover {
  background: #065e6f;
}

.sidebar-course-item {
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease, opacity 0.2s ease;
  margin-left: 0;
  width: 100%;
}

.sidebar-course-item:hover {
  background-color: #f1f3f5;
}

.sidebar-course-item.active {
  background-color: #e2f0fc;
  border-left: 3px solid #087990;
  transition: background-color 0.2s ease, border-left 0.2s ease;
}

.sidebar-course-item.inactive {
  opacity: 0.7;
}

.coursetutorials-item {
  width: 100%;
  display: block;
  padding: 0.5rem 1rem;
  margin: 0;
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.coursetutorials-item:hover {
  background-color: #f1f3f5;
  color: #087990;
}

.coursetutorials-item.active {
  background-color: #e2f0fc;
  border-left: solid #087990;
  font-weight: 500;
  color: #087990;
}

.coursetutorials-item.inactive {
  opacity: 0.7;
}

.course-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.course-details i {
  color: #087990;
  font-size: 0.9rem;
}

.course-title {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.8rem;
}

.course-status-indicator {
  font-size: 0.7rem;
  padding: 0.2rem 0.4rem;
  background-color: #f8d7da;
  color: #b02a37;
  border-radius: 4px;
}

.sidebar-loading,
.sidebar-empty {
  padding: 1rem 0;
  text-align: center;
  color: #6c757d;
  font-size: 0.85rem;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.sidebar-loading i {
  animation: fa-spin 1s infinite linear;
  opacity: 1;
}

/* ==================== Existing Styles (unchanged) ==================== */
/* Base styles */
.admin-dashboard {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f9fa;
  margin: 0;
  padding: 0;
}

.dashboard-container {
  display: flex;
  position: relative;
}

/* Main content styles */
.main-content {
  flex: 1;
  padding: 0.9rem;
  overflow-y: auto;
  margin-left: 0; /* No margin by default (mobile/tablet) */
  margin-top: 0;
}

.page-title {
  font-size: var(--fs-lg, 1.25rem) !important;
  margin: 0 0 0.5rem 0;
  font-weight: 600;
  color: #343a40;
  text-align: left;
}

.content-header {
  position: relative;
  z-index: 2;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.search-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.input-group {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.input-group input {
  width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 2rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.9rem;
}

.input-group i {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #adb5bd;
}

.filter-group {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.sort-btn {
  background-color: white;
  border: 1px solid #dee2e6;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sort-btn:hover {
  background-color: #f8f9fa;
}

/* Show full text by default, hide short text */
.sort-text {
  display: inline;
}

/* Show bulk text by default */
.bulk-text {
  display: inline;
}

/* Show full text by default, hide short text for lesson button */
.add-lesson-text-full {
  display: inline;
}

.add-lesson-text-short {
  display: none;
}

.bulk-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.bulk-btn:hover {
  background-color: #5a6268;
}

.add-lesson-btn {
  background-color: var(--primary-color, #087990);
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-lesson-btn:hover {
  background-color: #065e6f;
}

.add-lesson-btn.active {
  background-color: #dc3545;
}

.add-lesson-btn.active:hover {
  background-color: #bb2d3b;
}

/* Bulk actions */
.bulk-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  flex-wrap: wrap;
}

.bulk-action-btn {
  background: white;
  border: 1px solid #dee2e6;
  padding: 0.5rem 0.8rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.bulk-action-btn:hover {
  background-color: #f1f3f5;
}

.bulk-action-btn.danger {
  color: #dc3545;
  border-color: rgba(220, 53, 69, 0.3);
}

.bulk-action-btn.danger:hover {
  background-color: rgba(220, 53, 69, 0.1);
}

.bulk-action-btn.clear-btn {
  margin-left: auto;
  color: #6c757d;
}

.selected-count {
  font-size: 0.85rem;
  color: #6c757d;
  padding: 0 0.5rem;
}

/* Lesson content */
.lesson-content {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
}

.empty-state-container {
  display: flex;
  justify-content: center;
  padding: 3rem 1rem;
}

.empty-state-content {
  text-align: center;
  max-width: 400px;
}

.empty-state-content i {
  font-size: 2rem;
  color: #6c757d;
  margin-bottom: 1rem;
}

.empty-state-content h4 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #343a40;
}

.empty-state-content p {
  margin-bottom: 1.5rem;
  color: #6c757d;
}

/* Lesson form */
.lesson-form-container {
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;
}

.lesson-form {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.form-header {
  margin-bottom: 1.5rem;
}

.form-header h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #343a40;
}

.form-header p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.form-group {
  flex: 1;
  min-width: 200px;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.9rem;
  color: #343a40;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
}

.search-input:focus,
.form-group input:focus,
.form-group textarea:focus {
  outline: none !important;
  border-color: #087990 !important;
  box-shadow: 0 0 0 2px rgba(8, 121, 144, 0.25) !important;
}

.form-group input.error,
.form-group textarea.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}

.hint {
  color: #6c757d;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  display: block;
}

.status-toggle {
  display: flex;
  align-items: center;
}

.status-toggle label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0.5rem 0.8rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.status-toggle label.active {
  color: #198754;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  background-color: #ced4da;
  border-radius: 20px;
  transition: all 0.2s;
}

.status-toggle label.active .toggle-switch {
  background-color: #198754;
}

.toggle-switch:before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: white;
  top: 2px;
  left: 2px;
  transition: all 0.2s;
}

.status-toggle label.active .toggle-switch:before {
  transform: translateX(20px);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #dee2e6;
}

.cancel-btn {
  background-color: #fff;
  border: 1px solid #dee2e6;
  color: #495057;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background-color: #f8f9fa;
}

.submit-btn {
  background-color: #087990;
  color: white;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 4px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.submit-btn:hover {
  background-color: #065e6f;
}

.submit-btn:disabled {
  background-color: #adb5bd;
  cursor: not-allowed;
}

/* Lessons Table */
.lessons-list-container {
  margin-top: 1.5rem;
}

.table-responsive {
  overflow-x: auto;
}

.lessons-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white !important;
}

.lessons-table th {
  padding: 1rem 0.6rem;
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #e9ecef;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s;
}

.lessons-table th:hover {
  background-color: #e9ecef !important;
}

.lessons-table td {
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
  padding: 1rem 0.6rem;
}

.lessons-table tr:hover {
  background-color: #f8f9fa;
}

.lessons-table tr:last-child td {
  border-bottom: none;
}

.lessons-table tr.selected {
  background-color: rgba(8, 121, 144, 0.1);
}

.lessons-table tr.inactive {
  opacity: 0.7 !important;
  background-color: #f8f9fa !important;
}

.select-column {
  width: 40px;
  text-align: center;
}

.order-column {
  width: 80px;
  text-align: center;
}

.lesson-column {
  min-width: 150px;
}

.video-column,
.exercise-column {
  width: 120px;
  white-space: nowrap;
}

.status-column {
  width: 80px;
}

.actions-column {
  width: 130px;
  text-align: right;
}

.order-badge {
  display: inline-block;
  background-color: #e9ecef;
  color: #495057;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.lesson-checkbox {
  position: relative;
  display: inline-block;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.lesson-checkbox input {
  opacity: 0;
  position: absolute;
  width: 0;
  height: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: #eee;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.lesson-checkbox:hover .checkmark {
  background-color: #ddd;
}

.lesson-checkbox input:checked ~ .checkmark {
  background-color: var(--primary-color, #087990);
}

.checkmark:after {
  content: '';
  position: absolute;
  display: none;
}

.lesson-checkbox input:checked ~ .checkmark:after {
  display: block;
  left: 7px;
  top: 3px;
  width: 6px;
  height: 12px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.lesson-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.details {
  flex: 1;
  min-width: 0;
}

.lesson-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--text-color, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lesson-description {
  font-size: 0.8rem;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-available,
.exercise-available {
  color: #198754;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.no-video,
.no-exercise {
  color: #dc3545;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.text-success {
  color: #198754;
}

.text-danger {
  color: #dc3545;
}

.text-secondary {
  color: #6c757d;
}

.lesson-status {
  font-size: 0.75rem !important;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  display: inline-block;
}

.lesson-status.active {
  background: #d1e7dd;
  color: #146c43;
}

.lesson-status:not(.active) {
  background: #f8d7da;
  color: #b02a37;
}

.lesson-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.4rem;
  border-radius: 4px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.action-btn:hover {
  background-color: #f1f3f5;
}

.edit-btn {
  color: #6c757d;
}

.edit-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.delete-btn {
  color: #6c757d;
}

.delete-btn:hover {
  background: #e9ecef;
  color: #dc3545;
}

.status-btn i {
  color: #6c757d !important;
}

.status-btn:hover i {
  color: #28a745 !important;
}

.toggle-exercise-btn {
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  color: #087990;
  padding: 0.6rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-exercise-btn:hover {
  background-color: #e9ecef;
}

.add-lesson-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background-color: #6c757d !important;
}

/* Transitions */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* ==================== Mobile Responsive Styles ==================== */
@media (max-width: 767.98px) {
  .dashboard-header {
    padding: 8px 12px;
  }

  .page-title-header {
    display: none;
  }

  .header-actions {
    gap: 8px;
  }

  .header-action-btn {
    width: 36px;
    height: 36px;
  }

  .header-action-btn i {
    font-size: 1.1rem;
  }

  .notification-badge {
    width: 18px;
    height: 18px;
    font-size: 0.65rem;
  }

  .courses-toggle-btn {
    width: 36px;
    height: 36px;
  }

  .courses-toggle-btn i {
    font-size: 1.1rem;
  }

  .courses-sidebar-panel {
    width: 280px;
  }

  /* Hide "Ascending/Descending" text on mobile, show only icon */
  .sort-text {
    display: none;
  }

  .sort-btn {
    padding: 0.6rem;
    min-width: 40px;
    justify-content: center;
  }

  /* Hide "Bulk" text on mobile, show only icon */
  .bulk-text {
    display: none;
  }

  .bulk-btn {
    padding: 0.6rem;
    min-width: 40px;
    justify-content: center;
  }

  /* Show "New Lesson" instead of "Add New Lesson" on mobile */
  .add-lesson-text-full {
    display: none;
  }

  .add-lesson-text-short {
    display: inline;
  }

  .main-content {
    padding: 1rem;
  }

  .filter-group {
    flex-wrap: wrap;
  }

  .lesson-actions {
    gap: 0.5rem;
  }

  .action-btn {
    width: 28px;
    height: 28px;
  }

  .bulk-actions {
    flex-direction: flex !important;
    align-items: flex-start;
  }

  .selected-count {
    margin-top: 0.5rem;
  }

  .clear-btn {
    margin-left: 0;
    margin-top: 0.5rem;
  }

  .search-filter {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-row {
    flex-direction: column;
  }
}

@media (max-width: 575.98px) {
  .header-actions {
    gap: 6px;
  }

  .header-action-btn {
    width: 34px;
    height: 34px;
  }

  .courses-sidebar-panel {
    width: 85vw;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .lessons-table th,
  .lessons-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
  }

  .video-column,
  .status-column {
    display: none;
  }
}

@media (min-width: 768px) and (max-width: 991px) {
  .dashboard-header {
    padding: 8px 12px;
  }

  .header-left {
    margin-left: 0.5rem;
  }

  .lessons-title {
    font-size: 1.1rem !important;
  }

  .header-actions {
    gap: 8px;
  }

  .header-action-btn {
    width: 36px;
    height: 36px;
  }

  .courses-toggle-btn {
    width: 36px;
    height: 36px;
  }

  .courses-sidebar-panel {
    width: 300px;
  }

  .lesson-title {
    max-width: 150px;
  }

  .lesson-description {
    max-width: 150px;
  }

  /* Keep full text on tablets */
  .sort-text {
    display: inline;
  }

  .bulk-text {
    display: inline;
  }

  .add-lesson-text-full {
    display: inline;
  }

  .add-lesson-text-short {
    display: none;
  }
}

@media (min-width: 992px) {
  /* Show desktop sidebar on large screens */
  .dashboard-header {
    position: fixed;        /* Fixed to viewport */
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;           /* Below sidebar */
    width: 100%;
  }


  .dashboard-container {
    padding-top: 61px;      /* Match navbar height */
  }

  .sidebar-desktop {
    display: block !important;
  }

  .main-content {
    margin-left: 230px; /* ← ADD THIS */
  }

  /* Hide mobile courses toggle button */
  .courses-toggle-btn {
    display: none !important;
  }

  /* Hide the header-left container since toggle is hidden */
  .header-left {
    display: none;
  }

  /* Show full text on desktop */
  .sort-text {
    display: inline;
  }

  .bulk-text {
    display: inline;
  }

  .add-lesson-text-full {
    display: inline;
  }

  .add-lesson-text-short {
    display: none;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .lessons-table {
    background: var(--card-bg-dark, #2d3748);
  }

  .lessons-table th {
    background: var(--bg-dark-secondary, #1a202c);
    color: #e2e8f0;
    border-bottom-color: #4a5568;
  }

  .lessons-table td {
    border-bottom-color: #4a5568;
  }

  .lessons-table tr:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .lessons-table tr.inactive {
    background-color: rgba(0, 0, 0, 0.2);
  }

  .lessons-table tr.selected {
    background-color: rgba(8, 121, 144, 0.2);
  }

  .lesson-title {
    color: #e2e8f0;
  }

  .lesson-description {
    color: #a0aec0;
  }

  .lesson-status.active {
    background: rgba(209, 231, 221, 0.15);
    color: #8ee8b0;
  }

  .lesson-status:not(.active) {
    background: rgba(248, 215, 218, 0.15);
    color: #f8a3aa;
  }

  .order-badge {
    background-color: #4a5568;
    color: #e2e8f0;
  }

  .checkmark {
    background-color: #4a5568;
  }
}
</style>