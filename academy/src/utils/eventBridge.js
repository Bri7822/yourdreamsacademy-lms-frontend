// src/utils/eventBridge.js
class EventBridge {
  constructor() {
    this.channels = new Map()
    this.eventBuffer = new Map() // courseCode -> last events
    this.subscribers = new Map() // componentId -> subscriptions
    this.bufferSize = 10 // Keep last 10 events per course
    this.eventTTL = 30000 // 30 seconds
  }

  // Emit event with buffering
  emit(eventType, data) {
    const event = {
      type: eventType,
      data,
      timestamp: Date.now(),
      id: `${eventType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    // Buffer event for replay
    this.bufferEvent(eventType, event)

    // Notify current subscribers
    this.notifySubscribers(eventType, event)

    console.log(`🔔 EventBridge: ${eventType}`, data)
  }

  // Buffer event for late subscribers
  bufferEvent(eventType, event) {
    if (!this.eventBuffer.has(eventType)) {
      this.eventBuffer.set(eventType, [])
    }

    const buffer = this.eventBuffer.get(eventType)
    buffer.push(event)

    // Keep buffer size limited
    if (buffer.length > this.bufferSize) {
      buffer.shift()
    }

    // Clean old events
    this.cleanBuffer()
  }

  // Subscribe to events with replay
  subscribe(eventType, callback, componentId = 'unknown') {
    const subscriptionId = `${eventType}-${componentId}-${Date.now()}`

    // Create channel if it doesn't exist
    if (!this.channels.has(eventType)) {
      this.channels.set(eventType, new Set())
    }

    const channel = this.channels.get(eventType)
    const subscription = { callback, componentId, subscribedAt: Date.now() }

    channel.add(subscription)

    // Track subscription for cleanup
    if (!this.subscribers.has(componentId)) {
      this.subscribers.set(componentId, new Set())
    }
    this.subscribers.get(componentId).add(subscriptionId)

    // Replay recent events
    this.replayEvents(eventType, callback)

    console.log(`✅ EventBridge: ${componentId} subscribed to ${eventType}`)

    // Return unsubscribe function
    return () => {
      channel.delete(subscription)
      const compSubs = this.subscribers.get(componentId)
      if (compSubs) {
        compSubs.delete(subscriptionId)
        if (compSubs.size === 0) {
          this.subscribers.delete(componentId)
        }
      }
      console.log(`🔕 EventBridge: ${componentId} unsubscribed from ${eventType}`)
    }
  }

  // Replay recent events for new subscribers
  replayEvents(eventType, callback) {
    const buffer = this.eventBuffer.get(eventType)
    if (buffer) {
      const recentEvents = buffer.filter(event =>
        Date.now() - event.timestamp < this.eventTTL
      )

      recentEvents.forEach(event => {
        setTimeout(() => {
          callback(event.data)
        }, 10) // Small delay to ensure component is ready
      })

      if (recentEvents.length > 0) {
        console.log(`🔄 EventBridge: Replayed ${recentEvents.length} events for ${eventType}`)
      }
    }
  }

  // Notify all subscribers of an event
  notifySubscribers(eventType, event) {
    const channel = this.channels.get(eventType)
    if (channel) {
      channel.forEach(subscription => {
        try {
          subscription.callback(event.data)
        } catch (error) {
          console.error(`❌ EventBridge: Error in subscriber ${subscription.componentId}:`, error)
        }
      })
    }
  }

  // Clean old events from buffer
  cleanBuffer() {
    const now = Date.now()
    this.eventBuffer.forEach((buffer, eventType) => {
      this.eventBuffer.set(eventType,
        buffer.filter(event => now - event.timestamp < this.eventTTL)
      )
    })
  }

  // Get debug info
  getDebugInfo() {
    return {
      channels: Array.from(this.channels.keys()),
      bufferSizes: Object.fromEntries(
        Array.from(this.eventBuffer.entries()).map(([key, value]) => [key, value.length])
      ),
      subscribers: Array.from(this.subscribers.keys())
    }
  }

  // Cleanup all subscriptions for a component
  cleanupComponent(componentId) {
    const compSubs = this.subscribers.get(componentId)
    if (compSubs) {
      compSubs.forEach(subscriptionId => {
        // Parse subscriptionId to get eventType
        const eventType = subscriptionId.split('-')[0]
        const channel = this.channels.get(eventType)
        if (channel) {
          channel.forEach(sub => {
            if (sub.componentId === componentId) {
              channel.delete(sub)
            }
          })
        }
      })
      this.subscribers.delete(componentId)
    }
    console.log(`🧹 EventBridge: Cleaned up all subscriptions for ${componentId}`)
  }
}

// Global instance
export const eventBridge = new EventBridge()

// Initialize globally
if (typeof window !== 'undefined') {
  window.eventBridge = eventBridge
}