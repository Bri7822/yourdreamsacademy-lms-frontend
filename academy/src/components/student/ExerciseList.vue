<template>
  <div class="dashboard-section" key="exercises">
    <h3 class="section-title">Exercises</h3>
    <p>View and complete your exercises.</p>
    
    <div class="exercise-list">
      <div class="exercise-card" v-for="exercise in exercises" :key="exercise.id">
        <div class="exercise-header">
          <div class="exercise-title-container">
            <i class="fas fa-tasks"></i>
            <div class="exercise-info">
              <h4>{{ exercise.title }}</h4>
              <span class="course-name">{{ exercise.course }}</span>
            </div>
          </div>
          <span class="due-date" :class="{ 'overdue': exercise.status === 'Overdue' }">
            {{ exercise.dueDate }}
          </span>
        </div>
        <div class="exercise-content">
          <p>{{ exercise.description }}</p>
          <div class="exercise-status" :class="exercise.status.toLowerCase().replace(' ', '-')">
            {{ exercise.status }}
          </div>
        </div>
        <div class="exercise-footer">
          <button 
            class="btn-action btn-start" 
            v-if="exercise.status === 'Pending'"
            @click="startExercise(exercise.id)"
          >
            Start Exercise
          </button>
          <button 
            class="btn-action btn-continue" 
            v-if="exercise.status === 'In Progress'"
            @click="continueExercise(exercise.id)"
          >
            Continue
          </button>
          <button 
            class="btn-action btn-view" 
            v-if="exercise.status === 'Submitted'"
            @click="viewResults(exercise.id)"
          >
            View Results
          </button>
          <button 
            class="btn-action btn-retry" 
            v-if="exercise.status === 'Overdue'"
            @click="retryExercise(exercise.id)"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Exercises data
const exercises = ref([
  { 
    id: 1, 
    slug: 'responsive-layout-challenge',
    title: 'Responsive Layout Challenge', 
    course: 'Web Development Fundamentals', 
    description: 'Create a responsive webpage using CSS Grid and Flexbox', 
    dueDate: 'Due tomorrow', 
    status: 'Pending' 
  },
  { 
    id: 2, 
    slug: 'binary-search-tree',
    title: 'Binary Search Tree Implementation', 
    course: 'Data Structures and Algorithms', 
    description: 'Implement BST operations in JavaScript', 
    dueDate: 'Due in 3 days', 
    status: 'In Progress' 
  },
  { 
    id: 3, 
    slug: 'sql-query-practice',
    title: 'SQL Query Practice', 
    course: 'Database Systems', 
    description: 'Write complex SQL queries for the provided database', 
    dueDate: 'Overdue', 
    status: 'Overdue' 
  },
  { 
    id: 4, 
    slug: 'dom-manipulation',
    title: 'DOM Manipulation Exercise', 
    course: 'Web Development Fundamentals', 
    description: 'Practice DOM manipulation with JavaScript', 
    dueDate: 'Submitted', 
    status: 'Submitted' 
  }
])

// Exercise actions
const startExercise = (exerciseId) => {
  const exercise = exercises.value.find(ex => ex.id === exerciseId)
  if (exercise) {
    router.push(`/student/exercises/${exercise.slug}`)
  }
}

const continueExercise = (exerciseId) => {
  const exercise = exercises.value.find(ex => ex.id === exerciseId)
  if (exercise) {
    router.push(`/student/exercises/${exercise.slug}`)
  }
}

const viewResults = (exerciseId) => {
  const exercise = exercises.value.find(ex => ex.id === exerciseId)
  if (exercise) {
    router.push(`/student/exercises/${exercise.slug}/results`)
  }
}

const retryExercise = (exerciseId) => {
  const exercise = exercises.value.find(ex => ex.id === exerciseId)
  if (exercise) {
    router.push(`/student/exercises/${exercise.slug}`)
  }
}

onMounted(() => {
  // In a real app, fetch exercises from API
  console.log('ExerciseList component mounted')
})
</script>

<style scoped>
/* Exercise List Styles */
.dashboard-section {
  max-width: 1200px;
  margin: 0 auto;
}

.exercise-list {
  display: grid;
  gap: 1.25rem;
}

.exercise-card {
  background-color: var(--card-bg, #ffffff);
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.exercise-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 16px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.08);
}

.exercise-header {
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  background-color: rgba(8, 121, 144, 0.03);
  border-bottom: 1px solid var(--border-color, #e9ecef);
  flex-wrap: wrap;
  gap: 0.75rem;
}

.exercise-title-container {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  flex: 1;
  min-width: 0; /* Allows text truncation */
}

.exercise-header i {
  font-size: 1.4rem;
  color: var(--primary-color, #087990);
  margin-top: 0.25rem;
  flex-shrink: 0;
}

.exercise-info {
  min-width: 0; /* Allows text truncation */
}

.exercise-header h4 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-color, #333);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
}

.course-name {
  font-size: 0.9rem;
  color: var(--secondary-color, #6c757d);
  display: block;
  margin-top: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.due-date {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.4rem 0.75rem;
  border-radius: 20px;
  background-color: #f8f9fa;
  color: var(--text-color, #333);
  flex-shrink: 0;
  white-space: nowrap;
}

.due-date.overdue {
  background-color: #fff3cd;
  color: #856404;
}

.exercise-content {
  padding: 1rem;
}

.exercise-content p {
  margin: 0 0 1rem;
  color: var(--secondary-color, #6c757d);
  font-size: 0.95rem;
  line-height: 1.5;
}

.exercise-status {
  display: inline-block;
  padding: 0.4rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.exercise-status.pending {
  background-color: #e2e3e5;
  color: #383d41;
}

.exercise-status.in-progress {
  background-color: #cce5ff;
  color: #004085;
}

.exercise-status.overdue {
  background-color: #f8d7da;
  color: #721c24;
}

.exercise-status.submitted {
  background-color: #d4edda;
  color: #155724;
}

.exercise-footer {
  padding: 1rem;
  border-top: 1px solid var(--border-color, #e9ecef);
  display: flex;
  justify-content: flex-end;
}

.btn-action {
  padding: 0.6rem 1.25rem;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
}

.btn-start {
  background-color: var(--primary-color, #087990);
  color: white;
}

.btn-start:hover {
  background-color: #065e6f;
  transform: translateY(-2px);
}

.btn-continue {
  background-color: #17a2b8;
  color: white;
}

.btn-continue:hover {
  background-color: #138496;
  transform: translateY(-2px);
}

.btn-view {
  background-color: #6c757d;
  color: white;
}

.btn-view:hover {
  background-color: #5a6268;
  transform: translateY(-2px);
}

.btn-retry {
  background-color: #dc3545;
  color: white;
}

.btn-retry:hover {
  background-color: #c82333;
  transform: translateY(-2px);
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

.dashboard-section > p {
  color: var(--secondary-color, #6c757d);
  margin-bottom: 1.5rem;
  font-size: 1.05rem;
  line-height: 1.6;
}

/* Responsive Breakpoints */
@media (min-width: 992px) {
  .exercise-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 991px) and (min-width: 768px) {
  .exercise-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .exercise-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }
  
  .exercise-title-container {
    width: 100%;
  }
  
  .due-date {
    align-self: flex-start;
  }
  
  .exercise-footer {
    justify-content: stretch;
  }
  
  .btn-action {
    width: 100%;
    padding: 0.75rem 1.5rem;
  }
}

@media (max-width: 480px) {
  .dashboard-section {
    padding: 0.75rem;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .exercise-header {
    padding: 0.75rem;
  }
  
  .exercise-content {
    padding: 0.75rem;
  }
  
  .exercise-footer {
    padding: 0.75rem;
  }
  
  .exercise-header h4 {
    font-size: 1rem;
  }
  
  .exercise-content p {
    font-size: 0.9rem;
  }
  
  .btn-action {
    font-size: 0.9rem;
    min-width: unset;
  }
}

/* Reduced motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .exercise-card,
  .exercise-card:hover,
  .btn-action:hover {
    transition: none;
    transform: none;
  }
}
</style>