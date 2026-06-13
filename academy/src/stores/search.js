// stores/search.js
import { defineStore } from 'pinia'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useGuestStore } from '@/stores/guest'

const generateSlug = (title) => {
  if (!title) return ''
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim()
}

export const useSearchStore = defineStore('search', {
  state: () => ({
    searchQuery: '',
    searchResults: [],
    isLoading: false,
    error: null,
    filters: {
      type: 'all',
      category: 'all',
      level: 'all'
    },
    recentSearches: [],
    searchHistory: []
  }),

  getters: {
    hasResults: (state) => state.searchResults.length > 0,

    filteredResults: (state) => {
      return state.searchResults.filter(item => {
        if (state.filters.type !== 'all' && item.type !== state.filters.type) return false
        if (state.filters.category !== 'all' && item.category !== state.filters.category) return false
        if (state.filters.level !== 'all' && item.level !== state.filters.level) return false
        return true
      })
    },

    accessibleResults: (state) => {
      const authStore  = useAuthStore()
      const guestStore = useGuestStore()

      const buildActionUrl = (item, accessible) => {
        if (!accessible && item.requires_auth) return '/signup'

        if (authStore.isAuthenticated && authStore.isStudent) {
          switch (item.type) {
            case 'course':
              return `/student/courses/${item.code}`
            case 'lesson': {
              const slug = item.slug || generateSlug(item.title)
              return `/student/courses/${item.course_code || item.code}/lessons/${slug}`
            }
            case 'exercise':
              return `/student/exercises/${item.id}`
            default:
              return '/student/courses'
          }
        }

        // Guest / unauthenticated
        const basePath = '/guest'
        switch (item.type) {
          case 'course':
            return `${basePath}/courses/${item.code}`
          case 'lesson': {
            const slug = item.slug || generateSlug(item.title)
            return `${basePath}/courses/${item.course_code || item.code}/lessons/${slug}`
          }
          case 'exercise':
            return `${basePath}/exercises/${item.id}`
          default:
            return '#'
        }
      }

      return state.filteredResults.map(item => {
        const requiresAuth = item.requires_auth || false
        const allowPreview = item.allow_preview  || false

        let accessible   = false
        let promptSignup = false

        if (!requiresAuth) {
          accessible = true
        } else if (authStore.isAuthenticated && (authStore.isStudent || authStore.isAdmin || authStore.isTeacher)) {
          accessible   = true
          promptSignup = false
        } else if (!authStore.isAuthenticated && allowPreview) {
          accessible   = true
          promptSignup = false
        } else {
          accessible   = false
          promptSignup = true
        }

        return {
          ...item,
          slug:         item.slug || generateSlug(item.title),
          accessible,
          requiresAuth,
          promptSignup,
          allowPreview,
          actionUrl:    buildActionUrl(item, accessible)
        }
      })
    }
  },

  actions: {
    async searchAllData(query) {
      this.isLoading   = true
      this.error       = null
      this.searchQuery = query

      try {
        console.log('🔍 Searching for:', query)
        this.addToRecentSearches(query)

        const authStore = useAuthStore()
        let response

        if (authStore.isAuthenticated) {
          // ✅ FIX: use /search/ (full results) not /search/suggestions/ (autocomplete only)
          console.log('🎯 Using authenticated search endpoint')
          response = await axios.get('/api/student/search/', {
            params: { q: query }
          })
        } else {
          console.log('🎯 Using public search endpoint')
          response = await axios.get('/api/student/search/public/', { params: { q: query } })
        }

        console.log('✅ Search API response:', response.data)
        this.searchResults = this.processSearchResults(response.data.results || [])
        console.log('📦 Processed search results:', this.searchResults.length)

      } catch (error) {
        console.error('❌ Search error:', error)
        this.error = error.response?.data?.detail || 'Search failed. Please try again.'
        this.searchResults = []

        if (import.meta.env.DEV) {
          console.log('🔄 Using mock search data as fallback')
          this.searchResults = this.getMockSearchResults(query)
        }
      } finally {
        this.isLoading = false
      }
    },

    processSearchResults(results) {
      return results.map(item => ({
        ...item,
        requires_auth:     item.requires_auth     || false,
        allow_preview:     item.allow_preview      ?? true,
        enrollment_status: item.enrollment_status  || 'not_enrolled',
        title:             item.title              || 'Untitled',
        description:       item.description        || 'No description available',
        type:              item.type               || 'course',
        code:              item.code               || item.id?.toString() || 'unknown',
        course_code:       item.course_code        || item.course?.code   || 'unknown',
        slug:              item.slug               || generateSlug(item.title)
      }))
    },

    getMockSearchResults(query) {
      const mockData = [
        {
          id: 1, title: 'Financial Literacy Fundamentals',
          description: 'Master essential money management skills and budgeting techniques.',
          code: 'FIN101', type: 'course', category: 'Finance', level: 'beginner',
          duration: '4 weeks', requires_auth: false, allow_preview: true,
          enrollment_status: 'not_enrolled', is_new: false, is_popular: true
        },
        {
          id: 3, title: 'Budgeting for Beginners',
          description: 'Create and maintain your first budget effectively.',
          code: 'FIN102', slug: 'budgeting-for-beginners',
          type: 'lesson', category: 'Finance', level: 'beginner',
          duration: '45 min', requires_auth: false, allow_preview: true,
          enrollment_status: 'not_enrolled', course_title: 'Financial Literacy',
          course_code: 'FIN101'
        }
      ]

      return mockData
        .filter(item =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
        )
        .map(item => ({ ...item, slug: item.slug || generateSlug(item.title) }))
    },

    addToRecentSearches(query) {
      if (!query.trim()) return
      this.recentSearches = this.recentSearches
        .filter(s => s.toLowerCase() !== query.toLowerCase())
      this.recentSearches.unshift(query)
      if (this.recentSearches.length > 5) this.recentSearches = this.recentSearches.slice(0, 5)
      localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches))
    },

    loadRecentSearches() {
      try {
        const saved = localStorage.getItem('recentSearches')
        if (saved) this.recentSearches = JSON.parse(saved)
      } catch (error) {
        console.error('Error loading recent searches:', error)
      }
    },

    removeRecentSearch(search) {
      this.recentSearches = this.recentSearches.filter(s => s !== search)
      localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches))
    },

    clearRecentSearches() {
      this.recentSearches = []
      localStorage.removeItem('recentSearches')
    },

    setFilter(type, value) { this.filters[type] = value },

    clearFilters() {
      this.filters = { type: 'all', category: 'all', level: 'all' }
    },

    clearSearch() {
      this.searchQuery   = ''
      this.searchResults = []
      this.error         = null
    }
  }
})