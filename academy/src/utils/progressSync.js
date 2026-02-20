// src/utils/progressSync.js - COMPLETE FIXED VERSION
class ProgressSyncSystem {
  constructor() {
    this.subscribers = new Map();
    this.progressCache = new Map();
    this.isInitialized = false;
    this.pollingInterval = null;
    this.debugMode = true;
    this.persistentSubscribers = new Map();
  }

  init() {
    if (this.isInitialized) return;

    console.log('🔄 PROGRESS SYNC: System initializing...');

    // Restore cached data
    this.restoreCache();

    // Single global event listener
    window.addEventListener('lesson-completed', this.handleLessonCompleted.bind(this));
    window.addEventListener('progress-updated', this.handleProgressUpdate.bind(this));
    window.addEventListener('course-changed', this.handleCourseChanged.bind(this));

    // Create persistent global subscriber
    this.createPersistentSubscribers();

    // Smart polling for backup
    this.startSmartPolling();

    this.isInitialized = true;
    console.log('✅ PROGRESS SYNC: System initialized successfully');
  }

  // Create persistent subscribers that never unsubscribe
  createPersistentSubscribers() {
    // Global persistent subscriber
    const globalId = 'persistent-global';
    this.persistentSubscribers.set(globalId, {
      courseCode: '*',
      callback: (data) => {
        console.log('🌍 PERSISTENT GLOBAL: Received update', data);
        // This subscriber never unsubscribes and always listens
      },
      componentName: 'PersistentGlobal',
      id: globalId
    });

    console.log('🔔 PERSISTENT: Created global persistent subscriber');
  }

  handleLessonCompleted(event) {
    this.log('🎯 PROGRESS SYNC: Lesson completed event received', event.detail);

    const { courseCode, lessonId, progress, completedLessons, totalLessons } = event.detail;

    this.updateProgressCache(courseCode, {
      progress,
      completedLessons,
      totalLessons,
      lastUpdated: Date.now(),
      source: 'lesson-completed',
      lessonId
    });

    // Notify both regular and persistent subscribers
    this.notifyAllSubscribers(courseCode, 'lesson-completed', event.detail);
  }

  handleProgressUpdate(event) {
    // ✅ NEW: Check for loop prevention flag
    if (event.detail && event.detail.preventLoop) {
      this.log('⏭️ PROGRESS SYNC: Loop prevention flag detected, skipping cache update')
      return
    }

    this.log('📊 PROGRESS SYNC: Progress update event received', event.detail);

    const { courseCode, progress, completedLessons, totalLessons } = event.detail;

    // ✅ NEW: Only update cache if values actually changed
    const currentCache = this.getProgress(courseCode)
    if (currentCache.progress === progress &&
        currentCache.completedLessons === completedLessons &&
        currentCache.totalLessons === totalLessons) {
      this.log(`⏭️ PROGRESS SYNC: No changes for ${courseCode}, skipping cache update`)
      return
    }

    this.updateProgressCache(courseCode, {
      progress,
      completedLessons,
      totalLessons,
      lastUpdated: Date.now(),
      source: 'progress-updated'
    });

    this.notifyAllSubscribers(courseCode, 'progress-updated', event.detail);
  }

  handleCourseChanged(event) {
    this.log('🔄 PROGRESS SYNC: Course changed event received', event.detail);
    const { courseCode } = event.detail;
    this.notifyAllSubscribers(courseCode, 'course-changed', event.detail);
  }

  // Notify both regular and persistent subscribers
  notifyAllSubscribers(courseCode, eventType, data) {
    const safeCourseCode = String(courseCode || '*');
    let notifiedCount = 0;

    this.log(`📢 NOTIFYING ALL: Starting notification for ${safeCourseCode}`);

    // Notify regular subscribers
    this.subscribers.forEach((sub, id) => {
      if (sub.courseCode === safeCourseCode || sub.courseCode === '*') {
        try {
          const eventData = this.createEventData(data, eventType, sub.componentName);
          this.log(`📨 Sending to ${sub.componentName}:`, eventData);
          sub.callback(eventData);
          notifiedCount++;
        } catch (error) {
          console.error(`❌ Error in subscriber ${sub.componentName}:`, error);
        }
      }
    });

    // Always notify persistent subscribers (they never unsubscribe)
    this.persistentSubscribers.forEach((sub, id) => {
      if (sub.courseCode === safeCourseCode || sub.courseCode === '*') {
        try {
          const eventData = this.createEventData(data, eventType, sub.componentName);
          this.log(`📨 Sending to PERSISTENT ${sub.componentName}:`, eventData);
          sub.callback(eventData);
          notifiedCount++;
        } catch (error) {
          console.error(`❌ Error in persistent subscriber ${sub.componentName}:`, error);
        }
      }
    });

    if (notifiedCount > 0) {
      this.log(`✅ NOTIFIED: ${notifiedCount} subscribers for ${safeCourseCode}`);
    } else {
      this.log(`⚠️  NO SUBSCRIBERS: No one listening for ${safeCourseCode}`);

      // Even if no subscribers, ensure cache is updated
      this.ensureCachePropagation(safeCourseCode, data);
    }
  }

  // Ensure cache propagation even without subscribers
  ensureCachePropagation(courseCode, data) {
    this.log(`💾 ENSURING CACHE PROPAGATION for ${courseCode}`);

    // Update cache for all related courses
    if (courseCode !== '*') {
      this.updateProgressCache(courseCode, {
        ...data,
        lastUpdated: Date.now(),
        source: 'cache-propagation'
      });
    }

    // Also update global cache
    this.updateProgressCache('*', {
      progress: data.progress,
      lastUpdated: Date.now(),
      source: 'global-cache-propagation'
    });
  }

  createEventData(data, eventType, componentName) {
    return {
      ...data,
      eventType,
      timestamp: Date.now(),
      source: 'progress-sync',
      notifiedComponent: componentName
    };
  }

  updateProgressCache(courseCode, progressData) {
    const safeCourseCode = String(courseCode || '*');
    const current = this.progressCache.get(safeCourseCode) || {};
    const updated = {
      ...current,
      ...progressData,
      lastUpdated: Date.now()
    };

    this.progressCache.set(safeCourseCode, updated);
    this.log(`💾 CACHE UPDATED: ${safeCourseCode} -> ${updated.progress}%`, updated);

    // Persist to localStorage
    this.persistCache();
  }

  // Persist cache to localStorage
  persistCache() {
    if (typeof window !== 'undefined') {
      try {
        const cacheData = Object.fromEntries(this.progressCache);
        localStorage.setItem('progress-sync-cache', JSON.stringify(cacheData));
        this.log('💾 Cache persisted to localStorage');
      } catch (error) {
        console.error('Error persisting cache:', error);
      }
    }
  }

  // Restore cache from localStorage
  restoreCache() {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('progress-sync-cache');
        if (cached) {
          const cacheData = JSON.parse(cached);
          Object.entries(cacheData).forEach(([courseCode, data]) => {
            this.progressCache.set(courseCode, data);
          });
          this.log('💾 Cache restored from localStorage', cacheData);
        }
      } catch (error) {
        console.error('Error restoring cache:', error);
      }
    }
  }

  subscribe(courseCode, callback, componentName) {
    const safeCourseCode = String(courseCode || '*');
    const id = `${componentName}-${safeCourseCode}-${Date.now()}`;

    this.subscribers.set(id, {
      courseCode: safeCourseCode,
      callback,
      componentName,
      id
    });

    // Immediately send cached data
    const cached = this.progressCache.get(safeCourseCode);
    if (cached) {
      setTimeout(() => {
        this.log(`📨 Sending cached data to new subscriber: ${componentName}`, cached);
        callback({ ...cached, eventType: 'initial' });
      }, 10);
    }

    this.log(`🔔 SUBSCRIBED: ${componentName} to ${safeCourseCode} (${this.subscribers.size} total subscribers)`);

    return () => {
      this.subscribers.delete(id);
      this.log(`🔕 UNSUBSCRIBED: ${componentName} from ${safeCourseCode} (${this.subscribers.size} remaining)`);
    };
  }

  // Subscribe with persistence (never unsubscribes)
  subscribePersistent(courseCode, callback, componentName) {
    const safeCourseCode = String(courseCode || '*');
    const id = `persistent-${componentName}-${Date.now()}`;

    this.persistentSubscribers.set(id, {
      courseCode: safeCourseCode,
      callback,
      componentName: `Persistent${componentName}`,
      id
    });

    // Immediately send cached data
    const cached = this.progressCache.get(safeCourseCode);
    if (cached) {
      setTimeout(() => {
        this.log(`📨 Sending cached data to persistent subscriber: ${componentName}`, cached);
        callback({ ...cached, eventType: 'initial-persistent' });
      }, 10);
    }

    this.log(`🔔 PERSISTENT SUBSCRIBED: ${componentName} to ${safeCourseCode}`);

    // Persistent subscribers don't return unsubscribe function
    return () => { /* No-op for persistent subscribers */ };
  }

  startSmartPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);

    this.pollingInterval = setInterval(() => {
      if (this.subscribers.size > 0 || this.persistentSubscribers.size > 0) {
        this.log('🔄 SMART POLLING: Checking for updates...');
        this.forceProgressRefresh();
      }
    }, 10000); // 10 seconds
  }

  forceProgressRefresh() {
    const uniqueCourses = new Set();

    // Include both regular and persistent subscribers
    this.subscribers.forEach(sub => {
      if (sub.courseCode !== '*') {
        uniqueCourses.add(sub.courseCode);
      }
    });

    this.persistentSubscribers.forEach(sub => {
      if (sub.courseCode !== '*') {
        uniqueCourses.add(sub.courseCode);
      }
    });

    this.log(`🔄 FORCE REFRESH: Refreshing ${uniqueCourses.size} courses`);

    uniqueCourses.forEach(courseCode => {
      this.notifyAllSubscribers(courseCode, 'force-refresh', {
        courseCode,
        timestamp: Date.now(),
        message: 'Periodic refresh'
      });
    });
  }

  // Public API
  emitLessonCompleted(data) {
    this.log('🚀 EMITTING LESSON COMPLETED:', data);
    const event = new CustomEvent('lesson-completed', {
      detail: {
        ...data,
        globalTimestamp: Date.now(),
        system: 'progress-sync',
        emittedBy: 'emitLessonCompleted'
      }
    });
    window.dispatchEvent(event);
  }

  emitProgressUpdate(data) {
    this.log('📈 EMITTING PROGRESS UPDATE:', data);
    const event = new CustomEvent('progress-updated', {
      detail: {
        ...data,
        globalTimestamp: Date.now(),
        system: 'progress-sync',
        emittedBy: 'emitProgressUpdate'
      }
    });
    window.dispatchEvent(event);
  }

  emitCourseChanged(data) {
    const event = new CustomEvent('course-changed', {
      detail: {
        ...data,
        globalTimestamp: Date.now()
      }
    });
    window.dispatchEvent(event);
  }

  getProgress(courseCode) {
    const safeCourseCode = String(courseCode || '*');
    return this.progressCache.get(safeCourseCode) || {};
  }

  getAllProgress() {
    return Object.fromEntries(this.progressCache);
  }

  clearCache() {
    this.progressCache.clear();
    this.log('🧹 Progress cache cleared');
  }

  // Debug method
  debugState() {
    console.log('🐛 PROGRESS SYNC DEBUG STATE:');
    console.log('Regular Subscribers:', this.subscribers.size);
    console.log('Persistent Subscribers:', this.persistentSubscribers.size);
    console.log('Cache entries:', this.progressCache.size);
    console.log('Cache content:', Object.fromEntries(this.progressCache));

    this.subscribers.forEach((sub, id) => {
      console.log(`Regular Subscriber ${id}:`, sub);
    });

    this.persistentSubscribers.forEach((sub, id) => {
      console.log(`Persistent Subscriber ${id}:`, sub);
    });
  }

  // Enhanced logging
  log(message, data = null) {
    if (this.debugMode) {
      if (data) {
        console.log(message, data);
      } else {
        console.log(message);
      }
    }
  }

  destroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.subscribers.clear();
    this.persistentSubscribers.clear();
    this.progressCache.clear();
    this.isInitialized = false;
    this.log('🛑 Progress sync system destroyed');
  }
}

// Global instance
export const progressSync = new ProgressSyncSystem();

// Initialize immediately
if (typeof window !== 'undefined') {
  window.progressSync = progressSync;
  progressSync.init();
}