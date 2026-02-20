<template>
  <div class="auth-container">
    <div class="auth-wrapper">
      <div class="auth-card" :class="{ 'animate-in': isCardAnimated }">
        <h2 class="auth-heading">Forgot Password</h2>
        
        <!-- Success message -->
        <div v-if="requestSuccess" class="auth-alert success">
          <i class="fas fa-check-circle"></i>
          <span>{{ successMessage }}</span>
        </div>
        
        <!-- Alert for displaying errors -->
        <div v-if="errorMessage" class="auth-alert error">
          <i class="fas fa-exclamation-circle"></i>
          <span>{{ errorMessage }}</span>
          <button class="alert-close" @click="clearError" aria-label="Close alert">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form v-if="!requestSuccess" @submit.prevent="handleForgotPassword">
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input 
              type="email" 
              class="custom-form-control" 
              id="email" 
              v-model="email"
              placeholder="your.email@example.com" 
              :disabled="isLoading"
              required
            >
          </div>
          
          <p class="form-help-text">
            Enter the email address associated with your account and we'll send you a link to reset your password.
          </p>
          
          <button type="submit" class="sign-btn" :disabled="isLoading">
            <span v-if="isLoading"><i class="fas fa-spinner fa-spin"></i> Processing...</span>
            <span v-else>Send Reset Link</span>
          </button>
        </form>
        
        <div class="auth-divider">
          <div class="auth-divider-line"></div>
          <div class="auth-divider-text">OR</div>
          <div class="auth-divider-line"></div>
        </div>
        
        <div class="auth-redirect">
          <router-link to="/login" class="auth-link">Back to Login</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const email = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const requestSuccess = ref(false);
const successMessage = ref('');
const isCardAnimated = ref(false);

// Clear error state
const clearError = () => {
  errorMessage.value = '';
};

// Handle form submission
const handleForgotPassword = async () => {
  if (!email.value) {
    errorMessage.value = 'Please enter your email address';
    return;
  }
  
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    // Make sure this API endpoint matches what's defined in your Django urls.py
    const response = await axios.post('/api/auth/password-reset-request/', {
      email: email.value
    });
    
    // Display success message
    requestSuccess.value = true;
    successMessage.value = response.data.message || 'Password reset instructions have been sent to your email';
    
  } catch (error) {
    console.error('Password reset request error:', error);
    
    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.error || 'An error occurred. Please try again.';
    } else {
      errorMessage.value = 'Network error. Please check your connection and try again.';
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  // Add entrance animation after a short delay
  setTimeout(() => {
    isCardAnimated.value = true;
  }, 50);
});
</script>

<style scoped>
:root {
  /* Colors */
  --primary-color: #087990;
  --secondary-color: #444;
  --background-color: #f5f5f5;
  --light-accent: rgba(255, 255, 255, 0.2);
  --gray-bg: #f5f5f5;
  --border-color: #ddd;
  --text-color: #333;
  --accent-color: #6c9bcf;
  --error-color: #dc3545;
  --success-color: #28a745;

  /* Typography - reduced to 90% */
  --font-heading: 'Poppins', sans-serif;
  --font-body: 'Manrope', sans-serif;
  --fs-xs: 0.675rem; /* 90% of 0.75rem */
  --fs-sm: 0.7875rem; /* 90% of 0.875rem */
  --fs-base: 0.9rem; /* 90% of 1rem */
  --fs-md: 1.0125rem; /* 90% of 1.125rem */
  --fs-lg: 1.125rem; /* 90% of 1.25rem */
  --fs-xl: 1.35rem; /* 90% of 1.5rem */
  --fs-2xl: 1.575rem; /* 90% of 1.75rem */
  --fs-3xl: 1.8rem; /* 90% of 2rem */
  --fs-4xl: 2.25rem; /* 90% of 2.5rem */
}

.auth-container {
  height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 15px;
  position: relative;
  overflow: hidden;
}

.auth-wrapper {
  width: 100%;
  max-width: 400px; /* Keeping original max-width to maintain overall size */
  z-index: 10;
  position: relative;
  margin-top: -1.8rem; /* 90% of 2rem */
}

.auth-card {
  background-color: #f8f9fa;
  border-radius: 10.8px; /* 90% of 12px */
  padding: 22.5px; /* 90% of 25px */
  transform: translateY(27px); /* 90% of 30px */
  opacity: 0;
  transition: all 0.54s ease; /* 90% of 0.6s */
  box-shadow: 0 7.2px 28.8px rgba(0, 0, 0, 0.135); 
  border: 0.9px solid rgba(255, 255, 255, 0.27); /* 90% of 1px and 0.3 */
  width: 100%;
}

.auth-card.animate-in {
  transform: translateY(0);
  opacity: 1;
}

.auth-heading {
  font-family: var(--font-heading);
  font-size: var(--fs-lg);
  color: var(--primary-color);
  text-align: center;
  margin-bottom: 18px; /* 90% of 20px */
  font-weight: 600;
}

.form-group {
  margin-bottom: 13.5px; /* 90% of 15px */
}

.form-label {
  display: block;
  font-weight: 500;
  font-size: var(--fs-sm);
  color: var(--secondary-color);
  margin-bottom: 3.6px; /* 90% of 4px */
  font-family: var(--font-body);
}

.custom-form-control {
  width: 100%;
  padding: 9px 10.8px; /* 90% of 10px 12px */
  border-radius: 5.4px; /* 90% of 6px */
  border: 0.9px solid var(--border-color); /* 90% of 1px */
  background-color: #f8f9fa;
  font-size: var(--fs-sm);
  font-family: var(--font-body);
  transition: all 0.27s ease; /* 90% of 0.3s */
  height: auto;
}

.custom-form-control:focus,
.custom-form-control.focus-active {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1.8px rgba(8, 121, 144, 0.135); /* 90% of 2px and 0.15 */
}

.form-help-text {
  color: var(--secondary-color);
  font-size: var(--fs-xs);
  margin-bottom: 13.5px; /* 90% of 15px */
  line-height: 1.5;
  font-family: var(--font-body);
}

.sign-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  padding: 9px 13.5px; /* 90% of 10px 15px */
  border-radius: 4.5px; /* 90% of 5px */
  font-size: var(--fs-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.27s ease; /* 90% of 0.3s */
  font-family: var(--font-heading);
  letter-spacing: 0.45px; /* 90% of 0.5px */
  width: 100%;
  margin-bottom: 13.5px; /* 90% of 15px */
}

.sign-btn:hover {
  background-color: #06677e;
  transform: translateY(-1.8px); /* 90% of -2px */
  box-shadow: 0 4.5px 13.5px rgba(6, 103, 126, 0.27); /* 90% of 5px, 15px, and 0.3 */
}

.sign-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.auth-divider {
  display: flex;
  align-items: center;
  margin: 13.5px 0; /* 90% of 15px */
}

.auth-divider-line {
  flex-grow: 1;
  height: 0.9px; /* 90% of 1px */
  background-color: var(--border-color);
}

.auth-divider-text {
  margin: 0 10.8px; /* 90% of 12px */
  color: var(--secondary-color);
  font-size: var(--fs-xs);
  font-family: var(--font-body);
}

.auth-redirect {
  text-align: center;
  font-size: var(--fs-xs);
  color: var(--secondary-color);
  font-family: var(--font-body);
}

.auth-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.27s ease; /* 90% of 0.3s */
  font-size: var(--fs-xs);
}

.auth-link:hover {
  text-decoration: underline;
  color: #06677e;
}

/* Error alert styling */
.auth-alert {
  padding: 10.8px; /* 90% of 12px */
  border-radius: 5.4px; /* 90% of 6px */
  margin-bottom: 13.5px; /* 90% of 15px */
  display: flex;
  align-items: center;
  font-size: var(--fs-sm);
  position: relative;
}

.auth-alert.error {
  background-color: rgba(220, 53, 69, 0.09); /* 90% of 0.1 */
  color: var(--error-color);
  border: 0.9px solid rgba(220, 53, 69, 0.18); /* 90% of 1px and 0.2 */
}

.auth-alert.success {
  background-color: rgba(40, 167, 69, 0.09); /* 90% of 0.1 */
  color: var(--success-color);
  border: 0.9px solid rgba(40, 167, 69, 0.18); /* 90% of 1px and 0.2 */
}

.auth-alert i {
  margin-right: 7.2px; /* 90% of 8px */
}

.alert-close {
  position: absolute;
  right: 9px; /* 90% of 10px */
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.63; /* 90% of 0.7 */
  font-size: var(--fs-xs);
  padding: 0;
}

.alert-close:hover {
  opacity: 1;
}

/* Enhanced responsive adjustments */
@media (max-width: 768px) {
  .auth-card {
    padding: 18px 13.5px; /* 90% of 20px 15px */
  }
  
  .auth-heading {
    font-size: var(--fs-md);
  }
  
  .custom-form-control {
    padding: 7.2px 9px; /* 90% of 8px 10px */
  }
}

/* Small phone screens */
@media (max-width: 375px) {
  .auth-card {
    padding: 13.5px 10.8px; /* 90% of 15px 12px */
  }
  
  .auth-heading {
    font-size: var(--fs-base);
    margin-bottom: 13.5px; /* 90% of 15px */
  }
  
  .form-group {
    margin-bottom: 10.8px; /* 90% of 12px */
  }
  
  .sign-btn {
    padding: 7.2px 10.8px; /* 90% of 8px 12px */
  }
}
</style>