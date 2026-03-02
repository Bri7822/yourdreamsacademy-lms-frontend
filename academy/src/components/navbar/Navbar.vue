<template>
  <div class="header-wrapper">
    <div class="fixed-navbar">
      <nav class="navbar navbar-expand-lg navbar-custom">
        <div class="container position-relative">
          <!-- Logo on the left -->
          <router-link to="/" class="navbar-brand navbar-brand-custom">
            <img src="/src/assets/logo/1.png" alt="YDA" class="navbar-brand-logo">
          </router-link>

          <!-- Hamburger menu for mobile with dynamic icon -->
          <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#main_nav"
                  aria-controls="main_nav" :aria-expanded="isNavbarExpanded" aria-label="Toggle navigation"
                  @click="toggleNavbar">
            <i :class="['fas', isNavbarExpanded ? 'fa-times' : 'fa-bars', 'navbar-toggler-icon-custom']"></i>
          </button>

          <!-- Navigation items and auth buttons container -->
          <div class="collapse navbar-collapse" id="main_nav" ref="navbarCollapse">
            <!-- This wrapper ensures proper centering -->
            <div class="nav-wrapper w-100 d-flex justify-content-center">
              <!-- Nav items centered -->
              <ul class="navbar-nav mx-auto">
                <li class="nav-item nav-item-custom">
                  <router-link to="/" class="nav-link nav-link-custom" :class="{ 'active': isRouteActive('/')}">
                    <i class="fas fa-home me-1"></i> Home
                  </router-link>
                </li>
                <li class="nav-item nav-item-custom dropdown" @mouseenter="showDropdown('courses')" @mouseleave="hideDropdown('courses')">
                  <router-link to="/courses" class="nav-link nav-link-custom" :class="{ 'active': isRouteActive('/courses')}">
                    <i class="fas fa-graduation-cap me-1"></i> Courses
                  </router-link>
                  <div class="dropdown-menu" :class="{ 'show': activeDropdown === 'courses' }">
                    <router-link to="/courses/all" class="dropdown-item">All Courses</router-link>
                    <router-link to="/courses/popular" class="dropdown-item">Popular Courses</router-link>
                    <router-link to="/courses/new" class="dropdown-item">New Courses</router-link>
                  </div>
                </li>
                <li class="nav-item nav-item-custom dropdown" @mouseenter="showDropdown('tutorials')" @mouseleave="hideDropdown('tutorials')">
                    <router-link to="/lessons" class="nav-link nav-link-custom" :class="{ 'active': isRouteActive('/lessons')}">
                      <i class="fas fa-video me-1"></i> Lessons
                    </router-link>
                  <div class="dropdown-menu" :class="{ 'show': activeDropdown === 'tutorials' }">
                    <router-link to="/tutorials/video" class="dropdown-item">Video Tutorials</router-link>
                    <router-link to="/tutorials/step-by-step" class="dropdown-item">Step-by-Step Guides</router-link>
                  </div>
                </li>
                <li class="nav-item nav-item-custom dropdown" @mouseenter="showDropdown('exercises')" @mouseleave="hideDropdown('exercises')">
                  <router-link to="/exercises" class="nav-link nav-link-custom" :class="{ 'active': isRouteActive('/exercises')}">
                    <i class="fas fa-dumbbell me-1"></i> Exercises
                  </router-link>
                  <div class="dropdown-menu" :class="{ 'show': activeDropdown === 'exercises' }">
                    <router-link to="/exercises/practice" class="dropdown-item">Practice Exercises</router-link>
                    <router-link to="/exercises/quizzes" class="dropdown-item">Quizzes</router-link>
                  </div>
                </li>
                <li class="nav-item nav-item-custom dropdown" @mouseenter="showDropdown('certificates')" @mouseleave="hideDropdown('certificates')">
                  <router-link to="/certificates" class="nav-link nav-link-custom" :class="{ 'active': isRouteActive('/certificates')}">
                    <div class="nav-link-content">
                      <i class="fas fa-certificate me-1"></i>
                      <span class="nav-link-text">Certificates</span>
                      <!-- Under Development Badge -->
                      <span class="nav-badge">
                        <span class="badge-text">Dev</span>
                        <span class="badge-pulse"></span>
                      </span>
                    </div>
                  </router-link>
                  <div class="dropdown-menu" :class="{ 'show': activeDropdown === 'certificates' }">
                    <router-link to="/certificates/my-certificates" class="dropdown-item">
                      <span class="dropdown-item-content">
                        My Certificates
                        <span class="dropdown-badge">Dev</span>
                      </span>
                    </router-link>
                    <router-link to="/certificates/verify" class="dropdown-item">
                      <span class="dropdown-item-content">
                        Verify Certificate
                        <span class="dropdown-badge">Dev</span>
                      </span>
                    </router-link>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Mobile nav items for authenticated users -->
            <ul class="navbar-nav mobile-nav-items d-lg-none">
              <!-- Student mobile nav items -->
              <template v-if="authStore.isAuthenticated && authStore.isStudent">
                <li class="nav-item nav-item-custom">
                  <router-link to="/student" class="nav-link nav-link-custom" :class="{ 'active': isRouteActive('/student')}">
                    <i class="fas fa-tachometer-alt me-1"></i> Dashboard
                  </router-link>
                </li>
                <li class="nav-item nav-item-custom">
                  <router-link to="/student/courses" class="nav-link nav-link-custom" :class="{ 'active': isRouteActive('/student/courses')}">
                    <i class="fas fa-book me-1"></i> My Courses
                  </router-link>
                </li>
                <li class="nav-item nav-item-custom">
                  <router-link to="/student/grades" class="nav-link nav-link-custom" :class="{ 'active': isRouteActive('/student/grades')}">
                    <i class="fas fa-chart-bar me-1"></i> My Grades
                  </router-link>
                </li>
                <li class="nav-item nav-item-custom">
                  <router-link to="/student/certificates" class="nav-link nav-link-custom" :class="{ 'active': isRouteActive('/student/certificates')}">
                    <div class="nav-link-content">
                      <i class="fas fa-certificate me-1"></i>
                      <span class="nav-link-text">My Certificates</span>
                      <!-- Under Development Badge for mobile -->
                      <span class="nav-badge">
                        <span class="badge-text">Dev</span>
                        <span class="badge-pulse"></span>
                      </span>
                    </div>
                  </router-link>
                </li>
                <li class="nav-item nav-item-custom">
                  <router-link to="/student/settings" class="nav-link nav-link-custom" :class="{ 'active': isRouteActive('/student/settings')}">
                    <i class="fas fa-cog me-1"></i> Settings
                  </router-link>
                </li>
                <li class="nav-item nav-item-custom">
                  <a href="#" class="nav-link nav-link-custom" @click.prevent="handleLogout">
                    <i class="fas fa-sign-out-alt me-1"></i> Logout
                  </a>
                </li>
              </template>

              <!-- Admin/Teacher mobile nav items -->
              <template v-else-if="authStore.isAuthenticated">
                <li class="nav-item nav-item-custom">
                  <router-link to="/dashboard" class="nav-link nav-link-custom" :class="{ 'active': isRouteActive('/dashboard')}">
                    <i class="fas fa-tachometer-alt me-1"></i> Dashboard
                  </router-link>
                </li>
                <li class="nav-item nav-item-custom">
                  <a href="#" class="nav-link nav-link-custom" @click.prevent="handleLogout">
                    <i class="fas fa-sign-out-alt me-1"></i> Logout
                  </a>
                </li>
              </template>
            </ul>

            <div class="auth-buttons position-lg-absolute end-0">
              <!-- Non-authenticated view -->
              <template v-if="!authStore.isAuthenticated">
                <button class="sign-btn me-2">
                  <router-link to="/login" class="log">Login</router-link>
                </button>
                <button class="sign-btn">
                  <router-link to="/signup" class="log">Signup</router-link>
                </button>
              </template>

              <template v-else-if="authStore.isStudent">
                <div class="user-dropdown d-none d-lg-block" ref="userDropdownRef">
                  <button class="user-dropdown-btn shadow" @click.stop.prevent="toggleUserDropdown">
                    <span class="avatar-small">{{ getUserInitials }}</span>
                    <span class="user-name-small">{{ userName }}</span>
                    <i class="fas fa-chevron-down" :class="{ 'rotate-up': showUserDropdown }"></i>
                  </button>
                  <div :class="['dropdown-menu', {'is-active': showUserDropdown}]">
                    <router-link to="/student" class="fw-500" @click="closeUserDropdown">
                      <i class="fas fa-tachometer-alt"></i> Dashboard
                    </router-link>
                    <router-link to="/student/courses" class="fw-500" @click="closeUserDropdown">
                      <i class="fas fa-book"></i> My Courses
                    </router-link>
                    <router-link to="/student/grades" class="fw-500" @click="closeUserDropdown">
                      <i class="fas fa-chart-bar"></i> My Grades
                    </router-link>
                    <router-link to="/student/certificates" class="fw-500" @click="closeUserDropdown">
                      <div class="dropdown-item-content">
                        <i class="fas fa-certificate"></i> My Certificates
                        <span class="dropdown-badge">Dev</span>
                      </div>
                    </router-link>
                    <div class="dropdown-divider"></div>
                    <router-link to="/student/settings" class="fw-500" @click="closeUserDropdown">
                      <i class="fas fa-user"></i> Profile
                        <span class="dropdown-badge">Dev</span>
                    </router-link>
                    <router-link to="/student/settings" class="fw-500" @click="closeUserDropdown">
                      <i class="fas fa-cog"></i> Settings
                        <span class="dropdown-badge">Dev</span>
                    </router-link>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="fw-500" @click.prevent="handleLogout">
                      <i class="fas fa-sign-out-alt"></i> Logout
                    </a>
                  </div>
                </div>
              </template>

              <!-- Other user types (admin/teacher) -->
              <template v-else>
                <div class="user-dropdown d-none d-lg-block" ref="userDropdownRef">
                  <button class="user-dropdown-btn shadow" @click.stop.prevent="toggleUserDropdown">
                    <span class="avatar-small">{{ getUserInitials }}</span>
                    <span class="user-name-small">{{ userName }}</span>
                    <i class="fas fa-chevron-down" :class="{ 'rotate-up': showUserDropdown }"></i>
                  </button>
                  <div :class="['dropdown-menu', {'is-active': showUserDropdown}]">
                    <router-link to="/dashboard" class="fw-500" @click="closeUserDropdown">
                      <i class="fas fa-tachometer-alt"></i> Dashboard
                    </router-link>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="fw-500" @click.prevent="handleLogout">
                      <i class="fas fa-sign-out-alt"></i> Logout
                    </a>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </nav>

      <!-- Overlay for clicking outside navbar to close -->
      <div
        v-if="isNavbarExpanded && isMobileView"
        class="navbar-overlay"
        @click="closeNavbar"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd">
      </div>

      <!-- Course slider with REAL courses from backend -->
      <div class="course-slider-container">
        <div v-if="coursesLoading && courses.length === 0" class="course-slider-wrapper">
          <!-- Show loading animation with same number of items -->
          <div
            v-for="n in 10"
            :key="n"
            class="course-item loading"
          >
            <div class="loading-placeholder"></div>
          </div>
        </div>

        <div v-else id="course_slider" class="course-slider-wrapper">
          <!-- Real courses from backend -->
          <div
            v-for="course in duplicatedCourses"
            :key="`${course.id}-${course._duplicateIndex || 0}`"
            class="course-item"
            @click="handleCourseClick(course)"
          >
            {{ course.title }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../../stores/auth';
import { useGuestStore } from '../../stores/guest';
import axios from 'axios';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const guestStore = useGuestStore();

// Refs for DOM elements
const customFormControls = ref([]);
const authCard = ref(null);
const formCheckboxes = ref([]);
const navbarCollapse = ref(null);

const courses = ref([]);
const coursesLoading = ref(true);

// Navbar state
const isNavbarExpanded = ref(false);
const isMobileView = ref(false);
const activeDropdown = ref(null);

// Touch handling for swipe to close
const touchStartY = ref(0);
const touchEndY = ref(0);

// Dropdown state
const showUserDropdown = ref(false);
const userDropdownRef = ref(null);

// Fetch courses immediately when component is created
const fetchCourses = async () => {
  coursesLoading.value = true;
  try {
    let endpoint = '/api/student/home/courses/';

    if (authStore.isAuthenticated) {
      endpoint = '/api/student/courses/';
    } else {
      endpoint = '/api/student/guest/courses/';
    }

    const response = await axios.get(endpoint);

    if (response.data && response.data.courses) {
      courses.value = response.data.courses;
    } else {
      courses.value = response.data || [];
    }
  } catch (err) {
    console.error('Failed to fetch courses:', err);
    courses.value = [];
  } finally {
    coursesLoading.value = false;
  }
};

const handleCourseClick = async (course) => {
  console.log('Course clicked:', {
    course: course.title,
    isAuthenticated: authStore.isAuthenticated,
    isStudent: authStore.isStudent,
    isEnrolled: course.is_enrolled
  });

  if (authStore.isAuthenticated && authStore.isStudent) {
    // Authenticated student - go to student layout
    console.log('🔄 Routing to student course layout');

    // Set the active course immediately in session storage
    sessionStorage.setItem('activeCourseSlug', course.code);
    sessionStorage.setItem('activeCourseId', course.id);

    // Navigate to student course layout
    router.push(`/student/courses/${course.code}`);
  } else {
    // Guest or non-student user - go to guest layout
    console.log('🔄 Routing to guest course layout');

    if (!authStore.isAuthenticated) {
      // Ensure guest session is started for non-authenticated users
      try {
        const sessionResult = await guestStore.startGuestSession();
        console.log('✅ Guest session started:', sessionResult);
      } catch (err) {
        console.log('⚠️ Guest session start failed, but continuing...');
      }
    }

    // Navigate to guest course layout
    router.push(`/guest/courses/${course.code}`);
  }
};

// Duplicate courses for infinite scroll effect
const duplicatedCourses = computed(() => {
  if (!courses.value.length) return [];

  const originalCourses = courses.value.map((course, index) => ({
    ...course,
    _originalIndex: index
  }));

  const duplicated = originalCourses.map((course, index) => ({
    ...course,
    _duplicateIndex: index
  }));

  return [...originalCourses, ...duplicated];
});

// Watch route changes to close dropdowns and navbar
watch(() => route.path, () => {
  activeDropdown.value = null;
  showUserDropdown.value = false;
  closeNavbar();
});

// Watch authentication status to refresh courses
watch(() => authStore.isAuthenticated, () => {
  fetchCourses();
});

// Check if current route is active
const isRouteActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/');
};

// Dropdown methods
const showDropdown = (name) => {
  if (!isMobileView.value) {
    activeDropdown.value = name;
  }
};

const hideDropdown = (name) => {
  if (activeDropdown.value === name) {
    activeDropdown.value = null;
  }
};

// Close user dropdown
const closeUserDropdown = () => {
  showUserDropdown.value = false;
};

// Toggle navbar expanded state
const toggleNavbar = () => {
  isNavbarExpanded.value = !isNavbarExpanded.value;
};

// Close navbar
const closeNavbar = () => {
  if (isNavbarExpanded.value) {
    isNavbarExpanded.value = false;

    // Close Bootstrap collapse
    if (navbarCollapse.value) {
      const bsCollapse = new bootstrap.Collapse(navbarCollapse.value, {
        toggle: false
      });
      bsCollapse.hide();
    }
  }
};

// Touch event handlers for swipe to close
const handleTouchStart = (event) => {
  touchStartY.value = event.touches[0].clientY;
};

const handleTouchMove = (event) => {
  touchEndY.value = event.touches[0].clientY;
};

const handleTouchEnd = () => {
  // If swiped up (end position is higher than start position)
  if (touchEndY.value < touchStartY.value && touchStartY.value - touchEndY.value > 50) {
    closeNavbar();
  }

  // Reset touch values
  touchStartY.value = 0;
  touchEndY.value = 0;
};

// Handle logout
const handleLogout = () => {
  closeUserDropdown();
  authStore.logout();
  router.push('/login');
};

// Toggle user dropdown with improved handling
const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value;
};

// Click outside handler
const handleDocumentClick = (event) => {
  if (showUserDropdown.value && userDropdownRef.value && !userDropdownRef.value.contains(event.target)) {
    showUserDropdown.value = false;
  }

  if (activeDropdown.value && !event.target.closest('.dropdown') && !event.target.closest('.nav-item-custom')) {
    activeDropdown.value = null;
  }
};

// Get user initials for avatar
const getUserInitials = computed(() => {
  const user = authStore.user
  if (!user) return ''
  return `${user.first_name?.charAt(0) || ''}${user.last_name?.charAt(0) || ''}`
});

const userName = computed(() => {
  return authStore.user?.first_name || 'User'
});

// Check window size to determine mobile view
const checkWindowSize = () => {
  isMobileView.value = window.innerWidth < 992;
};

// Listen for Bootstrap collapse events to sync our state
const listenForCollapseEvents = () => {
  if (navbarCollapse.value) {
    navbarCollapse.value.addEventListener('shown.bs.collapse', () => {
      isNavbarExpanded.value = true;
    });

    navbarCollapse.value.addEventListener('hidden.bs.collapse', () => {
      isNavbarExpanded.value = false;
    });
  }
};

// Initialize animations and event listeners
const initAnimations = () => {
  // Input field animation
  customFormControls.value.forEach(control => {
    control.addEventListener('focus', () => {
      control.classList.add('focus-active');
    });
    control.addEventListener('blur', () => {
      control.classList.remove('focus-active');
    });
  });

  // Auth card animation
  if (authCard.value) {
    authCard.value.classList.add('animate-in');
  }

  // Checkbox styling
  formCheckboxes.value.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        checkbox.classList.add('checked');
      } else {
        checkbox.classList.remove('checked');
      }
    });
  });
};

// Add event listeners after mount
onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
  window.addEventListener('resize', checkWindowSize);

  checkWindowSize();
  initAnimations();

  // Fetch courses immediately
  fetchCourses();

  nextTick(() => {
    listenForCollapseEvents();
  });

  // Make navbar sticky on scroll
  const stickyNavbar = document.querySelector('.sticky-navbar');
  if (stickyNavbar) {
    const observer = new IntersectionObserver(
      ([e]) => e.target.classList.toggle('is-sticky', e.intersectionRatio < 1),
      {threshold: [1]}
    );
    observer.observe(stickyNavbar);
  }
});

// Clean up event listeners when component is unmounted
onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick);
  window.removeEventListener('resize', checkWindowSize);

  // Remove Bootstrap-specific listeners
  if (navbarCollapse.value) {
    navbarCollapse.value.removeEventListener('shown.bs.collapse', null);
    navbarCollapse.value.removeEventListener('hidden.bs.collapse', null);
  }

  // Clean up custom event listeners
  customFormControls.value.forEach(control => {
    control.removeEventListener('focus', null);
    control.removeEventListener('blur', null);
  });

  formCheckboxes.value.forEach(checkbox => {
    checkbox.removeEventListener('change', null);
  });
});
</script>

<style scoped>
/* Your existing styles remain exactly the same */
:root {
  --primary-color: #087990;
  --secondary-color: #444;
  --background-color: #3a2b2b;
  --light-accent: rgba(255, 255, 255, 0.2);
  --gray-bg: #f5f5f5;
  --border-color: #ddd;
  --shadow-color: rgba(0, 0, 0, 0.1);

  --font-heading: 'Poppins', sans-serif;
  --font-body: 'Manrope', sans-serif;
  --fs-xs: 0.675rem;
  --fs-sm: 0.79rem;
  --fs-base: 0.9rem;
  --fs-md: 1.01rem;
  --fs-lg: 1.125rem;
  --fs-xl: 1.35rem;
  --fs-2xl: 1.575rem;
  --fs-3xl: 1.8rem;
  --fs-4xl: 2.25rem;
}

/* Under Development Badge Styles */
.nav-link-content {
  display: flex;
  align-items: center;
  position: relative;
}

.nav-link-text {
  margin-right: 4px;
}

.nav-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #ff9800, #ff5722);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  animation: pulse-badge 2s infinite;
  box-shadow: 0 2px 4px rgba(255, 87, 34, 0.3);
  margin-left: 4px;
  white-space: nowrap;
  line-height: 1;
  height: 16px;
}

.badge-text {
  position: relative;
  z-index: 2;
}

.badge-pulse {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #ff9800, #ff5722);
  border-radius: 10px;
  animation: pulse-badge 2s infinite;
  z-index: 1;
}

.dropdown-item-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.dropdown-badge {
  background: linear-gradient(135deg, #ff9800, #ff5722);
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  animation: pulse-badge 2s infinite;
  box-shadow: 0 1px 3px rgba(255, 87, 34, 0.3);
  margin-left: 8px;
}

/* Pulse animation for badges */
@keyframes pulse-badge {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.7);
  }
  70% {
    box-shadow: 0 0 0 4px rgba(255, 152, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0);
  }
}

.navbar-toggler {
  z-index: 5002;
}

.navbar-toggler-icon-custom {
  font-size: 1.5rem;
  color: var(--secondary-color);
  transition: color 1s ease;
}

.fixed-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  z-index: 9999;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.navbar-toggler:focus .navbar-toggler-icon-custom,
.navbar-toggler:active .navbar-toggler-icon-custom,
.fa-times.navbar-toggler-icon-custom {
  color: var(--primary-color) !important;
}

.navbar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 4999;
}

.user-dropdown {
  position: relative;
  margin-left: 10px;
  z-index: 5000;
}

.fw-500 {
  font-weight: 500;
}

.user-dropdown-btn {
  display: flex;
  align-items: center;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 5px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-dropdown-btn:hover {
  background-color: var(--gray-bg);
}

.avatar-small {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  margin-right: 8px;
}

.fa-chevron-down{
  color: var(--primary-color);
  transition: transform 0.3s ease;
}

/* Add rotation class for chevron */
.fa-chevron-down.rotate-up {
  transform: rotate(180deg);
}

.user-name-small {
  font-weight: 500;
  margin-right: 8px;
  font-size: 14px;
  color: var(--secondary-color);
}

.nav-item-custom.dropdown {
  position: relative;
}

.nav-item-custom .dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  display: none;
  min-width: 10rem;
  padding: 0.5rem 0;
  margin: 0.125rem 0 0;
  font-size: 1rem;
  color: #212529;
  text-align: left;
  list-style: none;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 0.25rem;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.175);
}

.nav-item-custom .dropdown-menu.show {
  display: block;
}

.nav-item-custom .dropdown-item {
  display: block;
  width: 100%;
  padding: 0.25rem 1.5rem;
  clear: both;
  font-weight: 400;
  color: #212529;
  text-align: inherit;
  white-space: nowrap;
  background-color: transparent;
  border: 0;
  transition: all 0.2s ease;
}

.nav-item-custom .dropdown-item:hover {
  color: #16181b;
  background-color: #f8f9fa;
}

.navbar-nav {
  position: relative;
  z-index: 5000;
}

.nav-item-custom {
  position: relative;
  z-index: 5000;
}

.mobile-nav-items {
  width: 100%;
  padding-top: 0.5rem;
  margin-top: 0.5rem;
  border-top: 1px solid var(--border-color);
}

.dropdown-menu {
  position: absolute;
  top: 48.5px;
  right: 0;
  left: .1rem;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  min-width: 219px;
  z-index: 5000 !important;
  border: 1px solid var(--border-color);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: opacity 0.3s, visibility 0.3s, transform 0.3s;
  display: block !important;
}

.dropdown-menu.is-active {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-menu a {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  color: var(--secondary-color);
  text-decoration: none;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.dropdown-menu a:hover {
  background-color: var(--gray-bg);
  color: var(--primary-color);
}

.dropdown-menu a i {
  margin-right: 10px;
  width: 16px;
  text-align: center;
}

.dropdown-divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 5px 0;
}

.navbar-custom {
  position: relative;
  z-index: 5001;
}

.navbar-collapse {
  position: relative;
  z-index: 5001;
}

.header-wrapper{
  margin-bottom: 4rem !important;
}

@keyframes scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

@media (max-width: 991.98px) {
  .navbar-nav.mx-auto {
    margin-left: 0 !important;
    margin-right: 0 !important;
    width: 100%;
  }

  .auth-buttons {
    margin-left: -1rem !important;
    margin-right: 0 !important;
    width: 100%;
    padding-left:0;
  }

  .navbar-collapse {
    transition: transform 0.3s ease;
  }

  .navbar-collapse::after {
    content: '';
    display: block;
    width: 40px;
    height: 5px;
    background-color: var(--border-color);
    border-radius: 5px;
    margin: 10px auto 5px;
    opacity: 0.7;
  }

  /* Adjust badge for mobile */
  .nav-badge {
    font-size: 8px;
    padding: 1px 4px;
    height: 14px;
  }
}

@media (max-width: 768px) {
  .nav-badge {
    font-size: 7px;
    padding: 1px 3px;
    height: 12px;
  }

  .dropdown-badge {
    font-size: 7px;
    padding: 1px 4px;
  }
}
</style>
