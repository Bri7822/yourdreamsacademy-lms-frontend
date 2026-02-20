<template>
  <div class="enrollment-management">
    <h3 class="section-title">Enrollment Management</h3>
      <div class="section-description">
        Manage student enrollments, track progress, and handle approval workflows with real-time analytics.
      </div>
    <div class="header-section">

      <!-- Real-time Statistics -->
      <div class="stats-dashboard mb-3">

        <!-- Loading overlay for table -->
        <div v-if="loading" class="loading-overlay">
          <div class="loader">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading enrollments stats...</span>
          </div>
        </div>

        <div class="compact-chart-container">
          <div class="compact-chart-card">
            <h4>Enrollment Trends</h4>
            <canvas ref="enrollmentTrendChart" height="120"></canvas>
          </div>
          <div class="compact-chart-card">
            <h4>Status Distribution</h4>
            <canvas ref="statusChart" height="120"></canvas>
          </div>
          <div class="compact-chart-card">
            <h4>Progress Overview</h4>
            <canvas ref="progressChart" height="120"></canvas>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="compact-stats-grid">
          <div class="compact-stat-card pending">
            <div class="stat-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-content">
              <h4>{{ realtimeStats.pending }}</h4>
              <p>Pending</p>
            </div>
          </div>
          <div class="compact-stat-card approved">
            <div class="stat-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-content">
              <h4>{{ realtimeStats.approved }}</h4>
              <p>Active</p>
            </div>
          </div>
          <div class="compact-stat-card completed">
            <div class="stat-icon">
              <i class="fas fa-graduation-cap"></i>
            </div>
            <div class="stat-content">
              <h4>{{ realtimeStats.completed }}</h4>
              <p>Completed</p>
            </div>
          </div>
          <div class="compact-stat-card total">
            <div class="stat-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-content">
              <h4>{{ realtimeStats.total }}</h4>
              <p>Total</p>
            </div>
          </div>
        </div>
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
              placeholder="Search enrollments..."
              class="search-input"
              @input="handleSearch"
            />
          </div>
          <select v-model="filterCourse" class="filter-select" @change="filterEnrollments">
            <option value="">All Courses</option>
            <option v-for="course in courses" :key="course.id" :value="course.id">
              {{ course.title }}
            </option>
          </select>
          <select v-model="sortOption" class="filter-select" @change="sortEnrollments">
            <option value="date_desc">Recent First</option>
            <option value="date_asc">Oldest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="progress_desc">Progress (High-Low)</option>
            <option value="progress_asc">Progress (Low-High)</option>
          </select>
          <select v-model="filterStatus" class="filter-select" @change="filterEnrollments">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="completed">Completed</option>
            <option value="declined">Declined</option>
          </select>
        </div>
      </div>
      <div class="action-buttons">
        <button
          @click="toggleAutoApproval"
          class="auto-approval-btn btn-click-animation"
          :class="{ active: autoApprovalEnabled }"
        >
          <i class="fas fa-robot"></i>
          {{ autoApprovalEnabled ? 'Auto-Approval: ON' : 'Auto-Approval: OFF' }}
        </button>
        <button
          @click="refreshAllData"
          class="add-enrollment-btn btn-click-animation"
          :disabled="loading"
        >
          <i class="fas fa-sync" :class="{ 'fa-spin': loading }"></i>
          Refresh Data
        </button>
        <button
          @click="toggleEnrollmentForm"
          class="add-enrollment-btn btn-click-animation"
          :class="{ active: showEnrollmentForm }"
        >
          <i class="fas fa-user-plus"></i>
          {{ showEnrollmentForm ? 'Close Form' : 'Enroll Student' }}
        </button>
      </div>
    </div>

    <!-- Manual Enrollment Form -->
    <Transition name="slide-fade">
      <div v-if="showEnrollmentForm" class="enrollment-form-container">
        <form @submit.prevent="handleEnrollmentSubmit" class="enrollment-form">
          <div class="form-header">
            <h4>Manual Student Enrollment</h4>
            <p>Enroll a student manually when they cannot access their device or need assistance.</p>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="student_select">Select Student</label>
              <select
                id="student_select"
                v-model="enrollmentFormData.student"
                :class="{ error: enrollmentFormErrors.student }"
                required
                @change="updateSelectedStudent"
              >
                <option value="">Choose a student...</option>
                <option
                  v-for="student in students"
                  :key="student.id"
                  :value="student.id"
                >
                  {{ student.first_name }} {{ student.last_name }} ({{ student.email }})
                </option>
              </select>
              <span class="error-message" v-if="enrollmentFormErrors.student">
                {{ enrollmentFormErrors.student }}
              </span>
            </div>
            <div class="form-group">
              <label for="course_select">Select Course</label>
              <select
                id="course_select"
                v-model="enrollmentFormData.course"
                :class="{ error: enrollmentFormErrors.course }"
                required
              >
                <option value="">Choose a course...</option>
                <option v-for="course in availableCourses" :key="course.id" :value="course.id">
                  {{ course.title }} ({{ course.code }})
                </option>
              </select>
              <span class="error-message" v-if="enrollmentFormErrors.course">
                {{ enrollmentFormErrors.course }}
              </span>
            </div>
          </div>

          <div class="form-row" v-if="enrollmentFormData.student && enrollmentFormData.course">
            <div class="form-group">
              <label>Enrollment Status</label>
              <div class="status-options">
                <label class="status-option" :class="{ active: enrollmentFormData.status === 'pending' }">
                  <input type="radio" v-model="enrollmentFormData.status" value="pending" />
                  <span>Pending Review</span>
                </label>
                <label class="status-option" :class="{ active: enrollmentFormData.status === 'approved' }">
                  <input type="radio" v-model="enrollmentFormData.status" value="approved" />
                  <span>Auto-Approve</span>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label for="enrollment_notes">Notes (Optional)</label>
              <textarea
                id="enrollment_notes"
                v-model="enrollmentFormData.notes"
                placeholder="Add any notes about this enrollment..."
                rows="3"
              ></textarea>
            </div>
          </div>

          <!-- Selected Student Preview -->
          <div v-if="selectedStudent" class="selected-student-preview">
            <h5>Selected Student:</h5>
            <div class="student-preview">
              <div class="student-info">
                <h3>{{ selectedStudent.first_name }} {{ selectedStudent.last_name }}</h3>
                <p>{{ selectedStudent.email }}</p>
                <div class="student-stats">
                  <span class="stat">
                    <i class="fas fa-book"></i>
                    {{ selectedStudent.total_enrollments || 0 }} enrollments
                  </span>
                  <span class="stat">
                    <i class="fas fa-graduation-cap"></i>
                    {{ selectedStudent.completed_courses || 0 }} completed
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="cancelEnrollmentForm" class="cancel-btn btn-click-animation">
              Cancel
            </button>
            <button type="submit" class="submit-btn btn-click-animation" :disabled="enrollmentFormSubmitting">
              <i class="fas fa-spinner fa-spin" v-if="enrollmentFormSubmitting"></i>
              <i class="fas fa-user-plus" v-else></i>
              Enroll Student
            </button>
          </div>
        </form>
      </div>
    </Transition>

    <!-- Enrollment List -->
    <div class="enrollment-list-container">
      <!-- Loading overlay for table -->
      <div v-if="loading" class="loading-overlay">
        <div class="loader">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading enrollments list...</span>
        </div>
      </div>

      <div class="bulk-actions" v-if="selectedEnrollments.length > 0">
        <div class="bulk-actions-row">
          <select v-model="bulkAction" class="bulk-select">
            <option value="">Bulk Actions</option>
            <option value="approve">Approve</option>
            <option value="decline">Decline</option>
            <option value="complete">Mark Complete</option>
            <option value="reset">Reset Progress</option>
          </select>
          <button
            @click="applyBulkAction"
            class="apply-bulk-btn btn-click-animation"
            :disabled="!bulkAction"
          >
            Apply
          </button>
        </div>
        <span class="selected-count">{{ selectedEnrollments.length }} enrollments selected</span>
      </div>

      <div v-if="filteredEnrollments.length === 0 && !loading" class="no-enrollments">
        <i class="fas fa-user-graduate"></i>
        <p>No enrollments found. Adjust your search filters or wait for new enrollments.</p>
      </div>

      <!-- Responsive table container -->
      <div class="table-responsive">
        <table class="enrollment-table">
        <!-- Update the table header structure -->
        <thead>
          <tr>
            <th class="select-column">                  <!-- Checkbox column -->
              <label class="enrollment-checkbox">
                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
                <span class="checkmark"></span>
              </label>
            </th>
            <th class="student-column">Student</th>
            <th class="course-column">Course</th>
            <th class="progress-column">Progress</th>
            <th class="exercises-column">Exercises</th>
            <th class="status-column">Status</th>
            <th class="date-column">Date</th>
            <th class="actions-column">Actions</th>
          </tr>
        </thead>

        <!-- Update the table body structure -->
        <tbody>
          <tr
            v-for="enrollment in displayedEnrollments"
            :key="enrollment.id"
            :class="{
              pending: enrollment.status === 'pending',
              approved: enrollment.status === 'approved',
              completed: enrollment.status === 'completed',
              declined: enrollment.status === 'declined',
              selected: selectedEnrollments.includes(enrollment.id),
            }"
          >
            <td class="select-column">
              <label class="enrollment-checkbox">
                <input
                  type="checkbox"
                  v-model="selectedEnrollments"
                  :value="enrollment.id"
                  @click.stop
                />
                <span class="checkmark"></span>
              </label>
            </td>
            <td class="student-column">
              <div class="student-info">
                <div class="details">
                  <h3 class="student-name">{{ enrollment.student_name }}</h3>
                  <p class="student-email">{{ enrollment.student_email }}</p>
                </div>
              </div>
            </td>
            <td class="course-column">
              <div class="course-info">
                <div class="details">
                  <h3 class="course-title">{{ enrollment.course_title }}</h3>
                  <p class="course-code">{{ enrollment.course_code }}</p>
                </div>
              </div>
            </td>
            <td class="progress-column">
              <div class="progress-container">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: enrollment.progress + '%' }"
                    :class="getProgressClass(enrollment.progress)"
                  ></div>
                </div>
                <span class="progress-text">{{ enrollment.progress }}%</span>
              </div>
            </td>
            <td class="exercises-column">
              <div class="exercise-stats">
                <span class="completed">{{ enrollment.exercises_completed }}</span>
                <span class="separator">/</span>
                <span class="total">{{ enrollment.exercises_total }}</span>
              </div>
            </td>
            <td class="status-column">
              <span class="enrollment-status" :class="enrollment.status">
                {{ formatStatus(enrollment.status) }}
              </span>
            </td>
            <td class="date-column">
              {{ formatDate(enrollment.enrolled_at) }}
            </td>
            <td class="actions-column">
              <div class="enrollment-actions">
                <button
                  @click="viewStudentProgress(enrollment)"
                  class="action-btn view-btn"
                  title="View Progress"
                >
                  <i class="fas fa-chart-line"></i>
                </button>
                <button
                  v-if="enrollment.status === 'pending'"
                  @click="approveEnrollment(enrollment)"
                  class="action-btn approve-btn"
                  title="Approve Enrollment"
                >
                  <i class="fas fa-check"></i>
                </button>
                <button
                  v-if="enrollment.status === 'pending'"
                  @click="declineEnrollment(enrollment)"
                  class="action-btn decline-btn"
                  title="Decline Enrollment"
                >
                  <i class="fas fa-times"></i>
                </button>
                <button
                  v-if="enrollment.status === 'approved' && enrollment.progress < 100"
                  @click="markComplete(enrollment)"
                  class="action-btn complete-btn"
                  title="Mark Complete"
                >
                  <i class="fas fa-graduation-cap"></i>
                </button>
                <button
                  @click="resetProgress(enrollment)"
                  class="action-btn reset-btn"
                  title="Reset Progress"
                >
                  <i class="fas fa-undo"></i>
                </button>
              </div>
            </td>
          </tr>
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

    <!-- Progress Detail Modal -->
    <Transition name="modal-fade">
      <div v-if="showProgressModal" class="modal-overlay" @click="closeProgressModal">
        <div class="progress-modal" @click.stop>
          <div class="modal-header">
            <h4>Student Progress Details</h4>
            <button @click="closeProgressModal" class="close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body" v-if="selectedEnrollmentDetails">
            <div class="student-header">
              <div class="student-avatar large">
                {{ getInitials(selectedEnrollmentDetails.student_name) }}
              </div>
              <div class="student-details">
                <h3>{{ selectedEnrollmentDetails.student_name }}</h3>
                <p>{{ selectedEnrollmentDetails.student_email }}</p>
                <p>Course: {{ selectedEnrollmentDetails.course_title }}</p>
              </div>
            </div>

            <div class="progress-overview">
              <div class="progress-stat">
                <span class="label">Overall Progress</span>
                <div class="progress-bar large">
                  <div
                    class="progress-fill"
                    :style="{ width: selectedEnrollmentDetails.progress + '%' }"
                    :class="getProgressClass(selectedEnrollmentDetails.progress)"
                  ></div>
                </div>
                <span class="percentage">{{ selectedEnrollmentDetails.progress }}%</span>
              </div>
            </div>

            <div class="exercises-breakdown">
              <h5>Exercise Progress</h5>
              <div class="exercise-list">
                <div
                  v-for="exercise in selectedEnrollmentDetails.exercises"
                  :key="exercise.id"
                  class="exercise-item"
                  :class="{ completed: exercise.completed }"
                >
                  <div class="exercise-icon">
                    <i :class="exercise.completed ? 'fas fa-check-circle' : 'far fa-circle'"></i>
                  </div>
                  <div class="exercise-info">
                    <h6>{{ exercise.title }}</h6>
                    <p>{{ exercise.description }}</p>
                    <span class="completion-date" v-if="exercise.completed_at">
                      Completed: {{ formatDate(exercise.completed_at) }}
                    </span>
                  </div>
                  <div class="exercise-score" v-if="exercise.score !== null">
                    <span class="score">{{ exercise.score }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth'
import { useToast } from 'vue-toastification'
import { debounce } from 'lodash'

const authStore = useAuthStore()
const toast = useToast()

// State variables
const enrollments = ref([])
const courses = ref([])
const availableCourses = ref([])
const students = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref('')
const filterCourse = ref('')
const selectedEnrollments = ref([])
const bulkAction = ref('')
const selectAll = ref(false)
const sortField = ref('date')
const sortDirection = ref('desc')
const sortOption = ref('date_desc')
const autoApprovalEnabled = ref(false)
const showProgressModal = ref(false)
const selectedEnrollmentDetails = ref(null)

// Enrollment form state
const showEnrollmentForm = ref(false)
const enrollmentFormSubmitting = ref(false)
const enrollmentFormData = ref({
  student: null,
  course: '',
  status: 'pending',
  notes: ''
})
const enrollmentFormErrors = ref({})
const selectedStudent = ref(null)

// Real-time statistics
const realtimeStats = ref({
  pending: 0,
  approved: 0,
  completed: 0,
  total: 0
})

// Chart references
const enrollmentTrendChart = ref(null)
const statusChart = ref(null)
const progressChart = ref(null)

// Charts instances
let trendChart, statusPieChart, progressBarChart

// Pagination
const itemsPerPage = 10
const currentPage = ref(1)

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await Promise.all([
      fetchEnrollments(),
      fetchCourses(),
      fetchStudents(),
      checkAutoApprovalStatus()
    ])

    await nextTick()
    initializeCharts()
    startRealtimeUpdates()
  }
})

const API_PREFIX = '/api/admin'

// Watch for filter changes to reset pagination
watch([searchQuery, filterStatus, filterCourse], () => {
  currentPage.value = 1
})

// Watch for stats changes to update charts
watch(realtimeStats, (newStats, oldStats) => {
  if (oldStats && (
    newStats.pending !== oldStats.pending ||
    newStats.approved !== oldStats.approved ||
    newStats.completed !== oldStats.completed
  )) {
    updateCharts()
  }
}, { deep: true })

// Fetch all students
const fetchStudents = async () => {
  try {
    const response = await axios.get(`${API_PREFIX}/enrollment-management/students/`)
    students.value = response.data
  } catch (error) {
    console.error('Error fetching students:', error)
    toast.error('Failed to load students')
    students.value = []
  }
}

// Update selected student when dropdown changes
const updateSelectedStudent = () => {
  const studentId = enrollmentFormData.value.student
  if (studentId) {
    selectedStudent.value = students.value.find(s => s.id === studentId) || null
  } else {
    selectedStudent.value = null
  }
}

// Computed properties
const totalPages = computed(() => Math.ceil(filteredEnrollments.value.length / itemsPerPage))

const filteredEnrollments = computed(() => {
  return enrollments.value.filter((enrollment) => {
    const matchesSearch = !searchQuery.value.trim() || [
      enrollment.student_name,
      enrollment.student_email,
      enrollment.course_title,
      enrollment.course_code
    ].some(field => field?.toLowerCase().includes(searchQuery.value.toLowerCase()))

    const matchesStatus = !filterStatus.value || enrollment.status === filterStatus.value
    const matchesCourse = !filterCourse.value || enrollment.course_id.toString() === filterCourse.value

    return matchesSearch && matchesStatus && matchesCourse
  })
})

const handleSearch = debounce(() => {
  currentPage.value = 1
}, 300)

const sortedEnrollments = computed(() => {
  return [...filteredEnrollments.value].sort((a, b) => {
    let comparison = 0

    switch (sortField.value) {
      case 'name':
        comparison = a.student_name.localeCompare(b.student_name)
        break
      case 'progress':
        comparison = a.progress - b.progress
        break
      case 'date':
        const dateA = new Date(a.enrolled_at || 0)
        const dateB = new Date(b.enrolled_at || 0)
        comparison = dateA - dateB
        break
    }

    return sortDirection.value === 'asc' ? comparison : -comparison
  })
})

const displayedEnrollments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return sortedEnrollments.value.slice(start, end)
})

// Chart initialization
const initializeCharts = () => {
  if (enrollmentTrendChart.value) {
    const ctx = enrollmentTrendChart.value.getContext('2d')
    trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: getLast7Days(),
        datasets: [{
          label: 'New Enrollments',
          data: getEnrollmentTrendData(),
          borderColor: '#087990',
          backgroundColor: 'rgba(8, 121, 144, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    })
  }

  if (statusChart.value) {
    const ctx = statusChart.value.getContext('2d')
    statusPieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pending', 'Approved', 'Completed', 'Declined'],
        datasets: [{
          data: [
            realtimeStats.value.pending,
            realtimeStats.value.approved,
            realtimeStats.value.completed,
            enrollments.value.filter(e => e.status === 'declined').length
          ],
          backgroundColor: [
            '#ffc107',
            '#28a745',
            '#17a2b8',
            '#dc3545'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    })
  }

  if (progressChart.value) {
    const ctx = progressChart.value.getContext('2d')
    progressBarChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['0-25%', '26-50%', '51-75%', '76-100%'],
        datasets: [{
          label: 'Students',
          data: getProgressDistribution(),
          backgroundColor: [
            '#dc3545',
            '#ffc107',
            '#fd7e14',
            '#28a745'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    })
  }
}

const updateCharts = () => {
  if (statusPieChart) {
    statusPieChart.data.datasets[0].data = [
      realtimeStats.value.pending,
      realtimeStats.value.approved,
      realtimeStats.value.completed,
      enrollments.value.filter(e => e.status === 'declined').length
    ]
    statusPieChart.update()
  }

  if (progressBarChart) {
    progressBarChart.data.datasets[0].data = getProgressDistribution()
    progressBarChart.update()
  }

  if (trendChart) {
    trendChart.data.datasets[0].data = getEnrollmentTrendData()
    trendChart.update()
  }
}

const getLast7Days = () => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  }
  return days
}

const getEnrollmentTrendData = () => {
  const trendData = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dayEnrollments = enrollments.value.filter(e => {
      const enrollDate = new Date(e.enrolled_at)
      return enrollDate.toDateString() === date.toDateString()
    }).length
    trendData.push(dayEnrollments)
  }
  return trendData
}

const getProgressDistribution = () => {
  const distribution = [0, 0, 0, 0]
  enrollments.value.forEach(e => {
    if (e.progress <= 25) distribution[0]++
    else if (e.progress <= 50) distribution[1]++
    else if (e.progress <= 75) distribution[2]++
    else distribution[3]++
  })
  return distribution
}

const startRealtimeUpdates = () => {
  setInterval(async () => {
    await updateRealtimeStats()
  }, 10000)
}

const updateRealtimeStats = async () => {
  const filtered = filteredEnrollments.value
  realtimeStats.value = {
    total: filtered.length,
    pending: filtered.filter(e => e.status === 'pending').length,
    approved: filtered.filter(e => e.status === 'approved').length,
    completed: filtered.filter(e => e.status === 'completed').length
  }
}

// Enrollment form methods
const toggleEnrollmentForm = () => {
  showEnrollmentForm.value = !showEnrollmentForm.value
  if (!showEnrollmentForm.value) {
    resetEnrollmentForm()
  }
}

const resetEnrollmentForm = () => {
  enrollmentFormData.value = {
    student: null,
    course: '',
    status: 'pending',
    notes: ''
  }
  enrollmentFormErrors.value = {}
  selectedStudent.value = null
}

const validateEnrollmentForm = () => {
  const errors = {}

  if (!enrollmentFormData.value.student) {
    errors.student = 'Please select a student'
  } else {
    if (!students.value.some(s => s.id === enrollmentFormData.value.student)) {
      errors.student = 'Selected student does not exist'
    }
  }

  if (!enrollmentFormData.value.course) {
    errors.course = 'Please select a course'
  } else {
    if (!availableCourses.value.some(c => c.id === enrollmentFormData.value.course)) {
      errors.course = 'Selected course does not exist. Please refresh the page.'
    }
  }

  enrollmentFormErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleEnrollmentSubmit = async () => {
  if (!validateEnrollmentForm()) return

  enrollmentFormSubmitting.value = true

  try {
    const enrollmentData = {
      student: enrollmentFormData.value.student,
      course: enrollmentFormData.value.course,
      status: enrollmentFormData.value.status,
      notes: enrollmentFormData.value.notes
    }

    const response = await axios.post(
      `${API_PREFIX}/enrollment-management/create-enrollment/`,
      enrollmentData
    )

    toast.success(response.data.message || 'Student enrolled successfully!')
    await fetchEnrollments()
    resetEnrollmentForm()
    showEnrollmentForm.value = false
  } catch (error) {
    console.error('Error creating enrollment:', error)

    if (error.response?.status === 400) {
      const errorData = error.response.data

      if (errorData.error) {
        toast.error(errorData.error)

        if (errorData.error.includes('does not exist')) {
          await fetchCourses()
        }
      } else if (errorData.non_field_errors) {
        toast.error(errorData.non_field_errors[0])
      } else {
        enrollmentFormErrors.value = errorData
        toast.error('Please fix the form errors')
      }
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please contact support.')
    } else {
      toast.error('Failed to enroll student. Please try again.')
    }
  } finally {
    enrollmentFormSubmitting.value = false
  }
}

const refreshAllData = async () => {
  try {
    loading.value = true
    await Promise.all([
      fetchEnrollments(),
      fetchCourses(),
      fetchStudents()
    ])
    toast.success('Data refreshed successfully')
  } catch (error) {
    console.error('Error refreshing data:', error)
    toast.error('Failed to refresh data')
  } finally {
    loading.value = false
  }
}

const cancelEnrollmentForm = () => {
  resetEnrollmentForm()
  showEnrollmentForm.value = false
}

// Existing methods
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'

  const dateObj = typeof dateString === 'string' ? new Date(dateString) : dateString

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const formatStatus = (status) => {
  const statusMap = {
    pending: 'Pending',
    approved: 'Approved',
    completed: 'Completed',
    declined: 'Declined'
  }
  return statusMap[status] || status
}

const getInitials = (name) => {
  if (!name) return ''
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getProgressClass = (progress) => {
  if (progress === 100) return 'complete'
  if (progress >= 75) return 'high'
  if (progress >= 50) return 'medium'
  if (progress >= 25) return 'low'
  return 'very-low'
}

const filterEnrollments = () => {
  currentPage.value = 1
  updateRealtimeStats()
}

const sortEnrollments = () => {
  const [field, direction] = sortOption.value.split('_')
  sortField.value = field
  sortDirection.value = direction
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedEnrollments.value = displayedEnrollments.value.map((enrollment) => enrollment.id)
  } else {
    selectedEnrollments.value = []
  }
}

const toggleAutoApproval = async () => {
  try {
    const response = await axios.post(`${API_PREFIX}/enrollment-management/auto-approval/`, {
      enabled: !autoApprovalEnabled.value
    })
    autoApprovalEnabled.value = response.data.enabled
    toast.success(`Auto-approval ${autoApprovalEnabled.value ? 'enabled' : 'disabled'}`)
  } catch (error) {
    console.error('Error toggling auto-approval:', error)
    toast.error('Failed to update auto-approval setting')
  }
}

const approveEnrollment = async (enrollment) => {
  try {
    await axios.post(`${API_PREFIX}/enrollment-management/enrollments/${enrollment.id}/approve/`)
    await fetchEnrollments()
    toast.success('Enrollment approved successfully')
    updateRealtimeStats()
  } catch (error) {
    console.error('Error approving enrollment:', error)
    toast.error('Failed to approve enrollment')
  }
}

const declineEnrollment = async (enrollment) => {
  if (!confirm(`Are you sure you want to decline ${enrollment.student_name}'s enrollment?`)) {
    return
  }

  try {
    await axios.post(`${API_PREFIX}/enrollment-management/enrollments/${enrollment.id}/decline/`)
    await fetchEnrollments()
    toast.success('Enrollment declined')
    updateRealtimeStats()
  } catch (error) {
    console.error('Error declining enrollment:', error)
    toast.error('Failed to decline enrollment')
  }
}

const markComplete = async (enrollment) => {
  try {
    await axios.post(`${API_PREFIX}/enrollment-management/enrollments/${enrollment.id}/complete/`)
    await fetchEnrollments()
    toast.success('Enrollment marked as complete')
    updateRealtimeStats()
  } catch (error) {
    console.error('Error marking enrollment complete:', error)
    toast.error('Failed to mark enrollment complete')
  }
}

const resetProgress = async (enrollment) => {
  if (!confirm(`Are you sure you want to reset ${enrollment.student_name}'s progress?`)) {
    return
  }

  try {
    await axios.post(`${API_PREFIX}/enrollment-management/enrollments/${enrollment.id}/reset/`)
    await fetchEnrollments()
    toast.success('Progress reset successfully')
    updateRealtimeStats()
  } catch (error) {
    console.error('Error resetting progress:', error)
    toast.error('Failed to reset progress')
  }
}

const viewStudentProgress = async (enrollment) => {
  try {
    loading.value = true
    const response = await axios.get(`${API_PREFIX}/enrollment-management/enrollments/${enrollment.id}/details/`)
    selectedEnrollmentDetails.value = response.data
    showProgressModal.value = true
  } catch (error) {
    console.error('Error fetching enrollment details:', error)
    toast.error('Failed to load enrollment details')
  } finally {
    loading.value = false
  }
}

const closeProgressModal = () => {
  showProgressModal.value = false
  selectedEnrollmentDetails.value = null
}

const applyBulkAction = async () => {
  if (!bulkAction.value || selectedEnrollments.value.length === 0) return

  if (
    ['decline', 'reset'].includes(bulkAction.value) &&
    !confirm(`Are you sure you want to ${bulkAction.value} ${selectedEnrollments.value.length} enrollments?`)
  ) {
    return
  }

  try {
    loading.value = true
    await axios.post(`${API_PREFIX}/enrollment-management/bulk-actions/`, {
      action: bulkAction.value,
      enrollment_ids: selectedEnrollments.value,
    })

    await fetchEnrollments()
    selectedEnrollments.value = []
    bulkAction.value = ''
    updateRealtimeStats()

    toast.success(`Bulk action completed successfully`)
  } catch (error) {
    console.error('Bulk action failed:', error)
    toast.error('Bulk action failed. Please try again.')
  } finally {
    loading.value = false
  }
}

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page

  document.querySelector('.table-responsive').scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

const fetchEnrollments = async () => {
  try {
    loading.value = true
    const response = await axios.get(`${API_PREFIX}/enrollment-management/enrollments/`)

    enrollments.value = response.data.map(enrollment => ({
      id: enrollment.id,
      student_id: enrollment.student_id,
      student_name: enrollment.student_name,
      student_email: enrollment.student_email,
      course_id: enrollment.course_id,
      course_title: enrollment.course_title,
      course_code: enrollment.course_code,
      status: enrollment.status,
      enrolled_at: enrollment.enrolled_at,
      completed_at: enrollment.completed_at,
      progress: enrollment.progress,
      exercises_completed: enrollment.exercises_completed,
      exercises_total: enrollment.exercises_total
    }))

    await updateRealtimeStats()

  } catch (error) {
    console.error('Error fetching enrollments:', error)
    toast.error('Failed to load enrollments')
    enrollments.value = []
  } finally {
    loading.value = false
  }
}

const fetchCourses = async () => {
  try {
    const response = await axios.get(`${API_PREFIX}/courses/`, {
      params: { is_active: true }
    })
    courses.value = response.data
    availableCourses.value = response.data
  } catch (error) {
    console.error('Error fetching courses:', error)
    toast.error('Failed to load courses')
    courses.value = []
    availableCourses.value = []
  }
}

const checkAutoApprovalStatus = async () => {
  try {
    const response = await axios.get(`${API_PREFIX}/enrollment-management/auto-approval/`)
    autoApprovalEnabled.value = response.data.enabled
  } catch (error) {
    console.error('Error checking auto-approval status:', error)
    autoApprovalEnabled.value = false
  }
}

watch(
  selectedEnrollments,
  (newVal) => {
    selectAll.value =
      newVal.length === displayedEnrollments.value.length && displayedEnrollments.value.length > 0
  },
  { deep: true },
)

watch(enrollments, (newVal) => {
  if (newVal.length > 0) {
    console.log('First enrollment structure:', newVal[0])
  }
}, { immediate: true })
</script>

<style scoped>
.live-stat-card {
    background: linear-gradient(135deg, #ffffff 0%, #f9fbfd 100%);
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1.2rem;
    border: 1px solid #e6f0fa;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1);
    position: relative;
    overflow: hidden;
    box-shadow: 0 6px 15px rgba(8, 121, 144, 0.08);
}

.live-stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 25px rgba(8, 121, 144, 0.15);
}

.live-stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--primary-color, #087990);
    z-index: 1;
}

.live-stat-card.pending::before { background: linear-gradient(90deg, #ffc107 0%, #ffcd39 100%); }
.live-stat-card.approved::before { background: linear-gradient(90deg, #28a745 0%, #3dd35b 100%); }
.live-stat-card.completed::before { background: linear-gradient(90deg, #17a2b8 0%, #2dc9e0 100%); }
.live-stat-card.total::before { background: linear-gradient(90deg, #087990 0%, #0a9cb8 100%); }

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    z-index: 2;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.live-stat-card.pending .stat-icon {
    background: linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 221, 124, 0.15) 100%);
    color: #ffc107;
}

.live-stat-card.approved .stat-icon {
    background: linear-gradient(135deg, rgba(40, 167, 69, 0.15) 0%, rgba(100, 223, 132, 0.15) 100%);
    color: #28a745;
}

.live-stat-card.completed .stat-icon {
    background: linear-gradient(135deg, rgba(23, 162, 184, 0.15) 0%, rgba(104, 223, 245, 0.15) 100%);
    color: #17a2b8;
}

.live-stat-card.total .stat-icon {
    background: linear-gradient(135deg, rgba(8, 121, 144, 0.15) 0%, rgba(18, 165, 194, 0.15) 100%);
    color: #087990;
}

.stat-content h4 {
    font-size: 2.2rem;
    font-weight: 700;
    margin: 0 0 0.25rem 0;
    background: linear-gradient(90deg, #2c3e50 0%, #4a6582 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
}

.compact-chart-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.compact-chart-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 1rem;
  height: 180px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid #edf2f9;
}

.compact-chart-card h4 {
  font-size: 0.95rem;
  margin-bottom: 0.75rem;
  color: #4a6582;
}

/* Compact stats grid */
.compact-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.compact-stat-card {
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
  border: 1px solid #e6f0fa;
  height: 80px;
  transition: all 0.3s ease;
}

.compact-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
}

.compact-stat-card .stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}

.compact-stat-card.pending .stat-icon {
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
}

.compact-stat-card.approved .stat-icon {
  background: rgba(40, 167, 69, 0.15);
  color: #28a745;
}

.compact-stat-card.completed .stat-icon {
  background: rgba(23, 162, 184, 0.15);
  color: #17a2b8;
}

.compact-stat-card.total .stat-icon {
  background: rgba(8, 121, 144, 0.15);
  color: #087990;
}

.compact-stat-card .stat-content h4 {
  font-size: 1.3rem;
  margin: 0;
  font-weight: 700;
}

.compact-stat-card .stat-content p {
  font-size: 0.85rem;
  color: #6c757d;
  margin: 0;
}

.stat-content p {
    color: #6c757d;
    font-size: 0.95rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
}

.trend {
    font-size: 0.85rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(4px);
}

/* Chart Enhancements */
.chart-container {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 1.8rem;
    margin-bottom: 2.5rem;
}

.chart-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 1.5rem;
    height: 280px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 8px 25px rgba(140, 152, 164, 0.1);
    border: 1px solid #edf2f9;
    transition: all 0.4s ease;
}

.chart-card:hover {
    box-shadow: 0 12px 30px rgba(140, 152, 164, 0.15);
    transform: translateY(-3px);
}

.chart-card h4 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    color: #2c3e50;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.chart-card h4::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary-color, #087990);
}

.enrollment-trend h4::before { background: #4e73df; }
.status-distribution h4::before { background: #1cc88a; }
.progress-overview h4::before { background: #36b9cc; }

/* Form Styling Continuation */
.form-header {
    padding: 1.8rem 2rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #f1f7fd 100%);
    border-bottom: 1px solid #eaeff5;
}

.form-header h4 {
    font-size: 1.4rem;
    margin-bottom: 0.5rem;
    font-weight: 700;
    color: #2c3e50;
}

.form-header p {
    color: #6c757d;
    font-size: 1rem;
    max-width: 600px;
    line-height: 1.6;
}

.enrollment-form {
    padding: 2rem;
    background: #ffffff;
}

.form-row {
    display: flex;
    flex-wrap: wrap;
    gap: 1.8rem;
    margin-bottom: 2rem;
}

.form-group {
    flex: 1 1 300px;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
}

.form-group label {
    font-weight: 600;
    color: #4a6582;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.form-group label i {
    color: #6c757d;
    font-size: 0.9rem;
}

.student-search-container {
    position: relative;
}

.student-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #eaeff5;
    border-top: none;
    border-radius: 0 0 12px 12px;
    max-height: 250px;
    overflow-y: auto;
    z-index: 100;
    box-shadow: 0 10px 25px rgba(140, 152, 164, 0.15);
}

.student-option {
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid #f1f5f9;
}

.student-option:last-child {
    border-bottom: none;
}

.student-option:hover {
    background: #f8fbfe;
}

/* Status Options Styling */
.status-options {
    display: flex;
    gap: 1.2rem;
    flex-wrap: wrap;
}

.status-option {
    flex: 1;
    min-width: 160px;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border: 2px solid #eaeff5;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: #ffffff;
}

.status-option.active {
    border-color: #087990;
    background: rgba(8, 121, 144, 0.05);
    box-shadow: 0 5px 15px rgba(8, 121, 144, 0.1);
}

.status-option input {
    margin: 0;
    width: 18px;
    height: 18px;
}

/* Selected Student Preview */
.selected-student-preview {
    background: linear-gradient(135deg, #f8fbfe 0%, #f0f7ff 100%);
    border-radius: 16px;
    padding: 1.8rem;
    margin-bottom: 2rem;
    border: 1px solid #e6f0fa;
}

.selected-student-preview h5 {
    margin: 0 0 1.2rem 0;
    font-weight: 700;
    color: #2c3e50;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.student-preview {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.student-info h3 {
    margin: 0 0 0.4rem 0;
    font-size: 1.5rem;
    font-weight: 700;
    color: #2c3e50;
}

.student-info p {
    margin: 0 0 1rem 0;
    color: #6c757d;
}

.student-stats {
    display: flex;
    gap: 1.8rem;
}

.student-stats .stat {
    font-size: 0.9rem;
    color: #4a6582;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
}

.student-stats .stat i {
    color: #087990;
    font-size: 1.1rem;
}

/* Form Actions Enhancement */
.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1.2rem;
    margin-top: 1.5rem;
    padding-top: 2rem;
    border-top: 1px solid #eaeff5;
}

.submit-btn, .cancel-btn {
    padding: 0.9rem 2rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border: none;
}

.submit-btn {
    background: linear-gradient(135deg, #087990 0%, #0a9cb8 100%);
    color: white;
    box-shadow: 0 5px 15px rgba(8, 121, 144, 0.3);
}

.submit-btn:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(8, 121, 144, 0.4);
}

.submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.cancel-btn {
    background: #ffffff;
    color: #6c757d;
    border: 1px solid #eaeff5;
}

.cancel-btn:hover {
    background: #f8fbfe;
    border-color: #d1e0f0;
}

/* Enrollment Table Enhancements */
.enrollment-list-container {
    background: #ffffff;
    border-radius: 18px;
    box-shadow: 0 10px 30px rgba(140, 152, 164, 0.1);
    padding: 2rem;
    border: 1px solid #edf2f9;
    overflow: hidden;
    position: relative;  /* CRITICAL for overlay positioning */
    min-height: 400px;
}

.bulk-actions {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 1.2rem;
    margin-bottom: 1.8rem;
    padding: 1.2rem 1.8rem;
    background: linear-gradient(135deg, #f8fbfe 0%, #f1f7fd 100%);
    border-radius: 14px;
    border: 1px solid #e6f0fa;
    animation: slideIn 0.5s ease-out;
}

.bulk-actions-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.selected-count {
  font-size: 0.875rem;
  color: #666;
}

@media (min-width: 768px) {
  .bulk-actions {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }

  .bulk-actions-row {
    display: flex;
    gap: 0.5rem;
  }
}

/* Mobile optimization */
@media (max-width: 768px) {
  .bulk-actions-row {
    width: 100%;
  }

  .bulk-select,
  .apply-bulk-btn {
    flex: 1;
    min-width: 0;
  }

  .selected-count {
    font-size: 0.8rem;
  }

  /* .compact-stats-grid{
    display:grid;
  } */
}

@keyframes slideIn {
    from {
        transform: translateY(-20px);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.bulk-select {
    padding: 0.8rem 1.2rem;
    border: 1px solid #eaeff5;
    border-radius: 12px;
    min-width: 180px;
    background: white;
    font-weight: 500;
    box-shadow: 0 3px 10px rgba(140, 152, 164, 0.08);
}

.apply-bulk-btn {
    background: linear-gradient(135deg, #087990 0%, #0a9cb8 100%);
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 12px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 5px 15px rgba(8, 121, 144, 0.2);
}

.apply-bulk-btn:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(8, 121, 144, 0.3);
}

.apply-bulk-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.selected-count {
    margin-left: auto;
    font-size: 0.95rem;
    color: #4a6582;
    font-weight: 600;
    padding: 0.6rem 1.2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 3px 10px rgba(140, 152, 164, 0.08);
}

.no-enrollments {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.8rem;
    padding: 4rem 2rem;
    text-align: center;
}

.no-enrollments i {
    font-size: 4.5rem;
    color: #d1e0f0;
}

.no-enrollments p {
    font-size: 1.2rem;
    color: #6c757d;
    max-width: 500px;
    line-height: 1.6;
}

/* Table Styling Enhancements */
.enrollment-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    table-layout: auto;
}

.enrollment-table tbody tr:hover td {
    background: #f8fbfe;
}

.enrollment-table tbody tr.pending:hover td {
    background: rgba(255, 193, 7, 0.03);
}

.enrollment-table tbody tr.approved:hover td {
    background: rgba(40, 167, 69, 0.03);
}

.enrollment-table tbody tr.completed:hover td {
    background: rgba(23, 162, 184, 0.03);
}

.enrollment-table tbody tr.declined:hover td {
    background: rgba(220, 53, 69, 0.03);
}

.student-info {
    display: flex;
    align-items: center;
}

.student-name {
    font-weight: 600;
    color: #2c3e50;
    font-size: 1.05rem;
}

.student-email {
    color: #6c757d;
    font-size: 0.9rem;
}

.course-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.course-title {
    font-weight: 600;
    color: #2c3e50;
    font-size: 1.05rem;
}

.course-code {
    color: #6c757d;
    font-size: 0.9rem;
}

.progress-container {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.progress-bar {
    flex: 1;
    height: 10px;
    background: #edf2f9;
    border-radius: 5px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    border-radius: 5px;
    transition: width 0.8s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.progress-fill.very-low { background: linear-gradient(90deg, #e74a3b 0%, #ee6d60 100%); }
.progress-fill.low { background: linear-gradient(90deg, #fd7e14 0%, #ff9c4a 100%); }
.progress-fill.medium { background: linear-gradient(90deg, #f6c23e 0%, #f9d270 100%); }
.progress-fill.high { background: linear-gradient(90deg, #1cc88a 0%, #3dd5a7 100%); }
.progress-fill.complete { background: linear-gradient(90deg, #36b9cc 0%, #5fd2e4 100%); }

.progress-text {
    font-size: 0.9rem;
    font-weight: 600;
    min-width: 25px;
    text-align: right;
    color: #4a6582;
}

.exercise-stats .completed {
    color: #28a745;
}

.enrollment-status {
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    display: inline-block;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    min-width: 100px;
    text-align: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.enrollment-status.pending {
    background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
    color: #856404;
}

.enrollment-status.approved {
    background: linear-gradient(135deg, #d1e7dd 0%, #b7e5c7 100%);
    color: #0f5132;
}

.enrollment-status.completed {
    background: linear-gradient(135deg, #cce7ff 0%, #a6d5fa 100%);
    color: #055160;
}

.enrollment-status.declined {
    background: linear-gradient(135deg, #f8d7da 0%, #f1aab1 100%);
    color: #721c24;
}

.enrollment-actions {
    display: flex;
    justify-content: center;
    gap: 0.4rem;
    flex-wrap: wrap;
}

.action-btn {
    width: 32px;
    height: 32px;
    border-radius: 10px;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    background: #f8fbfe;
    color: #6c757d;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    border: 1px solid #eaeff5;
    font-size: 1rem;
}

.action-btn:hover {
    transform: translateY(-3px) scale(1.1);
    box-shadow: 0 5px 12px rgba(0,0,0,0.1);
}

.view-btn:hover {
    background: linear-gradient(135deg, #36b9cc 0%, #5fd2e4 100%);
    color: white;
    border-color: #36b9cc;
}

.approve-btn:hover {
    background: linear-gradient(135deg, #1cc88a 0%, #3dd5a7 100%);
    color: white;
    border-color: #1cc88a;
}

.decline-btn:hover {
    background: linear-gradient(135deg, #e74a3b 0%, #ee6d60 100%);
    color: white;
    border-color: #e74a3b;
}

.complete-btn:hover {
    background: linear-gradient(135deg, #4e73df 0%, #6e8bef 100%);
    color: white;
    border-color: #4e73df;
}

.reset-btn:hover {
    background: linear-gradient(135deg, #6f42c1 0%, #8d6bd9 100%);
    color: white;
    border-color: #6f42c1;
}

/* Pagination Styling */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1.5rem;
  gap: 1rem;
}

.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  background:
    linear-gradient(to right, white 30%, rgba(255,255,255,0)),
    linear-gradient(to right, rgba(255,255,255,0), white 70%) 100% 0,
    radial-gradient(farthest-side at 0% 50%, rgba(0,0,0,0.2), rgba(0,0,0,0)),
    radial-gradient(farthest-side at 100% 50%, rgba(0,0,0,0.2), rgba(0,0,0,0));
  background-repeat: no-repeat;
  background-size: 40px 100%, 40px 100%, 14px 100%, 14px 100%;
  background-position: 0 0, 100% 0, 0 0, 100% 0;
  background-attachment: local, local, scroll, scroll;
}

.page-btn {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: 1px solid #eaeff5;
    color: #4a6582;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 600;
    box-shadow: 0 3px 8px rgba(140, 152, 164, 0.1);
}

.page-btn:hover {
    background: #f8fbfe;
    border-color: #d1e0f0;
    color: #087990;
}

.page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.page-info {
    padding: 0.5rem 1.5rem;
    background: #f8fbfe;
    border-radius: 12px;
    font-weight: 500;
    color: #4a6582;
}

/* Progress Modal Styling */
.modal-overlay {
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(8px);
}

.progress-modal {
    max-width: 800px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
}

.modal-header {
    padding: 1.5rem 2rem;
    background: linear-gradient(135deg, #f8fbfe 0%, #f1f7fd 100%);
    border-bottom: 1px solid #eaeff5;
}

.modal-header h4 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #2c3e50;
}

.close-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    color: #6c757d;
    transition: all 0.3s ease;
    border: 1px solid #eaeff5;
}

.close-btn:hover {
    background: #f8fbfe;
    color: #e74a3b;
    transform: rotate(90deg);
}

.modal-body {
    padding: 2.5rem;
    max-height: 70vh;
    overflow-y: auto;
}

.student-header {
    display: flex;
    align-items: center;
    gap: 1.8rem;
    margin-bottom: 2.5rem;
    padding: 1.8rem;
    background: linear-gradient(135deg, #f8fbfe 0%, #f1f7fd 100%);
    border-radius: 18px;
    border: 1px solid #e6f0fa;
}

.student-details h3 {
    font-size: 1.6rem;
    margin-bottom: 0.5rem;
}

.progress-overview {
    margin-bottom: 2.5rem;
}

.progress-stat {
    margin-bottom: 1.5rem;
}

.progress-stat .label {
    font-size: 1.1rem;
    font-weight: 600;
    color: #4a6582;
    margin-bottom: 0.8rem;
}

.progress-bar.large {
    height: 18px;
    border-radius: 9px;
}

.progress-stat .percentage {
    font-size: 0.5rem;
    font-weight: 800;
    color: #087990;
    text-align: center;
    margin-top: 1rem;
    background: linear-gradient(90deg, #087990 0%, #0a9cb8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.exercises-breakdown h5 {
    font-size: 1.3rem;
    font-weight: 700;
    color: #2c3e50;
    margin-bottom: 1.5rem;
    padding-bottom: 0.8rem;
    border-bottom: 2px solid #eaeff5;
}

.exercise-item {
    padding: 1.5rem;
    border-radius: 16px;
    margin-bottom: 1.2rem;
    border: 1px solid #eaeff5;
    transition: all 0.3s ease;
}

.exercise-item:hover {
    border-color: #d1e0f0;
    box-shadow: 0 5px 15px rgba(140, 152, 164, 0.1);
}

.exercise-item.completed {
    background: linear-gradient(135deg, rgba(28, 200, 138, 0.03) 0%, rgba(100, 223, 132, 0.03) 100%);
    border-color: rgba(28, 200, 138, 0.2);
}

.exercise-icon {
    font-size: 1.4rem;
    color: #36b9cc;
}

.exercise-item.completed .exercise-icon {
    color: #1cc88a;
}

.exercise-info h6 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    color: #2c3e50;
}

.exercise-score .score {
    font-size: 1.3rem;
    font-weight: 700;
    color: #087990;
}
/* Base styles */
.enrollment-management {
  max-width: 100%;
  margin: 0 auto;
  font-family: var(--font-base, 'Inter', sans-serif);
}

.header-section {
  margin-bottom: 2rem;
  position: relative;
  min-height: 200px;
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

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 40px;
  height: 3px;
  background: var(--primary-color, #087990);
}

.section-description {
  color: var(--text-secondary, #6c757d);
  margin-bottom: 1.5rem;
}

/* Real-time dashboard styles */
.stats-dashboard {
  background: var(--card-bg, white);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color, #e9ecef);
  margin-bottom: 2rem;
}

.chart-container {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.chart-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  height: 200px;
  position: relative;
}

.chart-card h4 {
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.chart-card canvas {
  width: 100% !important;
  height: calc(100% - 40px) !important;
}

.live-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.live-stat-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid var(--border-color, #e9ecef);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.live-stat-card.pulse {
  animation: pulse 1s ease-in-out;
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(8, 121, 144, 0.15);
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.live-stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent-color, #087990);
}

.live-stat-card.pending::before { background: #ffc107; }
.live-stat-card.approved::before { background: #28a745; }
.live-stat-card.completed::before { background: #17a2b8; }

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.live-stat-card.pending .stat-icon {
  background: rgba(255, 193, 7, 0.1);
  color: #ffc107;
}

.live-stat-card.approved .stat-icon {
  background: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.live-stat-card.completed .stat-icon {
  background: rgba(23, 162, 184, 0.1);
  color: #17a2b8;
}

.live-stat-card.total .stat-icon {
  background: rgba(8, 121, 144, 0.1);
  color: #087990;
}

.stat-content {
  flex: 1;
  position: relative;
}

.stat-content h4 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  color: var(--text-color);
}

.stat-content p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
}

.trend {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.mini-chart {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 60px;
  height: 30px;
}

/* Controls */
.controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
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
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color, #087990);
  box-shadow: 0 0 0 3px rgba(8, 121, 144, 0.1);
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 6px;
  background: white;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color, #087990);
  box-shadow: 0 0 0 3px rgba(8, 121, 144, 0.1);
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-top: -1rem ;
  margin-bottom: -1rem;
}

.add-enrollment-btn,
.auto-approval-btn {
  background: var(--primary-color, #087990);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  white-space: nowrap;
}

.add-enrollment-btn:hover,
.auto-approval-btn:hover {
  background: #065e6f;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(8, 121, 144, 0.3);
}

.add-enrollment-btn.active {
  background: #dc3545;
}

.add-enrollment-btn.active:hover {
  background: #bb2d3b;
}

.auto-approval-btn.active {
  background: #28a745;
}

.auto-approval-btn.active:hover {
  background: #1e7e34;
}

/* Enrollment form styles */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.enrollment-form-container {
  margin-bottom: 2rem;
  background: var(--card-bg, white);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  border: 1px solid var(--border-color, #dee2e6);
  margin-top: 1.5rem;
}

.form-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color, #dee2e6);
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
}

.form-header h4 {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.form-header p {
  color: #6c757d;
  font-size: 0.9rem;
  margin: 0;
}

.enrollment-form {
  padding: 2rem;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
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
  font-weight: 600;
  color: var(--text-color, #333);
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 6px;
  width: 100%;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color, #087990);
  box-shadow: 0 0 0 3px rgba(8, 121, 144, 0.1);
}

.form-group input.error,
.form-group select.error,
.form-group textarea.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.8rem;
  font-weight: 500;
}

/* Student search styles */
.student-search-container {
  position: relative;
}

.student-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid var(--border-color, #dee2e6);
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.student-option {
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.student-option:hover {
  background: #f8f9fa;
}

.student-details {
  flex: 1;
}

.student-details strong {
  display: block;
  font-weight: 600;
  color: var(--text-color);
}

.student-details span {
  font-size: 0.85rem;
  color: #6c757d;
}

/* Status options */
.status-options {
  display: flex;
  gap: 1rem;
}

.status-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border: 2px solid var(--border-color, #dee2e6);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.status-option input {
  margin: 0;
}

.status-option.active {
  border-color: var(--primary-color, #087990);
  background: rgba(8, 121, 144, 0.05);
}

/* Selected student preview */
.selected-student-preview {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.selected-student-preview h5 {
  margin: 0 0 1rem 0;
  font-weight: 600;
  color: var(--text-color);
}

.student-preview {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.student-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mobile-only {
  display: none;
}

.student-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
}

.student-info p {
  margin: 0 0 0.5rem 0;
  color: #6c757d;
}

.student-stats {
  display: flex;
  gap: 1rem;
}

.student-stats .stat {
  font-size: 0.8rem;
  color: #6c757d;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

/* Form actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color, #e9ecef);
}

.submit-btn {
  background: var(--primary-color, #087990);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.submit-btn:hover:not(:disabled) {
  background: #065e6f;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(8, 121, 144, 0.3);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.cancel-btn {
  background: #6c757d;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

/* Table and existing styles remain the same but with enhanced visual appeal */
/* Continuing from enrollment-list-container */
.enrollment-list-container {
  position: relative;
  background: var(--card-bg, white);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color, #dee2e6);
  padding: 2rem;
  min-height: 400px;
}

/* Bulk actions */
.bulk-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border: 1px solid #e9ecef;
  animation: slideInDown 0.3s ease-out;
}

@keyframes slideInDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.bulk-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 6px;
  min-width: 150px;
  background: white;
  font-weight: 500;
  transition: all 0.3s ease;
}

.bulk-select:focus {
  outline: none;
  border-color: var(--primary-color, #087990);
  box-shadow: 0 0 0 3px rgba(8, 121, 144, 0.1);
}

.apply-bulk-btn {
  background: var(--primary-color, #087990);
  color: white;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.apply-bulk-btn:hover:not(:disabled) {
  background: #065e6f;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(8, 121, 144, 0.3);
}

.apply-bulk-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.selected-count {
  margin-left: auto;
  font-size: 0.9rem;
  color: #495057;
  font-weight: 600;
  padding: 0.5rem 1rem;
  background: rgba(8, 121, 144, 0.1);
  border-radius: 20px;
}

/* No enrollments message */
.no-enrollments {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 4rem 2rem;
  color: #6c757d;
  text-align: center;
}

.no-enrollments i {
  font-size: 4rem;
  opacity: 0.4;
  color: var(--primary-color, #087990);
}

.no-enrollments p {
  font-size: 1.1rem;
  font-weight: 500;
  max-width: 400px;
  line-height: 1.5;
}

/* Table styles */
.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, #dee2e6);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(3px);
  z-index: 20;
  border-radius: 12px;
}

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
}

.loader i {
  font-size: 2rem;
  color: var(--primary-color, #087990);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loader span {
  color: #495057;
  font-weight: 500;
  font-size: 1.1rem;
}

.enrollment-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  min-width: 1000px;
}

.enrollment-table thead {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color:#495057 !important;
}

.enrollment-table th:hover {
  background-color: #f8f9fa !important;
}



.enrollment-table tbody tr {
  transition: all 0.3s ease;
  position: relative;
  height: 40px;
}

.enrollment-table tbody tr::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: transparent;
  transition: all 0.3s ease;
}

.enrollment-table tbody tr:hover {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.enrollment-table tbody tr:hover::before {
  background: var(--primary-color, #087990);
}

.enrollment-table tr.pending::before {
  background: #ffc107;
}

.enrollment-table tr.approved::before {
  background: #28a745;
}

.enrollment-table tr.completed::before {
  background: #17a2b8;
}

.enrollment-table tr.declined::before {
  background: #dc3545;
}

.enrollment-table tr.selected {
  background: rgba(8, 121, 144, 0.05);
  box-shadow: inset 0 0 0 2px rgba(8, 121, 144, 0.2);
}

.student-column { min-width: 180px; }
.course-column  { min-width: 180px; }
.progress-column { min-width: 120px; }
.exercises-column { min-width: 80px; }
.status-column  { min-width: 100px; }
.date-column    { min-width: 100px; }
.actions-column { min-width: 150px; }

/* Student info styles */
.student-info {
  display: flex;
  align-items: start !important;
}

.details {
  flex: 1;
  min-width: 0;
}

.student-name {
  font-size: 0.7rem !important;
  margin-bottom: 0.1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: var(--text-color, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-email {
  font-size: 0.5rem;
  color: #6c757d;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Course info styles */
.course-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.course-title {
  font-size: 0.7rem;
  font-weight: 600;
  margin-bottom: 0.1rem;
  color: var(--text-color, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-code {
  font-size: 0.5rem;
  color: #6c757d;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Progress bar styles */
.progress-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg,
    rgba(255,255,255,0.2) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255,255,255,0.2) 50%,
    rgba(255,255,255,0.2) 75%,
    transparent 75%
  );
  background-size: 10px 10px;
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  from { background-position: 0 0; }
  to { background-position: 10px 0; }
}

.progress-fill.very-low {
  background: linear-gradient(90deg, #dc3545 0%, #e55a5a 100%);
}

.progress-fill.low {
  background: linear-gradient(90deg, #fd7e14 0%, #ff922b 100%);
}

.progress-fill.medium {
  background: linear-gradient(90deg, #ffc107 0%, #ffcd3a 100%);
}

.progress-fill.high {
  background: linear-gradient(90deg, #20c997 0%, #3dd5a7 100%);
}

.progress-fill.complete {
  background: linear-gradient(90deg, #28a745 0%, #34ce57 100%);
}

.progress-text {
  font-size: 0.8rem;
  font-weight: 600;
  color: #495057;
  min-width: 35px;
  text-align: left;
}

.exercise-stats {
    display: flex;
    margin-left:1rem;
    gap: 0.3rem;
    font-weight: 600;
    font-size: 0.8rem;
}


.exercise-stats .completed {
  color: #28a745;
}

.exercise-stats .separator {
  color: #6c757d;
}

.exercise-stats .total {
  color: #495057;
}

/* Status badges */
.enrollment-status {
  font-size: 0.6rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 20px;
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  text-align: center;
  min-width: 70px;
  transition: all 0.3s ease;
}

.enrollment-status.pending {
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  color: #856404;
  border: 1px solid #ffeaa7;
}

.enrollment-status.approved {
  background: linear-gradient(135deg, #d1e7dd 0%, #b7e5c7 100%);
  color: #0f5132;
  border: 1px solid #b7e5c7;
}

.enrollment-status.completed {
  background: linear-gradient(135deg, #cce7ff 0%, #a6d5fa 100%);
  color: #055160;
  border: 1px solid #a6d5fa;
}

.enrollment-status.declined {
  background: linear-gradient(135deg, #f8d7da 0%, #f1aab1 100%);
  color: #721c24;
  border: 1px solid #f1aab1;
}

.action-btn {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.7rem;
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: all 0.3s ease;
}

.action-btn:hover::before {
  width: 100%;
  height: 100%;
}

.view-btn {
  color: #6c757d;
  border-color: #e9ecef;
}

.view-btn:hover {
  background: #17a2b8;
  color: white;
  border-color: #17a2b8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
}

.approve-btn {
  color: #28a745;
  border-color: rgba(40, 167, 69, 0.3);
}

.approve-btn:hover {
  background: #28a745;
  color: white;
  border-color: #28a745;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
}

.decline-btn {
  color: #dc3545;
  border-color: rgba(220, 53, 69, 0.3);
}

.decline-btn:hover {
  background: #dc3545;
  color: white;
  border-color: #dc3545;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
}

.complete-btn {
  color: #17a2b8;
  border-color: rgba(23, 162, 184, 0.3);
}

.complete-btn:hover {
  background: #17a2b8;
  color: white;
  border-color: #17a2b8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3);
}

.reset-btn {
  color: #fd7e14;
  border-color: rgba(253, 126, 20, 0.3);
}

.reset-btn:hover {
  background: #fd7e14;
  color: white;
  border-color: #fd7e14;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(253, 126, 20, 0.3);
}

/* Checkbox styles */
.enrollment-checkbox {
  position: relative;
  display: inline-block;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.enrollment-checkbox input {
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
  background: #f8f9fa;
  border: 2px solid #e9ecef;
  border-radius: 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.enrollment-checkbox:hover .checkmark {
  background: #e9ecef;
  border-color: var(--primary-color, #087990);
  transform: scale(1.05);
}

.enrollment-checkbox input:checked ~ .checkmark {
  background: var(--primary-color, #087990);
  border-color: var(--primary-color, #087990);
  transform: scale(1.1);
}

.checkmark:after {
  content: '';
  position: absolute;
  display: none;
}

.enrollment-checkbox input:checked ~ .checkmark:after {
  display: block;
  left: 6px;
  top: 2px;
  width: 6px;
  height: 12px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Pagination styles */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
  gap: 1rem;
}

.page-btn {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #495057;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  height: 44px;
}

.page-btn:hover:not(:disabled) {
  background: var(--primary-color, #087990);
  border-color: var(--primary-color, #087990);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(8, 121, 144, 0.3);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f8f9fa;
  color: #6c757d;
}

.page-info {
  font-size: 0.95rem;
  color: #495057;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}

/* Progress Modal styles */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.progress-modal {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    transform: translateY(-20px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h4 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #343a40;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  padding: 0.25rem;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f8f9fa;
  color: #495057;
  transform: rotate(90deg);
}

.modal-body {
  padding: 2rem;
  max-height: 60vh;
  overflow-y: auto;
}

.student-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
}

.student-header {
  width: 28px;
  height: 28px;
  font-size: 0.7rem;
}

.student-header .student-details h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.2rem;
  font-weight: 700;
}

.student-header .student-details p {
  margin: 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.progress-overview {
  margin-bottom: 2rem;
}

.progress-stat {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.progress-stat .label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #495057;
}

.progress-bar.large {
  height: 16px;
  border-radius: 8px;
}

.progress-stat .percentage {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color, #087990);
  text-align: center;
}

.enrollment-table th,
.enrollment-table td {
  padding: 1rem 0.6rem;
  text-align: left;
  vertical-align: middle;
  border-bottom: 1px solid #e9ecef;
  white-space: nowrap;
}

.enrollment-table th.select-column,
.enrollment-table td.select-column {
  width: 50px;
  min-width: 50px;
  max-width: 50px;
  padding: 1rem 0.75rem;
}

.exercises-breakdown h5 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #343a40;
}

.exercise-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.exercise-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.exercise-item:hover {
  background: #f8f9fa;
  border-color: #dee2e6;
}

.exercise-item.completed {
  background: rgba(40, 167, 69, 0.05);
  border-color: rgba(40, 167, 69, 0.2);
}

.exercise-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.exercise-item.completed .exercise-icon {
  color: #28a745;
}

.exercise-item:not(.completed) .exercise-icon {
  color: #6c757d;
}

.exercise-info {
  flex: 1;
}

.exercise-info h6 {
  margin: 0 0 0.25rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #343a40;
}

.exercise-info p {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  color: #6c757d;
  line-height: 1.4;
}

.completion-date {
  font-size: 0.8rem;
  color: #28a745;
  font-weight: 500;
}

.exercise-score {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  text-align: center;
}

.exercise-score .score {
  font-size: 1rem;
  font-weight: 700;
  color: var(--primary-color, #087990);
  padding: 0.25rem 0.5rem;
  background: rgba(8, 121, 144, 0.1);
  border-radius: 4px;
}

/* Mobile responsive styles */
@media (max-width: 768px) {
  .stats-dashboard {
    padding: 1rem;
  }

  .enrollment-table td{
    text-align: start !important;
  }

  .enrollment-table th{
    text-align: start !important;
  }

  .mobile-only {
    display: inline-block;
  }

  .student-info {
    gap: 0.75rem;
  }

  .chart-container {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .chart-card {
    height: 150px;
  }

  .live-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .live-stat-card {
    padding: 1rem;
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }

  .controls {
    gap: 0.75rem;
  }

  .search-filter {
    gap: 0.5rem;
  }

  .action-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }

  .action-buttons button {
    width: 100%;
    justify-content: center;
  }

  .enrollment-form {
    padding: 1rem;
  }

  .form-row {
    flex-direction: column;
    gap: 1rem;
  }

  .table-responsive {
    margin: 0 -1rem;
    width: calc(100% + 2rem);
    border-left: none;
    border-right: none;
    border-radius: 0;
    padding-left: 1rem !important;
  }

  .enrollment-list-container {
    padding: 1rem;
    border-radius: 0;
    margin: 0 -1rem;
    width: calc(100% + 2rem);
  }

  .enrollment-table {
    min-width: 900px;
  }

  .enrollment-table th,
  .enrollment-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
    text-align: start !important;
  }

  .action-btn {
    width: 28px !important;
    height: 28px !important;
  }

  .enrollment-table tbody tr::before {
  display:none !important;
}
}

@media (min-width: 992px) {
  .enrollment-table {
    min-width: 100%; /* Allow table to expand fully on large devices */
    width: 100%;
  }
}
</style>