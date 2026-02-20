<template>
  <div class="dashboard-section">
    <div class="header-section">
      <h3 class="section-title">Revenue Analytics</h3>
      <div class="section-description">
        Monitor and manage revenue, commissions, and financial reports in real-time.
      </div>

      <!-- Real-time Statistics Cards -->
      <div class="revenue-dashboard" style="position: relative;">
        <div v-if="loading" class="loading-overlay">
          <div class="loader">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading revenue stats...</span>
          </div>
        </div>
        <!-- Compact Charts Section -->
        <div class="compact-charts-grid">
          <div class="compact-chart-card">
            <h4>Revenue Overview</h4>
            <canvas id="revenueChart" ref="revenueChart" height="100"></canvas>
          </div>
          <div class="compact-chart-card">
            <h4>Revenue Distribution</h4>
            <canvas id="distributionChart" ref="distributionChart" height="100"></canvas>
          </div>
          <div class="compact-chart-card">
            <h4>Transactions by Status</h4>
            <canvas id="statusChart" ref="statusChart" height="100"></canvas>
          </div>
          <div class="compact-chart-card">
            <h4>Currency Breakdown</h4>
            <canvas id="currencyChart" ref="currencyChart" height="100"></canvas>
          </div>
        </div>

        <!-- Compact Stats Cards -->
        <div class="compact-stats-grid">
          <div class="compact-stat-card total">
            <div class="stat-icon">
              <i class="fas fa-money-bill-wave"></i>
            </div>
            <div class="stat-content">
              <h4>{{ formatCurrency(revenueSummary.total_revenue || 0) }}</h4>
              <p>Total Revenue</p>
              <span class="trend positive">+{{ revenueGrowth }}%</span>
            </div>
          </div>
          <div class="compact-stat-card approved">
            <div class="stat-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-content">
              <h4>{{ formatCurrency(revenueSummary.teacher_payouts || 0) }}</h4>
              <p>Teacher Payouts</p>
              <span class="trend">70% of sales</span>
            </div>
          </div>
          <div class="compact-stat-card completed">
            <div class="stat-icon">
              <i class="fas fa-building"></i>
            </div>
            <div class="stat-content">
              <h4>{{ formatCurrency(revenueSummary.platform_commission || 0) }}</h4>
              <p>Platform Commission</p>
              <span class="trend positive">+{{ commissionGrowth }}%</span>
            </div>
          </div>
          <div class="compact-stat-card pending">
            <div class="stat-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="stat-content">
              <h4>{{ formatCurrency(revenueSummary.hosting_fees || 0, 'ZAR') }}</h4>
              <p>Monthly Hosting</p>
              <span class="trend">{{ revenueSummary.active_teachers || 0 }} teachers</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters and Controls -->
      <div class="controls">
        <div class="search-filter">
          <div class="input-group">
            <span class="input-icon">
              <i class="fas fa-search"></i>
            </span>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search transactions..."
              class="search-input"
              @input="handleSearch"
            />
          </div>

          <select v-model="filterPeriod" class="filter-select" @change="filterTransactions">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>

          <select v-model="filterCurrency" class="filter-select" @change="filterTransactions">
            <option value="all">All Currencies</option>
            <option value="USD">USD</option>
            <option value="ZAR">ZAR</option>
          </select>

           <select v-model="filterCourse" class="filter-select" @change="filterTransactions">
            <option value="all">All Courses</option>
            <option v-for="course in courses" :key="course.id" :value="course.id">
              {{ course.title }}
            </option>
          </select>

          <select v-model="filterStatus" class="filter-select" @change="filterTransactions">
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>
          <select v-model="filterTeacher" class="filter-select" @change="filterTransactions">
            <option value="all">All Teachers</option>
            <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
              {{ teacher.user?.get_full_name || teacher.user?.email }}
            </option>
          </select>

          <button
            @click="exportReport"
            class="export-btn btn-click-animation"
            :disabled="loading"
          >
            <i class="fas fa-download"></i>
            Export Report
          </button>
          <button
            @click="refreshData"
            class="refresh-btn btn-click-animation"
            :disabled="loading"
          >
            <i class="fas fa-sync" :class="{ 'fa-spin': loading }"></i>
            Refresh
          </button>
          <button @click="testConnection" class="refresh-btn btn-click-animation">
            <i class="fas fa-plug"></i> Test Connection
          </button>
           <button
              @click="toggleDataMode"
              class="refresh-btn btn-click-animation"
              :class="{ 'dummy-active': useDummyData }"
            >
              <i class="fas" :class="useDummyData ? 'fa-database' : 'fa-server'"></i>
              {{ useDummyData ? 'Using Real Data' : 'Using Dummy Data'}}
            </button>

        </div>

      </div>
    </div>

    <!-- Transactions Table -->
    <div class="revenue-table-container">
      <div v-if="loading" class="loading-overlay">
        <div class="loader">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading transactions...</span>
        </div>
      </div>
      <div class="table-header">
      <h4>Transaction History</h4>
      <div class="table-summary">
        Showing {{ displayedTransactions.length }} of {{ filteredTransactions.length }} transactions
        <span v-if="filteredTransactions.length > 0">
          (Total: {{ formatCurrency(filteredTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0), filteredTransactions[0]?.currency || 'USD') }})
        </span>
      </div>
    </div>

    <div class="table-responsive">
      <table class="revenue-table">
        <colgroup>
          <col class="id-column">
          <col class="date-column">
          <col class="course-column">
          <col class="student-column">
          <col class="teacher-column">
          <col class="amount-column">
          <col class="fee-column">
          <col class="payout-column">
          <col class="status-column">
          <col class="actions-column">
        </colgroup>
        <thead>
          <tr>
            <th @click="sortBy('transaction_id')">
              Transaction ID <i class="fas" :class="sortIcon('transaction_id')"></i>
            </th>
            <th @click="sortBy('created_at')">
              Date <i class="fas" :class="sortIcon('created_at')"></i>
            </th>
            <th @click="sortBy('course_title')">
              Course <i class="fas" :class="sortIcon('course_title')"></i>
            </th>
            <th @click="sortBy('student_name')">
              Student <i class="fas" :class="sortIcon('student_name')"></i>
            </th>
            <th @click="sortBy('teacher_name')">
              Teacher <i class="fas" :class="sortIcon('teacher_name')"></i>
            </th>
            <th @click="sortBy('amount')">
              Amount <i class="fas" :class="sortIcon('amount')"></i>
            </th>
            <th>Platform Fee</th>
            <th>Teacher Payout</th>
            <th @click="sortBy('status')">
              Status <i class="fas" :class="sortIcon('status')"></i>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="transaction in displayedTransactions" :key="transaction.id" :class="transaction.status">
            <td>{{ transaction.transaction_id }}</td>
            <td>{{ formatDate(transaction.created_at) }}</td>
            <td>
              <div class="course-info">
                <span>{{ transaction.course_title }}</span>
              </div>
            </td>
            <td>{{ transaction.student_name }}</td>
            <td>{{ transaction.teacher_name || 'Admin' }}</td>
            <td>{{ formatCurrency(transaction.amount, transaction.currency) }}</td>
            <td>
              {{ formatCurrency(transaction.platform_fee, transaction.currency) }}
              <span class="percentage">({{ transaction.teacher ? '30%' : '100%' }})</span>
            </td>
            <td>
              {{ formatCurrency(transaction.teacher_payout, transaction.currency) }}
              <span class="percentage">({{ transaction.teacher ? '70%' : '0%' }})</span>
            </td>
            <td>
              <span :class="`status-badge ${transaction.status}`">
                {{ transaction.status }}
              </span>
            </td>
            <td>
              <div class="transaction-actions">
                <button
                  v-if="transaction.status === 'completed'"
                  @click="processRefund(transaction)"
                  class="action-btn refund-btn"
                  title="Process Refund"
                  :disabled="processingRefund === transaction.id"
                >
                  <i class="fas" :class="processingRefund === transaction.id ? 'fa-spinner fa-spin' : 'fa-undo'"></i>
                </button>
                <button
                  @click="viewTransactionDetails(transaction)"
                  class="action-btn view-btn"
                  title="View Details"
                >
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="filteredTransactions.length === 0 && !loading" class="no-transactions">
        <i class="fas fa-receipt"></i>
        <p>No transactions found. Adjust your search filters or wait for new transactions.</p>
      </div>
    </div>

      <!-- Pagination -->
      <div class="pagination" v-if="totalPages > 1">
        <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1" class="page-btn">
          <i class="fas fa-chevron-left"></i>
        </button>

        <button
          v-for="page in visiblePages"
          :key="page"
          @click="changePage(page)"
          :class="['page-btn', { active: currentPage === page }]"
        >
          {{ page }}
        </button>

        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          <i class="fas fa-chevron-right"></i>
        </button>

        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
      </div>
    </div>

    <!-- Transaction Detail Modal -->
    <div v-if="selectedTransaction" class="modal-overlay" @click.self="selectedTransaction = null">
      <div class="modal-content">
        <div class="modal-header">
          <h4>Transaction Details</h4>
          <button @click="selectedTransaction = null" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <label>Transaction ID:</label>
              <span>{{ selectedTransaction.transaction_id }}</span>
            </div>
            <div class="detail-item">
              <label>Date:</label>
              <span>{{ formatDate(selectedTransaction.created_at) }}</span>
            </div>
            <div class="detail-item">
              <label>Course:</label>
              <span>{{ selectedTransaction.course_title }}</span>
            </div>
            <div class="detail-item">
              <label>Student:</label>
              <span>{{ selectedTransaction.student_name }}</span>
            </div>
            <div class="detail-item">
              <label>Teacher:</label>
              <span>{{ selectedTransaction.teacher_name || 'Admin' }}</span>
            </div>
            <div class="detail-item">
              <label>Amount:</label>
              <span>{{ formatCurrency(selectedTransaction.amount, selectedTransaction.currency) }}</span>
            </div>
            <div class="detail-item">
              <label>Platform Fee:</label>
              <span>{{ formatCurrency(selectedTransaction.platform_fee, selectedTransaction.currency) }} ({{ selectedTransaction.teacher ? '30%' : '100%' }})</span>
            </div>
            <div class="detail-item">
              <label>Teacher Payout:</label>
              <span>{{ formatCurrency(selectedTransaction.teacher_payout, selectedTransaction.currency) }} ({{ selectedTransaction.teacher ? '70%' : '0%' }})</span>
            </div>
            <div class="detail-item">
              <label>Status:</label>
              <span :class="`status-badge ${selectedTransaction.status}`">
                {{ selectedTransaction.status }}
              </span>
            </div>
            <div class="detail-item">
              <label>Payment Method:</label>
              <span>{{ selectedTransaction.payment_gateway || 'PayPal' }}</span>
            </div>
            <div class="detail-item" v-if="selectedTransaction.gateway_transaction_id">
              <label>Gateway Transaction ID:</label>
              <span>{{ selectedTransaction.gateway_transaction_id }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="selectedTransaction = null" class="btn btn-primary">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted,onUnmounted, watch, nextTick } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useToast } from 'vue-toastification'
import axios from 'axios'
// import Chart from 'chart.js/auto'

const authStore = useAuthStore()
const toast = useToast()

// State variables
const transactions = ref([])
const courses = ref([])
const teachers = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filterPeriod = ref('month')
const filterCurrency = ref('all')
const filterStatus = ref('all')
const filterCourse = ref('all')
const filterTeacher = ref('all')
const selectedTransaction = ref(null)
const processingRefund = ref(null)
const revenueChartType = ref('line')
const sortField = ref('created_at')
const sortDirection = ref('desc')
const revenueSummary = ref({})
const lastPeriodData = ref({})
const useDummyData = ref(false) // New flag for dummy data

// Chart references
const revenueChart = ref(null)
const distributionChart = ref(null)
const statusChart = ref(null)
const currencyChart = ref(null)

// Chart instances
let revenueChartInstance = null
let distributionChartInstance = null
let statusChartInstance = null
let currencyChartInstance = null

// Pagination
const itemsPerPage = 10
const currentPage = ref(1)

// Real-time updates
let refreshInterval = null

// Computed properties
const revenueGrowth = computed(() => {
  if (!lastPeriodData.value.total_revenue || lastPeriodData.value.total_revenue === 0) return 0
  const growth = ((revenueSummary.value.total_revenue - lastPeriodData.value.total_revenue) / lastPeriodData.value.total_revenue) * 100
  return growth.toFixed(1)
})

const commissionGrowth = computed(() => {
  if (!lastPeriodData.value.platform_commission || lastPeriodData.value.platform_commission === 0) return 0
  const growth = ((revenueSummary.value.platform_commission - lastPeriodData.value.platform_commission) / lastPeriodData.value.platform_commission) * 100
  return growth.toFixed(1)
})

const filteredTransactions = computed(() => {
  let filtered = transactions.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(transaction =>
      transaction.transaction_id.toLowerCase().includes(query) ||
      transaction.course_title.toLowerCase().includes(query) ||
      transaction.student_name.toLowerCase().includes(query) ||
      (transaction.teacher_name && transaction.teacher_name.toLowerCase().includes(query))
    )
  }

  // Apply currency filter
  if (filterCurrency.value !== 'all') {
    filtered = filtered.filter(transaction => transaction.currency === filterCurrency.value)
  }

  // Apply status filter
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(transaction => transaction.status === filterStatus.value)
  }

  // Apply course filter
  if (filterCourse.value !== 'all') {
    filtered = filtered.filter(transaction => transaction.course == filterCourse.value)
  }

  // Apply teacher filter
  if (filterTeacher.value !== 'all') {
    filtered = filtered.filter(transaction => transaction.teacher == filterTeacher.value)
  }

  // Apply period filter
  if (filterPeriod.value !== 'all') {
    const now = new Date()
    let startDate

    switch (filterPeriod.value) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        startDate = new Date(now.getFullYear(), quarter * 3, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
    }

    if (startDate) {
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.created_at)
        return transactionDate >= startDate
      })
    }
  }

  // Apply sorting
  filtered = [...filtered].sort((a, b) => {
    let valueA = a[sortField.value]
    let valueB = b[sortField.value]

    // Handle different data types for sorting
    if (sortField.value === 'created_at') {
      valueA = new Date(valueA)
      valueB = new Date(valueB)
    } else if (sortField.value === 'amount' || sortField.value === 'platform_fee' || sortField.value === 'teacher_payout') {
      valueA = parseFloat(valueA)
      valueB = parseFloat(valueB)
    }

    if (valueA < valueB) return sortDirection.value === 'asc' ? -1 : 1
    if (valueA > valueB) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })

  return filtered
})

const totalPages = computed(() => Math.ceil(filteredTransactions.value.length / itemsPerPage))

const displayedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredTransactions.value.slice(start, end)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// Dummy data generation
const generateDummyTransactions = () => {
  const statuses = ['completed', 'pending', 'refunded', 'failed']
  const currencies = ['USD', 'ZAR']
  const courses = [
    { id: 1, title: 'Web Development Bootcamp' },
    { id: 2, title: 'Data Science Fundamentals' },
    { id: 3, title: 'UX Design Masterclass' }
  ]
  const teachersList = [
    { id: 1, user: { get_full_name: 'John Smith', email: 'john@example.com' } },
    { id: 2, user: { get_full_name: 'Sarah Johnson', email: 'sarah@example.com' } }
  ]
  const students = ['Alice Brown', 'Bob Wilson', 'Charlie Davis', 'Diana Miller']

  const dummyTransactions = []

  for (let i = 0; i < 50; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const currency = currencies[Math.floor(Math.random() * currencies.length)]
    const course = courses[Math.floor(Math.random() * courses.length)]
    const teacher = teachersList[Math.floor(Math.random() * teachersList.length)]
    const student = students[Math.floor(Math.random() * students.length)]
    const amount = parseFloat((Math.random() * 500 + 20).toFixed(2))
    const platformFee = status === 'completed' ? parseFloat((amount * 0.3).toFixed(2)) : 0
    const teacherPayout = status === 'completed' ? parseFloat((amount * 0.7).toFixed(2)) : 0

    dummyTransactions.push({
      id: i + 1,
      transaction_id: `TXN${Math.floor(100000 + Math.random() * 900000)}`,
      created_at: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString(),
      course_title: course.title,
      course: course.id,
      student_name: student,
      teacher_name: teacher.user.get_full_name,
      teacher: teacher.id,
      amount: amount,
      currency: currency,
      platform_fee: platformFee,
      teacher_payout: teacherPayout,
      status: status,
      payment_gateway: 'PayPal',
      gateway_transaction_id: `GATE${Math.floor(100000 + Math.random() * 900000)}`
    })
  }

  return dummyTransactions
}

const generateDummySummary = () => {
  return {
    total_revenue: 12543.67,
    teacher_payouts: 8778.57,
    platform_commission: 3765.10,
    hosting_fees: 1200.00,
    active_teachers: 15
  }
}

const generateDummyCourses = () => {
  return [
    { id: 1, title: 'Web Development Bootcamp' },
    { id: 2, title: 'Data Science Fundamentals' },
    { id: 3, title: 'UX Design Masterclass' },
    { id: 4, title: 'Mobile App Development' },
    { id: 5, title: 'Digital Marketing Strategy' }
  ]
}

const generateDummyTeachers = () => {
  return [
    { id: 1, user: { get_full_name: 'John Smith', email: 'john@example.com' } },
    { id: 2, user: { get_full_name: 'Sarah Johnson', email: 'sarah@example.com' } },
    { id: 3, user: { get_full_name: 'Michael Brown', email: 'michael@example.com' } },
    { id: 4, user: { get_full_name: 'Emily Davis', email: 'emily@example.com' } }
  ]
}

// Add this function to your Vue component
const generateTestData = async () => {
  try {
    const response = await axios.post('/api/admin/test/generate-transactions/', {
      count: 10 // Generate 10 test transactions
    })
    console.log('Test data generated:', response.data)
    toast.success('Test transactions created')
    // Refresh the data
    await fetchTransactions()
    await fetchRevenueSummary()
  } catch (error) {
    console.error('Error generating test data:', error)
    toast.error('Failed to generate test data')
  }
}

const testConnection = async () => {
  try {
    const response = await axios.get('/api/admin/revenue/transactions/')
    console.log('API Response:', response.data)
    toast.success(`Connected! Found ${response.data.length} transactions`)
  } catch (error) {
    console.error('Connection failed:', error)
    toast.error('Connection failed: ' + error.message)
  }
}

// Methods
const fetchTransactions = async () => {
  if (useDummyData.value) {
    transactions.value = generateDummyTransactions()
    console.log('Using dummy transactions data')
    nextTick(() => {
      initCharts()
    })
    return
  }

  try {
    loading.value = true
    const response = await axios.get('/api/admin/revenue/transactions/', {
      params: {
        ordering: sortDirection.value === 'desc' ? `-${sortField.value}` : sortField.value
      }
    })

    // Handle both array and object responses
    if (Array.isArray(response.data)) {
      transactions.value = response.data
    } else if (response.data && response.data.results) {
      transactions.value = response.data.results // For paginated responses
    } else {
      transactions.value = []
    }

    console.log('Transactions loaded:', transactions.value.length)

    // Only init charts if we have data
    if (transactions.value.length > 0) {
      nextTick(() => {
        initCharts()
      })
    }
  } catch (error) {
    console.error('Error fetching transactions:', error)
    toast.error('Failed to load transactions. Using dummy data instead.')
    useDummyData.value = true
    transactions.value = generateDummyTransactions()
    nextTick(() => {
      initCharts()
    })
  } finally {
    loading.value = false
  }
}


const fetchRevenueSummary = async () => {
  if (useDummyData.value) {
    revenueSummary.value = generateDummySummary()
    lastPeriodData.value = {
      total_revenue: revenueSummary.value.total_revenue * 0.8,
      platform_commission: revenueSummary.value.platform_commission * 0.8
    }
    console.log('Using dummy revenue summary')
    return
  }

  try {
    const response = await axios.get('/api/admin/revenue/summary/')
    lastPeriodData.value = { ...revenueSummary.value }
    revenueSummary.value = response.data
  } catch (error) {
    console.error('Error fetching revenue summary:', error)
    toast.error('Failed to load revenue summary. Using dummy data instead.')
    useDummyData.value = true
    revenueSummary.value = generateDummySummary()
    lastPeriodData.value = {
      total_revenue: revenueSummary.value.total_revenue * 0.8,
      platform_commission: revenueSummary.value.platform_commission * 0.8
    }
  }
}

const fetchCourses = async () => {
  if (useDummyData.value) {
    courses.value = generateDummyCourses()
    console.log('Using dummy courses data')
    return
  }

  try {
    const response = await axios.get('/api/admin/courses/')
    courses.value = response.data.results || response.data
  } catch (error) {
    console.error('Error fetching courses:', error)
    toast.error('Failed to load courses. Using dummy data instead.')
    useDummyData.value = true
    courses.value = generateDummyCourses()
  }
}

const fetchTeachers = async () => {
  if (useDummyData.value) {
    teachers.value = generateDummyTeachers()
    console.log('Using dummy teachers data')
    return
  }

  try {
    const response = await axios.get('/api/admin/teachers/')
    teachers.value = response.data.results || response.data
  } catch (error) {
    console.error('Error fetching teachers:', error)
    toast.error('Failed to load teachers. Using dummy data instead.')
    useDummyData.value = true
    teachers.value = generateDummyTeachers()
  }
}

// Add a method to toggle between real and dummy data
const toggleDataMode = () => {
  useDummyData.value = !useDummyData.value
  refreshData()
}

const formatCurrency = (amount, currency = 'USD') => {
  const formatter = new Intl.NumberFormat(currency === 'ZAR' ? 'en-ZA' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  })
  return formatter.format(amount)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleSearch = () => {
  currentPage.value = 1
}

const filterTransactions = () => {
  currentPage.value = 1
  fetchTransactions()
}

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const refreshData = () => {
  fetchTransactions()
  fetchRevenueSummary()
  fetchCourses()
  fetchTeachers()
}

const viewTransactionDetails = (transaction) => {
  selectedTransaction.value = transaction
}

const processRefund = async (transaction) => {
  if (!confirm(`Are you sure you want to process a refund for ${formatCurrency(transaction.amount, transaction.currency)}? This action cannot be undone.`)) {
    return
  }

  try {
    processingRefund.value = transaction.id
    await axios.post(`/api/admin/revenue/transactions/${transaction.id}/process_refund/`)
    toast.success('Refund processed successfully')

    // Update the transaction status locally
    const index = transactions.value.findIndex(t => t.id === transaction.id)
    if (index !== -1) {
      transactions.value[index].status = 'refunded'
    }
  } catch (error) {
    console.error('Error processing refund:', error)
    toast.error(error.response?.data?.error || 'Failed to process refund')
  } finally {
    processingRefund.value = null
  }
}

const exportReport = async () => {
  try {
    const response = await axios.get('/api/admin/revenue/reports/export/', {
      params: {
        format: 'csv',
        period: filterPeriod.value,
        currency: filterCurrency.value,
        status: filterStatus.value,
        course: filterCourse.value,
        teacher: filterTeacher.value,
        search: searchQuery.value
      },
      responseType: 'blob'
    })

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `revenue-report-${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()

    toast.success('Report exported successfully')
  } catch (error) {
    console.error('Error exporting report:', error)
    toast.error('Failed to export report')
  }
}

const sortBy = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
  fetchTransactions()
}

const sortIcon = (field) => {
  if (sortField.value !== field) return 'fa-sort'
  return sortDirection.value === 'asc' ? 'fa-sort-up' : 'fa-sort-down'
}

// Chart methods
const initCharts = () => {
  // Destroy existing charts if they exist
  if (revenueChartInstance) revenueChartInstance.destroy()
  if (distributionChartInstance) distributionChartInstance.destroy()
  if (statusChartInstance) statusChartInstance.destroy()
  if (currencyChartInstance) currencyChartInstance.destroy()

  // Create new charts
  createRevenueChart()
  createDistributionChart()
  createStatusChart()
  createCurrencyChart()
}

const createRevenueChart = () => {
  const ctx = document.getElementById('revenueChart')
  if (!ctx) return

  // Group transactions by date for the chart
  const dailyData = transactions.value.reduce((acc, transaction) => {
    if (transaction.status !== 'completed') return acc

    const date = new Date(transaction.created_at).toLocaleDateString('en-US')
    if (!acc[date]) {
      acc[date] = { revenue: 0, payouts: 0 }
    }

    acc[date].revenue += parseFloat(transaction.amount)
    acc[date].payouts += parseFloat(transaction.teacher_payout)

    return acc
  }, {})

  const dates = Object.keys(dailyData).sort()
  const revenueData = dates.map(date => dailyData[date].revenue)
  const payoutData = dates.map(date => dailyData[date].payouts)

  revenueChartInstance = new Chart(ctx, {
    type: revenueChartType.value,
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Total Revenue',
          data: revenueData,
          borderColor: '#087990',
          backgroundColor: 'rgba(8, 121, 144, 0.1)',
          borderWidth: 1.5,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Teacher Payouts',
          data: payoutData,
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          borderWidth: 1.5,
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: 8
            },
            callback: function(value) {
              return '$' + value/1000 + 'K'
            }
          }
        },
        x: {
          ticks: {
            font: {
              size: 8
            }
          }
        }
      }
    }
  })
}

const createDistributionChart = () => {
  const ctx = document.getElementById('distributionChart')
  if (!ctx) return

  const teacherPayoutsTotal = transactions.value
    .filter(t => t.status === 'completed')
    .reduce((sum, transaction) => sum + parseFloat(transaction.teacher_payout), 0)

  const platformCommissionTotal = transactions.value
    .filter(t => t.status === 'completed')
    .reduce((sum, transaction) => sum + parseFloat(transaction.platform_fee), 0)

  const hostingFeesTotal = revenueSummary.value.hosting_fees || 0

  distributionChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Teacher Payouts', 'Platform Commission', 'Hosting Fees'],
      datasets: [{
        data: [teacherPayoutsTotal, platformCommissionTotal, hostingFeesTotal],
        backgroundColor: [
          '#28a745',
          '#dc3545',
          '#ffc107'
        ],
        borderColor: [
          '#fff',
          '#fff',
          '#fff'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        }
      }
    }
  })
}

const createStatusChart = () => {
  const ctx = document.getElementById('statusChart')
  if (!ctx) return

  // Count transactions by status
  const statusCounts = {
    completed: transactions.value.filter(t => t.status === 'completed').length,
    pending: transactions.value.filter(t => t.status === 'pending').length,
    refunded: transactions.value.filter(t => t.status === 'refunded').length,
    failed: transactions.value.filter(t => t.status === 'failed').length
  }

  statusChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Completed', 'Pending', 'Refunded', 'Failed'],
      datasets: [{
        data: [statusCounts.completed, statusCounts.pending, statusCounts.refunded, statusCounts.failed],
        backgroundColor: [
          '#28a745',
          '#ffc107',
          '#dc3545',
          '#6c757d'
        ],
        borderColor: [
          '#fff',
          '#fff',
          '#fff',
          '#fff'
        ],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        }
      }
    }
  })
}

const createCurrencyChart = () => {
  const ctx = document.getElementById('currencyChart')
  if (!ctx) return

  // Count transactions by currency
  const currencyCounts = {
    USD: transactions.value.filter(t => t.currency === 'USD').length,
    ZAR: transactions.value.filter(t => t.currency === 'ZAR').length
  }

  currencyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['USD', 'ZAR'],
      datasets: [{
        label: 'Transactions by Currency',
        data: [currencyCounts.USD, currencyCounts.ZAR],
        backgroundColor: [
          '#087990',
          '#20c997'
        ],
        borderColor: [
          '#087990',
          '#20c997'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
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

onMounted(() => {
  if (authStore.isAuthenticated) {
    refreshData()

    // Set up real-time updates every 30 seconds
    refreshInterval = setInterval(() => {
      if (!useDummyData.value) {
        refreshData()
      }
    }, 30000)
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

// Watch for changes in transactions to update charts
watch(transactions, () => {
  nextTick(() => {
    initCharts()
  })
})
</script>


<style scoped>
.charts-section {
  margin-bottom: 2rem;
}

.chart-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.chart-card {
  background: var(--card-bg, white);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color, #333);
}

.chart-select {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border-color, #dee2e6);
  background: var(--card-bg, white);
  color: var(--text-color, #333);
}

.revenue-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: var(--card-bg, white);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.card-icon {
  width: 50px;
  height: 50px;
  background: var(--primary-color, #087990);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.2rem;
}

.card-content h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: var(--text-secondary, #6c757d);
  font-weight: 500;
}

.amount {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: var(--text-color, #333);
}

.trend {
  font-size: 0.8rem;
  color: var(--text-secondary, #6c757d);
}

.trend.positive {
  color: #28a745;
}

.revenue-table-container {
  background: var(--card-bg, white);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-color, #dee2e6);
  overflow: hidden;
  font-family: var(--font-body);
  position: relative;
  min-height: 400px
}

.compact-chart-card h4 {
  font-size: 0.95rem;
  margin-bottom: 0.6rem;
  color: #4a6582;
  font-weight: 600;
  font-family: var(--font-heading);
}

.table-header h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  font-family: var(--font-heading);
}

.table-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.refresh-btn {
  background: var(--primary-color, #087990);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.revenue-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
}

.revenue-table th {
  padding: 0.6rem 0.5rem;
  font-size: 14.4px;
  font-weight: 600;
  font-family: var(--font-heading);
  color:#495057 !important;
}

.revenue-table td {
  padding: 0.6rem 0.5rem;
  border-bottom: 1px solid #e9ecef;
}

.course-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.course-icon {
  width: 24px;
  height: 24px;
  background: #e2f0fc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color, #087990);
  font-size: 0.7rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.completed {
  background: #d1e7dd;
  color: #146c43;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.refunded {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.failed {
  background: #f8d7da;
  color: #721c24;
}

.percentage {
  font-size: 0.75rem;
  color: var(--text-secondary, #6c757d);
  margin-left: 0.25rem;
}

.transaction-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.refund-btn {
  color: #dc3545;
}

.refund-btn:hover {
  background: #f8d7da;
}

.view-btn {
  color: var(--primary-color, #087990);
}

.view-btn:hover {
  background: #e2f0fc;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--card-bg, white);
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color, #dee2e6);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h4 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: var(--text-secondary, #6c757d);
}

.modal-body {
  padding: 1.5rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
}

.detail-item {
  display: contents;
}

.detail-item label {
  font-weight: 600;
  color: var(--text-secondary, #6c757d);
  padding: 0.5rem 0;
}

.detail-item span {
  padding: 0.5rem 0;
}

.export-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.export-btn:hover {
  background: #218838;
}

/* Base styles */
.dashboard-section {
  max-width: 100%;
  margin: 0 auto;
  font-family: var(--font-base, 'Inter', sans-serif);
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

/* Stats Dashboard - Matching enrollment pattern */
.stats-dashboard {
  background: var(--card-bg, white);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color, #e9ecef);
  margin-bottom: 2rem;
}

.revenue-dashboard {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  position: relative;
}

.compact-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.8rem;
  margin-bottom: 1.5rem;
}

.compact-stat-card {
  border-radius: 10px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  border: 1px solid #e6f0fa;
  height: 80px;
  transition: all 0.3s ease;
  font-family: var(--font-body);
}

.compact-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0,0,0,0.08);
}

.compact-stat-card .stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.compact-stat-card.total .stat-icon {
  background: rgba(8, 121, 144, 0.15);
  color: #087990;
}

.compact-stat-card.approved .stat-icon {
  background: rgba(40, 167, 69, 0.15);
  color: #28a745;
}

.compact-stat-card.completed .stat-icon {
  background: rgba(23, 162, 184, 0.15);
  color: #17a2b8;
}

.compact-stat-card.pending .stat-icon {
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
}

.compact-stat-card .stat-content {
  flex: 1;
  min-width: 0;
}

.compact-stat-card .stat-content h4 {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.15rem 0;
  color: var(--text-color);
  font-family: var(--font-heading);
  letter-spacing: -0.3px;
}

.compact-stat-card .stat-content p {
  margin: 0 0 0.15rem 0;
  color: var(--text-secondary, #6c757d);
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trend {
  font-size: 0.65rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0.15rem 0.4rem;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
}

.trend.positive {
  color: #28a745;
}
.trend.positive {
  color: #28a745;
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

  .search-filter {
    flex-direction: row !important;
    align-items: center;
    flex-wrap: wrap;
    /* display: flex; */
  }

    .revenue-summary {
    grid-template-columns: 1fr;
  }

  .revenue-table {
    font-size: 0.8rem;
  }

  .revenue-table th,
  .revenue-table td {
    padding: 0.5rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border-color, #dee2e6);
  }

  .detail-item:last-child {
    border-bottom: none;
  }
}

.search-filter {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  margin-bottom: -1rem;
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
  margin-bottom: -1rem;
}

.export-btn, .refresh-btn {
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

.export-btn:hover, .refresh-btn:hover:not(:disabled) {
  background: #065e6f;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(8, 121, 144, 0.3);
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Charts Section - Matching enrollment pattern */
.charts-section {
  margin-bottom: 2rem;
}

.chart-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.chart-card {
  background: var(--card-bg, white);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-color, #e9ecef);
  height: 300px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-header h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.chart-select {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border-color, #dee2e6);
  background: var(--card-bg, white);
  color: var(--text-color, #333);
}

.table-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color, #dee2e6);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.table-summary {
  color: var(--text-secondary, #6c757d);
  font-size: 0.9rem;
}

/* Table styles */
.table-responsive {
  position: relative;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
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
.revenue-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  min-width: 1000px;
}

.revenue-table thead {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color:#495057 !important;
}

.revenue-table th {
  padding: 1rem 0.75rem;
  text-align: left;
  font-weight: 600;
  color: var(--text-color);
  border-bottom: 2px solid #e9ecef;
}

.revenue-table th:hover {
  background-color: #f8f9fa !important;
}

.revenue-table td {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
}

.revenue-table tbody tr {
  transition: all 0.3s ease;
  position: relative;
  height: 40px;
}

.revenue-table tbody tr:hover {
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* .revenue-table tbody tr::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: transparent;
  transition: all 0.3s ease;
} */

.revenue-table tbody tr:hover::before {
  background: var(--primary-color, #087990);
}

.revenue-table tr.pending::before {
  background: #ffc107;
}

.revenue-table tr.approved::before {
  background: #28a745;
}

.revenue-table tr.completed::before {
  background: #17a2b8;
}

.revenue-table tr.declined::before {
  background: #dc3545;
}

.revenue-table tr.selected {
  background: rgba(8, 121, 144, 0.05);
  box-shadow: inset 0 0 0 2px rgba(8, 121, 144, 0.2);
}

/* Column specific styles */
.id-column { width: 90px; }
.date-column { width: 110px; }
.course-column { min-width: 90px; }
.student-column { min-width: 90px; }
.teacher-column { min-width: 90px; }
.amount-column { width: 80px; }
.currency-column { width: 60px; }
.fee-column { width: 90px; }
.payout-column { width: 90px; }
.status-column { width: 80px; }
.actions-column { width: 80px; }

.course-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.course-icon {
  width: 30px;
  height: 30px;
  background: #e2f0fc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color, #087990);
  font-size: 0.8rem;
}
.percentage {
  font-size: 0.75rem;
  color: var(--text-secondary, #6c757d);
  margin-left: 0.25rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.65rem;
  font-weight: 500;
  min-width: 70px;
}

.status-badge.completed {
  background: rgba(40, 167, 69, 0.15);
  color: #146c43;
}

.status-badge.pending {
  background: rgba(255, 193, 7, 0.15);
  color: #856404;
}

.status-badge.refunded {
  background: rgba(220, 53, 69, 0.15);
  color: #721c24;
}

.status-badge.failed {
  background: rgba(108, 117, 125, 0.15);
  color: #495057;
}

.transaction-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.refund-btn {
  color: #dc3545;
}

.refund-btn:hover {
  background: rgba(220, 53, 69, 0.1);
}

.view-btn {
  color: var(--primary-color, #087990);
}

.view-btn:hover {
  background: rgba(8, 121, 144, 0.1);
}

.no-transactions {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 4rem 2rem;
  color: #6c757d;
  text-align: center;
}

.no-transactions i {
  font-size: 4rem;
  opacity: 0.4;
  color: var(--primary-color, #087990);
}

.no-transactions p {
  font-size: 1.1rem;
  font-weight: 500;
  max-width: 400px;
  line-height: 1.5;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1.5rem;
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

/* Modal Styles */
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

.modal-content {
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

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
}

.detail-item {
  display: contents;
}

.detail-item label {
  font-weight: 600;
  color: var(--text-secondary, #6c757d);
  padding: 0.5rem 0;
}

.detail-item span {
  padding: 0.5rem 0;
}

/* Charts Section - Smaller and more compact with improved mobile responsiveness */
.compact-charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.8rem;
  margin-bottom: 1.5rem;
}

.compact-chart-card {
  background: #ffffff;
  border-radius: 10px;
  padding: 0.83rem;
  height: 210px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  border: 1px solid #edf2f9;
  font-family: var(--font-body);
  display: flex;
  flex-direction: column;
}

.compact-chart-card canvas {
  flex: 1;
  width: 100% !important;
  height: auto !important;
  max-height: 150px;
}

/* Responsive Design for Mobile */
@media (max-width: 640px) {
  .compact-stats-grid {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }

  .compact-charts-grid {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }

  .compact-chart-card {
    height: 240px;
    padding: 1rem;
  }

  .compact-chart-card h4 {
    font-size: 0.9rem;
    margin-bottom: 0.8rem;
  }

  .compact-stat-card {
    height: 85px;
    padding: 1rem;
  }

  .revenue-table {
    font-size: 0.7rem;
  }

  .revenue-table th,
  .revenue-table td {
    padding: 0.5rem 0.3rem;
  }
}

/* Tablet responsiveness */
@media (min-width: 641px) and (max-width: 1024px) {
  .compact-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.8rem;
  }

  .compact-charts-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.8rem;
  }

  .compact-chart-card {
    height: 220px;
  }
}

/* Large tablets and small desktops */
@media (min-width: 1025px) and (max-width: 1280px) {
  .compact-stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .compact-charts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1281px) {
  .compact-stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }

  .compact-charts-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 767px) {
  .controls {
    flex-direction: column;
  }

  .search-filter {
    flex-direction: column;
  }

  .action-buttons {
    width: 100%;
    justify-content: flex-start;
  }

  .compact-stats-grid {
    grid-template-columns: 1fr;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border-color, #dee2e6);
  }

  .detail-item:last-child {
    border-bottom: none;
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .chart-row {
    grid-template-columns: 1fr;
  }
}
</style>