<template>
  <div id="app">
    <!-- Enhanced Debug Info -->
    <div v-if="showDebug" class="debug-overlay">
      <div class="debug-info">
        <h4>🔍 Router Debug</h4>
        <p><strong>Current Path:</strong> {{ route.path }}</p>
        <p><strong>Route Name:</strong> {{ route.name }}</p>
        <p><strong>Full Route Meta:</strong> {{ JSON.stringify(route.meta, null, 2) }}</p>
        <p><strong>Is Guest Route:</strong> {{ isGuestRoute }}</p>
        <p><strong>Is Dashboard Route:</strong> {{ isDashboardRoute }}</p>
        <p><strong>Should Hide Navbar:</strong> {{ shouldHideNavbar }}</p>
        <p><strong>Navbar Visible:</strong> {{ !shouldHideNavbar }}</p>
        <p><strong>Footer Visible:</strong> {{ !shouldHideNavbar }}</p>
        <hr>
        <button @click="showDebug = !showDebug" class="debug-toggle">
          {{ showDebug ? 'Hide Debug' : 'Show Debug' }}
        </button>
      </div>
    </div>

    <!-- NAVBAR - Only show for non-dashboard routes -->
    <Navbar v-if="shouldShowNavbar" />
    <GlobalSearch />

    <!-- ✅ FIXED: CORRECT router-view with v-slot syntax -->
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>

    <!-- FOOTER - Only show for non-dashboard routes -->
    <Footer v-if="shouldShowNavbar" />
  </div>
</template>

<script setup>
import { RouterView, useRoute } from 'vue-router'
import { watch, computed, ref } from 'vue'
import Navbar from './components/navbar/Navbar.vue'
import Footer from '@/components/footer/Footer.vue'
import { useGuestStore } from '@/stores/guest'
import { useToast } from 'vue-toastification'

const route = useRoute()
const guestStore = useGuestStore()
const toast = useToast()

// Debug state
const showDebug = ref(false) // Set to false by default

// Route type detection
const isGuestRoute = computed(() => route.path.startsWith('/guest/courses'))
const isDashboardRoute = computed(() => {
  return (
    route.path.startsWith('/student') ||
    route.path.startsWith('/admin') ||
    route.path.startsWith('/teacher')
  )
})

// ✅ FIXED: Enhanced navbar visibility logic - SIMPLIFIED
const shouldHideNavbar = computed(() => {
  // Check route meta first
  if (route.meta.hideNavbar === true) {
    console.log('🔍 Hiding navbar based on route meta')
    return true
  }

  // Hide for all dashboard routes
  if (isDashboardRoute.value) {
    console.log('🔍 Hiding navbar for dashboard route')
    return true
  }

  // For guest routes, only show on guest-courses list
  if (isGuestRoute.value) {
    return route.name !== 'guest-courses'
  }

  // Default: show navbar
  return false
})

// ✅ FIXED: Computed for showing navbar (inverse of hide)
const shouldShowNavbar = computed(() => !shouldHideNavbar.value)

// Log route changes
watch(() => route.path, (newPath, oldPath) => {
  console.log('🔄 Route changed:', { from: oldPath, to: newPath })
  console.log('🔍 Route meta:', route.meta)
  console.log('🔍 shouldHideNavbar:', shouldHideNavbar.value)
  console.log('🔍 shouldShowNavbar:', shouldShowNavbar.value)
})

// Watch for session expiration
watch(() => guestStore.shouldRedirect, (shouldRedirect) => {
  if (shouldRedirect) {
    toast.error('Your guest session has expired. Please register to continue learning.')
  }
})
</script>

<style>
/* Your existing styles plus debug styles */
.debug-overlay {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.95);
  color: white;
  padding: 15px;
  border-radius: 8px;
  z-index: 9999;
  max-width: 500px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  max-height: 80vh;
  overflow-y: auto;
}

.debug-info h4 {
  margin: 0 0 10px 0;
  color: #4CAF50;
  border-bottom: 1px solid #4CAF50;
  padding-bottom: 5px;
}

.debug-info p {
  margin: 4px 0;
  line-height: 1.3;
}

.debug-info hr {
  border: none;
  border-top: 1px solid #555;
  margin: 8px 0;
}

.route-history {
  background: rgba(255,255,255,0.1);
  padding: 4px;
  margin: 2px 0;
  border-radius: 3px;
  font-size: 10px;
}

.debug-toggle {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  margin: 2px;
  font-size: 10px;
}

.debug-toggle:hover {
  background: #45a049;
}

:root {
  --primary-sec-color:  #087990;
  --primary-color:#06677e;
  --text-color: #212529;
  --gray-bg: #f8f9fa;
  --header-bg: #ffffff;
  --sidebar-bg: #ffffff;
  --card-bg: #ffffff;
  --border-color: #e9ecef;
  --shadow-color: rgba(0, 0, 0, 0.05);
  --error-color: #dc3545;

  --font-heading: 'Poppins', sans-serif;
  --font-body: 'Manrope', sans-serif;
  --fs-xs: 0.675rem;
  --fs-sm: 0.79rem;
  --fs-base: 0.9rem;
  --fs-md: 1.01rem;
  --fs-lg: 1.1rem;
  --fs-xl: 1.35rem;
  --fs-2xl: 1.575rem;
  --fs-3xl: 1.8rem;
  --fs-4xl: 2.25rem;
  --fs-5xl: 2.5rem;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-body);
  font-size: var(--fs-base);
  color: var(--text-color);
  line-height: 1.5;
  background-color: var(--gray-bg);
}

ul, ol {
  list-style: none;
}

a {
  color: var(--primary-color);
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: #065e6f;
}

button {
  cursor: pointer;
}

.text-primary { color: var(--primary-color); }
.text-secondary { color: var(--secondary-color); }
.text-success { color: #198754; }
.text-danger { color: var(--error-color); }
.text-warning { color: #ffc107; }

.custom-toast {
  background-color: var(--primary-color) !important;
  color: white;
  border-radius: 8px;
  padding: 12px 16px;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: var(--primary-color, #087990) !important;
  box-shadow: 0 0 0 2px rgba(8, 121, 144, 0.25);
  outline: none;
}

/* Enhanced transition animations */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Slide up animation for courses */
.slide-up-enter-active {
  animation: slideUp 0.6s ease-out;
}

.slide-up-leave-active {
  animation: slideUp 0.6s ease-out reverse;
}

@keyframes slideUp {
  0% {
    opacity: 0;
    transform: translateY(50px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

</style>