<template>
  <div class="lessons-view">
    <h3 class="section-title">Lessons Overview</h3>
    <p>Access and go through your enrolled course lessons.</p>

    <div class="lessons-container">
      <div class="lessons-content">
        <div class="lessons-toolbar">
          <div class="search-and-sort">
            <div class="lessons-search">
              <input type="text" placeholder="Search enrolled courses..." v-model="coursesSearchQuery">
              <i class="fas fa-search"></i>
            </div>
          </div>
        </div>

        <div v-if="loading" class="loading-container">
          <div class="spinner"></div>
          <p>Loading your enrolled courses...</p>
        </div>

        <div v-else-if="error" class="error-container">
          <p class="error-message">{{ error }}</p>
          <button @click="fetchCourses" class="retry-button">Retry</button>
        </div>

        <div v-else-if="!loading && !error && courses.length === 0" class="empty-state">
          <div class="empty-content">
            <i class="fas fa-book-open"></i>
            <h3>No Enrolled Courses</h3>
            <p>You haven't enrolled in any courses yet. Browse available courses to get started.</p>
            <router-link to="/courses" class="enroll-button">Browse Courses</router-link>
          </div>
        </div>

        <div v-else class="lessons-list">
          <div
            class="lesson-card"
            v-for="(course, index) in filteredCourses"
            :key="course.id"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="lesson-content">
              <div class="lesson-header">
                <h5>{{ course.title }}</h5>
                <span class="lesson-date">{{ course.code }}</span>
              </div>
              <div class="lesson-preview">
                {{ course.description }}
              </div>
              <div class="lesson-footer">
                <div class="lesson-info">
                  <!-- Bootstrap d-flex for status alignment -->
                  <div class="d-flex justify-content-between align-items-center w-100">
                    <span class="lesson-course">{{ course.total_lessons || 0 }} Lessons • {{ course.total_exercises || 0 }} Exercises</span>
                    <div class="lesson-status">
                      <span v-if="course.progress === 100" class="completed-badge">Completed</span>
                      <span v-else class="progress-badge">{{ course.progress || 0 }}% Complete</span>
                    </div>
                  </div>

                  <div class="lesson-actions mt-2">
                    <!-- UPDATED: Navigate to course lessons instead of course detail -->
                    <button
                      @click="startLearning(course)"
                      class="access-lessons"
                    >
                      <i class="fas fa-play-circle"></i>
                      {{ course.progress > 0 ? 'Continue Learning' : 'Start Learning' }}
                    </button>
                    <button
                      @click="openCourse(course)"
                      class="access-lessons secondary"
                    >
                      <i class="fas fa-info-circle"></i>
                      Course Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="filteredCourses.length === 0 && courses.length > 0" class="no-lessons">
            <p>No enrolled courses match your search criteria.</p>
            <button @click="coursesSearchQuery = ''" class="enroll-button">Clear Search</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { useLessonStore } from '@/stores/lesson';
import { generateSlug } from '@/utils/slugUtils'

const router = useRouter();
const authStore = useAuthStore();

// Animation state
const isMounted = ref(false);
const loading = ref(false);
const error = ref(null);

onMounted(() => {
  // Trigger the entrance animation after a short delay
  setTimeout(() => {
    isMounted.value = true;
  }, 100);

  // Fetch enrolled courses from backend
  fetchCourses();
});

// Courses data from backend
const courses = ref([]);

// ✅ FIXED: Fetch ONLY enrolled courses using dashboard endpoint
const fetchCourses = async () => {
  loading.value = true;
  error.value = null;

  try {
    console.log('📚 Fetching ENROLLED courses for dashboard...');

    // ✅ CRITICAL: Use DASHBOARD endpoint for enrolled courses only
    const response = await axios.get('/api/student/dashboard/courses/', {
      headers: {
        'Authorization': `Bearer ${authStore.accessToken}`
      }
    });

    console.log('✅ Dashboard courses API response:', response.data);

    // Handle response format
    let coursesData = [];
    if (response.data && Array.isArray(response.data.courses)) {
      coursesData = response.data.courses;
    } else if (response.data && Array.isArray(response.data)) {
      coursesData = response.data;
    } else {
      coursesData = [];
    }

    // ✅ Filter to only include enrolled courses (should already be filtered by backend)
    const enrolledCourses = coursesData.filter(course =>
      course.enrollment_status === 'approved' ||
      course.enrollment_status === 'completed' ||
      course.enrollment_status === 'enrolled'
    );

    console.log(`📊 Total enrolled courses: ${enrolledCourses.length}`);

    // Log individual course data for debugging
    enrolledCourses.forEach((course, index) => {
      console.log(`Enrolled Course ${index + 1}:`, {
        title: course.title,
        code: course.code,
        enrollment_status: course.enrollment_status,
        progress: course.progress,
        lessons: course.total_lessons,
        exercises: course.total_exercises
      });
    });

    courses.value = enrolledCourses;

  } catch (err) {
    console.error('❌ Failed to fetch enrolled courses:', err);

    if (err.response?.status === 401) {
      error.value = 'Your session has expired. Please log in again.';
      // Optionally redirect to login
      // router.push('/login');
    } else if (err.response?.status === 403) {
      error.value = 'You are not authorized to view enrolled courses.';
    } else if (err.response?.data?.detail) {
      error.value = err.response.data.detail;
    } else {
      error.value = 'Failed to load your enrolled courses. Please try again.';
    }
  } finally {
    loading.value = false;
  }
};

// Make sure the startLearning method uses generateSlug:
const startLearning = async (course) => {
  const lessonStore = useLessonStore()

  console.log('\n' + '='.repeat(80))
  console.log('🚀 LESSONS VIEW: Starting enrolled course')
  console.log('Course:', course.title)
  console.log('Code:', course.code)
  console.log('Progress:', course.progress + '%')
  console.log('='.repeat(80) + '\n')

  lessonStore.clearCourseData(course.code)
  lessonStore.resetCurrentCourse()

  sessionStorage.removeItem('activeCourseSlug')
  sessionStorage.setItem('lessonNavigationSource', 'student-lessons-view')

  // ✅ Load lessons first
  await lessonStore.loadLessons(course.code)

  if (lessonStore.lessons.length === 0) {
    console.error('❌ No lessons available for this course')
    return
  }

  const firstLesson = lessonStore.lessons[0]
  const firstLessonSlug = generateSlug(firstLesson.title)

  console.log('🎯 Navigating to lesson:', {
    courseSlug: course.code,
    lessonSlug: firstLessonSlug,
    lessonId: firstLesson.id,
    lessonTitle: firstLesson.title
  })

  // ✅ CORRECT: Use lessonSlug
  router.push({
    name: 'student-lesson-detail',
    params: {
      courseSlug: course.code,
      lessonSlug: firstLessonSlug
    },
    query: {
      courseId: course.id,
      courseTitle: course.title,
      source: 'lessons-view',
      progress: course.progress,
      t: Date.now()
    }
  })
}

// Navigate to course detail
const openCourse = (course) => {
  router.push({
    name: 'student-course-detail',
    params: {
      courseSlug: course.code
    },
    query: {
      source: 'lessons-view'
    }
  });
};

const coursesSearchQuery = ref('');

const filteredCourses = computed(() => {
  let result = [...courses.value];

  if (coursesSearchQuery.value) {
    const query = coursesSearchQuery.value.toLowerCase();
    result = result.filter(course =>
      (course.title || '').toLowerCase().includes(query) ||
      (course.code || '').toLowerCase().includes(query) ||
      (course.description || '').toLowerCase().includes(query)
    );
  }

  return result;
});
</script>

<style scoped>
.loading-container, .error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color, #087990);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  color: #e74c3c;
  margin-bottom: 1rem;
}

.retry-button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.retry-button:hover {
  background-color: #2980b9;
}

.lesson-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden; /* Ensure status badge stays within card bounds */
}

.lesson-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

/* Content area with background color */
.lesson-content {
  background-color: rgba(8, 121, 144, 0.03);
  padding: 12px;
}

.completed-badge {
  background-color: #27ae60;
  color: white;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
}

.progress-badge {
  background-color: var(--primary-color);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
}

.no-lessons {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
}

.enroll-button {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}

.enroll-button:hover {
  background-color: #2980b9;
}

/* Updated button and layout styles */
.lesson-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lesson-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.access-lessons {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.4rem 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.7rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.2s;
  white-space: nowrap;
}

.access-lessons:hover {
  background: var(--primary-color-dark, #065a6b);
  transform: translateY(-1px);
}

.access-lessons:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.access-lessons.secondary {
  background: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
}

.access-lessons.secondary:hover {
  background: var(--primary-color);
  color: white;
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
    opacity: 0;
    transform: translateY(-10px);
    animation: fadeInUp 0.5s ease forwards;
    animation-delay: 0.2s;
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

.lessons-view p {
  opacity: 0;
  transform: translateY(-10px);
  animation: fadeInUp 0.5s ease forwards;
  animation-delay: 0.3s;
  margin-bottom: 20px;
}

.lessons-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.lessons-content {
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--shadow-color);
  padding: 15px;
  display: flex;
  flex-direction: column;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.6s ease forwards;
  animation-delay: 0.4s;
}

.lessons-toolbar {
  margin-bottom: 15px;
  opacity: 0;
  animation: fadeIn 0.5s ease forwards;
  animation-delay: 0.6s;
}

.search-and-sort {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.lessons-search {
  position: relative;
  flex: 1;
}

.lessons-search input {
  width: 100%;
  padding: 8px 30px 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.lessons-search input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(8, 121, 144, 0.1);
}

.lessons-search i {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--secondary-color);
}

.lessons-list {
  display: grid;
  gap: 15px;
}

.lesson-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.lesson-header h5 {
  margin: 0;
  font-size: 0.9rem;
  color: var(--primary-color);
  font-weight: 600;
}

.lesson-date {
  font-size: 0.8rem;
  color: var(--secondary-color);
}

.lesson-preview {
  font-size: 0.9rem;
  color: var(--secondary-color);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.lesson-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.lesson-course {
  font-size: 0.8rem;
  background-color: rgba(8, 121, 144, 0.1);
  color: var(--primary-color);
  padding: 4px 8px;
  border-radius: 10px;
  display: inline-block;
}

/* Animation keyframes */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Responsive styles */
@media (max-width: 768px) {
  .search-and-sort {
    flex-direction: column;
    align-items: stretch;
  }

  .lesson-actions {
    flex-direction: column;
  }

  .access-lessons {
    justify-content: center;
    width: 100%;
  }

  .progress-badge{
    display: none;
  }

  /* Responsive adjustments for Bootstrap flex */
  .d-flex {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 8px;
  }

  .lesson-status {
    align-self: flex-end;
  }
}
</style>