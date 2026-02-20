// src/utils/globalProgressEvents.js
class GlobalProgressEvents {
  constructor() {
    this.eventBuffer = new Map()
    this.subscribers = new Map()
    this.isInitialized = false
  }

  init() {
    if (this.isInitialized) return

    console.log('🌍 GLOBAL PROGRESS EVENTS: Initializing')
    this.isInitialized = true
  }

  // Subscribe to global events (works even when component is not mounted)
  subscribePersistent(componentId, eventTypes, callback) {
    const id = `persistent-${componentId}-${Date.now()}`

    this.subscribers.set(id, {
      componentId,
      eventTypes: Array.isArray(eventTypes) ? eventTypes : [eventTypes],
      callback,
      subscribedAt: Date.now()
    })

    // Deliver any buffered events that match
    this.deliverBufferedEvents(id, eventTypes, callback)

    console.log(`🔔 GLOBAL EVENTS: ${componentId} subscribed to ${eventTypes.join(', ')}`)

    return () => {
      this.subscribers.delete(id)
      console.log(`🔕 GLOBAL EVENTS: ${componentId} unsubscribed`)
    }
  }

  deliverBufferedEvents(subscriberId, eventTypes, callback) {
    this.eventBuffer.forEach((event, key) => {
      if (eventTypes.includes(event.type)) {
        // Check if event is recent (last 30 seconds)
        if (Date.now() - event.timestamp < 30000) {
          console.log(`🔄 GLOBAL EVENTS: Delivering buffered event to ${subscriberId}`, event)
          callback(event)
        }
      }
    })
  }

  notifySubscribers(eventType, data) {
    this.subscribers.forEach((subscriber, id) => {
      if (subscriber.eventTypes.includes(eventType)) {
        try {
          subscriber.callback({
            type: eventType,
            data,
            timestamp: Date.now(),
            source: 'GlobalProgressEvents'
          })
        } catch (error) {
          console.error(`Error notifying subscriber ${subscriber.componentId}:`, error)
        }
      }
    })
  }

  // Force emit an event globally
  emitLessonCompleted(lessonId, courseCode) {
    console.log(`🌍 GLOBAL: Emitting lesson-completed for ${lessonId} in ${courseCode}`)

    // Store in buffer
    this.bufferEvent('lesson-completed', { lessonId, courseCode })

    // Notify subscribers
    this.notifySubscribers('lesson-completed', { lessonId, courseCode })

    // Also emit browser event for compatibility
    const event = new CustomEvent('lesson-completed', {
      detail: { lessonId, courseCode, timestamp: Date.now() }
    })
    window.dispatchEvent(event)
  }

  emitProgressUpdated(courseCode, progress, completedLessons, totalLessons) {
    console.log(`🌍 GLOBAL: Emitting progress-updated for ${courseCode} -> ${progress}%`)

    // Store in buffer
    this.bufferEvent('progress-updated', { courseCode, progress, completedLessons, totalLessons })

    // Notify subscribers
    this.notifySubscribers('progress-updated', { courseCode, progress, completedLessons, totalLessons })

    // Also emit browser event for compatibility
    const event = new CustomEvent('progress-updated', {
      detail: { courseCode, progress, completedLessons, totalLessons, timestamp: Date.now() }
    })
    window.dispatchEvent(event)
  }

  bufferEvent(eventType, data) {
    const key = `${eventType}-${data.courseCode}-${Date.now()}`
    this.eventBuffer.set(key, {
      type: eventType,
      data,
      timestamp: Date.now()
    })

    // Clean old events (keep only last 50)
    if (this.eventBuffer.size > 50) {
      const firstKey = this.eventBuffer.keys().next().value
      this.eventBuffer.delete(firstKey)
    }
  }
}

// Global instance
export const globalProgressEvents = new GlobalProgressEvents()

// Initialize immediately
if (typeof window !== 'undefined') {
  window.globalProgressEvents = globalProgressEvents
  globalProgressEvents.init()
}