import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

export function useCertificates() {
  const certificates = ref([])
  const loading = ref(false)
  const error = ref(null)
  const authStore = useAuthStore()

  // Load certificates for both guests and authenticated users
  const loadCertificates = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await axios.get('/api/student/certificates/')
      certificates.value = response.data.certificates

      console.log('📊 Real courses loaded as certificates:', {
        userType: response.data.user_type,
        count: response.data.total_certificates,
        totalCourses: response.data.total_courses,
        certificates: response.data.certificates
      })

      return response.data
    } catch (err) {
      error.value = 'Failed to load certificates. Please try again.'
      console.error('Error loading certificates:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Download certificate - only for authenticated users with completed courses
  const downloadCertificate = async (certificate) => {
    // For guests, show signup message
    if (!authStore.isAuthenticated) {
      alert('Please sign up to earn and download certificates!')
      return
    }

    // Check if user is enrolled
    if (!certificate.is_enrolled) {
      alert('Please enroll in this course first to earn a certificate.')
      return
    }

    // For authenticated users without access
    if (!certificate.accessible) {
      alert(certificate.message || 'Complete the course to download this certificate')
      return
    }

    try {
      let downloadEndpoint = ''

      // Handle both real and virtual certificates
      if (certificate.is_real_certificate) {
        downloadEndpoint = `/api/student/certificates/${certificate.certificate_id}/download/`
      } else {
        downloadEndpoint = `/api/student/courses/${certificate.course_code}/generate-certificate/`
      }

      const response = await axios.get(downloadEndpoint)

      // Show success message and handle download
      const message = certificate.is_real_certificate
        ? 'Certificate download started!'
        : 'Certificate generated successfully!'

      alert(message + ' ' + (response.data.detail || ''))

      if (response.data.download_url) {
        window.open(response.data.download_url, '_blank')
      }

      return response.data
    } catch (err) {
      console.error('Error downloading certificate:', err)
      if (err.response?.status === 403) {
        alert('You need to complete the course first to download this certificate.')
      } else {
        alert('Failed to download certificate. Please try again.')
      }
      throw err
    }
  }

  // View certificate - only for authenticated users with completed courses
  const viewCertificate = async (certificate) => {
    // For guests, show signup message
    if (!authStore.isAuthenticated) {
      alert('Please sign up to view certificates for completed courses!')
      return
    }

    // Check if user is enrolled
    if (!certificate.is_enrolled) {
      alert('Please enroll in this course first to view certificates.')
      return
    }

    // For authenticated users without access
    if (!certificate.accessible) {
      alert(certificate.message || 'Complete the course to view this certificate')
      return
    }

    try {
      let viewEndpoint = ''

      // Handle both real and virtual certificates
      if (certificate.is_real_certificate) {
        viewEndpoint = `/api/student/certificates/${certificate.certificate_id}/view/`
      } else {
        viewEndpoint = `/api/student/courses/${certificate.course_code}/certificate-preview/`
      }

      const response = await axios.get(viewEndpoint)

      // Show certificate details
      const certData = response.data
      const certificateDetails = `
Certificate Details:

Course: ${certData.course_title || certificate.course_title}
Teacher: ${certificate.teacher_name}
Total Lessons: ${certificate.total_lessons}
Issued: ${certData.issue_date || certData.issued_date || certificate.issue_date}
Grade: ${certData.formatted_grade || certData.grade || certificate.formatted_grade}
Progress: ${certificate.progress}%
Status: ${certData.message || certificate.message || 'Available'}

${certData.detail || ''}
      `.trim()

      alert(certificateDetails)

      return response.data
    } catch (err) {
      console.error('Error viewing certificate:', err)
      if (err.response?.status === 403) {
        alert('You need to complete the course first to view this certificate.')
      } else {
        alert('Failed to view certificate. Please try again.')
      }
      throw err
    }
  }

  // Share certificate - only for accessible certificates
  const shareCertificate = async (certificate) => {
    // For guests, show signup message
    if (!authStore.isAuthenticated) {
      alert('Please sign up to share your certificates!')
      return
    }

    // Check if user is enrolled
    if (!certificate.is_enrolled) {
      alert('Please enroll in this course first to share certificates.')
      return
    }

    // For authenticated users without access
    if (!certificate.accessible) {
      alert(certificate.message || 'Complete the course to share this certificate')
      return
    }

    try {
      const shareData = {
        title: `Certificate: ${certificate.course_title}`,
        text: `I earned a certificate in ${certificate.course_title} with a grade of ${certificate.formatted_grade}!`,
        url: window.location.origin + `/certificates/${certificate.certificate_id}`
      }

      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(
          `Certificate: ${certificate.course_title} - Grade: ${certificate.formatted_grade} - Issued: ${certificate.issue_date}`
        )
        alert('Certificate details copied to clipboard!')
      }
    } catch (err) {
      console.error('Error sharing certificate:', err)
      // Don't throw error for share cancellations
      if (err.name !== 'AbortError') {
        throw err
      }
    }
  }

  // Check if user can access a certificate
  const canAccessCertificate = (certificate) => {
    return authStore.isAuthenticated && certificate.is_enrolled && certificate.accessible
  }

  // Get certificate status message
  const getCertificateStatus = (certificate) => {
    if (!authStore.isAuthenticated) {
      return 'Sign up to earn this certificate'
    }
    if (!certificate.is_enrolled) {
      return 'Enroll in this course to earn a certificate'
    }
    return certificate.message || 'Complete the course to access this certificate'
  }

  return {
    // State
    certificates,
    loading,
    error,

    // Methods
    loadCertificates,
    downloadCertificate,
    viewCertificate,
    shareCertificate,
    canAccessCertificate,
    getCertificateStatus
  }
}