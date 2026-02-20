export const slugDebugMiddleware = (to, from, next) => {
    if (to.params.lessonSlug) {
      console.log('🔗 Slug Debug Middleware:')
      console.log('  Route:', to.path)
      console.log('  Course Slug:', to.params.courseSlug)
      console.log('  Lesson Slug:', to.params.lessonSlug)
      console.log('  Is numeric?', !isNaN(to.params.lessonSlug))
    }
    next()
  }