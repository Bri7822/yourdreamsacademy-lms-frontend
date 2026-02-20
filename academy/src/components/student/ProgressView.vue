<template>
  <div class="dashboard-section" key="progress">
    <h3 class="section-title">Progress Tracker</h3>
    <p>Track your learning progress and achievements.</p>

    <div class="progress-overview">
      <div class="progress-chart">
        <div class="chart-container">
          <div class="chart-progress" :style="{ '--progress': statistics.progress + '%' }">
            <div class="chart-value">{{ statistics.progress }}%</div>
          </div>
        </div>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-color completed"></span>
            <span>Completed</span>
          </div>
          <div class="legend-item">
            <span class="legend-color in-progress"></span>
            <span>In Progress</span>
          </div>
          <div class="legend-item">
            <span class="legend-color not-started"></span>
            <span>Not Started</span>
          </div>
        </div>
      </div>

      <div class="milestones">
        <h4>Recent Milestones</h4>
        <ul class="milestone-list">
          <li v-for="milestone in milestones" :key="milestone.id">
            <i :class="milestone.icon"></i>
            <div>
              <strong>{{ milestone.title }}</strong>
              <span>{{ milestone.date }}</span>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <div class="course-progress mb-3">
      <h4>Course Progress</h4>
      <div class="progress-cards">
        <div class="progress-card" v-for="course in courses" :key="course.id">
          <h5>{{ course.name }}</h5>
          <div class="progress-bar-container">
            <div class="progress-bar" :style="{ width: course.progress + '%' }"></div>
          </div>
          <div class="progress-details">
            <span>{{ course.progress }}% Complete</span>
            <span>{{ course.completedLessons }}/{{ course.totalLessons }} Lessons</span>
          </div>
        </div>
      </div>
    </div>


  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// Mock statistics
const statistics = ref({
  progress: 75
})

// Milestones data
const milestones = ref([
  {
    id: 1,
    title: 'Completed Web Development Basics',
    icon: 'fas fa-trophy',
    date: '2 days ago'
  },
  {
    id: 2,
    title: 'Reached 50% in Data Structures',
    icon: 'fas fa-star',
    date: '1 week ago'
  },
  {
    id: 3,
    title: 'Earned Perfect Score on SQL Quiz',
    icon: 'fas fa-check-circle',
    date: '2 weeks ago'
  }
])

// Courses data
const courses = ref([
  {
    id: 1,
    name: 'Web Development Fundamentals',
    progress: 80,
    completedLessons: 16,
    totalLessons: 20
  },
  {
    id: 2,
    name: 'Data Structures and Algorithms',
    progress: 65,
    completedLessons: 13,
    totalLessons: 20
  },
  {
    id: 3,
    name: 'Database Systems',
    progress: 45,
    completedLessons: 9,
    totalLessons: 20
  }
])

onMounted(() => {
  // In a real app, fetch progress data from API
  console.log('ProgressView component mounted')
})
</script>

<style scoped>
/* Progress Tracker Styles */
.progress-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.progress-chart {
  background-color: var(--card-bg, #ffffff);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chart-container {
  width: 150px;
  height: 150px;
  position: relative;
  margin-bottom: 20px;
}

.chart-progress {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(var(--primary-color, #087990) 0% var(--progress), #e9ecef var(--progress) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-value {
  width: 100px;
  height: 100px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color, #087990);
}

.chart-legend {
  display: grid;
  gap: 12px;
  align-self: stretch;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: var(--text-color, #333);
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-color.completed {
  background-color: var(--primary-color, #087990);
}

.legend-color.in-progress {
  background-color: #17a2b8;
}

.legend-color.not-started {
  background-color: #e9ecef;
}

.milestones {
  background-color: var(--card-bg, #ffffff);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.milestones h4 {
  margin: 0 0 20px;
  font-size: 1.1rem;
  color: var(--text-color, #333);
  font-weight: 600;
}

.milestone-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 15px;
}

.milestone-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  background-color: rgba(8, 121, 144, 0.03);
  transition: background-color 0.2s ease;
}

.milestone-list li:hover {
  background-color: rgba(8, 121, 144, 0.07);
}

.milestone-list li i {
  color: var(--primary-color, #087990);
  font-size: 1.2rem;
  width: 20px;
  text-align: center;
}

.milestone-list li div {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.milestone-list li strong {
  font-size: 0.9rem;
  color: var(--text-color, #333);
  margin-bottom: 2px;
}

.milestone-list li span {
  font-size: 0.8rem;
  color: var(--secondary-color, #6c757d);
}

.course-progress {
  background-color: var(--card-bg, #ffffff);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.course-progress h4 {
  margin: 0 0 20px;
  font-size: 1.1rem;
  color: var(--text-color, #333);
  font-weight: 600;
}

.progress-cards {
  display: grid;
  gap: 15px;
}

.progress-card {
  padding: 15px;
  border-radius: 6px;
  background-color: rgba(8, 121, 144, 0.03);
  transition: background-color 0.2s ease;
}

.progress-card:hover {
  background-color: rgba(8, 121, 144, 0.07);
}

.progress-card h5 {
  margin: 0 0 12px;
  font-size: 1rem;
  color: var(--text-color, #333);
  font-weight: 600;
}

.progress-bar-container {
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  margin-bottom: 8px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: var(--primary-color, #087990);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: var(--secondary-color, #6c757d);
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

.dashboard-content{
 padding:0rem !important;
}

.dashboard-section{
  padding:0rem !important;
}

.dashboard-section p {
  color: var(--secondary-color, #6c757d);
  margin-bottom: 25px;
}

@media (max-width: 1200px) {
  .progress-overview {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .chart-container {
    width: 120px;
    height: 120px;
  }

  .chart-value {
    width: 80px;
    height: 80px;
    font-size: 1.3rem;
  }
}

@media (max-width: 768px) {
  .progress-chart {
    padding: 15px;
  }

  .milestones {
    padding: 15px;
  }

  .course-progress {
    padding: 15px;
  }

  .progress-details {
    flex-direction: column;
    gap: 2px;
  }
}
</style>

