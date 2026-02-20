import { ref, computed } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useGuestStore } from '@/stores/guest'

export function useSearch() {
  const searchStore = useSearchStore()
  const authStore = useAuthStore()
  const guestStore = useGuestStore()
  const router = useRouter()

  const searchInput = ref('')
  const isSearchOpen = ref(false)

  const performSearch = async (query = null) => {
    const searchTerm = query || searchInput.value

    if (!searchTerm.trim()) {
      searchStore.clearSearch()
      return
    }

    await searchStore.searchAllData(searchTerm)

    // Navigate to search results page if not already there
    if (router.currentRoute.value.name !== 'search-results') {
      router.push({ name: 'search-results', query: { q: searchTerm } })
    }
  }

  const handleQuickSearch = async (query) => {
    searchInput.value = query
    await performSearch(query)
  }

  const handleSearchItemClick = (item) => {
    if (item.promptSignup && !authStore.isAuthenticated) {
      router.push('/signup')
    } else {
      router.push(item.actionUrl)
    }
    isSearchOpen.value = false
  }

  const toggleSearch = () => {
    isSearchOpen.value = !isSearchOpen.value
    if (isSearchOpen.value) {
      searchStore.loadRecentSearches()
    }
  }

  const accessibleResults = computed(() => searchStore.accessibleResults)

  return {
    searchInput,
    isSearchOpen,
    performSearch,
    handleQuickSearch,
    handleSearchItemClick,
    toggleSearch,
    accessibleResults,
    searchStore
  }
}