/**
 * src/utils/navigation.js
 *
 * Guest navigation utility — tracks where the user came from so the back
 * button can return them to ANY previous page, not just /guest/courses.
 *
 * Stores the full Vue Router location (name + path + params + query) so
 * GuestLessonHeader can reconstruct the exact back destination.
 */

import { generateSlug } from './slugUtils'

// ── Internal helpers ──────────────────────────────────────────────────────────

const safeGet = (key, parse = false) => {
  try {
    const val = sessionStorage.getItem(key)
    if (!val) return null
    return parse ? JSON.parse(val) : val
  } catch {
    return null
  }
}

const safeSet = (key, value, stringify = false) => {
  try {
    sessionStorage.setItem(key, stringify ? JSON.stringify(value) : value)
  } catch (err) {
    console.error(`[GuestNavigation] Failed to set "${key}":`, err)
  }
}

const safeRemove = (...keys) => {
  keys.forEach(k => { try { sessionStorage.removeItem(k) } catch (_) {} })
}

// ── Public API ────────────────────────────────────────────────────────────────

export const GuestNavigation = {

  /**
   * Store the FULL "from" route so goBack() can restore it exactly.
   *
   * Call this from the router afterEach when entering guest-lesson-detail.
   *
   * @param {import('vue-router').RouteLocationNormalized} fromRoute
   */
  setFromRoute(fromRoute) {
    if (!fromRoute || !fromRoute.name) return

    const stored = {
      name:   fromRoute.name,
      path:   fromRoute.path,
      params: { ...fromRoute.params },
      query:  { ...fromRoute.query },
    }

    safeSet('guestFromRoute', stored, true)
    // Keep the plain name around for backward compat with getSource()
    safeSet('guestNavigationSource', fromRoute.name)
    console.log('📍 [GuestNavigation] Stored from-route:', stored)
  },

  /**
   * Get the full stored from-route.
   * Returns null if nothing was stored.
   *
   * @returns {{ name: string, path: string, params: object, query: object } | null}
   */
  getFromRoute() {
    return safeGet('guestFromRoute', true)
  },

  // ── Legacy helpers (keep for backward compat) ─────────────────────────────

  /** @deprecated Use setFromRoute() */
  setSource(source) {
    safeSet('guestNavigationSource', typeof source === 'string' ? source : source?.name ?? '')
    console.log('📍 [GuestNavigation] Source set to:', source)
  },

  getSource() {
    return safeGet('guestNavigationSource')
  },

  clearSource() {
    safeRemove(
      'guestNavigationSource',
      'guestFromRoute',
      'guestCurrentCourseSlug',
      'guestCurrentLessonSlug',
      'lessonNavSource',
    )
  },

  // ── Course tracking ───────────────────────────────────────────────────────

  setCurrentCourse(courseSlug, courseTitle = '') {
    safeSet('guestCurrentCourseSlug', courseSlug)
    if (courseTitle) {
      safeSet(`guest_course_${courseSlug}`, { title: courseTitle }, true)
    }
  },

  getCurrentCourseSlug() {
    return safeGet('guestCurrentCourseSlug')
  },

  // ── Lesson tracking ───────────────────────────────────────────────────────

  setCurrentLesson(lessonSlug, lessonTitle = '') {
    safeSet('guestCurrentLessonSlug', lessonSlug)
    if (lessonTitle) {
      safeSet(`guest_lesson_${lessonSlug}`, { title: lessonTitle }, true)
    }
  },

  getCurrentLessonSlug() {
    return safeGet('guestCurrentLessonSlug')
  },

  // ── URL builders ──────────────────────────────────────────────────────────

  generateLessonUrl(courseSlug, lessonTitle, isGuest = false) {
    const lessonSlug = generateSlug(lessonTitle)
    const prefix     = isGuest ? '/guest' : '/student'
    return `${prefix}/courses/${courseSlug}/lessons/${lessonSlug}`
  },

  // ── Lesson nav source (used by router afterEach) ──────────────────────────

  setLessonNavSource(source, courseSlug, lessonSlug = null) {
    safeSet('lessonNavSource', { source, params: { courseSlug, lessonSlug }, timestamp: Date.now() }, true)
    console.log('📍 [GuestNavigation] Stored lesson nav source:', source)
  },

  getLessonNavSource() {
    return safeGet('lessonNavSource', true)
  },

  clearLessonNavSource() {
    safeRemove('lessonNavSource')
  },

  // ── Navigation history ────────────────────────────────────────────────────

  setNavigationHistory(fromRoute, toRoute) {
    safeSet('guestNavigationHistory', { from: fromRoute, to: toRoute, timestamp: Date.now() }, true)
  },

  getNavigationHistory() {
    return safeGet('guestNavigationHistory', true)
  },
}

export default GuestNavigation