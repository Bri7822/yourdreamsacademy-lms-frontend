// Add this to your main.js or create a separate file
class GuestEventBridge {
  constructor() {
    this.events = {};
    this.debugMode = true;
  }

  debugLog(message, data = null) {
    if (this.debugMode) {
      console.log(`🔔 [GuestEventBridge] ${message}`, data || '');
    }
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    this.debugLog(`Listener added for: ${event}`);
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
      this.debugLog(`Listener removed for: ${event}`);
    }
  }

  emit(event, data) {
    this.debugLog(`Emitting: ${event}`, data);
    if (this.events[event]) {
      this.events[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Specialized methods for guest system
  emitLessonCompleted(lessonId, courseSlug) {
    this.emit('guest-lesson-completed', {
      lessonId,
      courseSlug,
      timestamp: new Date().toISOString(),
      source: 'frontend'
    });
  }

  debugEventListeners() {
    console.log('🔍 EVENT BRIDGE DEBUG: Current listeners:')
    Object.keys(this.events).forEach(event => {
      console.log(`   ${event}: ${this.events[event].length} listeners`)
      this.events[event].forEach((listener, index) => {
        console.log(`     [${index}] ${listener.name || 'anonymous'}`)
      })
    })
  }

  emitTimeWarning(level, message, remainingTime) {
    this.emit('guest-time-warning', {
      level,
      message,
      remainingTime,
      timestamp: new Date().toISOString()
    });
  }

  // Cleanup all listeners
  destroy() {
    this.events = {};
    this.debugLog('All event listeners destroyed');
  }
}

// Create global instance
window.guestEventBridge = new GuestEventBridge();
window.guestEventBridge.debugEventListeners();


// In your guestEventBridge.js or wherever you define it
class GuestEventBridge {
  constructor() {
    this.events = {};
    this.debugMode = true;
  }

  debugLog(message, data = null) {
    if (this.debugMode) {
      console.log(`🔔 [GuestEventBridge] ${message}`, data || '');
    }
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
    this.debugLog(`Listener added for event: ${event}. Total listeners: ${this.events[event].length}`);
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
      this.debugLog(`Listener removed for event: ${event}. Remaining listeners: ${this.events[event].length}`);
    }
  }

  emit(event, data) {
    this.debugLog(`Emitting event: ${event}`, data);

    if (this.events[event]) {
      this.debugLog(`Found ${this.events[event].length} listeners for ${event}`);
      this.events[event].forEach((callback, index) => {
        try {
          this.debugLog(`Calling listener ${index + 1} for ${event}`);
          callback(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    } else {
      this.debugLog(`No listeners found for event: ${event}`);
    }
  }

  // Debug method to see all active listeners
  debugListeners() {
    console.group('🔍 GuestEventBridge Debug - Active Listeners');
    Object.keys(this.events).forEach(event => {
      console.log(`📢 ${event}: ${this.events[event].length} listener(s)`);
      this.events[event].forEach((listener, index) => {
        console.log(`   ${index + 1}. ${listener.name || 'anonymous function'}`);
      });
    });
    console.groupEnd();
  }
}

// Create global instance
window.guestEventBridge = new GuestEventBridge();

// Add debug method to window for easy access
window.debugGuestEvents = () => {
  window.guestEventBridge.debugListeners();
};

// Ensure guestEventBridge is available globally
if (typeof window !== 'undefined') {
  if (!window.guestEventBridge) {
    console.log('🔧 Initializing GuestEventBridge...')

    class GuestEventBridge {
      constructor() {
        this.events = {};
        this.debugMode = true;
        this.init();
      }

      init() {
        console.log('🎯 GuestEventBridge initialized')
      }

      debugLog(message, data = null) {
        if (this.debugMode) {
          console.log(`🔔 [GuestEventBridge] ${message}`, data || '');
        }
      }

      on(event, callback) {
        if (!this.events[event]) {
          this.events[event] = [];
        }
        this.events[event].push(callback);
        this.debugLog(`Listener added for event: ${event}. Total listeners: ${this.events[event].length}`);
      }

      off(event, callback) {
        if (this.events[event]) {
          this.events[event] = this.events[event].filter(cb => cb !== callback);
          this.debugLog(`Listener removed for event: ${event}. Remaining listeners: ${this.events[event].length}`);
        }
      }

      emit(event, data) {
        this.debugLog(`Emitting event: ${event}`, data);

        if (this.events[event]) {
          this.debugLog(`Found ${this.events[event].length} listeners for ${event}`);
          this.events[event].forEach((callback, index) => {
            try {
              this.debugLog(`Calling listener ${index + 1} for ${event}`);
              callback(data);
            } catch (error) {
              console.error(`Error in event handler for ${event}:`, error);
            }
          });
        } else {
          this.debugLog(`No listeners found for event: ${event}`);
        }
      }

      debugListeners() {
        console.group('🔍 GuestEventBridge Debug - Active Listeners');
        Object.keys(this.events).forEach(event => {
          console.log(`📢 ${event}: ${this.events[event].length} listener(s)`);
          this.events[event].forEach((listener, index) => {
            console.log(`   ${index + 1}. ${listener.name || 'anonymous function'}`);
          });
        });
        console.groupEnd();
      }
    }

    window.guestEventBridge = new GuestEventBridge();

    // Add debug method to window for easy access
    window.debugGuestEvents = () => {
      window.guestEventBridge.debugListeners();
    };
  } else {
    console.log('✅ GuestEventBridge already available')
  }
}