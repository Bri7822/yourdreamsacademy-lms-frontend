<template>
  <div class="certificates-overview-page">
    <!-- Header Section -->
    <section class="header-section">
      <div class="container">
        <div class="header-content">
          <h1 class="page-title animate-fade-in">Certificates
            <span class="under-dev-badge">
              <span class="badge-text">Under Development</span>
              <span class="badge-pulse"></span>
            </span>
          </h1>
          <p class="page-subtitle animate-fade-in-delay">View and download your earned certificates from completed courses</p>
        </div>
      </div>
    </section>

    <!-- Search and Filter Section -->
    <section class="filters-section">
      <div class="container">
        <div class="search-filter-container animate-slide-up">
          <div class="search-container">
            <input
              type="text"
              v-model="searchQuery"
              class="search-input"
              placeholder="Search certificates..."
              @input="handleSearch"
            >
            <div class="search-icon">
              <i class="fas fa-search"></i>
            </div>
          </div>

          <div class="category-filters">
            <button
              v-for="category in categories"
              :key="category.key"
              @click="setActiveCategory(category.key)"
              class="category-btn"
              :class="{ 'active': activeCategory === category.key }"
            >
              {{ category.label }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Certificates Section -->
    <section class="certificates-section">
      <div class="container">
        <!-- Under Development Notice -->
        <div class="under-development-notice animate-fade-in">
          <div class="notice-icon">
            <i class="fas fa-tools"></i>
          </div>
          <div class="notice-content">
            <h3>Certificates Feature Under Development</h3>
            <p>We're currently working on the certificates system. You'll be able to view and download your certificates once the feature is complete.</p>
            <div class="notice-features">
              <div class="feature-item">
                <i class="fas fa-check-circle"></i>
                <span>Certificate generation and validation</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-check-circle"></i>
                <span>Digital certificate downloads</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-check-circle"></i>
                <span>Certificate sharing options</span>
              </div>
              <div class="feature-item">
                <i class="fas fa-check-circle"></i>
                <span>Verification system</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state animate-fade-in">
          <div class="loading-spinner"></div>
          <p>Loading your certificates...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state animate-fade-in">
          <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Unable to Load Certificates</h3>
            <p>{{ error }}</p>
            <button @click="loadCertificates" class="retry-btn">
              <i class="fas fa-redo"></i>
              Try Again
            </button>
          </div>
        </div>

        <!-- Certificates Grid -->
        <div v-else-if="filteredCertificates.length > 0" class="certificates-container">
          <div
            class="certificate-card animate-card"
            v-for="(certificate, index) in filteredCertificates"
            :key="certificate.certificate_id"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="certificate-preview">
              <div class="certificate-placeholder">
                <i class="fas fa-certificate"></i>
                <p>Certificate Preview</p>
                <small>Course: {{ certificate.course_title }}</small>
              </div>
            </div>
            <div class="certificate-details">
              <h4>{{ certificate.course_title }}</h4>
              <p>Issued on {{ certificate.issue_date }}</p>
              <div class="certificate-grade">
                <i class="fas fa-star"></i>
                <span>Grade: {{ certificate.formatted_grade }}</span>
              </div>
              <div class="certificate-actions">
                <button
                  class="btn-download"
                  @click="handleDownload(certificate)"
                  :disabled="downloading === certificate.certificate_id"
                >
                  <i class="fas fa-download"></i>
                  {{ downloading === certificate.certificate_id ? 'Downloading...' : 'Download' }}
                </button>
                <button class="btn-share" @click="handleShare(certificate)">
                  <i class="fas fa-share-alt"></i> Share
                </button>
                <button class="btn-view" @click="handleView(certificate)">
                  <i class="fas fa-eye"></i> View
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state animate-fade-in">
          <i class="fas fa-certificate"></i>
          <h4>No Certificates Yet</h4>
          <p>Complete courses to earn certificates and showcase your achievements.</p>
          <button class="explore-courses-btn" @click="navigateToCourses">
            <i class="fas fa-graduation-cap"></i>
            Explore Courses
          </button>
        </div>
      </div>
    </section>

    <!-- Certificate Modal (placeholder for future implementation) -->
    <div v-if="selectedCertificate" class="certificate-modal">
      <!-- Certificate viewing modal would go here -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCertificates } from '@/composables/useCertificates'

const router = useRouter()

// Use certificate composable
const {
  certificates,
  loading,
  error,
  loadCertificates: loadCerts,
  downloadCertificate: downloadCert,
  viewCertificate: viewCert,
  shareCertificate: shareCert
} = useCertificates()

// Local state
const searchQuery = ref('')
const activeCategory = ref('all')
const downloading = ref(null)
const selectedCertificate = ref(null)

// Categories
const categories = ref([
  { key: 'all', label: 'All Certificates' },
  { key: 'Finance', label: 'Finance' },
  { key: 'Personal Development', label: 'Personal Development' },
  { key: 'Business', label: 'Business' },
  { key: 'Marketing', label: 'Marketing' },
  { key: 'Department of Education', label: 'Department of Education' }
])

// Computed
const filteredCertificates = computed(() => {
  let filtered = certificates.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(certificate =>
      certificate.course_title.toLowerCase().includes(query) ||
      certificate.course_code.toLowerCase().includes(query)
    )
  }

  // Category filter
  if (activeCategory.value !== 'all') {
    filtered = filtered.filter(certificate =>
      certificate.category === activeCategory.value
    )
  }

  return filtered
})

// Methods
const handleSearch = () => {
  // Debounce could be added here for performance
}

const setActiveCategory = (category) => {
  activeCategory.value = category
}

const handleDownload = async (certificate) => {
try {
  await downloadCert(certificate)
} catch (err) {
  // Error handling is now done in the composable
  console.error('Download action failed:', err)
}
}

const handleView = async (certificate) => {
try {
  await viewCert(certificate)
} catch (err) {
  // Error handling is now done in the composable
  console.error('View action failed:', err)
}
}

const handleShare = async (certificate) => {
try {
  await shareCert(certificate)
} catch (err) {
  // Error handling is now done in the composable
  console.error('Share action failed:', err)
}
}

const navigateToCourses = () => {
  router.push('/courses')
}

// Load certificates on mount
onMounted(() => {
  loadCertificates()
})

// Expose load function for retry
const loadCertificates = () => {
  loadCerts()
}
</script>

<style scoped>
/* Keep all your existing styles, they work perfectly */
/* Animation Keyframes */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes cardAppear {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Under Development Badge Animation */
@keyframes pulse-badge {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.7);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(255, 152, 0, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 152, 0, 0);
  }
}

/* Animation Classes */
.animate-fade-in {
  animation: fadeIn 1s ease-out forwards;
}

.animate-fade-in-delay {
  animation: fadeIn 1s ease-out 0.6s forwards;
  opacity: 0;
}

.animate-slide-up {
  animation: slideUp 1s ease-out 0.6s forwards;
  opacity: 0;
}

.animate-card {
  animation: cardAppear 1.4s ease-out forwards;
  opacity: 0;
}

.certificates-overview-page {
  min-height: 100vh;
  background-color: var(--gray-bg);
}

/* Header Section with Badge */
.header-section {
  background-color: var(--gray-bg);
  padding: 2rem 0 1rem;
  margin-top: 2rem;
}

.header-content {
  text-align: center;
  position: relative;
}

.page-title {
  text-align: center;
  font-size: var(--fs-2xl);
  margin-bottom: 0.5rem;
  margin-top: .5rem;
  color: var(--primary-color);
  font-family: var(--font-heading);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.page-subtitle {
  text-align: center;
  font-size: var(--fs-md);
  color: var(--secondary-color);
  max-width: 600px;
  margin: 0 auto;
  font-family: var(--font-body);
}

/* Under Development Badge */
.under-dev-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  background: linear-gradient(135deg, #ff9800, #ff5722);
  color: white;
  padding: 5px 12px 5px 10px;
  border-radius: 20px;
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(255, 87, 34, 0.3);
  margin-left: 8px;
  white-space: nowrap;
}

.badge-text {
  position: relative;
  z-index: 2;
}

.badge-pulse {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #ff9800, #ff5722);
  border-radius: 20px;
  animation: pulse-badge 2s infinite;
  z-index: 1;
}

/* Under Development Notice */
.under-development-notice {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 87, 34, 0.1));
  border-left: 4px solid #ff9800;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto 30px;
}

.notice-icon {
  background: linear-gradient(135deg, #ff9800, #ff5722);
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.notice-content h3 {
  margin: 0 0 10px 0;
  color: #ff9800;
  font-family: var(--font-heading);
  font-size: 1.2rem;
}

.notice-content p {
  margin: 0 0 15px 0;
  color: var(--text-color);
  line-height: 1.5;
}

.notice-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--secondary-color);
}

.feature-item i {
  color: #ff9800;
  font-size: 0.8rem;
}

.search-filter-container {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}

.search-container {
  position: relative;
  min-width: 200px;
  max-width: 250px;
}

.search-input {
  width: 100%;
  padding: 0.5rem 1rem;
  padding-right: 40px;
  font-size: var(--fs-sm);
  border: 1.8px solid var(--primary-color);
  border-radius: 20px;
  outline: none;
  font-family: var(--font-body);
  background-color: var(--background-color);
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(6, 103, 126, 0.1);
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--primary-color);
  font-size: var(--fs-sm);
}

.category-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.category-btn {
  padding: 0.5rem 1rem;
  border: 1.8px solid var(--primary-color);
  border-radius: 20px;
  background-color: transparent;
  color: var(--primary-color);
  font-size: var(--fs-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: var(--font-heading);
  white-space: nowrap;
}

.category-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(8, 121, 144, 0.2);
}

.category-btn.active {
  background-color: var(--primary-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(8, 121, 144, 0.3);
}

/* Certificates Section */
.certificates-section {
  padding: 1.5rem 0 3rem;
  background-color: var(--gray-bg);
}

.certificates-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.certificate-card {
  background-color: var(--gray-bg);
  border-radius: 8px;
  border: 1.5px solid var(--border-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  opacity: 0.7;
  position: relative;
}

.certificate-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.certificate-card::before {
  content: 'Sample Preview';
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(135deg, #ff9800, #ff5722);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.6rem;
  font-weight: 600;
  z-index: 2;
}

.certificate-preview {
  height: 200px;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(135deg, var(--primary-color) 0%, #087990 100%);
  color: white;
}

.certificate-placeholder {
  text-align: center;
  opacity: 0.8;
}

.certificate-placeholder i {
  font-size: 3rem;
  margin-bottom: 10px;
  display: block;
  color: #D4AF37;
}

.certificate-placeholder p {
  margin: 0;
  font-size: 0.9rem;
}

.certificate-details {
  padding: 15px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.certificate-details h4 {
  margin: 0 0 5px;
  font-size: 1.1rem;
  font-family: var(--font-heading);
  color: var(--text-color);
}

.certificate-details p {
  margin: 0 0 10px;
  font-size: 0.9rem;
  color: var(--secondary-color);
}

.certificate-grade {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 15px;
  font-size: 0.9rem;
  color: var(--secondary-color);
}

.certificate-grade i {
  color: #D4AF37;
}

.certificate-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  flex-wrap: wrap;
}

.btn-download, .btn-share, .btn-view {
  padding: 6px 12px;
  font-size: 0.9rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;
}

.btn-download {
  background-color: var(--primary-color);
  color: white;
}

.btn-download:hover:not(:disabled) {
  background-color: #065e6f;
  transform: translateY(-1px);
}

.btn-download:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-share {
  background-color: #6c757d;
  color: white;
}

.btn-share:hover {
  background-color: #5a6268;
  transform: translateY(-1px);
}

.btn-view {
  background-color: #17a2b8;
  color: white;
}

.btn-view:hover {
  background-color: #138496;
  transform: translateY(-1px);
}

/* Loading State */
.loading-state {
  text-align: center;
  padding: 4rem;
}

.loading-spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  text-align: center;
  padding: 4rem;
  color: #d32f2f;
}

.error-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.retry-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
  font-weight: 600;
  font-family: var(--font-heading);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #06677e;
  transform: translateY(-1px);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--shadow-color);
  max-width: 600px;
  margin: 0 auto;
}

.empty-state i {
  font-size: 4rem;
  color: var(--secondary-color);
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h4 {
  margin: 0 0 10px;
  font-family: var(--font-heading);
  color: var(--text-color);
  font-size: 1.2rem;
}

.empty-state p {
  margin: 0 0 20px;
  color: var(--secondary-color);
  max-width: 400px;
  margin: 0 auto 20px;
}

.explore-courses-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.explore-courses-btn:hover {
  background: #065e6f;
  transform: translateY(-1px);
}

/* Responsive styles */
@media (max-width: 768px) {
  .certificates-container {
    grid-template-columns: 1fr;
  }

  .certificate-actions {
    justify-content: center;
  }

  .btn-download, .btn-share, .btn-view {
    flex: 1;
    justify-content: center;
  }

  .search-filter-container {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .search-container {
    min-width: auto;
    max-width: none;
  }

  .category-filters {
    justify-content: center;
  }

  .page-title {
    flex-direction: column;
    gap: 10px;
  }

  .under-dev-badge {
    margin-left: 0;
  }

  .notice-features {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 576px) {
  .certificates-section {
    padding: 15px;
  }

  .certificate-actions {
    flex-direction: column;
  }

  .category-filters {
    gap: 0.5rem;
  }

  .category-btn {
    padding: 0.5rem 0.8rem;
    font-size: var(--fs-xs);
  }

  .search-input {
    padding: 0.5rem 0.8rem;
    padding-right: 35px;
  }

  .search-icon {
    right: 10px;
  }

  .under-development-notice {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }

  .notice-icon {
    align-self: center;
  }

  .under-dev-badge {
    font-size: 0.5rem;
    padding: 4px 10px 4px 8px;
  }
}
</style>