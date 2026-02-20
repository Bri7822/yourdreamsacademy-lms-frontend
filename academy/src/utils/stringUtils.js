// src/utils/stringUtils.js
/**
 * Generate a URL-friendly slug from a title
 * @param {string} title - The title to convert to slug
 * @returns {string} URL-friendly slug
 */
export const generateSlug = (title) => {
  if (!title) return ''

  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-word, non-space, non-hyphen characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Trim hyphens from start and end
    .trim()
}

/**
 * Find a lesson by slug in an array of lessons
 * @param {Array} lessons - Array of lesson objects
 * @param {string} slug - Slug to find
 * @returns {Object|null} Found lesson or null
 */
export const findLessonBySlug = (lessons, slug) => {
  if (!lessons || !slug) return null

  // First try to find by exact slug match
  const lessonBySlug = lessons.find(lesson =>
    generateSlug(lesson.title) === slug
  )

  if (lessonBySlug) return lessonBySlug

  // Fallback: try to find by ID (for backward compatibility)
  const lessonById = lessons.find(lesson =>
    lesson.id.toString() === slug ||
    lesson.id === parseInt(slug)
  )

  return lessonById || null
}