<template>
  <div class="auth-container">
    <!-- Notifications container -->
    <div class="notifications-container">
      <transition-group name="notification">
        <div v-for="notification in notifications" :key="notification.id"
             :class="['notification', `notification-${notification.type}`]">
          <div class="notification-content">
            <i :class="getNotificationIcon(notification.type)"></i>
            <span>{{ notification.message }}</span>
          </div>
          <button class="notification-close" @click="dismissNotification(notification.id)">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </transition-group>
    </div>

    <div class="auth-wrapper">
      <div class="auth-card">
        <!-- Show email verification message after successful registration -->
        <div v-if="registrationComplete" class="verification-message">
          <i class="fas fa-envelope-open-text verification-icon"></i>
          <h2 class="auth-heading">Please Verify Your Email</h2>
          <p class="verification-text">
            A verification link has been sent to <strong>{{ formData.email }}</strong>
          </p>
          <p class="verification-instructions">
            Please check your inbox and click on the verification link to activate your account.
            The link will expire in 24 hours.
          </p>
          <div class="verification-actions">
            <button class="secondary-btn" @click="resendVerificationEmail" :disabled="resendingEmail">
              <span v-if="resendingEmail"><i class="fas fa-spinner fa-spin"></i> Sending...</span>
              <span v-else>Resend verification email</span>
            </button>
            <router-link to="/login" class="auth-link">Back to login</router-link>
          </div>
        </div>

        <!-- Regular signup form when not yet registered -->
        <div v-else>
          <h2 class="auth-heading">Create Your Account</h2>

          <form @submit.prevent="handleSignUp">
            <div class="form-row">
              <div class="form-group">
                <label for="signup_first_name" class="form-label">First Name</label>
                <input
                  type="text"
                  class="custom-form-control"
                  id="signup_first_name"
                  v-model="formData.firstName"
                  placeholder="Your first name"
                  required
                >
              </div>

              <div class="form-group">
                <label for="signup_last_name" class="form-label">Last Name</label>
                <input
                  type="text"
                  class="custom-form-control"
                  id="signup_last_name"
                  v-model="formData.lastName"
                  placeholder="Your last name"
                  required
                >
              </div>
            </div>

            <div class="form-group">
              <label for="signup_email" class="form-label">Email</label>
              <input
                type="email"
                class="custom-form-control"
                id="signup_email"
                v-model="formData.email"
                placeholder="your.email@example.com"
                required
              >
            </div>

            <div class="form-group">
              <label for="signup_password" class="form-label">Password</label>
              <div class="password-wrapper">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  class="custom-form-control"
                  id="signup_password"
                  v-model="formData.password"
                  placeholder="Create a password"
                  required
                >
                <span
                  class="toggle-password"
                  @click="showPassword = !showPassword"
                >
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </span>
              </div>
            </div>

            <div class="form-group">
              <label for="signup_confirm_password" class="form-label">Confirm Password</label>
              <div class="password-wrapper">
                <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  class="custom-form-control"
                  id="signup_confirm_password"
                  v-model="formData.confirmPassword"
                  placeholder="Confirm your password"
                  required
                >
                <span
                  class="toggle-password"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </span>
              </div>
            </div>

            <div class="form-group">
              <label for="user_type" class="form-label">I am a</label>
              <div class="custom-select-wrapper">
                <select
                  class="custom-form-control"
                  id="user_type"
                  v-model="formData.userType"
                  required
                >
                  <option value="" disabled>Select your role</option>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
                <span class="select-arrow">
                  <i class="fas fa-chevron-down"></i>
                </span>
              </div>
            </div>

            <div class="form-options">
              <div class="terms-agreement">
                <input
                  class="form-checkbox"
                  type="checkbox"
                  id="terms_agreement"
                  v-model="formData.termsAgreed"
                  required
                >
                <label class="form-link-label" for="terms_agreement">
                  I agree to the <router-link to="/terms" class="auth-link">Terms of Service</router-link> and
                  <router-link to="/privacy" class="auth-link">Privacy Policy</router-link>
                </label>
              </div>
            </div>

            <button type="submit" class="sign-btn" :disabled="isLoading">
              <span v-if="isLoading"><i class="fas fa-spinner fa-spin"></i> Signing up...</span>
              <span v-else>Sign Up</span>
            </button>
          </form>

          <div class="auth-divider">
            <div class="auth-divider-line"></div>
            <div class="auth-divider-text">OR</div>
            <div class="auth-divider-line"></div>
          </div>

          <div class="auth-redirect">
            Already have an account?
            <router-link to="/login" class="auth-link">Sign in now</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isLoading = ref(false);
const notifications = ref([]);
const registrationComplete = ref(false);
const resendingEmail = ref(false);

// Form data using reactive for better object handling with axios
const formData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  userType: '',
  termsAgreed: false
});

// Function to get notification icon based on type
const getNotificationIcon = (type) => {
  switch (type) {
    case 'success':
      return 'fas fa-check-circle';
    case 'error':
      return 'fas fa-exclamation-circle';
    case 'warning':
      return 'fas fa-exclamation-triangle';
    case 'info':
    default:
      return 'fas fa-info-circle';
  }
};

// Show notification function
const showNotification = (message, type = 'info') => {
  const id = Date.now();
  notifications.value.push({ id, message, type });

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    dismissNotification(id);
  }, 5000);
};

// Dismiss notification function
const dismissNotification = (id) => {
  const index = notifications.value.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications.value.splice(index, 1);
  }
};

// Resend verification email
const resendVerificationEmail = async () => {
  if (!formData.email) {
    showNotification('Email address is required', 'error');
    return;
  }

  resendingEmail.value = true;

  try {
    const response = await axios.post('/api/auth/resend-verification/', {
      email: formData.email
    });

    showNotification('Verification email sent. Please check your inbox.', 'success');
  } catch (error) {
    console.error('Error resending verification email:', error);
    showNotification('Failed to resend verification email. Please try again.', 'error');
  } finally {
    resendingEmail.value = false;
  }
};

// Handle form submission with enhanced API response handling
const handleSignUp = async () => {
  // Form validation
  if (formData.password !== formData.confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return;
  }

  // Password strength validation
  if (formData.password.length < 8) {
    showNotification('Password must be at least 8 characters long', 'error');
    return;
  }

  isLoading.value = true;

  try {
    // Prepare data for API - match the exact fields the Django serializer expects
    const userData = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      password: formData.password,
      password2: formData.confirmPassword,
      user_type: formData.userType,
      terms_agreed: formData.termsAgreed
    };

    // API call to Django endpoint
    const response = await axios.post('/api/auth/register/', userData);

    // Handle successful response
    if (response.status === 201 || response.status === 200) {
      // Show verification message instead of redirecting immediately
      registrationComplete.value = true;
      showNotification('Account created successfully! Please check your email to verify your account.', 'success');
    } else {
      // Handle unexpected success status
      console.warn('Signup successful but with unexpected status:', response.status);
      showNotification('Account created, but there might be an issue with email verification.', 'warning');
      registrationComplete.value = true;
    }

  } catch (error) {
    console.error('Signup error:', error);

    // Check if the error has a response property
    if (error && error.response) {
      const status = error.response.status;
      const errorData = error.response.data || {};

      // Handle specific error types
      if (status === 400) {
        // For validation errors, extract and display all error messages
        if (typeof errorData === 'object') {
          // Handle nested error structure
          Object.entries(errorData).forEach(([field, errors]) => {
            if (Array.isArray(errors)) {
              errors.forEach(errorMsg => {
                showNotification(`${field}: ${errorMsg}`, 'error');
              });
            } else if (typeof errors === 'string') {
              showNotification(`${field}: ${errors}`, 'error');
            }
          });
        } else {
          showNotification('Invalid form data. Please check and try again.', 'error');
        }
      } else if (status === 500) {
        showNotification('Server error. Please try again later or contact support.', 'error');
      } else {
        showNotification(errorData.message || 'Registration failed. Please try again.', 'error');
      }
    } else {
      showNotification('Network error. Please check your connection and try again.', 'error');
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  // Use jQuery for animations
  $(document).ready(function() {
    // Add input field animation
    $('.custom-form-control').focus(function() {
      $(this).addClass('focus-active');
    }).blur(function() {
      $(this).removeClass('focus-active');
    });

    // Add entrance animation to auth card
    $('.auth-card').addClass('animate-in');

    // Style checkbox
    $('.form-checkbox').on('change', function() {
      if($(this).is(':checked')) {
        $(this).addClass('checked');
      } else {
        $(this).removeClass('checked');
      }
    });

    // Style select on change
    $('#user_type').on('change', function() {
      if($(this).val() !== '') {
        $(this).addClass('selected');
      } else {
        $(this).removeClass('selected');
      }
    });
  });
});
</script>

<style scoped>
/* Import Bootstrap 5.2.3 */
@import 'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css';

html, body {
  min-height: 100%;
  height: auto;
}

.auth-container {
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 15px;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
}

.auth-wrapper {
  width: 90%;
  max-width: 480px;
  z-index: 10;
  position: relative;
  margin-top: 30px;
  margin-bottom: 50px; /* Add bottom margin to allow scrolling past the form */
}

.auth-card {
  background-color: #f8f9fa;
  border-radius: 12px;
  padding: 25px;
  transform: translateY(30px);
  opacity: 0;
  transition: all 0.6s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  width: 100%;
}

.auth-card.animate-in {
  transform: translateY(0);
  opacity: 1;
  margin-top: 1rem;
}

.auth-heading {
  font-family: var(--font-heading);
  font-size: calc(var(--fs-xl) * 0.9); /* 90% of original size */
  color: var(--primary-color);
  text-align: center;
  margin-bottom: 20px;
  font-weight: 600;
}

/* Form row to handle first name and last name side by side */
.form-row {
  display: flex;
  gap: 10px;
  margin-bottom: 0;
}

.form-row .form-group {
  flex: 1;
}

.form-group {
  margin-bottom: 15px;
}

.form-label {
  display: block;
  font-weight: 500;
  font-size: calc(var(--fs-sm) * 0.9); /* 90% of original size */
  color: var(--secondary-color);
  margin-bottom: 4px;
  font-family: var(--font-body);
}

.custom-form-control {
  width: 100%;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: #f8f9fa;
  font-size: calc(var(--fs-sm) * 0.9); /* 90% of original size */
  font-family: var(--font-body);
  transition: all 0.3s ease;
  height: auto;
}

.custom-form-control:focus,
.custom-form-control.focus-active {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(8, 121, 144, 0.15);
}

/* Custom select styling */
.custom-select-wrapper {
  position: relative;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: var(--primary-color);
  z-index: 1;
}

select.custom-form-control {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 30px;
  cursor: pointer;
}

select.custom-form-control option {
  color: var(--text-color);
}

select.custom-form-control option:hover {
  background-color: var(--select-hover);
}

select.custom-form-control.selected {
  color: var(--primary-color);
  font-weight: 500;
}

.password-wrapper {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: var(--secondary-color);
  z-index: 10;
  font-size: calc(var(--fs-sm) * 0.9); /* 90% of original size */
}

.toggle-password:hover {
  color: var(--primary-color);
}

.form-options {
  margin-bottom: 15px;
}

.terms-agreement {
  display: flex;
  align-items: center; /* Changed from flex-start to center to align checkbox with text */
  margin-bottom: 5px;
}

.form-checkbox {
  margin-right: 6px;
  cursor: pointer;
  position: relative;
  appearance: none;
  width: 16px;
  height: 16px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  outline: none;
  transition: all 0.2s ease;
  vertical-align: middle;
  background-color: white;
  flex-shrink: 0; /* Prevent checkbox from shrinking */
}

.form-checkbox:checked {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.form-checkbox:checked::after {
  content: '✓';
  position: absolute;
  color: white;
  font-size: 12px;
  top: 0;
  left: 3px;
}

.form-checkbox:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(8, 121, 144, 0.15);
}

.form-link-label {
  font-size: calc(var(--fs-xs) * 0.9); /* 90% of original size */
  color: var(--secondary-color);
  cursor: pointer;
  font-family: var(--font-body);
  padding-top: 2px; /* Added padding to align better with the checkbox */
}

.sign-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  font-size: calc(var(--fs-sm) * 0.9); /* 90% of original size */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: var(--font-heading);
  letter-spacing: 0.5px;
  width: 100%;
  margin-bottom: 15px;
}

.sign-btn:hover {
  background-color: #06677e;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(6, 103, 126, 0.3);
}

.sign-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.auth-divider {
  display: flex;
  align-items: center;
  margin: 15px 0;
}

.auth-divider-line {
  flex-grow: 1;
  height: 1px;
  background-color: var(--border-color);
}

.auth-divider-text {
  margin: 0 12px;
  color: var(--secondary-color);
  font-size: calc(var(--fs-xs) * 0.9); /* 90% of original size */
  font-family: var(--font-body);
}

.auth-redirect {
  text-align: center;
  font-size: calc(var(--fs-xs) * 0.9); /* 90% of original size */
  color: var(--secondary-color);
  font-family: var(--font-body);
}

.auth-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  font-size: calc(var(--fs-xs) * 0.9); /* 90% of original size */
}

.auth-link:hover {
  text-decoration: underline;
  color: #06677e;
}

/* Notification system styles */
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 350px;
  width: calc(100% - 40px);
}

.notification {
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 15px;
}

.notification-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.notification-content i {
  margin-right: 10px;
  font-size: calc(18px * 0.9); /* 90% of original size */
}

.notification-close {
  background: none;
  border: none;
  color: #777;
  cursor: pointer;
  padding: 2px 5px;
  transition: color 0.2s;
}

.notification-close:hover {
  color: #333;
}

.notification-success {
  border-left: 4px solid var(--success-color);
}
.notification-success i {
  color: var(--success-color);
}

.notification-error {
  border-left: 4px solid var(--error-color);
}
.notification-error i {
  color: var(--error-color);
}

.notification-warning {
  border-left: 4px solid #f0ad4e;
}
.notification-warning i {
  color: #f0ad4e;
}

.notification-info {
  border-left: 4px solid var(--primary-color);
}
.notification-info i {
  color: var(--primary-color);
}

/* Animations for notifications */
.notification-enter-active {
  animation: slide-in 0.3s ease-out forwards;
}

.notification-leave-active {
  animation: slide-out 0.3s ease-out forwards;
}

.verification-message {
  text-align: center;
  padding: 1.5rem 0;
}

.verification-icon {
  font-size: 4rem;
  color: var(--primary-color);
  margin-bottom: 1.5rem;
}

.verification-text {
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.verification-instructions {
  color: #666;
  margin-bottom: 2rem;
}

.verification-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.secondary-btn {
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.secondary-btn:hover {
  background-color: #e0e0e0;
}

.secondary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes slide-in {
  0% {
    transform: translateX(100%);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-out {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* Responsive styles */
@media (max-width: 768px) {
  .auth-card {
    padding: 20px 15px;
  }

  .auth-heading {
    font-size: calc(var(--fs-md) * 0.9); /* 90% of responsive size */
  }

  .custom-form-control {
    padding: 8px 10px;
  }

  .terms-agreement {
    align-items: center; /* Keep checkbox aligned with text */
  }

  .notifications-container {
    max-width: 280px;
  }

  /* Make first name and last name stack on mobile */
  .form-row {
    flex-direction: column;
    gap: 5px;
  }
}

/* Small phone screens */
@media (max-width: 375px) {
  .auth-card {
    padding: 15px 12px;
  }

  .auth-heading {
    font-size: calc(var(--fs-base) * 0.9); /* 90% of responsive size */
    margin-bottom: 15px;
  }

  .form-group {
    margin-bottom: 12px;
  }

  .sign-btn {
    padding: 8px 12px;
  }

  .notifications-container {
    max-width: 260px;
    top: 10px;
    right: 10px;
  }
}

/* Added increased top spacing for medium and large devices */
@media (min-width: 768px) {
  .auth-wrapper {
    margin-top: 60px; /* Increased top margin for larger screens */
    margin-bottom: 80px; /* Extra bottom margin to allow scrolling past form */
  }

  .auth-container {
    align-items: flex-start; /* Align from top instead of center */
    padding-top: 30px;
  }
}

/* For even larger screens */
@media (min-width: 1200px) {
  .auth-wrapper {
    margin-top: 20px; /* Even more space for very large screens */
    margin-bottom: 80px; /* More bottom space for very large screens */
  }
}
</style>