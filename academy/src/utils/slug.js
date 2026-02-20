/**
 * Generate a consistent slug from a title
 * @param {string} title - The title to convert to slug
 * @returns {string} The generated slug
 */
export const generateSlug = (title) => {
  if (!title || typeof title !== 'string') return ''

  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}

/**
 * Find a lesson by slug in a lessons array
 * @param {Array} lessons - Array of lesson objects
 * @param {string} slug - The slug to find
 * @returns {Object|null} The found lesson or null
 */
export const findLessonBySlug = (lessons, slug) => {
  if (!lessons || !slug) return null

  return lessons.find(lesson => {
    if (!lesson.title) return false
    const lessonSlug = generateSlug(lesson.title)
    return lessonSlug === slug
  })
}

/**
 * Find a lesson by ID in a lessons array
 * @param {Array} lessons - Array of lesson objects
 * @param {string|number} id - The ID to find
 * @returns {Object|null} The found lesson or null
 */
export const findLessonById = (lessons, id) => {
  if (!lessons || id === undefined || id === null) return null

  const numericId = parseInt(id)
  return lessons.find(lesson => lesson.id === numericId)
}