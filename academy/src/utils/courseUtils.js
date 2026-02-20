/**
 * Utility functions for course management
 */

// Format course data for display
export const formatCourseData = (course) => {
  return {
    id: course.id,
    title: course.title,
    code: course.code,
    description: course.description,
    price: course.price || 0,
    is_active: course.is_active || true,
    progress: course.progress || 0,
    completed_lessons: course.completed_lessons || 0,
    total_lessons: course.total_lessons || 0,
    enrollment_status: course.enrollment_status || 'not_enrolled',
    is_enrolled: course.is_enrolled || false,
    total_exercises: course.total_exercises || 0,
    video_count: course.video_count || 0,
    category: course.category || 'General',
    is_popular: course.is_popular || false,
    is_new: course.is_new || false,
    duration: course.duration || 0,
    teacher_name: course.teacher_name || 'Instructor',
    created_at: course.created_at || new Date().toISOString()
  }
}

// Validate course data
export const validateCourse = (course) => {
  if (!course) return false
  if (!course.id || !course.title || !course.code) return false
  return true
}

// Get course access level based on user status
export const getCourseAccessLevel = (course, user) => {
  if (!user) return 'guest'

  if (course.is_enrolled) {
    return 'enrolled'
  } else if (user.isAuthenticated) {
    return 'authenticated'
  } else {
    return 'guest'
  }
}

// Generate course route based on access level
export const getCourseRoute = (course, user) => {
  const accessLevel = getCourseAccessLevel(course, user)

  switch (accessLevel) {
    case 'enrolled':
      return `/student/courses/${course.code}`
    case 'authenticated':
      return `/courses/${course.code}`
    case 'guest':
    default:
      return `/guest/courses/${course.code}`
  }
}

// Filter courses by criteria
export const filterCourses = (courses, criteria = {}) => {
  return courses.filter(course => {
    if (criteria.category && course.category !== criteria.category) return false
    if (criteria.is_popular && !course.is_popular) return false
    if (criteria.is_new && !course.is_new) return false
    if (criteria.is_enrolled && !course.is_enrolled) return false
    if (criteria.search) {
      const searchTerm = criteria.search.toLowerCase()
      return (
        course.title.toLowerCase().includes(searchTerm) ||
        course.description.toLowerCase().includes(searchTerm) ||
        course.category.toLowerCase().includes(searchTerm)
      )
    }
    return true
  })
}

// Sort courses
export const sortCourses = (courses, sortBy = 'title') => {
  return [...courses].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title)
      case 'progress':
        return (b.progress || 0) - (a.progress || 0)
      case 'popular':
        return (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0)
      case 'new':
        return (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0)
      case 'date':
        return new Date(b.created_at) - new Date(a.created_at)
      default:
        return a.title.localeCompare(b.title)
    }
  })
}