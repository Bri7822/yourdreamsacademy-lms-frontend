<template>
  <div class="certificates-view">
    <h3 class="section-title">Certificates</h3>
    <p>View and download your earned certificates.</p>

    <div class="certificates-container">
      <div class="certificate-card" v-for="certificate in certificates" :key="certificate.id">
        <div class="certificate-preview">
          <div class="certificate-placeholder">
            <i class="fas fa-certificate"></i>
            <p>Certificate Preview</p>
          </div>
        </div>
        <div class="certificate-details">
          <h4>{{ certificate.course }}</h4>
          <p>Issued on {{ certificate.issueDate }}</p>
          <div class="certificate-actions">
            <button class="btn-download" @click="downloadCertificate(certificate)">
              <i class="fas fa-download"></i> Download
            </button>
            <button class="btn-share" @click="shareCertificate(certificate)">
              <i class="fas fa-share-alt"></i> Share
            </button>
            <button class="btn-view" @click="viewCertificate(certificate)">
              <i class="fas fa-eye"></i> View
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state if no certificates -->
    <div v-if="certificates.length === 0" class="empty-state">
      <i class="fas fa-certificate"></i>
      <h4>No Certificates Yet</h4>
      <p>Complete courses to earn certificates and showcase your achievements.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Certificates data
const certificates = ref([
  { id: 1, course: 'Web Development Fundamentals', issueDate: 'March 15, 2023' },
  { id: 2, course: 'JavaScript Basics', issueDate: 'February 28, 2023' },
  { id: 3, course: 'HTML & CSS Mastery', issueDate: 'January 20, 2023' }
]);

// Methods
const downloadCertificate = (certificate) => {
  console.log('Downloading certificate for:', certificate.course);
  // In a real app, this would trigger a download of the certificate PDF
};

const shareCertificate = (certificate) => {
  console.log('Sharing certificate for:', certificate.course);
  // In a real app, this would open a sharing dialog or copy a link to clipboard
  if (navigator.share) {
    navigator.share({
      title: `Certificate: ${certificate.course}`,
      text: `I earned a certificate in ${certificate.course}!`,
      url: window.location.href
    });
  }
};

const viewCertificate = (certificate) => {
  console.log('Viewing certificate for:', certificate.course);
  // In a real app, this would open the certificate in a modal or new tab
};
</script>

<style scoped>
.section-title {
    font-family: var(--font-heading);
    font-size: var(--fs-lg);
    color: var(--text-color);
    margin: 0 0 14.4px 0;
    font-weight: 600;
    position: relative;
    padding-bottom: 9px;
    text-align:start;
}

.section-title::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 45px;
    height: 3px;
    background-color: var(--primary-color);
    border-radius: 3px;
}

.certificates-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.certificate-card {
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--shadow-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.certificate-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.certificate-preview {
  height: 200px;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--border-color);
  background:var(--primary-color);
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
  margin: 0 0 15px;
  font-size: 0.9rem;
  color: var(--secondary-color);
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

.btn-download:hover {
  background-color: #065e6f;
}

.btn-share {
  background-color: #6c757d;
  color: white;
}

.btn-share:hover {
  background-color: #5a6268;
}

.btn-view {
  background-color: #17a2b8;
  color: white;
}

.btn-view:hover {
  background-color: #138496;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--shadow-color);
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
  margin: 0;
  color: var(--secondary-color);
  max-width: 400px;
  margin: 0 auto;
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
}

@media (max-width: 576px) {
  .certificate-actions {
    flex-direction: column;
  }
}
</style>