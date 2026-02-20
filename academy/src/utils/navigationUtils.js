// src/utils/navigationUtils.js
// Single source of truth for slug generation and URL building.
// Import from here to avoid the guest first-click redirect bug.

export const generateSlug = (title) => {
  if (!title) return ''
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}

/**
 * Build the correct guest preview URL for any item type.
 * Returns null when required fields are missing so callers can
 * detect the failure instead of navigating to an undefined route.
 */
export const buildGuestUrl = (item) => {
  if (!item) return null

  const type =
    item.type ||
    (item.lessons_count !== undefined ? 'course' : null) ||
    (item.duration !== undefined ? 'lesson' : null) ||
    (item.questions_count !== undefined ? 'exercise' : null)

  switch (type) {
    case 'course': {
      const code = item.code
      if (!code) return null
      return `/guest/courses/${code}`
    }

    case 'lesson': {
      const courseCode = item.course_code || item.code
      if (!courseCode) return null
      const lessonSlug = item.slug || generateSlug(item.title)
      if (!lessonSlug) return null
      return `/guest/courses/${courseCode}/lessons/${lessonSlug}`
    }

    case 'exercise': {
      const courseCode = item.course_code || item.code
      return courseCode ? `/guest/courses/${courseCode}` : null
    }

    default:
      if (item.code) return `/guest/courses/${item.code}`
      if (item.course_code) return `/guest/courses/${item.course_code}`
      return null
  }
}

export const buildStudentUrl = (item) => {
  if (!item) return null

  const type =
    item.type ||
    (item.lessons_count !== undefined ? 'course' : null) ||
    (item.duration !== undefined ? 'lesson' : null)

  switch (type) {
    case 'course': {
      const code = item.code
      if (!code) return null
      return `/student/courses/${code}`
    }

    case 'lesson': {
      const courseCode = item.course_code || item.code
      if (!courseCode) return null
      const lessonSlug = item.slug || generateSlug(item.title)
      if (!lessonSlug) return null
      return `/student/courses/${courseCode}/lessons/${lessonSlug}`
    }

    case 'exercise':
      return item.id ? `/student/exercises/${item.id}` : null

    default:
      return item.code ? `/student/courses/${item.code}` : null
  }
}

export const navigationUtils = { generateSlug, buildGuestUrl, buildStudentUrl }
export default navigationUtils