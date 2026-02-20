// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import GuestCourseLayout from '@/views/guest/GuestCourseLayout.vue'
import { useGuestStore } from '@/stores/guest'
import { useToast } from 'vue-toastification'
import { NavigationHistory } from '@/utils/navigationHistory'
import { slugDebugMiddleware } from '@/middleware/slugDebug'

const toast = useToast()

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiresGuest: false, public: true },
  },
  {
    path: '/courses',
    name: 'courses',
    component: () => import('@/views/CoursesView.vue'),
    meta: {
      requiresGuest: false,
      transition: 'slide-up',
    },
  },
  {
    path: '/courses/all',
    name: 'all-courses',
    component: () => import('@/views/CoursesView.vue'),
    meta: {
      requiresGuest: false,
      public: true,
      transition: 'slide-up',
    },
  },
  {
    path: '/courses/popular',
    name: 'popular-courses',
    component: () => import('@/views/CoursesView.vue'),
    meta: {
      requiresGuest: false,
      transition: 'slide-up',
      public: true,
    },
  },
  {
    path: '/courses/new',
    name: 'new-courses',
    component: () => import('@/views/CoursesView.vue'),
    meta: {
      requiresGuest: false,
      transition: 'slide-up',
      public: true,
    },
  },
  {
    path: '/exercises',
    name: 'exercises-overview',
    component: () => import('@/components/home/HomeExercises.vue'),
    meta: {
      requiresGuest: false,
      public: true,
      transition: 'slide-up',
    },
  },
  {
    path: '/lessons',
    name: 'lessons-overview',
    component: () => import('@/components/home/LessonOverview.vue'),
    meta: {
      requiresGuest: false,
      public: true,
      transition: 'slide-up',
    },
  },
  {
    path: '/certificates',
    name: 'Certificates',
    component: () => import('@/components/home/HomeCertificates.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    meta: { public: true, requiresGuest: true, hideForAuth: true },
  },
  {
    path: '/signup',
    name: 'signup',
    component: () => import('@/views/Signup.vue'),
    meta: { requiresGuest: true, public: true, hideForAuth: true },
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: () => import('@/views/ForgotPassword.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: () => import('@/views/ResetPassword.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/admin',
    component: () => import('@/views/dashboard/AdminDashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('@/components/admin/DashboardHome.vue'),
        meta: { title: 'Dashboard' },
        props: true,
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('@/components/admin/UserManagement.vue'),
        meta: { title: 'User Management' },
      },
      {
        path: 'courses',
        name: 'admin-courses',
        component: () => import('@/components/admin/CourseManagement.vue'),
        meta: { title: 'Course Management' },
      },
      {
        path: 'enrollments',
        name: 'admin-enrollments',
        component: () => import('@/components/admin/EnrollmentManagement.vue'),
        meta: { title: 'Enrollments (Coming Soon)' },
      },
      {
        path: 'revenue',
        name: 'admin-revenue',
        component: () => import('@/components/admin/RevenueAnalytics.vue'),
        meta: { title: 'Revenue Analytics' },
      },
      {
        path: 'reports',
        name: 'admin-reports',
        component: () => import('@/components/admin/AdminReports.vue'),
        meta: { title: 'Reports' },
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: () => import('@/components/admin/Settings.vue'),
        meta: { title: 'System Settings' },
      },
    ],
  },

  {
    path: '/admin/courses/:courseSlug/lessons',
    name: 'course-lessons',
    component: () => import('@/components/admin/CourseTutorials.vue'),
    meta: { requiresAuth: true, adminOnly: true },
    props: (route) => ({
      courseSlug: route.params.courseSlug,
      // You can add other props here if needed
    }),
  },

  {
    path: '/student',
    component: () => import('@/views/dashboard/StudentDashboard.vue'),
    meta: {
      requiresAuth: true,
      requiresStudent: true,
    },
    children: [
      {
        path: '',
        name: 'student-dashboard',
        component: () => import('@/components/student/DashboardHome.vue'),
      },
      {
        path: 'courses',
        name: 'student-courses',
        component: () => import('@/components/student/CourseList.vue'),
      },
      {
        path: 'courses/:courseSlug',
        name: 'student-course-detail',
        component: () => import('@/components/student/CourseLayout.vue'),
        props: true,
        meta: {
          hideNavbar: true,
          hideFooter: true,
          requiresAuth: true,
          requiresStudent: true,
        },
      },

      {
        path: 'courses/:courseSlug/lessons',
        name: 'student-course-lessons',
        redirect: (to) => {
          // Redirect to first lesson of the course
          return {
            name: 'student-lesson-detail',
            params: {
              courseSlug: to.params.courseSlug,
              lessonId: 'first', // Will be handled by component to find first lesson
            },
            query: to.query,
          }
        },
      },
      {
        path: 'courses/:courseSlug/lessons/:lessonSlug',
        name: 'student-lesson-detail',
        component: () => import('@/components/student/LessonDetailParent.vue'), // NEW COMPONENT
        props: (route) => ({
          courseSlug: route.params.courseSlug,
          lessonId: route.params.lessonSlug,
        }),
        meta: {
          requiresAuth: true,
          requiresStudent: true,
          title: 'Course Lessons',
          showBackButton: true,
          standalone: true,
          keepAlive: true,
          noReload: true,
          hideNavbar: true,
          hideFooter: true,
        },
      },

      // {
      //   path: 'exercises',
      //   name: 'student-exercises',
      //   component: () => import('@/components/student/ExerciseList.vue')
      // },
      // {
      //   path: 'exercises/:exerciseSlug',
      //   name: 'student-exercise-detail',
      //   component: () => import('@/components/student/ExerciseDetail.vue'),
      //   props: true
      // },
      {
        path: 'grades',
        name: 'student-grades',
        component: () => import('@/components/student/GradesView.vue'),
      },
      {
        path: 'view-lessons',
        name: 'student-Lessons',
        component: () => import('@/components/student/LessonsView.vue'),
      },
      {
        path: 'progress',
        name: 'student-progress',
        component: () => import('@/components/student/ProgressView.vue'),
      },
      {
        path: 'notes',
        name: 'student-notes',
        component: () => import('@/components/student/NotesView.vue'),
      },
      {
        path: 'certificates',
        name: 'student-certificates',
        component: () => import('@/components/student/CertificatesView.vue'),
      },
      {
        path: 'settings',
        name: 'student-settings',
        component: () => import('@/components/student/SettingsView.vue'),
      },
    ],
  },

  // Guest Routes - SINGLE DEFINITION WITH PROPER STRUCTURE
  {
    path: '/guest',
    redirect: '/guest/courses',
  },
  {
    path: '/guest/courses',
    component: GuestCourseLayout,
    meta: {
      hideNavbar: true,
      hideFooter: true,
      requiresGuest: true,
      public: true,
      guestAccess: true,
      noReload: true,
    },
    children: [
      // Guest courses list
      {
        path: '',
        name: 'guest-courses',
        component: () => import('@/views/CoursesView.vue'),
        meta: {
          title: 'Available Courses',
          hideNavbar: false,
          hideFooter: false,
        },
      },
      // Guest course detail
      {
        path: ':courseSlug',
        name: 'guest-course-detail',
        component: () => import('@/views/guest/CourseDetailGuest.vue'),
        props: true,
        meta: {
          title: 'Course Preview',
          hideNavbar: true,
          hideFooter: true,
          requiresGuest: true,
          public: true,
          noReload: true,
        },
        beforeEnter: (to, from, next) => {
          console.log('🔐 Guest Course Detail Route Guard - Preventing reload')
          // This guard can be used for any pre-navigation logic if needed
          next()
        },
      },
    ],
  },
  // ✅ ADD THIS: Separate route for guest lessons WITH GuestLessonLayout
  {
    path: '/guest/courses/:courseSlug/lessons/:lessonSlug',
    name: 'guest-lesson-detail',
    component: () => import('@/views/guest/GuestLessonLayout.vue'),
    props: (route) => ({
      courseSlug: route.params.courseSlug,
      lessonId:   route.params.lessonSlug,
    }),
    meta: {
      hideNavbar:    true,
      hideFooter:    true,
      requiresGuest: true,
      public:        true,
      guestAccess:   true,
      noReload:      true,
    },
    beforeEnter: async (to, from, next) => {
      console.log('🔐 Guest Lesson Route Guard')
      const guestStore = useGuestStore()

      // ── Session already active ────────────────────────────────────────────
      if (guestStore.isGuestMode) {
        if (guestStore.remainingTime <= 0) {
          console.log('⏰ Guest session expired, redirecting to signup')
          guestStore.endSession()
          return next('/signup')
        }

        // Ensure timer is ticking
        if (!guestStore.timerStarted) {
          guestStore.startTimer()
        }

        console.log('✅ Guest session active, allowing access')
        return next()
      }

      // ── No session yet — start one NOW before allowing navigation ─────────
      // This is the key fix: the component (SearchResults / SearchSuggestions)
      // already called startGuestSession() and awaited it, but the Pinia
      // reactive state may not have propagated to this guard's execution
      // context in time on the very first navigation.  We call it again here;
      // if a session was already created by the component it will either be
      // a no-op or return the existing session quickly.
      console.log('🔄 No guest session in guard — starting session before allowing access')
      try {
        const result = await guestStore.startGuestSession()

        if (!result.success) {
          console.log('⚠️ Could not start guest session, redirecting to signup')
          toast.error(result.error || 'Failed to start preview session. Please sign up.', {
            timeout: 5000,
          })
          return next('/signup')
        }

        console.log('✅ Guest session started in guard, allowing access')
        return next()
      } catch (err) {
        console.error('❌ Guest session error in route guard:', err)
        return next('/signup')
      }
    },
    children: [
      {
        path: '',
        component: () => import('@/views/guest/LessonDetailGuest.vue'),
        props: (route) => ({
          courseSlug: route.params.courseSlug,
          lessonId:   route.params.lessonSlug,
        }),
        meta: {
          title:         'Lesson Preview',
          hideNavbar:    true,
          hideFooter:    true,
          requiresGuest: true,
          public:        true,
          guestAccess:   true,
          noReload:      true,
        },
      },
    ],
  },

  // Add these routes to your existing router configuration
  {
    path: '/search',
    name: 'search-results',
    component: () => import('@/views/SearchResults.vue'),
    meta: {
      public: true,
      requiresGuest: false,
    },
  },
  {
    path: '/search/suggestions',
    name: 'search-suggestions',
    component: () => import('@/components/home/SearchSuggestions.vue'),
    meta: {
      public: true,
      requiresGuest: false,
    },
  },

  {
    path: '/teacher',
    name: 'teacher-dashboard',
    component: () => import('@/views/dashboard/TeacherDashboard.vue'),
    meta: {
      requiresAuth: true,
      requiresTeacher: true,
      title: 'Teacher Dashboard',
    },
  },
  // {
  //   path: '/student',
  //   name: 'student-dashboard',
  //   component: () => import('@/views/dashboard/StudentDashboard.vue'),
  //   meta: {
  //     requiresAuth: true,
  //     requiresStudent: true,
  //     title: 'Student Dashboard'
  //   }
  // },
  {
    path: '/dashboard',
    redirect: (to) => {
      const authStore = useAuthStore()
      if (!authStore.isAuthenticated) return { name: 'login' }

      switch (authStore.userType) {
        case 'admin':
          return { name: 'admin-dashboard' }
        case 'teacher':
          return { name: 'teacher-dashboard' }
        case 'student':
          return { name: 'student-dashboard' }
        default:
          return { name: 'login' }
      }
    },
  },

  // Catch-all for 404
  //   {
  //     path: '/:pathMatch(.*)*',
  //     name: 'not-found',
  //     component: () => import('@/views/NotFound.vue')
  //   }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  },
})

router.beforeResolve((to, from, next) => {
  console.log('🔄 BeforeResolve:', { from: from.name, to: to.name })

  // Check if we're navigating within student dashboard
  const isStudentRoute = to.matched.some((record) => record.path.startsWith('/student'))
  const isFromStudentRoute = from.matched.some((record) => record.path.startsWith('/student'))

  // If both are student routes, try to prevent component recreation
  if (isStudentRoute && isFromStudentRoute) {
    console.log('📱 Student navigation - optimizing for no reload')

    // Check if it's the same parent route (StudentDashboard)
    const toParent = to.matched.find((record) => record.path === '/student')
    const fromParent = from.matched.find((record) => record.path === '/student')

    if (toParent && fromParent && toParent === fromParent) {
      console.log('✅ Same parent route - preventing unnecessary reload')
    }
  }

  next()
})

let isHandlingGuestRoute = false

router.beforeEach(async (to, from, next) => {
  console.log('🚦 Router navigating:', {
    from: from.path,
    to: to.path,
  })

  // Prevent infinite loops
  if (isHandlingGuestRoute) {
    return next()
  }

  isHandlingGuestRoute = true

  try {
    const { useAuthStore } = await import('@/stores/auth')
    const { useGuestStore } = await import('@/stores/guest')

    const authStore = useAuthStore()
    const guestStore = useGuestStore()

    // Initialize auth store if not already initialized
    if (!authStore.isInitialized) {
      await authStore.initAuth()
    }

    // ✅ CRITICAL: Clean up guest session if user is authenticated
    if (authStore.isAuthenticated && guestStore.isGuestMode) {
      console.log('🔄 User authenticated with active guest session - cleaning up...')
      guestStore.endSession()
    }

    // ✅ PUBLIC ROUTES: Always allow access immediately
    if (to.meta.public) {
      console.log('✅ Public route - allowing access:', to.path)

      // For authenticated users trying to access login/signup, redirect to dashboard
      if (to.meta.hideForAuth && authStore.isAuthenticated) {
        console.log('🔐 User authenticated, redirecting from auth page to dashboard')

        // Clear any guest session before redirecting
        if (guestStore.isGuestMode) {
          guestStore.endSession()
        }

        // Redirect based on user type
        if (authStore.isStudent) return next('/student')
        if (authStore.isAdmin) return next('/admin')
        if (authStore.isTeacher) return next('/teacher')
        return next('/dashboard')
      }

      return next()
    }

    // ✅ GUEST ACCESS ROUTES: Handle guest access with time limit
    if (to.meta.guestAccess) {
      console.log('🎯 Guest route - checking access:', to.path)

      // If user is authenticated, redirect to appropriate dashboard
      if (authStore.isAuthenticated) {
        console.log('✅ User authenticated, redirecting from guest route')

        // Clear guest session before redirecting
        if (guestStore.isGuestMode) {
          guestStore.endSession()
        }

        // Redirect based on user type
        if (authStore.isStudent) return next('/student')
        if (authStore.isAdmin) return next('/admin')
        if (authStore.isTeacher) return next('/teacher')
        return next('/dashboard')
      }

      // ✅ CRITICAL: Check if guest session has expired (0 seconds remaining)
      if (guestStore.isGuestMode && guestStore.remainingTime <= 0) {
        console.log('❌ Guest session expired, redirecting to signup')
        guestStore.endSession()
        return next('/signup')
      }

      // Try to start guest session if needed
      if (!guestStore.isGuestMode) {
        console.log('🔄 No guest session, attempting to start...')
        const result = await guestStore.startGuestSession()

        if (!result.success) {
          console.log('⚠️ Guest session failed, redirecting to signup')
          toast.error(result.error || 'Failed to start guest session. Please sign up.', {
            timeout: 5000,
          })
          return next('/signup')
        } else {
          console.log('✅ Guest session started successfully')
        }
      } else if (!guestStore.timerStarted) {
        // Ensure timer is running for existing sessions
        guestStore.startTimer()
      }

      return next()
    }

    // ✅ LEGACY REQUIRES_GUEST ROUTES: Convert to public access
    if (to.meta.requiresGuest) {
      console.log('🔄 Legacy guest route - converting to public access:', to.path)

      // If user is authenticated, redirect to appropriate dashboard
      if (authStore.isAuthenticated) {
        console.log('✅ User authenticated, redirecting from guest route')

        // Clear any guest session
        if (guestStore.isGuestMode) {
          guestStore.endSession()
        }

        if (authStore.isStudent) return next('/student')
        if (authStore.isAdmin) return next('/admin')
        if (authStore.isTeacher) return next('/teacher')
        return next('/dashboard')
      }

      // Allow access without requiring guest session
      console.log('✅ Allowing public access to legacy guest route')
      return next()
    }

    // ✅ PROTECTED ROUTES: Require authentication
    if (to.meta.requiresAuth) {
      console.log('🔐 Protected route - checking auth:', to.path)

      if (!authStore.isAuthenticated) {
        console.log('❌ User not authenticated, redirecting to login')

        // Clear guest session if exists (user might be coming from guest to login)
        if (guestStore.isGuestMode) {
          console.log('🧹 Clearing guest session before login redirect')
          guestStore.endSession()
        }

        return next({
          name: 'login',
          query: { redirect: to.fullPath },
        })
      }

      // Check specific role requirements
      if (to.meta.requiresAdmin && !authStore.isAdmin) {
        console.log('❌ Admin access required')
        return next({ name: 'login' })
      }
      if (to.meta.requiresTeacher && !authStore.isTeacher) {
        console.log('❌ Teacher access required')
        return next({ name: 'login' })
      }
      if (to.meta.requiresStudent && !authStore.isStudent) {
        console.log('❌ Student access required')
        return next({ name: 'login' })
      }

      console.log('✅ Auth check passed for protected route')
    }

    // Handle course navigation and lesson store management
    const { useLessonStore } = await import('@/stores/lesson')
    const lessonStore = useLessonStore()

    // Reset lesson store when navigating between different courses in lesson view
    if (to.name === 'student-lesson-detail' && from.name === 'student-lesson-detail') {
      const oldCourseSlug = from.params.courseSlug
      const newCourseSlug = to.params.courseSlug

      if (oldCourseSlug !== newCourseSlug) {
        console.log('🚨 ROUTER: Course changed in lesson view - resetting store')
        lessonStore.reset()
      }
    }

    // Reset lesson store when coming from course detail to lesson view with different course
    if (to.name === 'student-lesson-detail' && from.name === 'student-course-detail') {
      const targetCourse = to.params.courseSlug
      const storeCourse = lessonStore.courseData?.code

      if (storeCourse && storeCourse !== targetCourse) {
        console.log('🧹 ROUTER: Clearing old course data')
        lessonStore.reset()
      }
    }

    // ✅ DEFAULT: Allow navigation
    console.log('✅ Allowing navigation to:', to.path)
    next()
  } catch (error) {
    console.error('❌ Router guard error:', error)
    // Fallback to courses page to prevent infinite loops
    console.log('🔄 Fallback to courses page due to error')
    next('/courses')
  } finally {
    isHandlingGuestRoute = false
  }
})

router.afterEach((to, from) => {
  // Store the previous route in sessionStorage or a store
  if (from.name) {
    sessionStorage.setItem(
      'previousRoute',
      JSON.stringify({
        name: from.name,
        params: from.params,
        query: from.query,
      }),
    )
  }
})

router.afterEach((to, from) => {
  // Store the previous route for guest navigation
  if (to.name === 'guest-lesson-detail' && from.name) {
    console.log('📍 ROUTER: Storing guest navigation source:', from.name)
    try {
      sessionStorage.setItem('guestNavigationSource', from.name)

      // Store course slug if available
      if (to.params.courseSlug) {
        sessionStorage.setItem('guestCurrentCourseSlug', to.params.courseSlug)
      }
    } catch (error) {
      console.error('Failed to store guest navigation source:', error)
    }
  }

  // Clear guest navigation source when leaving guest mode
  if (from.name && from.name.includes('guest') && !to.name.includes('guest')) {
    try {
      sessionStorage.removeItem('guestNavigationSource')
      sessionStorage.removeItem('guestCurrentCourseSlug')
    } catch (error) {
      console.error('Failed to clear guest navigation source:', error)
    }
  }
})

// Add this to the existing router.afterEach in src/router/index.js
router.afterEach((to, from) => {
  // Store navigation source when going to lesson detail from specific routes
  if (to.name === 'student-lesson-detail' || to.name === 'guest-lesson-detail') {
    console.log('📌 Router: Storing navigation source from:', from.name)

    // Only store from specific sources
    const validSources = [
      'exercises-overview',
      'lessons-overview',
      'student-Lessons',
      'student-course-detail',
      'guest-course-detail',
      'courses',
      'all-courses',
      'popular-courses',
      'new-courses',
    ]

    if (validSources.includes(from.name)) {
      const sourceData = {
        source: from.name,
        params: {
          courseSlug: to.params.courseSlug,
          ...from.params,
        },
        query: from.query,
        timestamp: Date.now(),
      }

      // Store in sessionStorage as backup
      sessionStorage.setItem('lessonNavSource', JSON.stringify(sourceData))

      // Store in NavigationHistory utility
      if (typeof NavigationHistory !== 'undefined') {
        NavigationHistory.setSource(from.name, {
          courseSlug: to.params.courseSlug,
          ...from.params,
        })
      }
    }
  }

  // Clear navigation source when leaving lesson detail
  if (
    (from.name === 'student-lesson-detail' || from.name === 'guest-lesson-detail') &&
    to.name !== 'student-lesson-detail' &&
    to.name !== 'guest-lesson-detail'
  ) {
    console.log('🧹 Clearing navigation source - leaving lesson detail')
    sessionStorage.removeItem('lessonNavSource')

    if (typeof NavigationHistory !== 'undefined') {
      NavigationHistory.clear()
    }
  }

  // Store previous route for general use
  if (from.name) {
    sessionStorage.setItem(
      'previousRoute',
      JSON.stringify({
        name: from.name,
        params: from.params,
        query: from.query,
      }),
    )
  }
})

router.beforeEach((to, from, next) => {
  slugDebugMiddleware(to, from, next)
})

// Store navigation source for course detail views
router.afterEach((to, from) => {
  // Store navigation source when going to course detail from specific routes
  if (to.name === 'student-course-detail' || to.name === 'guest-course-detail') {
    console.log('📌 Router: Storing course navigation source from:', from.name)

    // Only store from specific sources
    const validSources = [
      'student-courses',
      'student-dashboard',
      'courses',
      'all-courses',
      'popular-courses',
      'new-courses',
      'home'
    ]

    if (validSources.includes(from.name)) {
      const sourceData = {
        source: from.name,
        params: {
          ...from.params,
        },
        query: from.query,
        timestamp: Date.now(),
      }

      // Store in sessionStorage
      sessionStorage.setItem('courseNavSource', JSON.stringify(sourceData))
      console.log('✅ Stored course navigation source:', sourceData)
    }
  }

  // Clear course navigation source when leaving course detail
  if (
    (from.name === 'student-course-detail' || from.name === 'guest-course-detail') &&
    to.name !== 'student-course-detail' &&
    to.name !== 'guest-course-detail' &&
    to.name !== 'student-lesson-detail' &&
    to.name !== 'guest-lesson-detail'
  ) {
    console.log('🧹 Clearing course navigation source - leaving course detail')
    sessionStorage.removeItem('courseNavSource')
  }

  // Store navigation source when going to lesson detail from specific routes
  if (to.name === 'student-lesson-detail' || to.name === 'guest-lesson-detail') {
    console.log('📌 Router: Storing navigation source from:', from.name)

    // Only store from specific sources
    const validSources = [
      'exercises-overview',
      'lessons-overview',
      'student-Lessons',
      'student-course-detail',
      'guest-course-detail',
      'courses',
      'all-courses',
      'popular-courses',
      'new-courses',
    ]

    if (validSources.includes(from.name)) {
      const sourceData = {
        source: from.name,
        params: {
          courseSlug: to.params.courseSlug,
          ...from.params,
        },
        query: from.query,
        timestamp: Date.now(),
      }

      // Store in sessionStorage as backup
      sessionStorage.setItem('lessonNavSource', JSON.stringify(sourceData))

      // Store in NavigationHistory utility
      if (typeof NavigationHistory !== 'undefined') {
        NavigationHistory.setSource(from.name, {
          courseSlug: to.params.courseSlug,
          ...from.params,
        })
      }
    }
  }

  // Clear navigation source when leaving lesson detail
  if (
    (from.name === 'student-lesson-detail' || from.name === 'guest-lesson-detail') &&
    to.name !== 'student-lesson-detail' &&
    to.name !== 'guest-lesson-detail'
  ) {
    console.log('🧹 Clearing navigation source - leaving lesson detail')
    sessionStorage.removeItem('lessonNavSource')

    if (typeof NavigationHistory !== 'undefined') {
      NavigationHistory.clear()
    }
  }

  // Store previous route for general use
  if (from.name) {
    sessionStorage.setItem(
      'previousRoute',
      JSON.stringify({
        name: from.name,
        params: from.params,
        query: from.query,
      }),
    )
  }

  // Store the previous route for guest navigation
  if (to.name === 'guest-lesson-detail' && from.name) {
    console.log('📍 ROUTER: Storing guest navigation source:', from.name)
    try {
      sessionStorage.setItem('guestNavigationSource', from.name)

      // Store course slug if available
      if (to.params.courseSlug) {
        sessionStorage.setItem('guestCurrentCourseSlug', to.params.courseSlug)
      }
    } catch (error) {
      console.error('Failed to store guest navigation source:', error)
    }
  }

  // Clear guest navigation source when leaving guest mode
  if (from.name && from.name.includes('guest') && !to.name.includes('guest')) {
    try {
      sessionStorage.removeItem('guestNavigationSource')
      sessionStorage.removeItem('guestCurrentCourseSlug')
    } catch (error) {
      console.error('Failed to clear guest navigation source:', error)
    }
  }
})

export default router
