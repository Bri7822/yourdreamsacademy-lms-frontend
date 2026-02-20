// Search utility functions
export const searchUtils = {
  // Highlight search terms in text
  highlightText(text, query) {
    if (!query || !text) return text

    const searchTerms = query.toLowerCase().split(' ')
    let highlighted = text

    searchTerms.forEach(term => {
      if (term.length < 2) return

      const regex = new RegExp(`(${term})`, 'gi')
      highlighted = highlighted.replace(regex, '<mark>$1</mark>')
    })

    return highlighted
  },

  // Calculate search relevance score
  calculateRelevance(item, query) {
    const searchTerms = query.toLowerCase().split(' ')
    let score = 0

    // Title matches are most important
    if (item.title) {
      searchTerms.forEach(term => {
        if (item.title.toLowerCase().includes(term)) {
          score += 10
        }
      })
    }

    // Description matches are important
    if (item.description) {
      searchTerms.forEach(term => {
        if (item.description.toLowerCase().includes(term)) {
          score += 5
        }
      })
    }

    // Content matches are less important
    if (item.content) {
      searchTerms.forEach(term => {
        if (item.content.toLowerCase().includes(term)) {
          score += 2
        }
      })
    }

    // Category matches
    if (item.category) {
      searchTerms.forEach(term => {
        if (item.category.toLowerCase().includes(term)) {
          score += 3
        }
      })
    }

    return score
  },

  // Sort results by relevance
  sortByRelevance(results, query) {
    return results
      .map(item => ({
        ...item,
        relevance: this.calculateRelevance(item, query)
      }))
      .sort((a, b) => b.relevance - a.relevance)
  },

  // Extract search snippets
  extractSnippet(text, query, maxLength = 150) {
    if (!text) return ''

    const searchTerms = query.toLowerCase().split(' ')
    let snippet = text

    // Find the first occurrence of any search term
    for (const term of searchTerms) {
      if (term.length < 2) continue

      const index = text.toLowerCase().indexOf(term)
      if (index !== -1) {
        const start = Math.max(0, index - 30)
        const end = Math.min(text.length, index + maxLength)
        snippet = text.substring(start, end)

        if (start > 0) {
          snippet = '...' + snippet
        }
        if (end < text.length) {
          snippet = snippet + '...'
        }
        break
      }
    }

    // If no term found, take the beginning
    if (snippet === text && text.length > maxLength) {
      snippet = text.substring(0, maxLength) + '...'
    }

    return snippet
  },

  // Sanitize search query
  sanitizeQuery(query) {
    return query
      .trim()
      .replace(/[<>]/g, '') // Remove potentially dangerous characters
      .substring(0, 100) // Limit length
  }
}