<template>
  <div class="course-management">
    <div class="header-section">
      <h3 class="section-title text-start">Course Management</h3>
      <div class="section-description mb-4">
        Manage all courses, including creating, editing, and deactivating courses.
      </div>

      <div class="controls">
        <div class="search-filter">
          <div class="input-group">
            <span class="input-icon">
              <i class="fas fa-search"></i>
            </span>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search courses..."
              class="search-input"
              @input="handleSearch"
            />
          </div>

          <select v-model="filterStatus" class="filter-select" @change="filterCourses">
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <select v-model="sortOption" class="filter-select" @change="sortCourses">
            <option value="title_asc">Title (A-Z)</option>
            <option value="title_desc">Title (Z-A)</option>
            <option value="date_asc">Date Created (Oldest)</option>
            <option value="date_desc">Date Created (Recent)</option>
          </select>
        </div>

        <button
          @click="toggleCourseForm"
          class="add-course-btn btn-click-animation"
          :class="{ active: showCourseForm }"
        >
          <i class="fas fa-plus"></i>
          {{ showCourseForm ? 'Close' : 'New Course' }}
        </button>
      </div>
    </div>

    <Transition name="slide-fade">
      <div v-if="showCourseForm" class="course-form-container">
        <form @submit.prevent="handleSubmit" class="course-form">
          <div class="form-header">
            <h4>{{ isEditing ? 'Edit Course' : 'Create New Course' }}</h4>
            <p v-if="isEditing">Update course information below.</p>
            <p v-else>Create a new course for students.</p>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="title">Course Title</label>
              <input
                id="title"
                v-model="formData.title"
                required
                :class="{ error: formErrors.title }"
              />
              <span class="error-message" v-if="formErrors.title">
                {{ formErrors.title }}
              </span>
            </div>
            <div class="form-group">
              <label for="code">Course Code</label>
              <input
                id="code"
                v-model="formData.code"
                required
                :class="{ error: formErrors.code }"
              />
              <span class="error-message" v-if="formErrors.code">
                {{ formErrors.code }}
              </span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="description">Description</label>
              <textarea
                id="description"
                v-model="formData.description"
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
              <label for="price">Price ($)</label>
              <input
                id="price"
                v-model.number="formData.price"
                type="number"
                min="0"
                step="0.01"
                :class="{ error: formErrors.price }"
              />
              <span class="error-message" v-if="formErrors.price">
                {{ formErrors.price }}
              </span>
            </div>
            <div class="form-group">
              <label for="duration">Duration (weeks)</label>
              <input
                id="duration"
                v-model.number="formData.duration"
                type="number"
                min="1"
                :class="{ error: formErrors.duration }"
              />
              <span class="error-message" v-if="formErrors.duration">
                {{ formErrors.duration }}
              </span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="teacher">Teacher</label>
              <select
                id="teacher"
                v-model="formData.teacher"
                :class="{ error: formErrors.teacher }"
              >
                <option :value="null">No Teacher (Admin Managed)</option>
                <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                  {{ teacher.name || teacher.user?.name }} ({{ teacher.email }})
                </option>
              </select>
              <span class="error-message" v-if="formErrors.teacher">
                {{ formErrors.teacher }}
              </span>
            </div>
            <div class="form-group">
              <label>Status</label>
              <div class="status-toggle">
                <label :class="{ active: formData.is_active }">
                  <input type="checkbox" v-model="formData.is_active" hidden />
                  <span class="toggle-switch"></span>
                  {{ formData.is_active ? 'Active' : 'Inactive' }}
                </label>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="cancelEdit" class="cancel-btn btn-click-animation">
              Cancel
            </button>
            <button type="submit" class="submit-btn btn-click-animation" :disabled="formSubmitting">
              <i class="fas fa-spinner fa-spin" v-if="formSubmitting"></i>
              {{ isEditing ? 'Update Course' : 'Create Course' }}
            </button>
          </div>
        </form>
      </div>
    </Transition>

    <div class="course-list-container">
      <div class="bulk-actions" v-if="selectedCourses.length > 0">
        <select v-model="bulkAction" class="bulk-select">
          <option value="">Bulk Actions</option>
          <option value="activate">Activate</option>
          <option value="deactivate">Deactivate</option>
          <option value="delete">Delete</option>
        </select>
        <button
          @click="applyBulkAction"
          class="apply-bulk-btn btn-click-animation"
          :disabled="!bulkAction"
        >
          Apply
        </button>
        <span class="selected-count">{{ selectedCourses.length }} courses selected</span>
      </div>

      <div v-if="courses.length === 0 && !loading" class="no-courses">
        <i class="fas fa-book"></i>
        <p>No courses found. Adjust your search filters or create a new course.</p>
      </div>

      <!-- Responsive table container with loading overlay -->
      <div class="table-responsive">
        <div v-if="loading" class="loading-overlay">
          <div class="loader">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading courses...</span>
          </div>
        </div>

        <table class="course-table">
          <thead>
            <tr>
              <th class="select-column">
                <label class="course-checkbox">
                  <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
                  <span class="checkmark"></span>
                </label>
              </th>
              <th class="course-column">Course</th>
              <th class="teacher-column">Teacher</th>
              <th class="price-column">Price</th>
              <th class="status-column">Status</th>
              <th class="date-column">Created</th>
              <th class="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="course in displayedCourses"
              :key="course.id"
              :class="{
                inactive: !course.is_active,
                selected: selectedCourses.includes(course.id),
              }"
            >
              <td class="select-column">
                <label class="course-checkbox">
                  <input type="checkbox" v-model="selectedCourses" :value="course.id" @click.stop />
                  <span class="checkmark"></span>
                </label>
              </td>
              <td class="course-column">
                <div class="course-info">
                  <div class="course-icon">
                    <i class="fas fa-book"></i>
                  </div>
                  <div class="details">
                    <h3 class="course-title">{{ course.title }}</h3>
                    <p class="course-code">{{ course.code }}</p>
                  </div>
                </div>
              </td>
              <td class="teacher-column">
                <span v-if="course.teacher" class="teacher-info">
                  {{
                    course.teacher_name ||
                    course.teacher?.user?.get_full_name ||
                    'No teacher assigned'
                  }}
                </span>
                <span v-else class="no-teacher"> Admin Managed </span>
              </td>
              <td class="price-column price-col">
                {{ formatPrice(course.price) }}
              </td>
              <td class="status-column">
                <span class="course-status" :class="{ active: course.is_active }">
                  {{ course.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="date-column date-col">
                {{ formatDate(course.created_at) }}
              </td>
              <td class="actions-column">
                <div class="course-actions">
                  <button
                    @click="viewCourseTutorials(course)"
                    class="action-btn view-btn"
                    title="Manage lessons"
                  >
                    <i class="fas fa-play-circle"></i>
                  </button>
                  <button
                    @click="editCourse(course)"
                    class="action-btn edit-btn"
                    title="Edit course"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    @click="toggleCourseStatus(course)"
                    class="action-btn status-btn"
                    :title="course.is_active ? 'Deactivate course' : 'Activate course'"
                  >
                    <i :class="course.is_active ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
                  </button>
                  <button
                    @click="confirmDeleteCourse(course)"
                    class="action-btn delete-btn"
                    title="Delete course"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
            <draggable
              v-model="sortedLessons"
              tag="tbody"
              handle=".drag-handle"
              @end="handleReorder"
            >
              <tr
                v-for="lesson in sortedLessons"
                :key="lesson.id"
                :class="{ inactive: !lesson.is_active }"
              >
                <td class="order-column">
                  <i class="fas fa-grip-vertical drag-handle"></i>
                  {{ lesson.order }}
                </td>
                <td class="lesson-column">
                  <div class="lesson-info">
                    <div class="lesson-icon">
                      <i class="fas fa-play-circle"></i>
                    </div>
                    <div class="details">
                      <h3 class="lesson-title">{{ lesson.title }}</h3>
                      <p class="lesson-description">
                        {{ truncateDescription(lesson.description) }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="video-column">
                  <span v-if="lesson.video_url" class="video-available">
                    <i class="fas fa-check-circle text-success"></i> Video
                  </span>
                  <span v-else class="no-video">
                    <i class="fas fa-times-circle text-danger"></i> No Video
                  </span>
                </td>
                <td class="status-column">
                  <span class="lesson-status" :class="{ active: lesson.is_active }">
                    {{ lesson.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="actions-column">
                  <div class="lesson-actions">
                    <button
                      @click="editLesson(lesson)"
                      class="action-btn edit-btn"
                      title="Edit lesson"
                    >
                      <i class="fas fa-edit"></i>
                    </button>
                    <button
                      @click="toggleLessonStatus(lesson)"
                      class="action-btn status-btn"
                      :title="lesson.is_active ? 'Deactivate lesson' : 'Activate lesson'"
                    >
                      <i :class="lesson.is_active ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
                    </button>
                    <button
                      @click="confirmDeleteLesson(lesson)"
                      class="action-btn delete-btn"
                      title="Delete lesson"
                    >
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </draggable>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="totalPages > 1">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1" class="page-btn">
          <i class="fas fa-chevron-left"></i>
        </button>

        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>

        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth'
import { useToast } from 'vue-toastification'
import { debounce } from 'lodash'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State variables
const courses = ref([])
const teachers = ref([])
const loading = ref(false)
const formSubmitting = ref(false)
const searchQuery = ref('')
const filterStatus = ref('')
const showCourseForm = ref(false)
const isEditing = ref(false)
const selectedCourses = ref([])
const bulkAction = ref('')
const formErrors = ref({})
const selectAll = ref(false)
const sortField = ref('date')
const sortDirection = ref('desc')
const sortOption = ref('date_desc')

// Pagination
const itemsPerPage = 10
const currentPage = ref(1)
const totalCourses = ref(0)

// Form data
const formData = ref({
  id: null,
  title: '',
  code: '',
  description: '',
  price: 0,
  duration: 12,
  teacher: null,
  is_active: true,
})

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await fetchCourses()
    await fetchTeachers()
  } else {
    router.push('/login')
  }
})

// Watch for filter changes to reset pagination
watch([searchQuery, filterStatus], () => {
  currentPage.value = 1
})

// Computed properties
const totalPages = computed(() => Math.ceil(filteredCourses.value.length / itemsPerPage))

const filteredCourses = computed(() => {
  return courses.value.filter((course) => {
    // If no search query, return all courses that match status filter
    if (!searchQuery.value.trim()) {
      return filterStatus.value === '' ? true : course.is_active.toString() === filterStatus.value
    }

    // Prepare search terms - convert to lowercase for case-insensitive search
    const searchTerm = searchQuery.value.toLowerCase()

    // Check if search term matches any of these fields
    const matchesSearch = [
      course.title,
      course.code,
      course.description,
      course.teacher_name || course.teacher?.user?.get_full_name || '',
      formatPrice(course.price),
      course.is_active ? 'active' : 'inactive',
    ].some((field) => field?.toLowerCase().includes(searchTerm))

    // Also check status filter if applied
    const matchesStatus =
      filterStatus.value === '' ? true : course.is_active.toString() === filterStatus.value

    return matchesSearch && matchesStatus
  })
})

const handleSearch = debounce(() => {
  currentPage.value = 1 // Reset to first page when searching
}, 300)

const sortedCourses = computed(() => {
  return [...filteredCourses.value].sort((a, b) => {
    let comparison = 0

    switch (sortField.value) {
      case 'title':
        comparison = a.title.localeCompare(b.title)
        break
      case 'price':
        comparison = a.price - b.price
        break
      case 'date':
        const dateA = new Date(a.created_at || 0)
        const dateB = new Date(b.created_at || 0)
        comparison = dateA - dateB
        break
    }

    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})

const displayedCourses = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return sortedCourses.value.slice(start, end)
})

// Methods
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const debouncedSearch = debounce(() => {
  filterCourses()
}, 300)

const filterCourses = () => {
  currentPage.value = 1
}

const sortCourses = () => {
  const [field, direction] = sortOption.value.split('_')
  sortField.value = field
  sortDirection.value = direction
}

const toggleCourseForm = () => {
  showCourseForm.value = !showCourseForm.value
  if (!showCourseForm.value) {
    resetForm()
  }
}

const resetForm = () => {
  formData.value = {
    id: null,
    title: '',
    code: '',
    description: '',
    price: 0,
    duration: 12,
    teacher: null,
    is_active: true,
  }
  formErrors.value = {}
  isEditing.value = false
}

const editCourse = (course) => {
  formData.value = {
    id: course.id,
    title: course.title,
    code: course.code,
    description: course.description,
    price: course.price || 0, // Ensure price is never null
    duration: course.duration,
    teacher: course.teacher?.id || null, // Handle null teacher
    is_active: course.is_active,
  }
  isEditing.value = true
  showCourseForm.value = true
  formErrors.value = {}

  setTimeout(() => {
    document.querySelector('.course-form-container')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, 100)
}

const cancelEdit = () => {
  resetForm()
  showCourseForm.value = false
}

const validateForm = () => {
  const errors = {}

  if (!formData.value.title.trim()) {
    errors.title = 'Title is required'
  }

  if (!formData.value.code.trim()) {
    errors.code = 'Code is required'
  }

  if (formData.value.price < 0) {
    errors.price = 'Price must be positive'
  }

  if (formData.value.duration < 1) {
    errors.duration = 'Duration must be at least 1 week'
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return

  formSubmitting.value = true

  try {
    const courseData = {
      title: formData.value.title,
      code: formData.value.code,
      description: formData.value.description,
      price: formData.value.price || 0, // Ensure price is always a number
      duration: formData.value.duration,
      is_active: formData.value.is_active,
    }

    // Only include teacher if one is selected
    if (formData.value.teacher) {
      courseData.teacher = formData.value.teacher
    }

    const response = isEditing.value
      ? await axios.put(`/api/admin/courses/${formData.value.id}/`, courseData)
      : await axios.post('/api/admin/courses/', courseData)

    toast.success(`Course ${isEditing.value ? 'updated' : 'created'} successfully`)
    await fetchCourses()
    cancelEdit()
  } catch (error) {
    console.error('Error saving course:', error)

    if (error.response) {
      if (error.response.status === 400) {
        // Handle backend validation errors
        formErrors.value = error.response.data
        if (error.response.data.teacher) {
          toast.error('Invalid teacher selection')
        }
        toast.error('Please fix the form errors')
      } else {
        toast.error(error.response.data.detail || 'An error occurred')
      }
    } else {
      toast.error('Network error occurred. Please check your connection.')
    }
  } finally {
    formSubmitting.value = false
  }
}

const toggleCourseStatus = async (course) => {
  try {
    await axios.patch(`/api/admin/courses/${course.id}/`, { is_active: !course.is_active })

    await fetchCourses()
    toast.success(`Course ${!course.is_active ? 'activated' : 'deactivated'} successfully`)
  } catch (error) {
    console.error('Error updating course status:', error)
    toast.error('Failed to update course status')
  }
}

const confirmDeleteCourse = (course) => {
  if (
    confirm(
      `Are you sure you want to permanently delete ${course.title}? This action cannot be undone.`,
    )
  ) {
    deleteCourse(course.id)
  }
}

const deleteCourse = async (courseId) => {
  try {
    await axios.delete(`/api/admin/courses/${courseId}/`)

    await fetchCourses()
    toast.success('Course deleted successfully')
  } catch (error) {
    console.error('Error deleting course:', error)
    toast.error('Failed to delete course')
  }
}

const applyBulkAction = async () => {
  if (!bulkAction.value || selectedCourses.value.length === 0) return

  if (
    bulkAction.value === 'delete' &&
    !confirm(`Are you sure you want to delete ${selectedCourses.value.length} courses?`)
  ) {
    return
  }

  try {
    loading.value = true
    await axios.post('/api/admin/courses/bulk_actions/', {
      action: bulkAction.value,
      course_ids: selectedCourses.value,
    })

    await fetchCourses()
    selectedCourses.value = []
    bulkAction.value = ''

    toast.success(`Bulk action '${bulkAction.value}' completed successfully`)
  } catch (error) {
    console.error('Bulk action failed:', error)
    toast.error('Bulk action failed. Please try again.')
  } finally {
    loading.value = false
  }
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedCourses.value = displayedCourses.value.map((course) => course.id)
  } else {
    selectedCourses.value = []
  }
}

watch(
  selectedCourses,
  (newVal) => {
    selectAll.value =
      newVal.length === displayedCourses.value.length && displayedCourses.value.length > 0
  },
  { deep: true },
)

const fetchCourses = async () => {
  try {
    loading.value = true
    const response = await axios.get('/api/admin/courses/')
    // Ensure teacher data is properly structured even when null
    courses.value = response.data.map((course) => ({
      ...course,
      teacher: course.teacher || null,
    }))
    totalCourses.value = courses.value.length
  } catch (error) {
    console.error('Error fetching courses:', error)
    toast.error('Failed to load courses')
    courses.value = []
  } finally {
    loading.value = false
  }
}

const fetchTeachers = async () => {
  try {
    const response = await axios.get('/api/admin/teachers/')
    teachers.value = response.data
  } catch (error) {
    console.error('Error fetching teachers:', error)
    toast.error('Failed to load teachers')
    teachers.value = []
  }
}

const formatPrice = (price) => {
  if (price === null || price === undefined || isNaN(price)) return 'Free'
  const num = Number(price)
  return num === 0 ? 'Free' : `$${num.toFixed(2)}`
}

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page

  document.querySelector('.table-responsive').scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

const viewCourseTutorials = (course) => {
  const courseSlug = generateCourseSlug(course.title);
  router.push({
    name: 'course-lessons',
    params: {
      courseSlug: courseSlug
    }
  });
}

// Helper function to generate consistent slugs
const generateCourseSlug = (title) => {
  return title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
</script>

<style scoped>
.course-management {
  max-width: 100%;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 2rem;
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--fs-lg) !important;
  color: var(--text-color);
  margin: 0 0 14.4px 0;
  font-weight: 600;
  position: relative;
  padding-bottom: 9px;
}

.section-description {
  color: var(--text-secondary, #6c757d);
  margin-bottom: 1.5rem;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .controls {
    flex-direction: row;
    align-items: flex-start;
  }
}

.search-filter {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

@media (min-width: 768px) {
  .search-filter {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
  }
}

.input-group {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.input-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #adb5bd;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 2rem;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  font-size: 0.9rem;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  background: white;
  font-size: 0.9rem;
}

.add-course-btn {
  background: var(--primary-color, #087990);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  white-space: nowrap;
}

.add-course-btn:hover {
  background: #065e6f;
}

.add-course-btn.active {
  background: #dc3545;
}

.add-course-btn.active:hover {
  background: #bb2d3b;
}

/* Form styles */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.course-form-container {
  margin-bottom: 2rem;
  background: var(--card-bg, white);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid var(--border-color, #dee2e6);
}

.form-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color, #dee2e6);
  background: #f8f9fa;
}

.form-header h4 {
  font-size: 1.2rem;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.form-header p {
  color: #6c757d;
  font-size: 0.9rem;
}

.course-form {
  padding: 1.5rem;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .form-row {
    flex-direction: row;
  }
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--text-color, #333);
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.5rem;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  width: 100%;
  font-size: 0.95rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color, #087990);
  box-shadow: 0 0 0 2px rgba(8, 121, 144, 0.2);
}

.form-group input.error,
.form-group select.error,
.form-group textarea.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.8rem;
}

.status-toggle label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  background: #ddd;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.status-toggle .active .toggle-switch {
  background: #28a745;
}

.status-toggle .active .toggle-switch::after {
  transform: translateX(24px);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.submit-btn {
  background: var(--primary-color, #087990);
  color: white;
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  background: #065e6f;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.cancel-btn {
  background: #6c757d;
  color: white;
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.cancel-btn:hover {
  background: #5a6268;
}

/* Course list container */
.course-list-container {
  position: relative;
  background: var(--card-bg, white);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color, #dee2e6);
  padding: 1.5rem;
  min-height: 300px;
}

/* Bulk actions */
.bulk-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.bulk-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  min-width: 150px;
}

.apply-bulk-btn {
  background: var(--primary-color, #087990);
  color: white;
  border: none;
  padding: 0.4rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.apply-bulk-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.selected-count {
  margin-left: auto;
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

/* No courses message */
.no-courses {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 0;
  color: #6c757d;
}

.no-courses i {
  font-size: 3rem;
  opacity: 0.5;
}

.no-courses p {
  font-size: 1rem;
}

/* Table styles */
.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, #dee2e6);
}

.course-table {
  width: 100%;
  border-collapse: collapse;
  background: white !important;
}

.course-table th {
  padding: 1rem 0.6rem;
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #e9ecef;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s;
}

.course-table th:hover {
  background-color: #e9ecef !important;
}

.course-table td {
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
}

.course-table tr:last-child td {
  border-bottom: none;
}

.course-table tr:hover {
  background-color: #f8f9fa !important;
}

.course-table tr.inactive {
  opacity: 0.7 !important;
  background-color: #f8f9fa !important;
}

.course-table tr.selected {
  background-color: rgba(8, 121, 144, 0.1);
}

/* Column specific styles */
.select-column {
  width: 40px;
  text-align: center;
}

.course-column {
  min-width: 150px;
}

.teacher-column {
  min-width: 100px;
}

.price-column {
  white-space: nowrap;
}

.price-col {
  font-size: 0.75rem;
}

.status-column {
  min-width: 80px;
}

.date-column {
  min-width: 70px;
}

.date-col {
  font-size: 0.75rem;
}

.actions-column {
  min-width: 80px;
  text-align: right;
}

/* Course info in table */
.course-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.course-icon {
  width: 36px;
  height: 36px;
  background: #e2f0fc;
  color: var(--primary-color, #087990);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.details {
  flex: 1;
  min-width: 0;
}

.course-title {
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 0.1rem;
  color: var(--text-color, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 0.8rem;
}

.course-code {
  font-size: 0.5rem;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.teacher-info {
  font-size: 0.75rem;
  display: inline-block;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-teacher {
  font-size: 0.75rem;
  color: #6c757d;
  font-style: italic;
}

/* Course status badges */
.course-status {
  font-size: 0.6rem !important;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  display: inline-block;
}

.course-status.active {
  background: #d1e7dd;
  color: #146c43;
}

.course-status:not(.active) {
  background: #f8d7da;
  color: #b02a37;
}

/* Course actions in table */
.course-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.3rem;
  border-radius: 4px;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 0.8rem;
}

.view-btn {
  color: #6c757d;
}

.view-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.edit-btn {
  color: #6c757d;
}

.edit-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.status-btn {
  color: #6c757d;
}

.status-btn:hover {
  background: #e9ecef;
  color: #28a745;
}

.delete-btn {
  color: #6c757d;
}

.delete-btn:hover {
  background: #e9ecef;
  color: #dc3545;
}

/* Checkbox styles */
.course-checkbox {
  position: relative;
  display: inline-block;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.course-checkbox input {
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

.course-checkbox:hover .checkmark {
  background-color: #ddd;
}

.course-checkbox input:checked ~ .checkmark {
  background-color: var(--primary-color, #087990);
}

.checkmark:after {
  content: '';
  position: absolute;
  display: none;
}

.course-checkbox input:checked ~ .checkmark:after {
  display: block;
  left: 7px;
  top: 3px;
  width: 6px;
  height: 12px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1.5rem;
  gap: 1rem;
}

.page-btn {
  background: white;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #c1c9d0;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9rem;
  color: #6c757d;
}

/* Loading states */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
  z-index: 10;
}

.spinner-border {
  width: 3rem;
  height: 3rem;
  color: var(--primary-color);
}

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loader i {
  font-size: 2rem;
  color: var(--primary-color, #087990);
}

.loader span {
  color: #6c757d;
}

/* Button animations */
.btn-click-animation {
  position: relative;
  overflow: hidden;
}

.btn-click-animation::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%) scale(0);
  transition:
    transform 0.4s,
    opacity 0.4s;
  opacity: 0;
}

.btn-click-animation:active::after {
  transform: translate(-50%, -50%) scale(2);
  opacity: 0;
  transition: 0s;
}

/* Responsive adjustments */
@media (min-width: 992px) {
  .table-responsive {
    overflow-x: none !important;
  }
}

/* Responsive adjustments */
@media (max-width: 991px) {
  .course-title {
    max-width: 150px;
  }

  .course-code {
    max-width: 150px;
  }
}

@media (max-width: 767px) {
  .table-responsive {
    margin: 0 -1rem;
    width: calc(100% + 2rem);
    border-left: none;
    border-right: none;
    border-radius: 0;
  }

  .course-list-container {
    padding: 1rem;
    border-radius: 0;
    box-shadow: none;
  }

  .course-form-container {
    border-radius: 0;
    margin-left: -1rem;
    margin-right: -1rem;
    width: calc(100% + 2rem);
  }

  .teacher-column,
  .date-column {
    display: none;
  }

  .course-actions {
    gap: 0.75rem;
  }

  .action-btn {
    width: 32px;
    height: 32px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .course-list-container,
  .course-form-container {
    background: var(--card-bg-dark, #2d3748);
    border-color: var(--border-color-dark, #4a5568);
  }

  .course-table {
    background: var(--card-bg-dark, #2d3748);
  }

  .course-table th {
    background: var(--bg-dark-secondary, #1a202c);
    color: #e2e8f0;
    border-bottom-color: #4a5568;
  }

  .course-table td {
    border-bottom-color: #4a5568;
  }

  .course-table tr:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .course-table tr.inactive {
    background-color: rgba(0, 0, 0, 0.2);
  }

  .course-table tr.selected {
    background-color: rgba(8, 121, 144, 0.2);
  }

  .course-icon {
    background: rgba(8, 121, 144, 0.2);
  }

  .course-title {
    color: #e2e8f0;
  }

  .course-code,
  .no-teacher {
    color: #a0aec0;
  }

  .course-status.active {
    background: rgba(209, 231, 221, 0.15);
    color: #8ee8b0;
  }

  .course-status:not(.active) {
    background: rgba(248, 215, 218, 0.15);
    color: #f8a3aa;
  }

  .form-header {
    background: var(--bg-dark-secondary, #1a202c);
    border-bottom-color: #4a5568;
  }

  .form-header p {
    color: #a0aec0;
  }

  .form-group label {
    color: #e2e8f0;
  }

  .form-group input,
  .form-group select,
  .form-group textarea {
    background: var(--bg-dark-secondary, #1a202c);
    border-color: #4a5568;
    color: #e2e8f0;
  }

  .toggle-switch {
    background: #4a5568;
  }

  .checkmark {
    background-color: #4a5568;
  }

  .pagination .page-btn {
    background: var(--bg-dark-secondary, #1a202c);
    border-color: #4a5568;
    color: #e2e8f0;
  }

  .bulk-actions {
    background: var(--bg-dark-secondary, #1a202c);
    border-color: #4a5568;
  }

  .page-info {
    color: #a0aec0;
  }

  .loading-overlay {
    background: rgba(45, 55, 72, 0.8);
  }

  .loader span {
    color: #a0aec0;
  }
}

/* Print styles */
@media print {
  .course-management {
    max-width: 100%;
  }

  .controls,
  .add-course-btn,
  .bulk-actions,
  .pagination,
  .course-actions,
  .form-actions {
    display: none !important;
  }

  .course-list-container,
  .course-form-container,
  .table-responsive {
    box-shadow: none;
    border: none;
  }

  .course-table th {
    background: white !important;
    color: black !important;
  }

  .course-table tr,
  .course-table tr:hover,
  .course-table tr.inactive,
  .course-table tr.selected {
    background: white !important;
    opacity: 1 !important;
  }

  .course-status {
    border: 1px solid #adb5bd;
  }
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.course-table tbody tr {
  animation: fadeIn 0.3s ease forwards;
}

.course-table tbody tr:nth-child(1) {
  animation-delay: 0.05s;
}
.course-table tbody tr:nth-child(2) {
  animation-delay: 0.1s;
}
.course-table tbody tr:nth-child(3) {
  animation-delay: 0.15s;
}
.course-table tbody tr:nth-child(4) {
  animation-delay: 0.2s;
}
.course-table tbody tr:nth-child(5) {
  animation-delay: 0.25s;
}
.course-table tbody tr:nth-child(6) {
  animation-delay: 0.3s;
}
.course-table tbody tr:nth-child(7) {
  animation-delay: 0.35s;
}
.course-table tbody tr:nth-child(8) {
  animation-delay: 0.4s;
}
.course-table tbody tr:nth-child(9) {
  animation-delay: 0.45s;
}
.course-table tbody tr:nth-child(10) {
  animation-delay: 0.5s;
}

/* Custom scrollbar for table */
.table-responsive::-webkit-scrollbar {
  height: 8px;
}

.table-responsive::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.table-responsive::-webkit-scrollbar-thumb {
  background: #adb5bd;
  border-radius: 4px;
}

.table-responsive::-webkit-scrollbar-thumb:hover {
  background: #6c757d;
}

/* Focus styles for accessibility */
.page-btn:focus {
  outline: 2px solid var(--primary-color, #087990);
  outline-offset: 2px;
}

select:focus,
textarea:focus,
.bulk-select:focus,
.input:focus,
.search-input:focus,
.filter-select:focus {
  border-color: var(--primary-color, #087990);
  outline: none;
  box-shadow: 0 0 0 2px rgba(8, 121, 144, 0.2);
}

/* Style consistency with UserManagement */
.course-management {
  font-family: var(--font-base, 'Inter', sans-serif);
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background: var(--primary-color, #087990);
}

.form-group label {
  text-transform: capitalize;
  letter-spacing: 0.01em;
}

.course-status {
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-weight: 600;
  font-size: 0.7rem;
}

/* Additional form field styles for consistency */
.form-group input:focus::placeholder,
.form-group textarea:focus::placeholder {
  opacity: 0.5;
}

.form-group select option {
  padding: 10px;
}

/* Tooltip styles */
.action-btn {
  position: relative;
}

.action-btn::before {
  content: attr(title);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.3rem 0.6rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 4px;
  font-size: 0.7rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  pointer-events: none;
}

.action-btn:hover::before {
  opacity: 1;
  visibility: visible;
  bottom: calc(100% + 10px);
}

.tutorials-btn {
  color: #6c757d;
}

.tutorials-btn:hover {
  background: #e9ecef;
  color: #17a2b8;
}

/* Mobile devices (≤ 575px) */
@media (max-width: 575px) {
  .bulk-actions {
    flex-wrap: wrap;
    gap: 0.5rem;                /* reduce gap for mobile */
  }

  .bulk-actions select,
  .bulk-actions button {
    flex: 1 1 auto;             /* allow them to share the top row */
    min-width: 0;               /* prevent overflow with long text */
  }

  .bulk-actions .selected-count {
    flex: 0 0 100%;             /* force onto its own line */
    text-align: left;           /* align with left edge (optional) */
    margin-top: 0.25rem;        /* small spacing from above */
    font-size: 0.9rem;          /* optional: adjust font size */
  }
}
</style>
