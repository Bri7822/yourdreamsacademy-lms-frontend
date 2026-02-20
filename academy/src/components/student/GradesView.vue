<template>
  <div class="dashboard-section" key="grades">
    <h3 class="section-title">My Grades</h3>
    <p>View your grades and performance metrics.</p>

    <div class="grades-summary">
      <div class="grade-overview">
        <div class="grade-card">
          <h4>Overall Average</h4>
          <div class="grade-percentage">{{ statistics.averageGrade }}%</div>
          <div class="grade-description">Your current average across all courses</div>
        </div>

        <div class="grade-distribution">
          <h4>Grade Distribution</h4>
          <div class="grade-bars">
            <div class="grade-bar" v-for="(count, grade) in gradeDistribution" :key="grade">
              <div class="bar-label">{{ grade }}</div>
              <div class="bar-container">
                <div class="bar-fill" :style="{ width: (count / maxGradeCount) * 100 + '%' }"></div>
              </div>
              <div class="bar-count">{{ count }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="course-grades">
        <h4>Grades by Course</h4>
        <table class="grades-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Assignments</th>
              <th>Average</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="course in courseGrades" :key="course.id">
              <td>{{ course.name }}</td>
              <td>{{ course.completedAssignments }}/{{ course.totalAssignments }}</td>
              <td>{{ course.average }}%</td>
              <td>
                <span class="status-badge" :class="course.status.toLowerCase()">
                  {{ course.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Mock statistics
const statistics = ref({
  averageGrade: 88
})

// Grade distribution data
const gradeDistribution = ref({
  'A+': 3,
  'A': 5,
  'B+': 2,
  'B': 1,
  'C+': 0,
  'C': 0
})

const maxGradeCount = computed(() => {
  return Math.max(...Object.values(gradeDistribution.value))
})

// Course grades data
const courseGrades = ref([
  {
    id: 1,
    name: 'Web Development Fundamentals',
    completedAssignments: 8,
    totalAssignments: 10,
    average: 92,
    status: 'Excellent'
  },
  {
    id: 2,
    name: 'Data Structures and Algorithms',
    completedAssignments: 5,
    totalAssignments: 8,
    average: 85,
    status: 'Good'
  },
  {
    id: 3,
    name: 'Database Systems',
    completedAssignments: 3,
    totalAssignments: 6,
    average: 78,
    status: 'Average'
  }
])

onMounted(() => {
  // In a real app, fetch grades from API
  console.log('GradesView component mounted')
})
</script>

<style scoped>
/* Grades Styles */
.grades-summary {
  background-color: var(--card-bg, #ffffff);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 15px;
  margin-bottom: 20px;
}

.grade-overview {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  margin-bottom: 30px;
}

.grade-card {
  background-color: rgba(8, 121, 144, 0.05);
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.grade-card h4 {
  margin: 0 0 10px;
  font-size: 1rem;
  color: var(--secondary-color, #6c757d);
}

.grade-percentage {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color, #087990);
  margin-bottom: 5px;
}

.grade-description {
  font-size: 0.8rem;
  color: var(--secondary-color, #6c757d);
}

.grade-distribution {
  padding: 15px;
}

.grade-distribution h4 {
  margin: 0 0 15px;
  font-size: 1rem;
  color: var(--secondary-color, #6c757d);
}

.grade-bars {
  display: grid;
  gap: 10px;
}

.grade-bar {
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  gap: 10px;
}

.bar-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color, #333);
}

.bar-container {
  height: 10px;
  background-color: #e9ecef;
  border-radius: 5px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background-color: var(--primary-color, #087990);
  transition: width 0.3s ease;
}

.bar-count {
  font-size: 0.9rem;
  text-align: right;
  color: var(--text-color, #333);
}

.course-grades {
  background-color: var(--card-bg, #ffffff);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 15px;
}

.course-grades h4 {
  margin: 0 0 15px;
  font-size: 1rem;
  color: var(--secondary-color, #6c757d);
}

.grades-table {
  width: 100%;
  border-collapse: collapse;
}

.grades-table th, .grades-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid var(--border-color, #e9ecef);
}

.grades-table th {
  font-weight: 600;
  color: var(--secondary-color, #6c757d);
  font-size: 0.9rem;
}

.grades-table td {
  color: var(--text-color, #333);
}

.status-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.excellent {
  background-color: #d4edda;
  color: #155724;
}

.status-badge.good {
  background-color: #cce5ff;
  color: #004085;
}

.status-badge.average {
  background-color: #fff3cd;
  color: #856404;
}

.section-title {
    font-family: var(--font-heading);
    font-size: var(--fs-lg);
    color: var(--text-color);
    margin: 0 0 14.4px 0;
    font-weight: 600;
    position: relative;
    padding-bottom: 9px;
    text-align:start;
}

.section-title::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 45px;
    height: 3px;
    background-color: var(--primary-color);
    border-radius: 3px;
}

.dashboard-section p {
  color: var(--secondary-color, #6c757d);
  margin-bottom: 20px;
}

@media (max-width: 1200px) {
  .grade-overview {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .grades-table {
    font-size: 0.8rem;
  }

  .grades-table th, .grades-table td {
    padding: 8px;
  }

  .grade-percentage {
    font-size: 1.5rem;
  }
}
</style>

