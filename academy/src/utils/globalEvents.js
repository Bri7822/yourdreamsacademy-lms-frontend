// src/utils/globalEvents.js - GLOBAL EVENT SYSTEM THAT NEVER FAILS

class GlobalEventSystem {
  constructor() {
    this.listeners = new Map();
    this.eventQueue = [];
    this.isInitialized = false;
    console.log('🎯 GLOBAL EVENT SYSTEM: Initialized');
  }

  init() {
    if (this.isInitialized) return;

    // Global event listener that NEVER gets removed
    if (typeof window !== 'undefined') {
      window._globalLessonCompleted = this.handleLessonCompleted.bind(this);
      window.addEventListener('lesson-completed', window._globalLessonCompleted);
      console.log('🔗 GLOBAL EVENT SYSTEM: Permanent listener installed');
    }

    this.isInitialized = true;
  }

  handleLessonCompleted(event) {
    console.log('🎯 GLOBAL EVENT CAPTURED:', event.detail);

    // Store the event for new subscribers
    this.eventQueue.push(event.detail);
    if (this.eventQueue.length > 10) this.eventQueue.shift();

    // Notify all listeners
    this.listeners.forEach((callback, id) => {
      try {
        callback(event.detail);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  subscribe(callback, componentName = 'unknown') {
    const id = `${componentName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.listeners.set(id, callback);

    console.log(`🔔 GLOBAL EVENT: ${componentName} subscribed (${this.listeners.size} total listeners)`);

    // Send recent events to new subscriber
    if (this.eventQueue.length > 0) {
      setTimeout(() => {
        this.eventQueue.forEach(event => callback(event));
      }, 100);
    }

    return () => {
      this.listeners.delete(id);
      console.log(`🔕 GLOBAL EVENT: ${componentName} unsubscribed (${this.listeners.size} remaining)`);
    };
  }

  emitLessonCompleted(eventData) {
    console.log('🚀 GLOBAL EVENT EMITTED:', eventData);

    if (typeof window !== 'undefined') {
      const event = new CustomEvent('lesson-completed', { detail: eventData });
      window.dispatchEvent(event);
    }

    // Also handle immediately for reliability
    this.handleLessonCompleted({ detail: eventData });
  }

  getListenerCount() {
    return this.listeners.size;
  }
}

// SINGLE GLOBAL INSTANCE - This never gets destroyed
export const globalEvents = new GlobalEventSystem();

// Initialize immediately
if (typeof window !== 'undefined') {
  window._globalEventSystem = globalEvents;
  globalEvents.init();
}