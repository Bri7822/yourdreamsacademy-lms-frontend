// src/utils/navigationHistory.js
export const NavigationHistory = {
  // Store navigation source
  setSource(source, params = {}) {
    try {
      const historyData = {
        source,
        params,
        timestamp: Date.now()
      }
      sessionStorage.setItem('navigationSource', JSON.stringify(historyData))
      console.log('📌 Navigation source set:', source, params)
    } catch (error) {
      console.error('Failed to set navigation source:', error)
    }
  },

  // Get navigation source
  getSource() {
    try {
      const data = sessionStorage.getItem('navigationSource')
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Failed to get navigation source:', error)
      return null
    }
  },

  // Clear navigation source
  clear() {
    sessionStorage.removeItem('navigationSource')
  },

  // Get route to navigate back to
  getBackRoute(currentParams = {}) {
    const source = this.getSource()
    if (!source) return null

    console.log('🔍 Determining back route from source:', source.source)

    // Based on the source, determine where to go back
    switch (source.source) {
      case 'exercises-overview':
        return { name: 'exercises-overview' }

      case 'lessons-overview':
        return { name: 'lessons-overview' }

      case 'student-Lessons':
        return { name: 'student-Lessons' }

      case 'student-course-detail':
        // Return to the specific course detail
        const courseSlug = source.params?.courseSlug || currentParams.courseSlug
        if (courseSlug) {
          return {
            name: 'student-course-detail',
            params: { courseSlug }
          }
        }
        return { name: 'student-courses' }

      case 'guest-course-detail':
        // Return to guest course detail
        const guestSlug = source.params?.courseSlug || currentParams.courseSlug
        if (guestSlug) {
          return {
            name: 'guest-course-detail',
            params: { courseSlug: guestSlug }
          }
        }
        return { name: 'guest-courses' }

      case 'courses':
      case 'all-courses':
      case 'popular-courses':
      case 'new-courses':
        // Return to courses page
        return { name: 'courses' }

      default:
        // Fallback based on current context
        if (currentParams.courseSlug) {
          // If we have a course slug, try to return to course detail
          return {
            name: 'student-course-detail',
            params: { courseSlug: currentParams.courseSlug }
          }
        }
        return { name: 'student-dashboard' }
    }
  }
}