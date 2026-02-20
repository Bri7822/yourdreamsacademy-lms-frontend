<template>
    <div class="dashboard-container">
      <div class="dashboard-sidebar" :class="{ 'collapsed': sidebarCollapsed }">
        <div class="logo-container">
          <h1 class="dashboard-logo ms-1">Your Dreams Academy</h1>
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
            <span class="user-role">Student</span>
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
                <h3>Welcome, {{ user.first_name }}!</h3>
                <p>{{ welcomeMessage }}</p>
              </div>
              
              <div class="cards-container">
                <div v-for="(item, index) in 4" :key="'student-card-'+index"
                      :class="getCardClass(index)"
                      :style="getCardStyle(index)">
                  <!-- Card 1 - My Courses -->
                  <div v-if="index === 0" class="card-header">
                    <i class="fas fa-book"></i>
                    <h4>My Courses</h4>
                  </div>
                  <div v-if="index === 0" class="card-content">
                    <div class="card-stat">{{ statistics.courses }}</div>
                    <p>Active Courses</p>
                  </div>
                  <div v-if="index === 0" class="card-footer">
                    <a href="#" @click.prevent="setActiveNavItem('courses')">View Courses</a>
                  </div>
                  
                  <!-- Card 2 - Exercises -->
                  <div v-if="index === 1" class="card-header">
                    <i class="fas fa-tasks"></i>
                    <h4>Exercises</h4>
                  </div>
                  <div v-if="index === 1" class="card-content">
                    <div class="card-stat">{{ statistics.exercises }}</div>
                    <p>Pending Exercises</p>
                  </div>
                  <div v-if="index === 1" class="card-footer">
                    <a href="#" @click.prevent="setActiveNavItem('exercises')">View Exercises</a>
                  </div>
                  
                  <!-- Card 3 - My Grades -->
                  <div v-if="index === 2" class="card-header">
                    <i class="fas fa-star"></i>
                    <h4>My Grades</h4>
                  </div>
                  <div v-if="index === 2" class="card-content">
                    <div class="card-stat">{{ statistics.averageGrade }}%</div>
                    <p>Average Grade</p>
                  </div>
                  <div v-if="index === 2" class="card-footer">
                    <a href="#" @click.prevent="setActiveNavItem('grades')">View Grades</a>
                  </div>
                  
                  <!-- Card 4 - Progress -->
                  <div v-if="index === 3" class="card-header">
                    <i class="fas fa-chart-line"></i>
                    <h4>Progress</h4>
                  </div>
                  <div v-if="index === 3" class="card-content">
                    <div class="card-stat">{{ statistics.progress }}%</div>
                    <p>Overall Progress</p>
                  </div>
                  <div v-if="index === 3" class="card-footer">
                    <a href="#" @click.prevent="setActiveNavItem('progress')">View Progress</a>
                  </div>
                </div>
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
            
            <!-- Courses Section -->
            <div v-else-if="activeNavItem === 'courses'" 
                 class="dashboard-section" key="courses">
              <h3 class="section-title">My Courses</h3>
              <p>View and manage your enrolled courses.</p>
              
              <div class="course-list">
                <div class="course-card" v-for="course in courses" :key="course.id">
                  <div class="course-header">
                    <i class="fas fa-book"></i>
                    <h4>{{ course.name }}</h4>
                  </div>
                  <div class="course-content">
                    <p>{{ course.description }}</p>
                    <div class="progress-container">
                      <div class="progress-bar" :style="{ width: course.progress + '%' }"></div>
                      <span>{{ course.progress }}% Complete</span>
                    </div>
                  </div>
                  <div class="course-footer">
                    <router-link :to="`/student/courses/${course.id}`" class="course-link">View Course</router-link>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Exercises Section -->
            <div v-else-if="activeNavItem === 'exercises'" 
                 class="dashboard-section" key="exercises">
              <h3 class="section-title">Exercises</h3>
              <p>View and complete your exercises.</p>
              
              <div class="exercise-list">
                <div class="exercise-card" v-for="exercise in exercises" :key="exercise.id">
                  <div class="exercise-header">
                    <i class="fas fa-tasks"></i>
                    <div>
                      <h4>{{ exercise.title }}</h4>
                      <span class="course-name">{{ exercise.course }}</span>
                    </div>
                    <span class="due-date" :class="{ 'overdue': exercise.status === 'Overdue' }">
                      {{ exercise.dueDate }}
                    </span>
                  </div>
                  <div class="exercise-content">
                    <p>{{ exercise.description }}</p>
                    <div class="exercise-status" :class="exercise.status.toLowerCase()">
                      {{ exercise.status }}
                    </div>
                  </div>
                  <div class="exercise-footer">
                    <button class="btn-start" v-if="exercise.status === 'Pending'">
                      Start Exercise
                    </button>
                    <button class="btn-continue" v-if="exercise.status === 'In Progress'">
                      Continue
                    </button>
                    <button class="btn-view" v-if="exercise.status === 'Submitted'">
                      View Results
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Grades Section -->
            <div v-else-if="activeNavItem === 'grades'" 
                 class="dashboard-section" key="grades">
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
            
            <!-- Tutorials Section -->
            <div v-else-if="activeNavItem === 'tutorials'" 
                 class="dashboard-section" key="tutorials">
              <h3 class="section-title">Tutorials</h3>
              <p>Access learning resources and tutorials.</p>
              
              <div class="tutorial-categories">
                <div class="category-card" v-for="category in tutorialCategories" :key="category.id">
                  <div class="category-icon">
                    <i :class="category.icon"></i>
                  </div>
                  <h4>{{ category.name }}</h4>
                  <p>{{ category.description }}</p>
                  <div class="tutorial-count">
                    {{ category.tutorialCount }} Tutorials Available
                  </div>
                  <button class="btn-explore">Explore</button>
                </div>
              </div>
            </div>
            
            <!-- Progress Section -->
            <div v-else-if="activeNavItem === 'progress'" 
                 class="dashboard-section" key="progress">
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
              
              <div class="course-progress">
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
            
            <!-- Notes Section -->
            <div v-else-if="activeNavItem === 'notes'" 
                 class="dashboard-section" key="notes">
              <h3 class="section-title">Saved Notes</h3>
              <p>Access and manage your saved notes.</p>
              
              <div class="notes-container">
                <div class="notes-sidebar">
                  <div class="notes-search">
                    <input type="text" placeholder="Search notes..." v-model="notesSearchQuery">
                    <i class="fas fa-search"></i>
                  </div>
                  
                  <div class="notes-folders">
                    <div class="folder" v-for="folder in noteFolders" :key="folder.id"
                         :class="{ 'active': activeFolder === folder.id }"
                         @click="activeFolder = folder.id">
                      <i :class="folder.icon"></i>
                      <span>{{ folder.name }}</span>
                      <span class="note-count">{{ folder.count }}</span>
                    </div>
                  </div>
                </div>
                
                <div class="notes-content">
                  <div class="notes-toolbar">
                    <button class="btn-new-note">
                      <i class="fas fa-plus"></i> New Note
                    </button>
                    <div class="notes-filter">
                      <span>Sort by:</span>
                      <select v-model="notesSortBy">
                        <option value="recent">Most Recent</option>
                        <option value="oldest">Oldest</option>
                        <option value="title">Title</option>
                      </select>
                    </div>
                  </div>
                  
                  <div class="notes-list">
                    <div class="note-card" v-for="note in filteredNotes" :key="note.id">
                      <div class="note-header">
                        <h5>{{ note.title }}</h5>
                        <span class="note-date">{{ note.date }}</span>
                      </div>
                      <div class="note-preview">
                        {{ note.preview }}
                      </div>
                      <div class="note-footer">
                        <span class="note-course">{{ note.course }}</span>
                        <div class="note-actions">
                          <button class="btn-edit"><i class="fas fa-edit"></i></button>
                          <button class="btn-delete"><i class="fas fa-trash"></i></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Certificates Section -->
            <div v-else-if="activeNavItem === 'certificates'" 
                 class="dashboard-section" key="certificates">
              <h3 class="section-title">Certificates</h3>
              <p>View and download your earned certificates.</p>
              
              <div class="certificates-container">
                <div class="certificate-card" v-for="certificate in certificates" :key="certificate.id">
                  <div class="certificate-preview">
                    <!-- <img src="@/assets/certificate-placeholder.png" alt="Certificate Preview"> -->
                  </div>
                  <div class="certificate-details">
                    <h4>{{ certificate.course }}</h4>
                    <p>Issued on {{ certificate.issueDate }}</p>
                    <div class="certificate-actions">
                      <button class="btn-download">
                        <i class="fas fa-download"></i> Download
                      </button>
                      <button class="btn-share">
                        <i class="fas fa-share-alt"></i> Share
                      </button>
                      <button class="btn-view">
                        <i class="fas fa-eye"></i> View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Settings Section -->
            <div v-else-if="activeNavItem === 'settings'" 
                 class="dashboard-section" key="settings">
              <h3 class="section-title">Profile Settings</h3>
              <p>Manage your account and preferences.</p>
              
              <div class="settings-container">
                <div class="settings-tabs">
                  <button class="tab" :class="{ 'active': activeTab === 'profile' }"
                          @click="activeTab = 'profile'">
                    Profile
                  </button>
                  <button class="tab" :class="{ 'active': activeTab === 'account' }"
                          @click="activeTab = 'account'">
                    Account
                  </button>
                  <button class="tab" :class="{ 'active': activeTab === 'notifications' }"
                          @click="activeTab = 'notifications'">
                    Notifications
                  </button>
                  <button class="tab" :class="{ 'active': activeTab === 'security' }"
                          @click="activeTab = 'security'">
                    Security
                  </button>
                </div>
                
                <div class="settings-content">
                  <div v-if="activeTab === 'profile'" class="profile-settings">
                    <form @submit.prevent="saveProfile">
                      <div class="form-group">
                        <label>First Name</label>
                        <input type="text" v-model="user.first_name">
                      </div>
                      <div class="form-group">
                        <label>Last Name</label>
                        <input type="text" v-model="user.last_name">
                      </div>
                      <div class="form-group">
                        <label>Email</label>
                        <input type="email" v-model="user.email">
                      </div>
                      <div class="form-group">
                        <label>Bio</label>
                        <textarea v-model="user.bio"></textarea>
                      </div>
                      <div class="form-group">
                        <label>Profile Picture</label>
                        <div class="avatar-upload">
                          <div class="avatar-preview">
                            <img :src="user.avatar || '@/assets/default-avatar.png'" alt="Profile">
                          </div>
                          <button type="button" class="btn-upload">Upload New Photo</button>
                        </div>
                      </div>
                      <button type="submit" class="btn-save">Save Changes</button>
                    </form>
                  </div>
                  
                  <div v-if="activeTab === 'account'" class="account-settings">
                    <div class="account-info">
                      <div class="info-item">
                        <span class="info-label">Account Created:</span>
                        <span class="info-value">January 15, 2023</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Last Login:</span>
                        <span class="info-value">Today at 10:30 AM</span>
                      </div>
                      <div class="info-item">
                        <span class="info-label">Account Status:</span>
                        <span class="info-value active">Active</span>
                      </div>
                    </div>
                    
                    <div class="account-actions">
                      <button class="btn-action danger">
                        <i class="fas fa-trash"></i> Delete Account
                      </button>
                      <button class="btn-action">
                        <i class="fas fa-download"></i> Export Data
                      </button>
                    </div>
                  </div>
                  
                  <div v-if="activeTab === 'notifications'" class="notification-settings">
                    <h4>Notification Preferences</h4>
                    <div class="notification-options">
                      <div class="option-item">
                        <label class="switch">
                          <input type="checkbox" v-model="notificationSettings.courseUpdates" checked>
                          <span class="slider"></span>
                        </label>
                        <span>Course Updates</span>
                      </div>
                      <div class="option-item">
                        <label class="switch">
                          <input type="checkbox" v-model="notificationSettings.assignmentDeadlines" checked>
                          <span class="slider"></span>
                        </label>
                        <span>Assignment Deadlines</span>
                      </div>
                      <div class="option-item">
                        <label class="switch">
                          <input type="checkbox" v-model="notificationSettings.gradeUpdates">
                          <span class="slider"></span>
                        </label>
                        <span>Grade Updates</span>
                      </div>
                      <div class="option-item">
                        <label class="switch">
                          <input type="checkbox" v-model="notificationSettings.announcements" checked>
                          <span class="slider"></span>
                        </label>
                        <span>Announcements</span>
                      </div>
                    </div>
                    
                    <div class="notification-email">
                      <h4>Email Notifications</h4>
                      <div class="email-frequency">
                        <label>Frequency:</label>
                        <select v-model="notificationSettings.emailFrequency">
                          <option value="immediate">Immediate</option>
                          <option value="daily">Daily Digest</option>
                          <option value="weekly">Weekly Digest</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="activeTab === 'security'" class="security-settings">
                    <div class="password-change">
                      <h4>Change Password</h4>
                      <form @submit.prevent="changePassword">
                        <div class="form-group">
                          <label>Current Password</label>
                          <input type="password" v-model="password.current">
                        </div>
                        <div class="form-group">
                          <label>New Password</label>
                          <input type="password" v-model="password.new">
                        </div>
                        <div class="form-group">
                          <label>Confirm New Password</label>
                          <input type="password" v-model="password.confirm">
                        </div>
                        <button type="submit" class="btn-save">Update Password</button>
                      </form>
                    </div>
                    
                    <div class="security-sessions">
                      <h4>Active Sessions</h4>
                      <div class="session-list">
                        <div class="session-item" v-for="session in activeSessions" :key="session.id">
                          <div class="session-info">
                            <i class="fas fa-laptop"></i>
                            <div>
                              <strong>{{ session.device }}</strong>
                              <span>{{ session.location }} • {{ session.lastActive }}</span>
                            </div>
                          </div>
                          <button class="btn-logout" v-if="!session.current">
                            Log Out
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </main>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// User data
const user = ref({
    id: 1,
    first_name: 'Student',
    last_name: 'User',
    email: 'student@dreamacademy.com',
    user_type: 'student',
    bio: 'Computer Science student passionate about web development',
    avatar: null
});

// Mock statistics for student dashboard
const statistics = ref({
    courses: 3,
    exercises: 5,
    averageGrade: 88,
    progress: 75
});

// Grade distribution data
const gradeDistribution = ref({
    'A+': 3,
    'A': 5,
    'B+': 2,
    'B': 1,
    'C+': 0,
    'C': 0
});

const maxGradeCount = computed(() => {
    return Math.max(...Object.values(gradeDistribution.value));
});

// Course grades data
const courseGrades = ref([
    { id: 1, name: 'Web Development Fundamentals', completedAssignments: 8, totalAssignments: 10, average: 92, status: 'Excellent' },
    { id: 2, name: 'Data Structures and Algorithms', completedAssignments: 5, totalAssignments: 8, average: 85, status: 'Good' },
    { id: 3, name: 'Database Systems', completedAssignments: 3, totalAssignments: 6, average: 78, status: 'Average' }
]);

// Courses data
const courses = ref([
    { id: 1, name: 'Web Development Fundamentals', description: 'Learn the basics of HTML, CSS and JavaScript', progress: 80, completedLessons: 16, totalLessons: 20 },
    { id: 2, name: 'Data Structures and Algorithms', description: 'Master fundamental computer science concepts', progress: 65, completedLessons: 13, totalLessons: 20 },
    { id: 3, name: 'Database Systems', description: 'Introduction to SQL and database design', progress: 45, completedLessons: 9, totalLessons: 20 }
]);

// Exercises data
const exercises = ref([
    { id: 1, title: 'Responsive Layout Challenge', course: 'Web Development Fundamentals', description: 'Create a responsive webpage using CSS Grid and Flexbox', dueDate: 'Due tomorrow', status: 'Pending' },
    { id: 2, title: 'Binary Search Tree Implementation', course: 'Data Structures and Algorithms', description: 'Implement BST operations in JavaScript', dueDate: 'Due in 3 days', status: 'In Progress' },
    { id: 3, title: 'SQL Query Practice', course: 'Database Systems', description: 'Write complex SQL queries for the provided database', dueDate: 'Overdue', status: 'Overdue' },
    { id: 4, title: 'DOM Manipulation Exercise', course: 'Web Development Fundamentals', description: 'Practice DOM manipulation with JavaScript', dueDate: 'Submitted', status: 'Submitted' }
]);

// Tutorial categories
const tutorialCategories = ref([
    { id: 1, name: 'Web Development', icon: 'fas fa-code', description: 'HTML, CSS, JavaScript and frameworks', tutorialCount: 24 },
    { id: 2, name: 'Computer Science', icon: 'fas fa-laptop-code', description: 'Algorithms, data structures and theory', tutorialCount: 18 },
    { id: 3, name: 'Database', icon: 'fas fa-database', description: 'SQL, NoSQL and database design', tutorialCount: 12 },
    { id: 4, name: 'Mobile Development', icon: 'fas fa-mobile-alt', description: 'iOS and Android app development', tutorialCount: 8 }
]);

// Milestones data
const milestones = ref([
    { id: 1, title: 'Completed Web Development Basics', icon: 'fas fa-trophy', date: '2 days ago' },
    { id: 2, title: 'Reached 50% in Data Structures', icon: 'fas fa-star', date: '1 week ago' },
    { id: 3, title: 'Earned Perfect Score on SQL Quiz', icon: 'fas fa-check-circle', date: '2 weeks ago' }
]);

// Notes data
const noteFolders = ref([
    { id: 1, name: 'All Notes', icon: 'fas fa-sticky-note', count: 24 },
    { id: 2, name: 'Web Development', icon: 'fas fa-code', count: 12 },
    { id: 3, name: 'Algorithms', icon: 'fas fa-laptop-code', count: 6 },
    { id: 4, name: 'Database', icon: 'fas fa-database', count: 4 },
    { id: 5, name: 'Favorites', icon: 'fas fa-star', count: 8 }
]);

const notes = ref([
    { id: 1, title: 'CSS Grid Layout Notes', preview: 'Key concepts for working with CSS Grid...', course: 'Web Development', date: 'Today', folder: 2 },
    { id: 2, title: 'Binary Search Trees', preview: 'Implementation details and time complexity...', course: 'Algorithms', date: 'Yesterday', folder: 3 },
    { id: 3, title: 'SQL Joins Cheat Sheet', preview: 'Different types of joins and their syntax...', course: 'Database', date: '3 days ago', folder: 4 },
    { id: 4, title: 'JavaScript Promises', preview: 'How to work with async code using promises...', course: 'Web Development', date: '1 week ago', folder: 2 }
]);

const activeFolder = ref(1);
const notesSearchQuery = ref('');
const notesSortBy = ref('recent');

const filteredNotes = computed(() => {
    let result = [...notes.value];
    
    if (activeFolder.value !== 1) {
        result = result.filter(note => note.folder === activeFolder.value);
    }
    
    if (notesSearchQuery.value) {
        const query = notesSearchQuery.value.toLowerCase();
        result = result.filter(note => 
            note.title.toLowerCase().includes(query) || 
            note.preview.toLowerCase().includes(query) ||
            note.course.toLowerCase().includes(query)
        );
    }
    
    if (notesSortBy.value === 'recent') {
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (notesSortBy.value === 'oldest') {
        result.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (notesSortBy.value === 'title') {
        result.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    return result;
});

// Certificates data
const certificates = ref([
    { id: 1, course: 'Web Development Fundamentals', issueDate: 'March 15, 2023' },
    { id: 2, course: 'JavaScript Basics', issueDate: 'February 28, 2023' },
    { id: 3, course: 'HTML & CSS Mastery', issueDate: 'January 20, 2023' }
]);

// Settings data
const activeTab = ref('profile');
const notificationSettings = ref({
    courseUpdates: true,
    assignmentDeadlines: true,
    gradeUpdates: false,
    announcements: true,
    emailFrequency: 'daily'
});

const password = ref({
    current: '',
    new: '',
    confirm: ''
});

const activeSessions = ref([
    { id: 1, device: 'MacBook Pro (Current)', location: 'New York, USA', lastActive: 'Now', current: true },
    { id: 2, device: 'iPhone 13', location: 'New York, USA', lastActive: '2 hours ago', current: false },
    { id: 3, device: 'Windows PC', location: 'Brooklyn, USA', lastActive: '3 days ago', current: false }
]);

// Animation states
const cardLoadingComplete = ref(false);
const pageTransitioning = ref(false);

// Set user from auth store on component mount
onMounted(() => {
    if (authStore.user) {
        user.value = { ...user.value, ...authStore.user };
    } else {
        // Redirect to login if no user in auth store
        router.push('/login');
    }
    
    // Initialize card animations with staggered delay
    initCardAnimations();
    
    // Set sidebar to collapsed by default on mobile
    if (window.innerWidth < 992) {
        sidebarCollapsed.value = true;
    }
});

// Initialize card animations
const initCardAnimations = () => {
    setTimeout(() => {
        cardLoadingComplete.value = true;
    }, 100);
};

// Navigation state
const sidebarCollapsed = ref(false);
const activeNavItem = ref('dashboard');
const notificationCount = ref(3);

// Student navigation items
const navItems = ref([
    { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { id: 'courses', label: 'My Courses', icon: 'fas fa-book' },
    { id: 'exercises', label: 'Exercises', icon: 'fas fa-tasks' },
    { id: 'grades', label: 'My Grades', icon: 'fas fa-star' },
    { id: 'tutorials', label: 'Tutorials', icon: 'fas fa-graduation-cap' },
    { id: 'progress', label: 'Progress Tracker', icon: 'fas fa-chart-line' },
    { id: 'notes', label: 'Saved Notes', icon: 'fas fa-sticky-note' },
    { id: 'certificates', label: 'Certificates', icon: 'fas fa-certificate' },
    { id: 'settings', label: 'Profile Settings', icon: 'fas fa-cog' }
]);

// Mock recent activities
const recentActivities = ref([
    { 
        icon: 'fas fa-book text-primary', 
        text: 'New material posted for "Advanced Mathematics"', 
        time: '1 hour ago' 
    },
    { 
        icon: 'fas fa-check-circle text-success', 
        text: 'Exercise "Introduction to Calculus" submitted', 
        time: '3 hours ago' 
    },
    { 
        icon: 'fas fa-star text-warning', 
        text: 'Received grade for "Physics 101" assignment - 92%', 
        time: 'Yesterday' 
    },
    { 
        icon: 'fas fa-certificate text-info', 
        text: 'Earned certificate for completing "Web Development Basics"', 
        time: '2 days ago' 
    }
]);

// Computed properties
const currentPageTitle = computed(() => {
    const current = navItems.value.find(item => item.id === activeNavItem.value);
    return current ? current.label : 'Dashboard';
});

const welcomeMessage = computed(() => {
    return "Track your learning progress and access your courses.";
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
    pageTransitioning.value = true;
    
    setTimeout(() => {
        activeNavItem.value = itemId;
        
        nextTick(() => {
            pageTransitioning.value = false;
        });
    }, 150);
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
    
    setTimeout(() => {
        button.classList.remove('clicking');
    }, 200);
};

// Settings methods
const saveProfile = () => {
    console.log('Profile saved', user.value);
    // In a real app, this would call an API to save the profile
};

const changePassword = () => {
    console.log('Password changed', password.value);
    // In a real app, this would call an API to change the password
};
</script>

<style scoped>
/* Base styles from admin dashboard */


.logout-btn {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px;
  background: none;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--secondary-color);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-body);
  font-size: 13px; /* Smaller font */
  min-height: 36px; /* Fixed height */
  justify-content: start;
}
.sidebar-nav a.router-link-exact-active {
  background-color: rgba(8, 121, 144, 0.05);
  color: var(--primary-color) !important;
}


.dashboard-container {
    display: flex;
    height: 100vh;
    background-color: var(--gray-bg);
    font-family: var(--font-body);
}

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
    transition: width 0.3s ease, transform 0.3s ease;
    z-index: 1000;
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
    font-size: var(--fs-base);
    font-weight: 600;
    color: var(--primary-color);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.sidebar-toggle {
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
    width: 25px;
    height: 25px;
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
    padding: 9px 0;
    overflow-y: auto;
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
    padding: 7.8px 12px;
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

.dashboard-header {
    background-color: var(--header-bg);
    padding: 10.3px 15px;
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
    padding-left: 5px;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.notification-btn {
    background: none;
    border: none;
    font-size: var(--fs-base);
    color: var(--primary-color);
    cursor: pointer;
    position: relative;
    padding: 7.5px;
}

.notification-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background-color: var(--error-color);
    color: white;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: bold;
}

.dashboard-content {
    flex: 1;
    padding: 18px 15px;
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

.recent-activity {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    padding: 15px;
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

/* Course List Styles */
.course-list {
    display: grid;
    gap: 15px;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.course-card {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.course-header {
    padding: 12px;
    display: flex;
    align-items: center;
    background-color: rgba(8, 121, 144, 0.03);
    border-bottom: 1px solid var(--border-color);
}

.course-header i {
    font-size: 1.2rem;
    color: var(--primary-color);
    margin-right: 10px;
}

.course-header h4 {
    margin: 0;
    font-size: 1rem;
}

.course-content {
    padding: 12px;
    flex: 1;
}

.course-content p {
    margin: 0 0 10px;
    color: var(--secondary-color);
    font-size: 0.9rem;
}

.progress-container {
    margin-top: 15px;
}

.progress-bar {
    height: 6px;
    background-color: var(--primary-color);
    border-radius: 3px;
    margin-bottom: 5px;
}

.course-footer {
    padding: 10px 12px;
    border-top: 1px solid var(--border-color);
}

.course-link {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9rem;
}

.course-link:hover {
    text-decoration: underline;
}

/* Exercise List Styles */
.exercise-list {
    display: grid;
    gap: 15px;
}

.exercise-card {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    overflow: hidden;
}

.exercise-header {
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: rgba(8, 121, 144, 0.03);
    border-bottom: 1px solid var(--border-color);
}

.exercise-header i {
    font-size: 1.2rem;
    color: var(--primary-color);
    margin-right: 10px;
}

.exercise-header h4 {
    margin: 0;
    font-size: 1rem;
}

.course-name {
    font-size: 0.8rem;
    color: var(--secondary-color);
    display: block;
}

.due-date {
    font-size: 0.8rem;
    font-weight: 500;
    padding: 3px 8px;
    border-radius: 12px;
    background-color: #f8f9fa;
}

.due-date.overdue {
    background-color: #fff3cd;
    color: #856404;
}

.exercise-content {
    padding: 12px;
}

.exercise-content p {
    margin: 0 0 10px;
    color: var(--secondary-color);
    font-size: 0.9rem;
}

.exercise-status {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
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
    padding: 10px 12px;
    border-top: 1px solid var(--border-color);
    display: flex;
    justify-content: flex-end;
}

.btn-start, .btn-continue, .btn-view {
    padding: 5px 12px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 500;
    border: none;
    cursor: pointer;
}

.btn-start {
    background-color: var(--primary-color);
    color: white;
}

.btn-continue {
    background-color: #17a2b8;
    color: white;
}

.btn-view {
    background-color: #6c757d;
    color: white;
}

/* Grades Styles */
.grades-summary {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    padding: 15px;
    margin-bottom: 20px;
}

.grade-overview {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 20px;
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
    color: var(--secondary-color);
}

.grade-percentage {
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 5px;
}

.grade-description {
    font-size: 0.8rem;
    color: var(--secondary-color);
}

.grade-distribution {
    padding: 15px;
}

.grade-distribution h4 {
    margin: 0 0 15px;
    font-size: 1rem;
    color: var(--secondary-color);
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
}

.bar-container {
    height: 10px;
    background-color: #e9ecef;
    border-radius: 5px;
    overflow: hidden;
}

.bar-fill {
    height: 100%;
    background-color: var(--primary-color);
}

.bar-count {
    font-size: 0.9rem;
    text-align: right;
}

.course-grades {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    padding: 15px;
}

.grades-table {
    width: 100%;
    border-collapse: collapse;
}

.grades-table th, .grades-table td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid var(--border-color);
}

.grades-table th {
    font-weight: 600;
    color: var(--secondary-color);
    font-size: 0.9rem;
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

/* Tutorials Styles */
.tutorial-categories {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
}

.category-card {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    padding: 15px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.category-icon {
    width: 50px;
    height: 50px;
    background-color: rgba(8, 121, 144, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 10px;
}

.category-icon i {
    font-size: 1.5rem;
    color: var(--primary-color);
}

.category-card h4 {
    margin: 0 0 5px;
    font-size: 1.1rem;
}

.category-card p {
    margin: 0 0 10px;
    font-size: 0.9rem;
    color: var(--secondary-color);
}

.tutorial-count {
    font-size: 0.8rem;
    color: var(--primary-color);
    font-weight: 500;
    margin-bottom: 15px;
}

.btn-explore {
    padding: 5px 15px;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
}

/* Progress Tracker Styles */
.progress-overview {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
}

.progress-chart {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    padding: 15px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.chart-container {
    width: 150px;
    height: 150px;
    position: relative;
    margin-bottom: 15px;
}

.chart-progress {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: conic-gradient(var(--primary-color) 0% var(--progress), #e9ecef var(--progress) 100%);
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
    color: var(--primary-color);
}

.chart-legend {
    display: grid;
    gap: 10px;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
}

.legend-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.legend-color.completed {
    background-color: var(--primary-color);
}

.legend-color.in-progress {
    background-color: #17a2b8;
}

.legend-color.not-started {
    background-color: #e9ecef;
}

.milestones {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    padding: 15px;
}

.milestones h4 {
    margin: 0 0 15px;
    font-size: 1rem;
    color: var(--secondary-color);
}

.milestone-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 10px;
}

.milestone-list li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    border-radius: 6px;
    background-color: rgba(8, 121, 144, 0.03);
}

.milestone-list li i {
    color: var(--primary-color);
    font-size: 1.1rem;
}

.milestone-list li div {
    display: flex;
    flex-direction: column;
}

.milestone-list li strong {
    font-size: 0.9rem;
}

.milestone-list li span {
    font-size: 0.8rem;
    color: var(--secondary-color);
}

.course-progress {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    padding: 15px;
}

.course-progress h4 {
    margin: 0 0 15px;
    font-size: 1rem;
    color: var(--secondary-color);
}

.progress-cards {
    display: grid;
    gap: 15px;
}

.progress-card {
    padding: 12px;
    border-radius: 6px;
    background-color: rgba(8, 121, 144, 0.03);
}

.progress-card h5 {
    margin: 0 0 10px;
    font-size: 0.9rem;
}

.progress-bar-container {
    height: 6px;
    background-color: #e9ecef;
    border-radius: 3px;
    margin-bottom: 5px;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background-color: var(--primary-color);
}

.progress-details {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--secondary-color);
}

/* Notes Styles */
.notes-container {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 20px;
}

.notes-sidebar {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    padding: 15px;
    display: flex;
    flex-direction: column;
}

.notes-search {
    position: relative;
    margin-bottom: 15px;
}

.notes-search input {
    width: 100%;
    padding: 8px 30px 8px 10px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 0.9rem;
}

.notes-search i {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--secondary-color);
}

.notes-folders {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.folder {
    display: flex;
    align-items: center;
    padding: 8px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
}

.folder:hover {
    background-color: rgba(8, 121, 144, 0.05);
}

.folder.active {
    background-color: rgba(8, 121, 144, 0.1);
    color: var(--primary-color);
    font-weight: 500;
}

.folder i {
    margin-right: 8px;
    font-size: 0.9rem;
}

.note-count {
    margin-left: auto;
    font-size: 0.8rem;
    background-color: rgba(8, 121, 144, 0.1);
    color: var(--primary-color);
    padding: 2px 6px;
    border-radius: 10px;
}

.notes-content {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    padding: 15px;
    display: flex;
    flex-direction: column;
}

.notes-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.btn-new-note {
    padding: 6px 12px;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
}

.notes-filter {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
}

.notes-filter select {
    padding: 5px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 0.9rem;
}

.notes-list {
    display: grid;
    gap: 15px;
}

.note-card {
    padding: 12px;
    border-radius: 6px;
    background-color: rgba(8, 121, 144, 0.03);
    border: 1px solid var(--border-color);
}

.note-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.note-header h5 {
    margin: 0;
    font-size: 0.9rem;
}

.note-date {
    font-size: 0.8rem;
    color: var(--secondary-color);
}

.note-preview {
    font-size: 0.9rem;
    color: var(--secondary-color);
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.note-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.note-course {
    font-size: 0.8rem;
    background-color: rgba(8, 121, 144, 0.1);
    color: var(--primary-color);
    padding: 2px 6px;
    border-radius: 10px;
}

.note-actions {
    display: flex;
    gap: 5px;
}

.btn-edit, .btn-delete {
    width: 25px;
    height: 25px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
}

.btn-edit {
    background-color: rgba(40, 167, 69, 0.1);
    color: #28a745;
}

.btn-delete {
    background-color: rgba(220, 53, 69, 0.1);
    color: #dc3545;
}

/* Certificates Styles */
.certificates-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.certificate-card {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.certificate-preview {
    height: 200px;
    background-color: #f8f9fa;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid var(--border-color);
}

.certificate-preview img {
    max-width: 100%;
    max-height: 100%;
}

.certificate-details {
    padding: 15px;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.certificate-details h4 {
    margin: 0 0 5px;
    font-size: 1.1rem;
}

.certificate-details p {
    margin: 0 0 15px;
    font-size: 0.9rem;
    color: var(--secondary-color);
}

.certificate-actions {
    display: flex;
    gap: 8px;
    margin-top: auto;
}

.btn-download, .btn-share, .btn-view {
    padding: 6px 12px;
    font-size: 0.9rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
}

.btn-download {
    background-color: var(--primary-color);
    color: white;
}

.btn-share {
    background-color: #6c757d;
    color: white;
}

.btn-view {
    background-color: #17a2b8;
    color: white;
}

/* Settings Styles */
.settings-container {
    background-color: var(--card-bg);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--shadow-color);
}

.settings-tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
}

.tab {
    padding: 12px 20px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    font-size: 0.9rem;
    cursor: pointer;
    color: var(--secondary-color);
}

.tab.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
    font-weight: 500;
}

.settings-content {
    padding: 20px;
}

.profile-settings .form-group {
    margin-bottom: 15px;
}

.profile-settings label {
    display: block;
    margin-bottom: 5px;
    font-size: 0.9rem;
    font-weight: 500;
}

.profile-settings input, .profile-settings textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 0.9rem;
}

.profile-settings textarea {
    min-height: 100px;
    resize: vertical;
}

.avatar-upload {
    display: flex;
    align-items: center;
    gap: 15px;
}

.avatar-preview {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    background-color: #f8f9fa;
}

.avatar-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.btn-upload {
    padding: 6px 12px;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
}

.btn-save {
    padding: 8px 16px;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
}

.account-info {
    margin-bottom: 20px;
}

.info-item {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid var(--border-color);
}

.info-label {
    font-weight: 500;
    color: var(--secondary-color);
}

.info-value {
    color: var(--text-color);
}

.info-value.active {
    color: #28a745;
}

.account-actions {
    display: flex;
    gap: 10px;
}

.btn-action {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 0.9rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
}

.btn-action.danger {
    background-color: #f8d7da;
    color: #721c24;
}

.notification-options {
    display: grid;
    gap: 15px;
    margin-bottom: 20px;
}

.option-item {
    display: flex;
    align-items: center;
    gap: 10px;
}

.switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 24px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
}

input:checked + .slider {
    background-color: var(--primary-color);
}

input:checked + .slider:before {
    transform: translateX(26px);
}

.email-frequency {
    display: flex;
    align-items: center;
    gap: 10px;
}

.email-frequency select {
    padding: 5px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 0.9rem;
}

.security-sessions .session-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid var(--border-color);
}

.session-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.session-info i {
    font-size: 1.2rem;
    color: var(--primary-color);
}

.session-info div {
    display: flex;
    flex-direction: column;
}

.session-info strong {
    font-size: 0.9rem;
}

.session-info span {
    font-size: 0.8rem;
    color: var(--secondary-color);
}

.btn-logout {
    padding: 5px 10px;
    background-color: #f8d7da;
    color: #721c24;
    border: none;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
}

/* Animations */
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

.btn-click-animation:active, 
.clicking {
    transform: scale(0.97);
}

.dashboard-section {
    transition: opacity 0.3s ease;
}

.dashboard-section.fading {
    opacity: 0;
}

/* Responsive styles */
@media (max-width: 1200px) {
    .cards-container {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .grade-overview {
        grid-template-columns: 1fr;
    }
    
    .progress-overview {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 992px) {
    .dashboard-sidebar {
        transform: translateX(-100%);
        width: 240px;
    }
    
    .dashboard-sidebar.collapsed {
        transform: translateX(0);
        width: 50px;
    }
        
    .dashboard-main {
        margin-left: 0 !important;
        padding-left: 50px;
        transition: margin-left 0.3s ease, padding-left 0.3s ease;
    }
    
    .dashboard-sidebar:not(.collapsed) {
        width: 240px;
        transform: translateX(0);
    }
    
    .dashboard-content {
        padding: 18px 12px;
    }
    
    .dashboard-sidebar.collapsed + .dashboard-main {
        padding-left: 70px;
    }

    .card-header {
        padding: 8px;
    }
    
    .card-stat {
        font-size: 1.2rem;
    }

    .notes-container {
        grid-template-columns: 1fr;
    }
    
    .notes-sidebar {
        display: none;
    }
}

@media (max-width: 768px) {
    .dashboard-header {
        padding: 10.3px 27px;
        flex-direction: row;
        align-items: center;
        gap: 12px;
    }

    .sidebar-nav a {
    padding: 7.8px 12px;
}

    .cards-container {
        grid-template-columns: 1fr;
    }
    
    .header-actions {
        width: auto;
        justify-content: flex-end;
        margin-top: 0;
    }
    
    .dashboard-greeting h3 {
        font-size: 1rem;
    }

    .page-title h2 {
        font-size: 1.1rem;
        margin-left: -.4rem !important;
        margin-bottom: 0;
    }
    
    .card-header h4 {
        font-size: 0.8rem;
    }
    
    .card-stat {
        font-size: 1rem;
    }
}

@media (max-width: 576px) {
    .dashboard-sidebar:not(.collapsed) {
        width: 100%;
        max-width: 280px;
    }
    
    .dashboard-content {
        padding: 12px;
    }
    
    .dashboard-card {
        max-width: 100%;
        padding: 5px;
    }

    .dashboard-header {
        height: auto;
        padding: 10.3px 18px;
    }

    .card-content {
        padding: 8px;
    }
    
    .card-stat {
        font-size: 0.9rem;
    }
    
    .section-title {
        font-size: var(--fs-md);
    }
    
    .dashboard-sidebar.collapsed + .dashboard-main {
        padding-left: 50px;
    }

    .dashboard-sidebar.collapsed + .dashboard-main .dashboard-header {
        padding-left: 18px;
    }
}
</style>