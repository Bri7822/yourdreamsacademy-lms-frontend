<template>
  <div class="video-uploader-wrapper">
    <div class="video-uploader">
      <!-- Header Section -->
      <div class="uploader-header">
        <div class="header-content">
          <div class="icon-wrapper">
            <i class="fas fa-video"></i>
          </div>
          <div class="header-text">
            <h3>Video Content</h3>
            <p>Add a video to your lesson by uploading a file or providing a URL</p>
          </div>
        </div>
      </div>

      <!-- Input Type Toggle -->
      <div class="input-type-selector">
        <div class="toggle-group">
          <button 
            type="button" 
            @click="setInputType('url')"
            class="toggle-button"
            :class="{ active: videoInputType === 'url' }"
          >
            <i class="fas fa-link"></i>
            <span>Video URL</span>
          </button>
          <button 
            type="button" 
            @click="setInputType('upload')"
            class="toggle-button"
            :class="{ active: videoInputType === 'upload' }"
          >
            <i class="fas fa-cloud-upload-alt"></i>
            <span>Upload File</span>
          </button>
        </div>
      </div>

      <!-- URL Input Section -->
      <Transition name="content-slide">
        <div v-if="videoInputType === 'url'" class="url-input-section">
          <div class="input-container">
            <div class="input-wrapper">
              <i class="fas fa-link input-icon"></i>
              <input
                v-model="localVideoUrl"
                @input="handleVideoUrlChange"
                type="text"
                placeholder="Paste YouTube, Vimeo, or direct video URL here..."
                class="url-input"
                :class="{ 
                  error: uploadState.error,
                  success: uploadState.success && !uploadState.uploading
                }"
              />
              <div class="input-status">
                <div v-if="uploadState.uploading" class="status-indicator uploading">
                  <div class="spinner"></div>
                </div>
                <div v-else-if="uploadState.success" class="status-indicator success">
                  <i class="fas fa-check"></i>
                </div>
                <div v-else-if="uploadState.error" class="status-indicator error">
                  <i class="fas fa-exclamation-triangle"></i>
                </div>
              </div>
            </div>
            
            <!-- URL Status Message -->
            <div class="status-message">
              <div v-if="uploadState.uploading" class="message uploading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>{{ uploadState.message || 'Saving URL...' }}</span>
              </div>
              <div v-else-if="uploadState.success" class="message success">
                <i class="fas fa-check-circle"></i>
                <span>Video URL saved successfully</span>
              </div>
              <div v-else-if="uploadState.error" class="message error">
                <i class="fas fa-exclamation-circle"></i>
                <span>{{ uploadState.error }}</span>
              </div>
            </div>

            <!-- URL Examples -->
            <div class="url-examples">
              <h4>Supported formats:</h4>
              <div class="example-list">
                <div class="example-item">
                  <i class="fab fa-youtube"></i>
                  <span>YouTube: youtube.com/watch?v=...</span>
                </div>
                <div class="example-item">
                  <i class="fab fa-vimeo"></i>
                  <span>Vimeo: vimeo.com/12345</span>
                </div>
                <div class="example-item">
                  <i class="fas fa-file-video"></i>
                  <span>Direct: yoursite.com/video.mp4</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- File Upload Section -->
      <Transition name="content-slide">
        <div v-if="videoInputType === 'upload'" class="upload-section">
          <div 
            class="upload-area" 
            :class="{ 
              dragging: isDragging,
              'has-file': selectedVideoFile && !uploadState.uploading,
              'upload-success': uploadState.success,
              'upload-error': uploadState.error
            }"
            @dragover.prevent="handleDragOver"
            @dragleave.prevent="handleDragLeave"
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
          >
            <input
              type="file"
              ref="videoFileInput"
              @change="handleVideoFileSelect"
              accept="video/mp4,video/webm,video/ogg,video/mov,video/avi"
              class="file-input"
              hidden
            />

            <!-- Default State -->
            <div v-if="!selectedVideoFile && !uploadState.uploading && !uploadState.success" class="upload-placeholder">
              <div class="upload-icon">
                <i class="fas fa-cloud-upload-alt"></i>
              </div>
              <div class="upload-text">
                <h4>Drop your video here</h4>
                <p>or <span class="browse-link">browse files</span> to upload</p>
              </div>
              <div class="upload-specs">
                <span class="spec-item">MP4, WebM, OGG, MOV, AVI</span>
                <span class="spec-divider">•</span>
                <span class="spec-item">Max 100MB</span>
              </div>
            </div>

            <!-- File Selected -->
            <div v-if="selectedVideoFile && !uploadState.uploading && !uploadState.success" class="file-selected">
              <div class="file-icon">
                <i class="fas fa-file-video"></i>
              </div>
              <div class="file-info">
                <h4>{{ selectedVideoFile.name }}</h4>
                <p>{{ formatFileSize(selectedVideoFile.size) }}</p>
              </div>
              <button type="button" @click.stop="clearSelectedFile" class="remove-file-btn">
                <i class="fas fa-times"></i>
              </button>
            </div>

            <!-- Upload Progress -->
            <div v-if="uploadState.uploading" class="upload-progress">
              <div class="progress-circle">
                <svg class="progress-ring" width="80" height="80">
                  <circle
                    class="progress-ring-circle-bg"
                    stroke="currentColor"
                    stroke-width="4"
                    fill="transparent"
                    r="36"
                    cx="40"
                    cy="40"
                  />
                  <circle
                    class="progress-ring-circle"
                    stroke="currentColor"
                    stroke-width="4"
                    fill="transparent"
                    r="36"
                    cx="40"
                    cy="40"
                    :stroke-dasharray="226.2"
                    :stroke-dashoffset="226.2 - (226.2 * uploadState.progress) / 100"
                  />
                </svg>
                <div class="progress-text">{{ uploadState.progress }}%</div>
              </div>
              <div class="upload-info">
                <h4>Uploading...</h4>
                <p>{{ uploadState.message || 'Processing your video' }}</p>
              </div>
            </div>

            <!-- Upload Success -->
            <div v-if="uploadState.success && selectedVideoFile" class="upload-success">
              <div class="success-icon">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="success-info">
                <h4>Upload Complete!</h4>
                <p>{{ selectedVideoFile.name }}</p>
              </div>
            </div>
          </div>

          <!-- Upload Error -->
          <div v-if="uploadState.error" class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <span>{{ uploadState.error }}</span>
          </div>
        </div>
      </Transition>

      <!-- Preview Section -->
      <div v-if="canPreview" class="preview-section">
        <button
          @click="openPreview"
          type="button"
          class="preview-button"
        >
          <i class="fas fa-play"></i>
          <span>Preview Video</span>
        </button>
      </div>
    </div>

    <!-- Video Preview Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showPreviewModal" class="preview-modal-overlay" @click="closePreview">
          <div class="preview-modal" @click.stop>
            <div class="modal-header">
              <h3>Video Preview</h3>
              <button @click="closePreview" class="close-button">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="modal-body">
              <div class="video-container">
                <!-- For uploaded videos -->
                <video 
                  v-if="previewVideoUrl && isLocalVideo(previewVideoUrl)"
                  :src="previewVideoUrl"
                  controls
                  class="video-player"
                ></video>
                
                <!-- For external videos (YouTube, Vimeo) -->
                <iframe
                  v-else-if="previewVideoUrl && isEmbedUrl(previewVideoUrl)"
                  :src="previewVideoUrl"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowfullscreen
                  class="video-iframe"
                ></iframe>
                
                <div v-else class="no-video">
                  <i class="fas fa-video-slash"></i>
                  <p>Unable to preview this video</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick, computed } from 'vue'
import { debounce } from 'lodash'
import { useToast } from 'vue-toastification'
import axios from 'axios'

const toast = useToast()

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  courseId: {
    type: [Number, String],
    required: true
  },
  lessonId: {
    type: [Number, String],
    default: null
  },
  isEditing: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'video-uploaded', 'video-url-saved'])

// Reactive state
const videoInputType = ref('url')
const localVideoUrl = ref('')
const selectedVideoFile = ref(null)
const uploadedVideoUrl = ref('')
const isDragging = ref(false)
const showPreviewModal = ref(false)
const previewVideoUrl = ref('')

const uploadState = ref({
  uploading: false,
  progress: 0,
  success: false,
  error: null,
  message: ''
})

// Computed properties
const canPreview = computed(() => {
  return (videoInputType.value === 'url' && localVideoUrl.value && uploadState.value.success) ||
         (videoInputType.value === 'upload' && uploadedVideoUrl.value && uploadState.value.success)
})

// Initialize component
onMounted(() => {
  if (props.modelValue) {
    if (props.modelValue.startsWith('videos/') || props.modelValue.includes('/media/videos/')) {
      videoInputType.value = 'upload'
      uploadedVideoUrl.value = props.modelValue
      uploadState.value.success = true
    } else {
      videoInputType.value = 'url'
      localVideoUrl.value = props.modelValue
      uploadState.value.success = true
    }
  }
})

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    resetUploadState()
    return
  }
  
  if (newValue.startsWith('videos/') || newValue.includes('/media/videos/')) {
    videoInputType.value = 'upload'
    uploadedVideoUrl.value = newValue
    uploadState.value.success = true
  } else {
    videoInputType.value = 'url'
    localVideoUrl.value = newValue
    uploadState.value.success = true
  }
})

// Methods
const setInputType = (type) => {
  if (type === videoInputType.value) return
  
  videoInputType.value = type
  resetUploadState()
  emit('update:modelValue', '')
}

const resetUploadState = () => {
  uploadState.value = {
    uploading: false,
    progress: 0,
    success: false,
    error: null,
    message: ''
  }
  
  if (videoInputType.value === 'url') {
    selectedVideoFile.value = null
    uploadedVideoUrl.value = ''
  } else {
    localVideoUrl.value = ''
  }
}

const handleVideoUrlChange = debounce(async () => {
  if (!localVideoUrl.value.trim()) {
    uploadState.value.success = false
    emit('update:modelValue', '')
    return
  }
  
  try {
    uploadState.value = {
      uploading: true,
      progress: 0,
      success: false,
      error: null,
      message: 'Validating URL...'
    }

    // Don't normalize URL before validation - let server handle it
    const originalUrl = localVideoUrl.value.trim()
    
    const url = props.lessonId 
      ? `/api/admin/courses/${props.courseId}/lessons/${props.lessonId}/upload-video/`
      : `/api/admin/courses/${props.courseId}/lessons/upload-video/`
    
    const response = await axios.post(url, {
      video_url: originalUrl
    })
    
    // Use server's returned URL for storage, but keep original for display/preview
    const serverUrl = response.data.video_url || originalUrl
    
    uploadState.value = {
      uploading: false,
      progress: 100,
      success: true,
      error: null,
      message: 'URL saved successfully'
    }
    
    // Emit the server's processed URL for saving
    emit('update:modelValue', serverUrl)
    emit('video-url-saved', {
      video_url: serverUrl,
      lesson_id: response.data.id
    })
    
    toast.success('Video URL saved successfully')
    
  } catch (error) {
    uploadState.value = {
      uploading: false,
      progress: 0,
      success: false,
      error: error.response?.data?.error || 'Invalid or unsupported video URL',
      message: 'URL validation failed'
    }
    toast.error(error.response?.data?.error || 'Failed to save video URL')
  }
}, 1000)

const triggerFileInput = () => {
  if (!uploadState.value.uploading) {
    document.querySelector('.file-input').click()
  }
}

const handleVideoFileSelect = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  try {
    validateVideoFile(file)
    selectedVideoFile.value = file
    await handleVideoUpload()
  } catch (error) {
    uploadState.value.error = error.message
    toast.error(error.message)
  }
}

const handleDragOver = (event) => {
  event.preventDefault()
  isDragging.value = true
}

const handleDragLeave = (event) => {
  event.preventDefault()
  isDragging.value = false
}

const handleDrop = async (event) => {
  event.preventDefault()
  isDragging.value = false
  
  const files = event.dataTransfer.files
  if (files.length > 0) {
    try {
      validateVideoFile(files[0])
      selectedVideoFile.value = files[0]
      await handleVideoUpload()
    } catch (error) {
      uploadState.value.error = error.message
      toast.error(error.message)
    }
  }
}

const validateVideoFile = (file) => {
  const validExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi']
  const ext = file.name.split('.').pop().toLowerCase()
  
  if (!validExtensions.includes(`.${ext}`)) {
    throw new Error('Invalid file type. Please upload MP4, WebM, OGG, MOV, or AVI files.')
  }
  
  if (file.size > 100 * 1024 * 1024) {
    throw new Error('File too large. Maximum size is 100MB.')
  }
}

const handleVideoUpload = async () => {
  if (!selectedVideoFile.value) {
    uploadState.value.error = 'Please select a video file'
    return
  }
  
  try {
    uploadState.value = {
      uploading: true,
      progress: 0,
      success: false,
      error: null,
      message: 'Uploading video...'
    }
    
    const formData = new FormData()
    formData.append('video', selectedVideoFile.value)
    
    const url = props.lessonId 
      ? `/api/admin/courses/${props.courseId}/lessons/${props.lessonId}/upload-video/`
      : `/api/admin/courses/${props.courseId}/lessons/upload-video/`
    
    const response = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        uploadState.value.progress = percent
        uploadState.value.message = `Uploading... ${percent}%`
      }
    })
    
    uploadState.value = {
      uploading: false,
      progress: 100,
      success: true,
      error: null,
      message: 'Upload complete!'
    }
    
    uploadedVideoUrl.value = response.data.video_url
    
    emit('update:modelValue', response.data.full_url || response.data.video_url)
    emit('video-uploaded', {
      video_url: response.data.video_url,
      full_url: response.data.full_url,
      lesson_id: response.data.id
    })
    
    toast.success('Video uploaded successfully')
    
  } catch (error) {
    uploadState.value = {
      uploading: false,
      progress: 0,
      success: false,
      error: error.response?.data?.error || 'Upload failed',
      message: 'Upload failed'
    }
    toast.error(error.response?.data?.error || 'Failed to upload video')
  }
}

const clearSelectedFile = () => {
  selectedVideoFile.value = null
  uploadState.value = {
    uploading: false,
    progress: 0,
    success: false,
    error: null,
    message: ''
  }
}

const openPreview = () => {
  if (uploadState.value.uploading) {
    toast.warning('Please wait until processing is complete')
    return
  }

  const videoUrl = videoInputType.value === 'url' ? localVideoUrl.value : uploadedVideoUrl.value

  if (!videoUrl) {
    toast.warning('No video URL available for preview')
    return
  }

  // Process the URL for preview
  previewVideoUrl.value = processUrlForPreview(videoUrl)
  
  if (!previewVideoUrl.value) {
    toast.error('Unable to create preview for this video URL')
    return
  }

  showPreviewModal.value = true
}

const processUrlForPreview = (url) => {
  if (!url) return null

  // Handle uploaded files (local videos)
  if (url.startsWith('videos/') || url.includes('/media/videos/')) {
    const baseUrl = window.location.origin
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`
    } else if (url.startsWith('videos/')) {
      return `${baseUrl}/media/${url}`
    } else {
      return url.startsWith('http') ? url : `${baseUrl}${url}`
    }
  }

  // Handle YouTube URLs
  if (url.includes('youtube.com/watch')) {
    try {
      const urlObj = new URL(url)
      const videoId = urlObj.searchParams.get('v')
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null
    } catch (e) {
      return null
    }
  }

  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0]
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }

  // Handle Vimeo URLs
  if (url.includes('vimeo.com') && !url.includes('player.vimeo.com')) {
    const match = url.match(/vimeo\.com\/(\d+)/)
    const videoId = match ? match[1] : null
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null
  }

  // Handle direct video URLs and already processed embed URLs
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }

  // Handle relative URLs
  const baseUrl = window.location.origin
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

const closePreview = () => {
  showPreviewModal.value = false
  previewVideoUrl.value = ''
}

const isLocalVideo = (url) => {
  if (!url) return false
  
  // Check if it's a direct video file (not an embed URL)
  const isVideoFile = /\.(mp4|webm|ogg|mov|avi)(\?.*)?$/i.test(url)
  const isEmbedService = url.includes('youtube.com/embed') || 
                        url.includes('player.vimeo.com') ||
                        url.includes('youtube.com/watch') ||
                        url.includes('youtu.be') ||
                        (url.includes('vimeo.com') && !url.includes('player.vimeo.com'))

  return isVideoFile || (!isEmbedService && (url.includes('/media/') || url.startsWith('videos/')))
}

const isEmbedUrl = (url) => {
  if (!url) return false
  
  return url.includes('youtube.com/embed') || 
         url.includes('player.vimeo.com') ||
         (!isLocalVideo(url) && (
           url.includes('youtube.com') || 
           url.includes('youtu.be') ||
           url.includes('vimeo.com')
         ))
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Expose methods for parent component
defineExpose({
  resetComponent: () => {
    videoInputType.value = 'url'
    localVideoUrl.value = ''
    selectedVideoFile.value = null
    uploadedVideoUrl.value = ''
    showPreviewModal.value = false
    previewVideoUrl.value = ''
    resetUploadState()
  },
  getCurrentVideoUrl: () => {
    return videoInputType.value === 'url' ? localVideoUrl.value : uploadedVideoUrl.value
  }
})
</script>

<style scoped>
.video-uploader-wrapper {
  width: 100%;
  margin-bottom: 1.5rem;
}

.video-uploader {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  position: relative;
}

.uploader-header {
  position: relative;
  z-index: 1;
  margin-bottom: 1.5rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-wrapper {
  width: 40px;
  height: 40px;
  background: #f3f4f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
}

.icon-wrapper i {
  font-size: 1.2rem;
  color: #6b7280;
}

.header-text h3 {
  color: #111827;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.header-text p {
  color: #6b7280;
  margin: 0;
  font-size: 0.85rem;
}

.input-type-selector {
  position: relative;
  z-index: 1;
  margin-bottom: 1.5rem;
}

.toggle-group {
  display: flex;
  background: #f9fafb;
  border-radius: 8px;
  padding: 3px;
  border: 1px solid #e5e7eb;
}

.toggle-button {
  flex: 1;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  cursor: pointer;
  font-size: 0.85rem;
}

.toggle-button:hover {
  color: #374151;
  background: rgba(107, 114, 128, 0.1);
}

.toggle-button.active {
  background: white;
  color: #111827;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

.toggle-button i {
  font-size: 0.9rem;
}

/* Content Transitions */
.content-slide-enter-active,
.content-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.content-slide-enter-from,
.content-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* URL Input Section */
.url-input-section {
  position: relative;
  z-index: 1;
}

.input-container {
  background: #fafafa;
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.input-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

.input-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  z-index: 2;
  font-size: 0.9rem;
}

.url-input {
  width: 100%;
  padding: 0.75rem 0.75rem 0.75rem 2.25rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  background: white;
  padding-right: 2.5rem;
}

.url-input:focus {
  outline: none;
  border-color: #087990 !important;
  box-shadow: 0 0 0 2px rgba(8, 121, 144, 0.25) !important;
}

.url-input.success {
  border-color: #10b981;
  background-color: #f0fdf4;
}

.url-input.error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.input-status {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
}

.status-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
}

.status-indicator.uploading {
  color: var(--primary-color);
}

.status-indicator.success {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.status-indicator.error {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.status-message {
  margin-bottom: 1.5rem;
}

.message {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
}

.message.uploading {
  background: rgba(59, 130, 246, 0.1);
  color: var(--primary-color);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.message.success {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.message.error {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.url-examples {
  background: rgba(59, 130, 246, 0.05);
  border-radius: 6px;
  padding: 1rem;
  border: 1px solid rgba(59, 130, 246, 0.1);
}

.url-examples h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
}

.example-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.example-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.example-item i {
  width: 16px;
  text-align: center;
  font-size: 0.7rem;
}

/* Upload Section */
.upload-section {
  position: relative;
  z-index: 1;
}

.upload-area {
  background: #fafafa;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 2rem 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  min-height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: var(--primary-color);
  background: #f8faff;
}

.upload-area.dragging {
  border-color: var(--primary-color);
  background: rgba(59, 130, 246, 0.05);
}

.upload-area.has-file {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.upload-area.upload-success {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.upload-area.upload-error {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.upload-placeholder {
  width: 100%;
}

.upload-icon {
  margin-bottom: 1rem;
}

.upload-icon i {
  font-size: 2rem;
  color: #9ca3af;
  opacity: 0.7;
}

.upload-text h4 {
  margin: 0 0 0.3rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.upload-text p {
  margin: 0 0 1rem 0;
  color: #6b7280;
  font-size: 0.85rem;
}

.browse-link {
  color: var(--primary-color);
  font-weight: 600;
  text-decoration: underline;
}

.upload-specs {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.spec-item {
  font-size: 0.7rem;
  color: #9ca3af;
  background: rgba(156, 163, 175, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
}

.spec-divider {
  color: #d1d5db;
  font-size: 0.7rem;
}

.file-selected {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  width: 100%;
  max-width: 400px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
}

.file-icon {
  width: 60px;
  height: 60px;
  background: rgba(16, 185, 129, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-icon i {
  font-size: 1.5rem;
  color: #059669;
}

.file-info {
  flex: 1;
  text-align: left;
}

.file-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  word-break: break-word;
}

.file-info p {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.remove-file-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.remove-file-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.1);
}

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.progress-circle {
  position: relative;
  width: 80px;
  height: 80px;
}

.progress-ring {
  transform: rotate(-90deg);
}

.progress-ring-circle-bg {
  stroke: #e5e7eb;
  opacity: 0.3;
}

.progress-ring-circle {
  stroke: var(--primary-color);
  transition: stroke-dashoffset 0.3s ease;
  stroke-linecap: round;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--primary-color);
}

.upload-info {
  text-align: center;
}

.upload-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
}

.upload-info p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.upload-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.success-icon {
  width: 80px;
  height: 80px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-icon i {
  font-size: 2rem;
  color: #10b981;
}

.success-info {
  text-align: center;
}

.success-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
}

.success-info p {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

.error-message {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  color: #dc2626;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.preview-section {
  position: relative;
  z-index: 1;
  margin-top: 1.5rem;
  text-align: center;
}

.preview-button {
  background: var(--primary-color);
  border: 1px solid var(--primary-color);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
}

.preview-button:hover {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

/* Modal Styles */
.preview-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.preview-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111827;
}

.close-button {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #e5e7eb;
  color: #374151;
}

.modal-body {
  padding: 0;
}

.video-container {
  position: relative;
  width: 100%;
  height: 500px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-player,
.video-iframe {
  width: 100%;
  height: 100%;
}

.no-video {
  color: #9ca3af;
  text-align: center;
}

.no-video i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-video p {
  margin: 0;
  font-size: 1.1rem;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Responsive Design */
@media (max-width: 768px) {
  .video-uploader {
    padding: 1rem;
  }
  
  .header-content {
    gap: 0.5rem;
  }
  
  .toggle-group {
    flex-direction: column;
    gap: 3px;
  }
  
  .input-container {
    padding: 1rem;
  }
  
  .upload-area {
    padding: 1.5rem 1rem;
    min-height: 120px;
  }
  
  .file-selected {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
  
  .file-info {
    text-align: center;
  }
  
  .preview-modal-overlay {
    padding: 1rem;
  }
  
  .modal-header {
    padding: 0.75rem 1rem;
  }
  
  .video-container {
    height: 250px;
  }
  
  .upload-specs {
    flex-direction: column;
    gap: 0.4rem;
  }
  
  .example-list {
    gap: 0.4rem;
  }
  
  .upload-icon i {
    font-size: 1.5rem;
  }
  
  .upload-text h4 {
    font-size: 0.9rem;
  }
  
  .upload-text p {
    font-size: 0.8rem;
  }
}
</style>