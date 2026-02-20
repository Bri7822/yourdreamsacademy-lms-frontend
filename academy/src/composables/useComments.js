import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import axios from 'axios'

export function useComments() {
  const authStore = useAuthStore()
  const toast = useToast()

  const comments = ref([])
  const loading = ref(false)
  const error = ref(null)

  const loadComments = async (courseId = null) => {
    if (!authStore.isAuthenticated) return

    loading.value = true
    error.value = null

    try {
      let url = '/api/student/comments/'
      if (courseId) {
        url += `?course_id=${courseId}`
      }

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${authStore.accessToken}`
        }
      })

      comments.value = response.data
    } catch (err) {
      console.error('Failed to load comments:', err)
      error.value = 'Failed to load comments'
      toast.error('Failed to load comments')
    } finally {
      loading.value = false
    }
  }

  const submitComment = async (courseId, content) => {
    if (!authStore.isAuthenticated) {
      toast.error('Please login to post a comment')
      return null
    }

    try {
      const response = await axios.post(
        '/api/student/comments/create/',
        { course: courseId, content },
        {
          headers: {
            'Authorization': `Bearer ${authStore.accessToken}`
          }
        }
      )

      comments.value.unshift(response.data)
      toast.success('Comment posted successfully!')
      return response.data
    } catch (err) {
      console.error('Failed to submit comment:', err)
      const errorMsg = err.response?.data?.error || 'Failed to post comment'
      toast.error(errorMsg)
      throw err
    }
  }

  const submitReply = async (commentId, content) => {
    if (!authStore.isAuthenticated) {
      toast.error('Please login to post a reply')
      return null
    }

    try {
      const response = await axios.post(
        '/api/student/comments/reply/',
        { comment: commentId, content },
        {
          headers: {
            'Authorization': `Bearer ${authStore.accessToken}`
          }
        }
      )

      // Find comment and add reply
      const comment = comments.value.find(c => c.id === commentId)
      if (comment) {
        if (!comment.replies) comment.replies = []
        comment.replies.push(response.data)
      }

      toast.success('Reply posted successfully!')
      return response.data
    } catch (err) {
      console.error('Failed to submit reply:', err)
      toast.error('Failed to post reply')
      throw err
    }
  }

  const toggleReaction = async (commentId, reactionType) => {
    if (!authStore.isAuthenticated) {
      toast.error('Please login to react to comments')
      return null
    }

    try {
      const response = await axios.post(
        `/api/student/comments/${commentId}/react/`,
        { reaction_type: reactionType },
        {
          headers: {
            'Authorization': `Bearer ${authStore.accessToken}`
          }
        }
      )

      // Update the comment in the list
      const index = comments.value.findIndex(c => c.id === commentId)
      if (index !== -1) {
        comments.value[index] = response.data
      }

      return response.data
    } catch (err) {
      console.error('Failed to toggle reaction:', err)
      toast.error('Failed to update reaction')
      throw err
    }
  }

  return {
    comments: computed(() => comments.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    loadComments,
    submitComment,
    submitReply,
    toggleReaction
  }
}