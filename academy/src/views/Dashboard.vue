<template>
    <div class="dashboard-container">

      <div class="dashboard-sidebar" :class="{ 'collapsed': sidebarCollapsed }">
        <div class="logo-container">
          <h1 class="dashboard-logo ms-1">Dreams Academy</h1>
          <button class="sidebar-toggle me-3" @click="toggleSidebar">
            <i :class="sidebarCollapsed ? 'fas fa-bars' : 'fas fa-times'"></i>
          </button>
        </div>
        
        <div class="user-profile">
          <div class="avatar">
            <span class="avatar-initial">{{ getUserInitials }}</span>
          </div>
          <div class="user-info" v-if="!sidebarCollapsed">
            <h3 class="user-name">{{ user.first_name }} {{ user.last_name }}</h3>
            <span class="user-role">{{ user.user_type === 'teacher' ? 'Teacher' : 'Student' }}</span>
          </div>
        </div>
        
        <nav class="sidebar-nav">
          <ul>
            <li v-for="(item, index) in navItems" :key="index" 
                :class="{ 'active': activeNavItem === item.id }">
              <a href="#" @click.prevent="setActiveNavItem(item.id); handleButtonClick($event)"
                 :class="getButtonClass(activeNavItem === item.id)">
                <i :class="item.icon"></i>
                <span v-if="!sidebarCollapsed">{{ item.label }}</span>
              </a>
            </li>
          </ul>
        </nav>
        
        <div class="sidebar-footer">
          <button class="logout-btn" @click="handleLogout">
            <i class="fas fa-sign-out-alt"></i>
            <span v-if="!sidebarCollapsed">Logout</span>
          </button>
        </div>
      </div>
      
      <div class="dashboard-main">
          <header class="dashboard-header">
            <div class="page-title">
              <h2>{{ currentPageTitle }}</h2>
            </div>
            <div class="header-actions">
                    <router-link 
                to="/" 
                class="header-action-btn" 
                title="Home"
                exact-active-class="active"
              >
                <i class="fas fa-home"></i>
              </router-link>

              <!-- Notification Bell -->
                <button class="header-action-btn notification-btn" title="Notifications">
                  <i class="fas fa-bell"></i>
                  <span class="notification-badge" v-if="notificationCount > 0">
                    {{ notificationCount }}
                  </span>
                </button>
             </div>
        </header>
        
        <main class="dashboard-content">
          <!-- Use Vue transition for page changes -->
          <Transition name="fade" mode="out-in">
            <!-- Dashboard - Home -->
            <div v-if="activeNavItem === 'dashboard'" class="dashboard-section" key="dashboard"
                 :class="{ 'fading': pageTransitioning }">
              <div class="dashboard-greeting">
                <h3>Welcome back, {{ user.first_name }}!</h3>
                <p>{{ welcomeMessage }}</p>
              </div>
              
              <div class="cards-container">
                <!-- Teacher Dashboard -->
                <template v-if="user.user_type === 'teacher'">
                  <div v-for="(item, index) in 3" :key="'teacher-card-'+index"
                       :class="getCardClass(index)"
                       :style="getCardStyle(index)">
                    <!-- Card 1 -->
                    <div v-if="index === 0" class="card-header">
                      <i class="fas fa-users"></i>
                      <h4>Classes</h4>
                    </div>
                    <div v-if="index === 0" class="card-content">
                      <div class="card-stat">5</div>
                      <p>Active Classes</p>
                    </div>
                    <div v-if="index === 0" class="card-footer">
                      <a href="#" @click.prevent="setActiveNavItem('classes')">Manage Classes</a>
                    </div>
                    
                    <!-- Card 2 -->
                    <div v-if="index === 1" class="card-header">
                      <i class="fas fa-book"></i>
                      <h4>Assignments</h4>
                    </div>
                    <div v-if="index === 1" class="card-content">
                      <div class="card-stat">12</div>
                      <p>Pending Reviews</p>
                    </div>
                    <div v-if="index === 1" class="card-footer">
                      <a href="#" @click.prevent="setActiveNavItem('assignments')">Review Assignments</a>
                    </div>
                    
                    <!-- Card 3 -->
                    <div v-if="index === 2" class="card-header">
                      <i class="fas fa-clipboard-list"></i>
                      <h4>Attendance</h4>
                    </div>
                    <div v-if="index === 2" class="card-content">
                      <div class="card-stat">89<span class="percent">%</span></div>
                      <p>Average Attendance</p>
                    </div>
                    <div v-if="index === 2" class="card-footer">
                      <a href="#" @click.prevent="setActiveNavItem('attendance')">View Reports</a>
                    </div>
                  </div>
                </template>
                
                <!-- Student Dashboard -->
                <template v-else>
                  <div v-for="(item, index) in 3" :key="'student-card-'+index"
                       :class="getCardClass(index)"
                       :style="getCardStyle(index)">
                    <!-- Card 1 -->
                    <div v-if="index === 0" class="card-header">
                      <i class="fas fa-book-open"></i>
                      <h4>Courses</h4>
                    </div>
                    <div v-if="index === 0" class="card-content">
                      <div class="card-stat">4</div>
                      <p>Enrolled Courses</p>
                    </div>
                    <div v-if="index === 0" class="card-footer">
                      <a href="#" @click.prevent="setActiveNavItem('courses')">View Courses</a>
                    </div>
                    
                    <!-- Card 2 -->
                    <div v-if="index === 1" class="card-header">
                      <i class="fas fa-tasks"></i>
                      <h4>Assignments</h4>
                    </div>
                    <div v-if="index === 1" class="card-content">
                      <div class="card-stat">3</div>
                      <p>Due This Week</p>
                    </div>
                    <div v-if="index === 1" class="card-footer">
                      <a href="#" @click.prevent="setActiveNavItem('assignments')">View Assignments</a>
                    </div>
                    
                    <!-- Card 3 -->
                    <div v-if="index === 2" class="card-header">
                      <i class="fas fa-chart-line"></i>
                      <h4>Progress</h4>
                    </div>
                    <div v-if="index === 2" class="card-content">
                      <div class="card-stat">76<span class="percent">%</span></div>
                      <p>Overall Completion</p>
                    </div>
                    <div v-if="index === 2" class="card-footer">
                      <a href="#" @click.prevent="setActiveNavItem('progress')">View Progress</a>
                    </div>
                  </div>
                </template>
              </div>
              
              <div class="recent-activity">
                <h3 class="section-title">Recent Activity</h3>
                <ul class="activity-list">
                  <li v-for="(activity, index) in recentActivities" :key="index" 
                      class="activity-item">
                    <div class="activity-icon">
                      <i :class="activity.icon"></i>
                    </div>
                    <div class="activity-content">
                      <p class="activity-text">{{ activity.text }}</p>
                      <span class="activity-time">{{ activity.time }}</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <!-- Other sections content is loaded conditionally -->
            <div v-else-if="activeNavItem === 'classes' && user.user_type === 'teacher'" 
                 class="dashboard-section" key="classes">
              <h3 class="section-title">Your Classes</h3>
              <p>Manage your classes, view student progress, and create new assignments.</p>
              <!-- Classes content would go here -->
            </div>
            
            <div v-else-if="activeNavItem === 'courses' && user.user_type === 'student'" 
                 class="dashboard-section" key="courses">
              <h3 class="section-title">Your Courses</h3>
              <p>Access your enrolled courses, view lectures, and track your progress.</p>
              <!-- Courses content would go here -->
            </div>
            
            <div v-else-if="activeNavItem === 'assignments'" 
                 class="dashboard-section" key="assignments">
              <h3 class="section-title">
                {{ user.user_type === 'teacher' ? 'Assignment Reviews' : 'Your Assignments' }}
              </h3>
              <p>
                {{ user.user_type === 'teacher' 
                  ? 'Review and grade student submissions.' 
                  : 'View your upcoming and completed assignments.' }}
              </p>
              <!-- Assignments content would go here -->
            </div>
            
            <div v-else-if="activeNavItem === 'calendar'" 
                 class="dashboard-section" key="calendar">
              <h3 class="section-title">Calendar</h3>
              <p>View upcoming events, deadlines, and schedule.</p>
              <!-- Calendar content would go here -->
            </div>
            
            <div v-else-if="activeNavItem === 'messages'" 
                 class="dashboard-section" key="messages">
              <h3 class="section-title">Messages</h3>
              <p>Communicate with students, teachers, and administration.</p>
              <!-- Messages content would go here -->
            </div>
            
            <div v-else-if="activeNavItem === 'profile'" 
                 class="dashboard-section" key="profile">
              <h3 class="section-title">Your Profile</h3>
              <p>View and edit your profile information.</p>
              <!-- Profile content would go here -->
            </div>
            
            <div v-else-if="activeNavItem === 'settings'" 
                 class="dashboard-section" key="settings">
              <h3 class="section-title">Account Settings</h3>
              <p>Manage your account preferences and settings.</p>
              <!-- Settings content would go here -->
            </div>
          </Transition>
        </main>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// User data (mock data that would come from your auth store)
const user = ref({
  id: 1,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  user_type: 'teacher', // can be 'teacher' or 'student'
});

// Animation states
const cardLoadingComplete = ref(false);
const pageTransitioning = ref(false);

// Set user from auth store on component mount
onMounted(() => {
  if (authStore.user) {
    user.value = authStore.user;
  } else {
    // Redirect to login if no user in auth store
    router.push('/login');
  }
  
  // Add click event listener to document for closing dropdown
  document.addEventListener('click', handleDocumentClick);
  
  // Initialize card animations with staggered delay
  initCardAnimations();
});

onUnmounted(() => {
  // Remove event listeners on component unmount
  document.removeEventListener('click', handleDocumentClick);
});

// Initialize card animations
const initCardAnimations = () => {
  // Use setTimeout to simulate jQuery's delayed animations
  setTimeout(() => {
    cardLoadingComplete.value = true;
  }, 100);
};

// Navigation state
const sidebarCollapsed = ref(false);
const activeNavItem = ref('dashboard');
const showUserDropdown = ref(false);
const userDropdown = ref(null);
const notificationCount = ref(3);
// const dashboardSection = ref(null);

// Teacher navigation items
const teacherNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
  { id: 'classes', label: 'Classes', icon: 'fas fa-users' },
  { id: 'assignments', label: 'Assignments', icon: 'fas fa-book' },
  { id: 'calendar', label: 'Calendar', icon: 'fas fa-calendar-alt' },
  { id: 'messages', label: 'Messages', icon: 'fas fa-envelope' },
  { id: 'attendance', label: 'Attendance', icon: 'fas fa-clipboard-list' },
  { id: 'resources', label: 'Resources', icon: 'fas fa-folder' }
];

// Student navigation items
const studentNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-home' },
  { id: 'courses', label: 'Courses', icon: 'fas fa-book-open' },
  { id: 'assignments', label: 'Assignments', icon: 'fas fa-tasks' },
  { id: 'calendar', label: 'Calendar', icon: 'fas fa-calendar-alt' },
  { id: 'messages', label: 'Messages', icon: 'fas fa-envelope' },
  { id: 'progress', label: 'Progress', icon: 'fas fa-chart-line' },
  { id: 'resources', label: 'Resources', icon: 'fas fa-folder' }
];

// Mock recent activities
const teacherActivities = [
  { 
    icon: 'fas fa-paper-plane text-primary', 
    text: 'You posted a new assignment in "Advanced Mathematics"', 
    time: '10 minutes ago' 
  },
  { 
    icon: 'fas fa-comment text-success', 
    text: 'Sarah Johnson submitted an assignment for review', 
    time: '1 hour ago' 
  },
  { 
    icon: 'fas fa-users text-info', 
    text: 'You took attendance for "Physics 101" class', 
    time: 'Yesterday' 
  },
  { 
    icon: 'fas fa-bell text-warning', 
    text: 'Upcoming class schedule meeting on Friday', 
    time: '2 days ago' 
  }
];

const studentActivities = [
  { 
    icon: 'fas fa-check-circle text-success', 
    text: 'You completed "Introduction to Calculus" module', 
    time: '30 minutes ago' 
  },
  { 
    icon: 'fas fa-file-upload text-primary', 
    text: 'You submitted assignment for "English Literature"', 
    time: '3 hours ago' 
  },
  { 
    icon: 'fas fa-star text-warning', 
    text: 'You received a grade of 95% on your Physics quiz', 
    time: 'Yesterday' 
  },
  { 
    icon: 'fas fa-calendar-check text-info', 
    text: 'New assignment added in "World History" course', 
    time: '2 days ago' 
  }
];

// Computed properties
const navItems = computed(() => {
  return user.value.user_type === 'teacher' ? teacherNavItems : studentNavItems;
});

const recentActivities = computed(() => {
  return user.value.user_type === 'teacher' ? teacherActivities : studentActivities;
});

const currentPageTitle = computed(() => {
  const current = navItems.value.find(item => item.id === activeNavItem.value);
  return current ? current.label : 'Dashboard';
});

const welcomeMessage = computed(() => {
  if (user.value.user_type === 'teacher') {
    return "Here's an overview of your classes and recent activities.";
  } else {
    return "Track your courses, assignments, and overall progress.";
  }
});

const getUserInitials = computed(() => {
  return `${user.value.first_name.charAt(0)}${user.value.last_name.charAt(0)}`;
});

// Card animation classes
const getCardClass = () => {
  return {
    'dashboard-card': true,
    'card-animate': cardLoadingComplete.value,
    'card-delay': true
  };
};

const getCardStyle = (index) => {
  return {
    animationDelay: `${index * 100}ms`
  };
};

// Event handlers
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

const setActiveNavItem = async (itemId) => {
  // Use Vue's transition approach
  pageTransitioning.value = true;
  
  // Short delay to allow CSS transition to happen
  setTimeout(() => {
    activeNavItem.value = itemId;
    
    // Reset transition state after content has changed
    nextTick(() => {
      pageTransitioning.value = false;
    });
  }, 150);
  
  // Close user dropdown if open
  showUserDropdown.value = false;
};

const toggleUserDropdown = () => {
  showUserDropdown.value = !showUserDropdown.value;
};

const handleDocumentClick = (event) => {
  if (userDropdown.value && !userDropdown.value.contains(event.target)) {
    showUserDropdown.value = false;
  }
};

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

// Button animation classes
const getButtonClass = (isActive) => {
  return {
    'active': isActive,
    'btn-click-animation': true
  };
};

// Handle button click animation
const handleButtonClick = (event) => {
  const button = event.currentTarget;
  button.classList.add('clicking');
  
  // Remove class after animation completes
  setTimeout(() => {
    button.classList.remove('clicking');
  }, 200);
};

// Watch for user type changes and update active nav item accordingly
watch(() => user.value.user_type, () => {
  // Reset to dashboard when user type changes
  activeNavItem.value = 'dashboard';
  
  // Make sure the active nav item is valid for the current user type
  const validNavIds = navItems.value.map(item => item.id);
  if (!validNavIds.includes(activeNavItem.value)) {
    activeNavItem.value = 'dashboard';
  }
});
</script>

<style>


/* dash */
  /* Dashboard Layout */
  .dashboard-container {
    display: flex;
    height: 100vh;
    background-color: var(--gray-bg);
    font-family: var(--font-body);
  }
  
  /* Sidebar Styles */
  .dashboard-sidebar {
    width: 240px;
    height: 100vh;
    background-color: var(--sidebar-bg);
    box-shadow: 1px 0 5px var(--shadow-color);
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0;
    top: 0;
    transition: width 0.3s ease;
    z-index: 100;
  }

  .section-title {
  font-size: var(--fs-2xl);
  text-align: center;
  margin-bottom: 2.25rem; /* reduced from 2.5rem */
  font-weight: 700;
  color: var(--secondary-color);
}
  
  .dashboard-sidebar.collapsed {
    width: 60px;
  }
  
  .logo-container {
    padding: 18px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-color);
  }
  
  .dashboard-logo {
    font-family: var(--font-heading);
    font-size: var(--fs-lg);
    font-weight: 600;
    color: var(--primary-color);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .sidebar-toggle {
    /* margin-right: 2rem !important; */
    background: none;
    border: none;
    color: var(--secondary-color);
    cursor: pointer;
    font-size: var(--fs-base);
    padding: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .user-profile {
    padding: 18px 14px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
  }
  
  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: var(--primary-color);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: var(--fs-sm);
    margin-right: 9px;
    flex-shrink: 0;
  }
  
  .avatar-initial {
    text-transform: uppercase;
  }
  
  .user-info {
    overflow: hidden;
  }
  
  .user-name {
    margin: 0;
    font-size: var(--fs-sm);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .user-role {
    font-size: var(--fs-xs);
    color: var(--secondary-color);
    display: block;
  }
  
  .sidebar-nav {
    flex: 1;
    overflow-y: auto;
    padding: 9px 0;
  }
  
  .sidebar-nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .sidebar-nav li {
    margin: 4.5px 0;
  }
  
  .sidebar-nav a {
    display: flex;
    align-items: center;
    padding: 10.8px 18px;
    color: var(--secondary-color);
    text-decoration: none;
    transition: all 0.2s ease;
    border-left: 3px solid transparent;
  }
  
  .sidebar-nav a:hover {
    background-color: rgba(8, 121, 144, 0.05);
    color: var(--primary-color);
  }
  
  .sidebar-nav li.active a {
    background-color: rgba(8, 121, 144, 0.1);
    color: var(--primary-color);
    border-left: 3px solid var(--primary-color);
    font-weight: 500;
  }
  
  .sidebar-nav i {
    font-size: var(--fs-base);
    margin-right: 14.4px;
    width: 18px;
    text-align: center;
  }
  
  .sidebar-footer {
    padding: 14.4px;
    border-top: 1px solid var(--border-color);
  }
  
  .logout-btn {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 9px;
    background: none;
    border: 1px solid var(--border-color);
    border-radius: 4.5px;
    color: var(--secondary-color);
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: var(--font-body);
    font-size: var(--fs-sm);
  }
  
  .logout-btn:hover {
    background-color: rgba(220, 53, 69, 0.1);
    color: var(--error-color);
    border-color: rgba(220, 53, 69, 0.2);
  }
  
  .logout-btn i {
    margin-right: 9px;
  }
  
  /* Main Content Area */
  .dashboard-main {
    flex: 1;
    margin-left: 240px;
    transition: margin-left 0.3s ease;
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow-y: auto;
  }
  
  .dashboard-sidebar.collapsed + .dashboard-main {
    margin-left: 60px;
  }
  
  /* Header Styles */
  .dashboard-header {
    background-color: var(--header-bg);
    padding: 10.3px 27px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-color);
    box-shadow: 0 1px 3px var(--shadow-color);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  .page-title h2 {
    margin: 0;
    font-family: var(--font-heading);
    font-size: var(--fs-lg);
    font-weight: 600;
    color: var(--primary-color);
  }
  
  .header-actions {
    display: flex;
    align-items: center;
  }
  
  .notification-btn {
    background: none;
    border: none;
    font-size: var(--fs-base);
    color: var(--secondary-color);
    cursor: pointer;
    position: relative;
    margin-right: 18px;
    padding: 7.5px;
  }
  
  .notification-badge {
    position: absolute;
    top: 0;
    right: 0;
    background-color: var(--error-color);
    color: white;
    border-radius: 9px;
    font-size: var(--fs-xs);
    padding: 0 5.4px;
    min-width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Content Area */
  .dashboard-content {
    flex: 1;
    padding: 18px 27px;
    /* overflow-y: auto; */
  }
  
  .dashboard-section {
    animation: fadeIn 0.3s ease;
  }
  
  .dashboard-greeting {
    margin-bottom: 27px;
  }
  
  .dashboard-greeting h3 {
    font-family: var(--font-heading);
    font-size: var(--fs-xl);
    color: var(--text-color);
    margin: 0 0 9px 0;
    font-weight: 600;
  }
  
  .dashboard-greeting p {
    color: var(--secondary-color);
    font-size: var(--fs-base);
    margin: 0;
  }
  
  .section-title {
    font-family: var(--font-heading);
    font-size: var(--fs-lg);
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
    width: 45px;
    height: 3px;
    background-color: var(--primary-color);
    border-radius: 3px;
  }
  
  /* Cards */
  .cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 18px;
    margin-bottom: 27px;
  }

  /* Cards (continuation) */
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
  padding: 16px;
  display: flex;
  align-items: center;
  background-color: rgba(8, 121, 144, 0.03);
  border-bottom: 1px solid var(--border-color);
}

.card-header i {
  font-size: var(--fs-lg);
  color: var(--primary-color);
  margin-right: 10px;
}

.card-header h4 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--fs-md);
  font-weight: 600;
  color: var(--text-color);
}

.card-content {
  padding: 18px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.card-stat {
  font-size: var(--fs-3xl);
  font-weight: 700;
  color: var(--primary-color);
  line-height: 1;
  margin-bottom: 9px;
  display: flex;
  align-items: flex-end;
}

.percent {
  font-size: var(--fs-lg);
  margin-left: 3px;
}

.card-content p {
  margin: 0;
  color: var(--secondary-color);
  font-size: var(--fs-sm);
}

.card-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.card-footer a {
  color: var(--primary-color);
  text-decoration: none;
  font-size: var(--fs-sm);
  font-weight: 500;
  transition: color 0.2s ease;
}

.card-footer a:hover {
  color: #065e6f;
  text-decoration: underline;
}

/* Recent Activity */
.recent-activity {
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--shadow-color);
  padding: 18px;
}

.activity-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 36px;
  height: 36px;
  background-color: var(--gray-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.activity-icon i {
  font-size: var(--fs-base);
}

.activity-content {
  flex: 1;
}

.activity-text {
  margin: 0 0 4px;
  font-size: var(--fs-sm);
  line-height: 1.4;
}

.activity-time {
  font-size: var(--fs-xs);
  color: var(--secondary-color);
}

/* Add transitions for sidebar and content */
.dashboard-sidebar {
  transition: width 0.3s ease;
}

.dashboard-main {
  transition: margin-left 0.3s ease;
}

/* Animation classes */
.card-hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.button-click {
  transform: scale(0.98);
}

/* Fade animations for page transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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

/* Button click animation */
.btn-click-animation:active, 
.clicking {
  transform: scale(0.97);
}

/* Page transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.dashboard-section {
  transition: opacity 0.3s ease;
}

.dashboard-section.fading {
  opacity: 0;
}

/* Sidebar transition */
.dashboard-sidebar {
  transition: width 0.3s ease;
}

.dashboard-main {
  transition: margin-left 0.3s ease;
}

/* Animation delays for cards */
.card-delay:nth-child(1) {
  animation-delay: 0ms;
}
.card-delay:nth-child(2) {
  animation-delay: 100ms;
}
.card-delay:nth-child(3) {
  animation-delay: 200ms;
}

.nav-link-custom.router-link-active[href="/dashboard"] {
  color: #087990;
  font-weight: 500;
}

.nav-link-custom.router-link-active[href="/dashboard"] i {
  color: #087990;
}
.header-action-btn {
  /* Layout */
  position: relative;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  
  /* Appearance */
  background: none;
  border: none;
  border-radius: 50%;
  color: var(--primary-color);
  cursor: pointer;
  text-decoration: none;
  
  /* Animation */
  transition: all 0.2s ease;
}

/* Hover & Active States */
.header-action-btn:hover {
  background-color: rgba(8, 121, 144, 0.1);
  color: var(--primary-color);
  transform: scale(1.1);
}

.header-action-btn.active {
  color: var(--primary-color);
  background-color: rgba(8, 121, 144, 0.15);
}

/* Icon Styling */
.header-action-btn i {
  font-size: 1.2rem;
}

/* Pulse Animation (for both) */
@keyframes gentle-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.15); }
}

.header-action-btn.pulse {
  animation: gentle-pulse 0.5s ease;
}
/* Notification badge styling */
.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: var(--error-color);
  color: var(--primary-color);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  pointer-events: none;
}

/* Pulse animation for both icons */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.header-action-btn.pulse {
  animation: pulse 0.5s ease;
}

/* Active state for notifications */
.notification-btn.active {
  color: var(--primary-color);
}

/* Responsive styles */
@media (max-width: 991px) {
  .cards-container {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 767px) {
  .dashboard-sidebar {
    width: 60px;
  }
  
  .dashboard-main {
    margin-left: 60px;
  }
  
  .dashboard-header {
    padding: 10.3px 16px;
  }
  
  .dashboard-content {
    padding: 16px;
  }
  
  .user-name-small {
    display: none;
  }
}

@media (max-width: 575px) {
  .cards-container {
    grid-template-columns: 1fr;
  }
  
  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    margin-top: 12px;
    width: 100%;
    justify-content: space-between;
  }
}

/* Key frame animations */
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
</style>
