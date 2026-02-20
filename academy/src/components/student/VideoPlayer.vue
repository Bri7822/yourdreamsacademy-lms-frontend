<template>
  <div class="video-player-container">
    <div class="video-wrapper">

      <!-- Loading overlay — sits on top, same box size always -->
      <div v-if="loading" class="video-overlay video-loading">
        <div class="spinner"></div>
        <p>Loading video...</p>
        <small>{{ detectedSource }} | {{ videoFormat }}</small>
      </div>

      <!-- Error overlay -->
      <div v-else-if="videoError" class="video-overlay video-error">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Unable to Load Video</h3>
        <p>{{ errorMessage }}</p>
        <div class="error-actions">
          <button @click="retryVideo" class="retry-btn"><i class="fas fa-redo"></i> Retry</button>
          <button @click="openExternal" class="external-btn"><i class="fas fa-external-link-alt"></i> Open Externally</button>
        </div>
      </div>

      <!-- YouTube — plain iframe, no IFrame API (avoids postMessage localhost issues) -->
      <div v-if="isYouTube && youtubeEmbedUrl" class="embed-container">
        <iframe
          ref="youtubeFrame"
          :src="youtubeEmbedUrl"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          class="embed-frame"
          @load="onYouTubeEmbedLoad"
          @error="onEmbedError"
        ></iframe>
      </div>

      <!-- Vimeo -->
      <div v-if="isYouTube && youtubeEmbedUrl" class="embed-container">
        <iframe
          ref="youtubeFrame"
          :src="youtubeEmbedUrl"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          class="embed-frame"
          @load="onYouTubeEmbedLoad"
          @error="onEmbedError"
        ></iframe>
        <!-- Blocks suggested videos and external links after completion -->
        <div v-if="videoCompleted" class="yt-end-overlay">
          <div class="yt-end-message">
            <i class="fas fa-check-circle"></i>
            <p>Video completed!</p>
          </div>
        </div>
      </div>

      <!-- Direct video -->
      <video
        v-else-if="processedVideoUrl && !isEmbeddedVideo"
        ref="videoElement"
        :key="videoKey"
        controls preload="metadata" playsinline crossorigin="anonymous"
        class="video-element"
        @loadstart="onLoadStart"
        @loadedmetadata="onLoadedMetadata"
        @loadeddata="onLoadedData"
        @canplay="onCanPlay"
        @play="onPlay"
        @pause="onPause"
        @timeupdate="onTimeUpdate"
        @ended="onEnded"
        @error="onVideoError"
      >
        <source :src="processedVideoUrl" :type="videoMimeType">
        Your browser does not support HTML5 video.
      </video>

    </div>

    <!-- Info bar — renders below, never inside the 16:9 box -->
    <div v-if="videoLoaded && !videoError" class="video-info-bar">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${progressPercentage}%` }"></div>
      </div>
      <div class="video-meta">
        <span class="badge badge-source">{{ detectedSource }}</span>
        <span v-if="duration > 0" class="time-display">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
        <span class="badge badge-status">{{ videoStatus }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

// YouTube: plain iframe only — no IFrame API (blocked by postMessage on localhost)

// ── Vimeo SDK singleton ───────────────────────────────────────────────────────
let vimeoReady = false, vimeoLoading = false
const vimeoCbs = []
function loadVimeoSDK() {
  return new Promise(resolve => {
    if (vimeoReady) { resolve(); return }
    vimeoCbs.push(resolve)
    if (vimeoLoading) return
    vimeoLoading = true
    const s = document.createElement('script')
    s.src = 'https://player.vimeo.com/api/player.js'
    s.onload = () => { vimeoReady = true; vimeoCbs.forEach(c => c()); vimeoCbs.length = 0 }
    document.head.appendChild(s)
  })
}

export default defineComponent({
  name: 'VideoPlayer',
  props: {
    videoUrl:    { type: String, required: true },
    lessonId:    { type: [String, Number], required: true },
    videoConfig: { type: Object, default: () => ({}) },
    guestMode:   { type: Boolean, default: false },
  },
  emits: ['progress-update', 'video-completed', 'video-error', 'video-loaded'],

  setup(props, { emit }) {
    const videoElement   = ref(null)
    const embedFrame     = ref(null)
    const youtubeFrame   = ref(null)
    const videoKey       = ref(0)
    const loading        = ref(true)
    const videoError     = ref(false)
    const errorMessage   = ref('')
    const videoLoaded    = ref(false)
    const currentTime    = ref(0)
    const duration       = ref(0)
    const isPlaying      = ref(false)
    const videoStatus    = ref('Initializing...')
    const videoCompleted = ref(false)

    let vimeoPlayer = null, loadTimeout = null, ytWatchdogTimer = null

    // YouTube IFrame API loader
    let ytReady = false
    function loadYouTubeAPI() {
      if (ytReady || window.YT) { ytReady = true; return }
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      window.onYouTubeIframeAPIReady = () => { ytReady = true }
      document.head.appendChild(s)
    }

    const detectedSource = computed(() => {
      if (props.videoConfig?.source) return props.videoConfig.source.toUpperCase()
      const u = (props.videoUrl || '').toLowerCase()
      if (u.includes('youtube.com') || u.includes('youtu.be')) return 'YOUTUBE'
      if (u.includes('vimeo.com'))   return 'VIMEO'
      if (u.includes('cloudinary.com')) return 'CLOUDINARY'   // ← add this
      if (u.includes('/media/') || u.includes('localhost')) return 'LOCAL'
      if (u.startsWith('http'))      return 'EXTERNAL'
      return 'LOCAL'
    })

    const isYouTube       = computed(() => detectedSource.value === 'YOUTUBE')
    const isVimeo         = computed(() => detectedSource.value === 'VIMEO')
    const isEmbeddedVideo = computed(() => isYouTube.value || isVimeo.value)

    const youtubeVideoId = computed(() => {
      if (!isYouTube.value || !props.videoUrl) return ''
      const u = props.videoUrl
      try {
        if (u.includes('youtube.com/watch?v=')) return u.split('v=')[1].split('&')[0]
        if (u.includes('youtu.be/'))             return u.split('youtu.be/')[1].split('?')[0]
        if (u.includes('youtube.com/embed/'))    return u.split('youtube.com/embed/')[1].split('?')[0]
      } catch {}
      return ''
    })

    // MUST be in return — template and openExternal reference it
    const youtubeEmbedUrl = computed(() => {
      if (!youtubeVideoId.value) return ''
      const origin = encodeURIComponent(window.location.origin)
      return `https://www.youtube.com/embed/${youtubeVideoId.value}?rel=0&modestbranding=1&enablejsapi=1&origin=${origin}&showinfo=0&iv_load_policy=3`
    })

    const vimeoEmbedUrl = computed(() => {
      if (!isVimeo.value || !props.videoUrl) return ''
      const u = props.videoUrl
      try {
        let id = ''
        if (u.includes('player.vimeo.com/video/')) id = u.split('player.vimeo.com/video/')[1].split(/[/?]/)[0]
        else if (u.includes('vimeo.com/'))         id = u.split('vimeo.com/')[1].split(/[/?]/)[0]
        if (id) return `https://player.vimeo.com/video/${id}?api=1&title=0&byline=0&portrait=0`
      } catch {}
      return props.videoUrl
    })

    const processedVideoUrl = computed(() => {
      if (isEmbeddedVideo.value) return ''
      const u = props.videoUrl
      if (!u) return ''

      // Cloudinary or any full URL — use as-is
      if (u.startsWith('https://') || u.startsWith('http://')) return u

      // Local media paths — only relevant in development
      const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
      if (u.startsWith('/media/')) return `${baseUrl}${u}`

      return `${baseUrl}/media/${u}`
    })

    const videoMimeType      = computed(() => `video/${props.videoConfig?.format || 'mp4'}`)
    const progressPercentage = computed(() => duration.value ? Math.min((currentTime.value / duration.value) * 100, 100) : 0)
    const videoFormat        = computed(() => isYouTube.value ? 'YouTube' : isVimeo.value ? 'Vimeo' : (props.videoConfig?.format || 'MP4'))

    const markCompleted = () => {
      if (videoCompleted.value) return
      videoCompleted.value = true
      videoStatus.value = 'Completed'
      emit('video-completed', { lessonId: props.lessonId, duration: duration.value, completed: true })
    }

    const emitProgress = () => {
      emit('progress-update', {
        currentTime: currentTime.value,
        duration: duration.value,
        progress: progressPercentage.value,
        lessonId: props.lessonId
      })
      // Only auto-complete direct videos (Cloudinary, local, external)
      // YouTube and Vimeo handle completion via their own events
      if (!isEmbeddedVideo.value && progressPercentage.value >= 95) {
        markCompleted()
      }
    }

    // ── YouTube — plain iframe, fires onload when ready ────────────────────────
    const onYouTubeEmbedLoad = () => {
      if (loadTimeout) { clearTimeout(loadTimeout); loadTimeout = null }
      loading.value = false; videoLoaded.value = true; videoError.value = false
      videoCompleted.value = false; videoStatus.value = 'Playing'
      emit('video-loaded', true)

      // Small delay so iframe is ready to receive messages
      setTimeout(() => {
        try {
          youtubeFrame.value?.contentWindow?.postMessage(
            JSON.stringify({ event: 'listening' }),
            'https://www.youtube.com'
          )
        } catch {
          // catch em
        }
      }, 1000)
    }

    const handleYouTubeMessage = (event) => {
      if (!event.origin.includes('youtube.com')) return
      try {
        const data = JSON.parse(event.data)

        // Periodic time updates — most reliable way to track progress
        if (data.event === 'infoDelivery' && data.info) {
          const ct = data.info.currentTime
          const dur = data.info.duration
          if (ct && dur && isFinite(ct) && isFinite(dur)) {
            currentTime.value = ct
            duration.value = dur
            videoStatus.value = 'Playing'
            emit('progress-update', {
              currentTime: ct,
              duration: dur,
              progress: (ct / dur) * 100,
              lessonId: props.lessonId
            })
            if ((ct / dur) * 100 >= 95) markCompleted()
          }
        }

        // Ended state as backup
        if (data.event === 'onStateChange' && data.info === 0) {
          markCompleted()
        }
      } catch {
        // catch her
      }
    }

    // ── Vimeo ─────────────────────────────────────────────────────────────────
    const onVimeoEmbedLoad = async () => {
      if (loadTimeout) { clearTimeout(loadTimeout); loadTimeout = null }
      loading.value = false; videoLoaded.value = true; videoError.value = false
      videoCompleted.value = false; videoStatus.value = 'Embed loaded'
      emit('video-loaded', true)
      await loadVimeoSDK()
      if (vimeoPlayer) { try { vimeoPlayer.destroy() } catch {} vimeoPlayer = null }
      try {
        vimeoPlayer = new window.Vimeo.Player(embedFrame.value)
        vimeoPlayer.getDuration().then(d => { if (d && isFinite(d)) duration.value = d }).catch(() => {})
        vimeoPlayer.on('timeupdate', (d) => { currentTime.value = d.seconds; if (d.duration && isFinite(d.duration)) duration.value = d.duration; isPlaying.value = true; videoStatus.value = 'Playing'; emitProgress() })
        vimeoPlayer.on('pause',  (d) => { currentTime.value = d.seconds; isPlaying.value = false; videoStatus.value = 'Paused'; emitProgress() })
        vimeoPlayer.on('ended',  ()  => { isPlaying.value = false; currentTime.value = duration.value; emitProgress(); markCompleted() })
        vimeoPlayer.on('error',  ()  => handleVideoError('Vimeo video failed to load.'))
      } catch { handleVideoError('Could not initialize Vimeo player.') }
    }

    // ── Direct video ──────────────────────────────────────────────────────────
    const onLoadStart      = () => { videoStatus.value = 'Loading...' }
    const onLoadedData     = () => { videoStatus.value = 'Data loaded' }
    const onLoadedMetadata = (e) => { if (e.target.duration && isFinite(e.target.duration)) duration.value = e.target.duration; videoStatus.value = 'Metadata loaded' }
    const onCanPlay        = () => {
      if (loadTimeout) { clearTimeout(loadTimeout); loadTimeout = null }
      loading.value = false; videoLoaded.value = true; videoError.value = false; videoCompleted.value = false; videoStatus.value = 'Ready'
      emit('video-loaded', true)
    }
    const onPlay       = () => { isPlaying.value = true;  videoStatus.value = 'Playing' }
    const onPause      = () => { isPlaying.value = false; videoStatus.value = 'Paused'; emitProgress() }
    const onTimeUpdate = (e) => { currentTime.value = e.target.currentTime; emitProgress() }
    const onEnded      = () => { isPlaying.value = false; currentTime.value = duration.value; emitProgress(); markCompleted() }
    const onVideoError = (e) => {
      const c = { 1: 'Loading aborted.', 2: 'Network error.', 3: 'Decode error.', 4: 'Source not supported.' }
      handleVideoError('Failed to load video. ' + (c[e.target?.error?.code] || 'Unknown error.'))
    }
    const onEmbedError = () => handleVideoError('Failed to load embedded video.')

    const handleVideoError = (message) => {
      if (loadTimeout) { clearTimeout(loadTimeout); loadTimeout = null }
      loading.value = false; videoError.value = true; errorMessage.value = message; videoStatus.value = 'Error'
      emit('video-error', { message, lessonId: props.lessonId })
    }

    const destroyPlayers = () => {
      if (loadTimeout)    { clearTimeout(loadTimeout);    loadTimeout = null }
      if (ytWatchdogTimer){ clearTimeout(ytWatchdogTimer); ytWatchdogTimer = null }
      if (vimeoPlayer)    { try { vimeoPlayer.destroy() } catch {} vimeoPlayer = null }
    }

    const initializeVideo = () => {
      destroyPlayers()
      loading.value = true; videoError.value = false; errorMessage.value = ''
      videoLoaded.value = false; videoCompleted.value = false
      currentTime.value = 0; duration.value = 0; isPlaying.value = false; videoStatus.value = 'Initializing...'

      if (isYouTube.value) {
        loadTimeout = setTimeout(() => { if (loading.value) handleVideoError('YouTube took too long to load.') }, 15000)
      } else if (isVimeo.value) {
        loadTimeout = setTimeout(() => { if (loading.value) handleVideoError('Vimeo embed timed out.') }, 15000)
      } else {
        const timeout = detectedSource.value === 'CLOUDINARY' ? 20000 : 5000
        loadTimeout = setTimeout(() => { if (loading.value && !videoLoaded.value) handleVideoError('Video took too long to load.') }, timeout)
      }
    }

    const retryVideo   = () => { videoKey.value++; initializeVideo() }
    const openExternal = () => {
      if (isYouTube.value && youtubeVideoId.value) window.open(`https://www.youtube.com/watch?v=${youtubeVideoId.value}`, '_blank')
      else window.open(props.videoUrl, '_blank')
    }
    const formatTime = (s) => {
      if (!s || !isFinite(s)) return '00:00'
      return `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(Math.floor(s % 60)).padStart(2,'0')}`
    }

    onMounted(() => {
      loadYouTubeAPI()
      initializeVideo()
      window.addEventListener('message', handleYouTubeMessage)  // ← add
    })

    onUnmounted(() => {
      destroyPlayers()
      window.removeEventListener('message', handleYouTubeMessage)  // ← add
    })

    watch(() => props.videoUrl, (n, o) => { if (n !== o) { videoKey.value++; initializeVideo() } })
    watch(() => props.lessonId, () => { videoKey.value++ })

    return {
      videoElement, embedFrame, youtubeFrame, videoKey,
      loading, videoError, errorMessage, videoLoaded,
      currentTime, duration, isPlaying, videoStatus,
      detectedSource, isYouTube, isVimeo, isEmbeddedVideo,
      processedVideoUrl,
      youtubeEmbedUrl, youtubeVideoId,
      vimeoEmbedUrl,
      videoMimeType, progressPercentage, videoFormat,
      onLoadStart, onLoadedMetadata, onLoadedData, onCanPlay,
      onPlay, onPause, onTimeUpdate, onEnded, onVideoError,
      onYouTubeEmbedLoad, onVimeoEmbedLoad, onEmbedError,
      retryVideo, openExternal, formatTime, handleYouTubeMessage,
      videoCompleted,
    }
  }
})
</script>

<style scoped>
/* The wrapper is ALWAYS 16:9 — loading overlay sits inside it, no height jump */
.video-player-container {
  width: 100%;
  margin-bottom: 1rem;
}

/* Fixed 280px height — identical for local, YouTube, Vimeo. No jumps, no mismatch. */
.video-wrapper {
  position: relative;
  width: 100%;
  height: 400px !important;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  aspect-ratio: 16 / 9;
}

/* Every child fills the box absolutely */
.video-element,
.embed-container,
.video-overlay {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
}

/* Local video fills the full box width — same as embeds */
.video-element { object-fit: contain; background: #000; }

.embed-container > div,
.embed-frame { width: 100%; height: 100%; border: none; }

/* Overlays */
.video-overlay {
  z-index: 10;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  text-align: center; padding: 2rem;
}

.video-loading { background: rgba(0,0,0,0.88); color: #fff; }
.video-loading p     { margin: 0.4rem 0 0.15rem; font-size: 0.88rem; }
.video-loading small { opacity: 0.5; font-size: 0.7rem; }

.video-error { background: rgba(0,0,0,0.92); color: #fff; }
.video-error i  { font-size: 2.2rem; color: #dc3545; margin-bottom: 0.5rem; }
.video-error h3 { margin: 0 0 0.35rem; font-size: 0.95rem; }
.video-error p  { margin: 0; font-size: 0.8rem; opacity: 0.7; }

.spinner {
  width: 44px; height: 44px;
  border: 4px solid rgba(255,255,255,0.12);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.85s linear infinite;
  margin-bottom: 0.7rem;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-actions { display: flex; gap: 0.65rem; margin-top: 1rem; flex-wrap: wrap; justify-content: center; }
.retry-btn, .external-btn {
  padding: 0.5rem 1rem; border: none; border-radius: 7px;
  cursor: pointer; display: flex; align-items: center; gap: 0.3rem;
  font-size: 0.8rem; transition: background 0.18s;
}
.retry-btn          { background: #007bff; color: #fff; }
.retry-btn:hover    { background: #0056b3; }
.external-btn       { background: #6c757d; color: #fff; }
.external-btn:hover { background: #565e64; }

/* Info bar — outside the 16:9 box, never causes size change */
.video-info-bar {
  background: #f1f3f5;
  padding: 0.55rem 0.9rem;
  border: 1px solid #dee2e6; border-top: none;
  border-radius: 0 0 12px 12px;
}

.progress-bar {
  width: 100%; height: 4px;
  background: #dee2e6; border-radius: 2px; overflow: hidden;
  margin-bottom: 0.4rem;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b9eed, #1a6fb5);
  transition: width 0.35s ease;
}

.video-meta {
  display: flex; align-items: center; gap: 0.45rem;
  font-size: 0.72rem; flex-wrap: wrap;
}
.badge {
  padding: 0.16rem 0.42rem; border-radius: 4px;
}
.badge-source { background: #e9ecef; color: #495057; }
.badge-status { background: #17a2b8; color: #fff; }
.time-display { flex: 1; text-align: center; font-family: monospace; color: #6c757d; }

@media (max-width: 768px) {
  .video-wrapper     { border-radius: 8px; }
  .video-info-bar    { border-radius: 0 0 8px 8px; }
}
</style>