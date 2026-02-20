// src/utils/globalProgressState.js
class GlobalProgressState {
  constructor() {
    this.state = new Map()
    this.subscribers = new Map()
    this.isInitialized = false
  }

  init() {
    if (this.isInitialized) return

    console.log('🌍 GLOBAL PROGRESS: Initializing persistent state')
    this.restoreFromStorage()
    this.isInitialized = true
  }

  // Subscribe with persistence (survives component unmounts)
  subscribePersistent(componentId, callback) {
    const id = `persistent-${componentId}-${Date.now()}`

    this.subscribers.set(id, {
      componentId,
      callback,
      subscribedAt: Date.now()
    })

    // Immediately send current state
    this.notifySubscriber(id, callback)

    console.log(`🔔 GLOBAL PROGRESS: ${componentId} subscribed persistently`)

    return () => {
      this.subscribers.delete(id)
      console.log(`🔕 GLOBAL PROGRESS: ${componentId} unsubscribed`)
    }
  }

  // Update progress and notify ALL persistent subscribers
  updateProgress(courseCode, progressData) {
    const current = this.state.get(courseCode) || {}
    const newData = {
      ...current,
      ...progressData,
      lastUpdated: Date.now(),
      updatedFrom: 'GlobalProgressState'
    }

    this.state.set(courseCode, newData)
    this.persistToStorage()

    console.log(`🌍 GLOBAL PROGRESS: Updated ${courseCode} -> ${newData.progress}%`)

    // Notify ALL persistent subscribers
    this.notifyAllSubscribers(courseCode, newData)

    return newData
  }

  getProgress(courseCode) {
    return this.state.get(courseCode) || {
      progress: 0,
      completedLessons: 0,
      totalLessons: 0,
      lastUpdated: null
    }
  }

  getAllProgress() {
    return Object.fromEntries(this.state)
  }

  // Notify a single subscriber
  notifySubscriber(subscriberId, callback) {
    try {
      const allProgress = this.getAllProgress()
      callback({
        type: 'initial-state',
        data: allProgress,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Error notifying subscriber:', error)
    }
  }

  // Notify all subscribers about a specific course update
  notifyAllSubscribers(courseCode, progressData) {
    this.subscribers.forEach((subscriber, id) => {
      try {
        subscriber.callback({
          type: 'progress-updated',
          courseCode,
          data: progressData,
          timestamp: Date.now(),
          source: 'GlobalProgressState'
        })
      } catch (error) {
        console.error(`Error notifying subscriber ${subscriber.componentId}:`, error)
      }
    })
  }

  // Persistence
  persistToStorage() {
    if (typeof window !== 'undefined') {
      try {
        const data = Object.fromEntries(this.state)
        localStorage.setItem('global-progress-state', JSON.stringify(data))
      } catch (error) {
        console.error('Error persisting global progress:', error)
      }
    }
  }

  restoreFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('global-progress-state')
        if (stored) {
          const data = JSON.parse(stored)
          this.state = new Map(Object.entries(data))
          console.log('🌍 GLOBAL PROGRESS: Restored from storage', data)
        }
      } catch (error) {
        console.error('Error restoring global progress:', error)
      }
    }
  }

  // Debug
  debugState() {
    console.log('🌍 GLOBAL PROGRESS DEBUG:')
    console.log('Subscribers:', this.subscribers.size)
    console.log('State:', Object.fromEntries(this.state))
  }
}

// Global instance
export const globalProgressState = new GlobalProgressState()

// Initialize immediately
if (typeof window !== 'undefined') {
  window.globalProgressState = globalProgressState
  globalProgressState.init()
}