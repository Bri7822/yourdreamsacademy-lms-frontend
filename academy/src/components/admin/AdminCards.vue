<template>
  <div class="cards-container">
    <div
      v-for="(card, index) in cardsData"
      :key="index"
      class="dashboard-card"
      :class="{'card-animate': cardLoadingComplete, 'card-delay': true}"
      :style="{'animation-delay': `${index * 100}ms`}"
    >
      <div class="card-header">
        <i :class="card.icon"></i>
        <h4>{{ card.title }}</h4>
      </div>
      <div class="card-content">
        <div class="card-stat">
          {{ card.value }}
        </div>
        <p>{{ card.description }}</p>
      </div>
      <div class="card-footer">
        <router-link :to="{ name: card.route }">{{ card.actionText }}</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  statistics: {
    type: Object,
    required: true,
    default: () => ({
      users: 0,
      courses: 0,
      enrollments: 0,
      revenue: 0
    })
  },
  cardLoadingComplete: {
    type: Boolean,
    default: false
  }
})

const cardsData = computed(() => [
  {
    icon: 'fas fa-users',
    title: 'User Management',
    value: props.statistics.users.toLocaleString(),
    description: 'Total Registered Users',
    route: 'admin-users',
    actionText: 'Manage Users'
  },
  {
    icon: 'fas fa-book',
    title: 'Courses',
    value: props.statistics.courses.toLocaleString(),
    description: 'Active Courses',
    route: 'admin-courses',
    actionText: 'Manage Courses'
  },
  {
    icon: 'fas fa-user-graduate',
    title: 'Enrollments',
    value: props.statistics.enrollments.toLocaleString(),
    description: 'Total Enrollments',
    route: 'admin-enrollments',
    actionText: 'Manage Enrollments'
  },
  {
    icon: 'fas fa-chart-line',
    title: 'Revenue',
    value: `$${props.statistics.revenue.toLocaleString()}`,
    description: 'Monthly Revenue',
    route: 'admin-revenue',
    actionText: 'Manage Revenue'
  }
])
</script>

<style scoped>
.cards-container {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.dashboard-card {
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--shadow-color);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 12px;
  display: flex;
  align-items: center;
  background-color: rgba(8, 121, 144, 0.03);
  border-bottom: 1px solid var(--border-color);
}

.card-header i {
  font-size: var(--fs-lg);
  color: var(--primary-color);
  margin-right: 8px;
}

.card-header h4 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}

.card-content {
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.card-stat {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1;
  margin-bottom: 5px;
}

.card-content p {
  margin: 0;
  color: var(--secondary-color);
  font-size: 0.8rem;
}

.card-footer {
  padding: 8px 12px;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.card-footer a {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 500;
  transition: color 0.2s ease;
}

.card-footer a:hover {
  color: #065e6f;
  text-decoration: underline;
}

.card-animate {
  animation: cardAppear 0.4s ease forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes cardAppear {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1200px) {
  .cards-container {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .cards-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .cards-container {
    grid-template-columns: 1fr;
  }

  .card-header {
    padding: 8px;
  }

  .card-stat {
    font-size: 1.2rem;
  }
}
</style>