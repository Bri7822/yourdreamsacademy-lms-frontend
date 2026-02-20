/**
 * Generate a slug from a title
 * @param {string} title - The title to convert to slug
 * @returns {string} The generated slug
 */
export const generateSlug = (title) => {
  if (!title) return '';

  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
};

/**
 * Find a lesson by slug in a lessons array
 * @param {Array} lessons - Array of lesson objects
 * @param {string} slug - The slug to find
 * @returns {Object|null} The found lesson or null
 */
export const findLessonBySlug = (lessons, slug) => {
  if (!lessons || !slug) return null;

  return lessons.find(lesson => {
    if (!lesson.title) return false;

    const lessonSlug = generateSlug(lesson.title);
    return lessonSlug === slug;
  });
};

/**
 * Find a lesson by ID in a lessons array
 * @param {Array} lessons - Array of lesson objects
 * @param {string|number} id - The ID to find
 * @returns {Object|null} The found lesson or null
 */
export const findLessonById = (lessons, id) => {
  if (!lessons || id === undefined || id === null) return null;

  const numericId = parseInt(id);
  return lessons.find(lesson => lesson.id === numericId);
};

/**
 * Get lesson navigation data for a course
 * @param {Array} lessons - Array of lesson objects
 * @param {string} currentSlug - Current lesson slug
 * @returns {Object} Navigation data with prev/next lessons
 */
export const getLessonNavigation = (lessons, currentSlug) => {
  if (!lessons || !currentSlug) return { prev: null, next: null };

  const currentIndex = lessons.findIndex(lesson => {
    const lessonSlug = generateSlug(lesson.title);
    return lessonSlug === currentSlug;
  });

  if (currentIndex === -1) return { prev: null, next: null };

  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return {
    prev: prevLesson ? {
      id: prevLesson.id,
      title: prevLesson.title,
      slug: generateSlug(prevLesson.title),
      order: prevLesson.order
    } : null,
    next: nextLesson ? {
      id: nextLesson.id,
      title: nextLesson.title,
      slug: generateSlug(nextLesson.title),
      order: nextLesson.order
    } : null
  };
};