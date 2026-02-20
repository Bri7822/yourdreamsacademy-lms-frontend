<template>
<div class="global-search">
    <div class="search-trigger" @click="toggleSearch">
    <i class="fas fa-search"></i>
    <span>Search</span>
    </div>

    <div v-if="isSearchOpen" class="search-modal" @click.self="toggleSearch">
    <div class="search-modal-content">
        <div class="search-header">
        <h3>Search Content</h3>
        <button class="close-btn" @click="toggleSearch">
            <i class="fas fa-times"></i>
        </button>
        </div>

        <div class="search-input-container">
        <input
            type="text"
            v-model="searchInput"
            placeholder="Search for courses, lessons, exercises..."
            class="search-modal-input"
            @keypress.enter="performSearch"
            ref="searchInputRef"
        >
        <button class="search-modal-btn" @click="performSearch">
            <i class="fas fa-search"></i>
        </button>
        </div>

        <div class="search-results-preview" v-if="searchStore.searchResults.length > 0">
        <div class="preview-header">
            <h4>Quick Results</h4>
            <button class="view-all-btn" @click="viewAllResults">
            View All Results
            </button>
        </div>

        <div class="preview-results">
            <div v-for="result in accessibleResults.slice(0, 3)"
                :key="result.id"
                class="preview-result"
                @click="handleSearchItemClick(result)">
            <div class="preview-result-type" :class="result.type">
                {{ result.type }}
            </div>
            <h5>{{ result.title }}</h5>
            <p>{{ getPreviewDescription(result) }}</p>
            <div class="preview-actions">
                <button v-if="result.promptSignup" class="signup-btn">
                Sign Up
                </button>
                <button v-else class="view-btn">
                View
                </button>
            </div>
            </div>
        </div>
        </div>

        <div class="search-suggestions" v-else>
        <div class="suggestion-section">
            <h4>Recent Searches</h4>
            <div class="suggestion-tags">
            <span v-for="search in searchStore.recentSearches"
                    :key="search"
                    @click="handleQuickSearch(search)">
                {{ search }}
            </span>
            </div>
        </div>

        <div class="suggestion-section">
            <h4>Popular Topics</h4>
            <div class="suggestion-tags">
            <span @click="handleQuickSearch('financial planning')">Financial Planning</span>
            <span @click="handleQuickSearch('habit building')">Habit Building</span>
            <span @click="handleQuickSearch('business basics')">Business Basics</span>
            <span @click="handleQuickSearch('investment')">Investment</span>
            <span @click="handleQuickSearch('productivity')">Productivity</span>
            </div>
        </div>
        </div>
    </div>
    </div>
</div>
</template>

<script setup>
import { ref, nextTick, computed, watch } from 'vue'
import { useSearch } from '@/composables/useSearch'

const {
searchInput,
isSearchOpen,
performSearch,
handleQuickSearch,
handleSearchItemClick,
toggleSearch,
accessibleResults,
searchStore
} = useSearch()

const searchInputRef = ref(null)

const getPreviewDescription = (result) => {
if (result.description) {
    return result.description.length > 80
    ? result.description.substring(0, 80) + '...'
    : result.description
}
return 'No description available'
}

const viewAllResults = () => {
if (searchStore.searchQuery) {
    toggleSearch()
    // Navigate to search results page
    import('@/router').then(({ default: router }) => {
    router.push({
        name: 'search-results',
        query: { q: searchStore.searchQuery }
    })
    })
}
}

// Focus input when modal opens
watch(isSearchOpen, (newVal) => {
if (newVal) {
    nextTick(() => {
    searchInputRef.value?.focus()
    })
}
})
</script>

<style scoped>
.global-search {
position: relative;
}

.search-trigger {
display: flex;
align-items: center;
gap: 0.5rem;
padding: 0.5rem 1rem;
background: var(--primary-color);
color: white;
border-radius: 6px;
cursor: pointer;
transition: background-color 0.3s ease;
}

.search-trigger:hover {
background: #06677e;
}

.search-modal {
position: fixed;
top: 0;
left: 0;
right: 0;
bottom: 0;
background: rgba(0, 0, 0, 0.5);
display: flex;
align-items: flex-start;
justify-content: center;
z-index: 10000;
padding: 2rem;
}

.search-modal-content {
background: white;
border-radius: 12px;
width: 100%;
max-width: 600px;
max-height: 80vh;
overflow-y: auto;
box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.search-header {
display: flex;
justify-content: space-between;
align-items: center;
padding: 1.5rem;
border-bottom: 1px solid var(--border-color);
}

.search-header h3 {
margin: 0;
color: var(--primary-color);
}

.close-btn {
background: none;
border: none;
font-size: 1.25rem;
color: var(--secondary-color);
cursor: pointer;
padding: 0.25rem;
}

.search-input-container {
display: flex;
padding: 1.5rem;
gap: 0.5rem;
}

.search-modal-input {
flex: 1;
padding: 12px 16px;
border: 2px solid var(--primary-color);
border-radius: 8px;
font-size: 16px;
outline: none;
}

.search-modal-btn {
background: var(--primary-color);
color: white;
border: none;
border-radius: 8px;
padding: 12px 20px;
cursor: pointer;
}

.search-results-preview {
padding: 0 1.5rem 1.5rem;
}

.preview-header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 1rem;
}

.preview-header h4 {
margin: 0;
color: var(--primary-color);
}

.view-all-btn {
background: transparent;
border: 1px solid var(--primary-color);
color: var(--primary-color);
padding: 4px 8px;
border-radius: 4px;
cursor: pointer;
font-size: 0.875rem;
}

.preview-results {
display: grid;
gap: 1rem;
}

.preview-result {
border: 1px solid var(--border-color);
border-radius: 8px;
padding: 1rem;
cursor: pointer;
transition: background-color 0.3s ease;
}

.preview-result:hover {
background: var(--gray-bg);
}

.preview-result-type {
display: inline-block;
padding: 2px 8px;
border-radius: 12px;
font-size: 0.75rem;
font-weight: 600;
text-transform: capitalize;
margin-bottom: 0.5rem;
}

.preview-result-type.course {
background: #e3f2fd;
color: #1976d2;
}

.preview-result-type.lesson {
background: #f3e5f5;
color: #7b1fa2;
}

.preview-result-type.exercise {
background: #e8f5e8;
color: #388e3c;
}

.preview-result h5 {
margin: 0 0 0.5rem 0;
color: var(--primary-color);
}

.preview-result p {
margin: 0 0 1rem 0;
color: var(--secondary-color);
font-size: 0.875rem;
line-height: 1.4;
}

.preview-actions {
display: flex;
justify-content: flex-end;
}

.signup-btn, .view-btn {
padding: 4px 12px;
border: none;
border-radius: 4px;
font-size: 0.875rem;
cursor: pointer;
}

.signup-btn {
background: #dc3545;
color: white;
}

.view-btn {
background: var(--primary-color);
color: white;
}

.search-suggestions {
padding: 1.5rem;
}

.suggestion-section {
margin-bottom: 1.5rem;
}

.suggestion-section h4 {
margin: 0 0 0.75rem 0;
color: var(--primary-color);
font-size: 0.875rem;
text-transform: uppercase;
letter-spacing: 0.5px;
}

.suggestion-tags {
display: flex;
gap: 0.5rem;
flex-wrap: wrap;
}

.suggestion-tags span {
background: var(--primary-color-light);
color: var(--primary-color);
padding: 6px 12px;
border-radius: 20px;
cursor: pointer;
transition: background-color 0.3s ease;
font-size: 0.875rem;
}

.suggestion-tags span:hover {
background: var(--primary-color);
color: white;
}

@media (max-width: 768px) {
.search-modal {
    padding: 1rem;
}

.search-modal-content {
    max-height: 90vh;
}

.suggestion-tags {
    flex-direction: column;
}
}
</style>