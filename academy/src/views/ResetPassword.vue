<template>
  <div class="auth-container">
    <div class="auth-wrapper">
      <div class="auth-card" :class="{ 'animate-in': isCardAnimated }">
        <h2 class="auth-heading">Reset Your Password</h2>
        
        <!-- Token validity alert -->
        <div v-if="tokenError" class="auth-alert error">
          <i class="fas fa-exclamation-triangle"></i>
          <span>{{ tokenError }}</span>
        </div>
        
        <!-- Success message -->
        <div v-if="resetSuccess" class="auth-alert success d-block">
          <i class="fas fa-check-circle"></i>
          <span>{{ successMessage }}</span>
          <div class="auth-redirect" style="margin-top: 13.5px; margin-bottom: 13.5px;">
            <router-link to="/login" class="sign-btn text-decoration-none">Login</router-link>
          </div>
        </div>
        
        <!-- Alert for displaying errors -->
        <div v-if="errorMessage && !tokenError" class="auth-alert error">
          <i class="fas fa-exclamation-circle"></i>
          <span>{{ errorMessage }}</span>
          <button class="alert-close" @click="clearError" aria-label="Close alert">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form v-if="!tokenError && !resetSuccess" @submit.prevent="handleResetPassword">
          <div class="form-group">
            <label for="password" class="form-label">New Password</label>
            <div class="password-wrapper">
              <input 
                :type="showPassword ? 'text' : 'password'" 
                class="custom-form-control" 
                id="password" 
                v-model="password"
                placeholder="Enter new password" 
                :disabled="isLoading"
                required
              >
              <span 
                class="toggle-password" 
                @click="showPassword = !showPassword"
              >
                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </span>
            </div>
            <div class="password-strength" v-if="password">
              <div class="strength-meter">
                <div 
                  class="strength-bar" 
                  :style="{ width: passwordStrength.score * 25 + '%', 
                  backgroundColor: passwordStrength.color }"
                ></div>
              </div>
              <span class="strength-text" :style="{ color: passwordStrength.color }">
                {{ passwordStrength.message }}
              </span>
            </div>
          </div>
          
          <div class="form-group">
            <label for="confirm_password" class="form-label">Confirm Password</label>
            <div class="password-wrapper">
              <input 
                :type="showConfirmPassword ? 'text' : 'password'" 
                class="custom-form-control" 
                id="confirm_password" 
                v-model="confirmPassword"
                placeholder="Confirm new password" 
                :disabled="isLoading"
                required
              >
              <span 
                class="toggle-password" 
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
              </span>
            </div>
            <div class="password-match" v-if="password && confirmPassword">
              <span v-if="password === confirmPassword" style="color: var(--success-color)">
                <i class="fas fa-check"></i> Passwords match
              </span>
              <span v-else style="color: var(--error-color)">
                <i class="fas fa-times"></i> Passwords do not match
              </span>
            </div>
          </div>
          
          <button 
            type="submit" 
            class="sign-btn" 
            :disabled="isLoading || !isFormValid"
          >
            <span v-if="isLoading"><i class="fas fa-spinner fa-spin"></i> Resetting...</span>
            <span v-else>Reset Password</span>
          </button>
        </form>
        
        <div class="auth-divider">
          <div class="auth-divider-line"></div>
          <div class="auth-divider-text">OR</div>
          <div class="auth-divider-line"></div>
        </div>
        
        <div class="auth-redirect">
          Remember your password? 
          <router-link to="/login" class="auth-link">Sign in</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();

const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const tokenError = ref('');
const resetSuccess = ref(false);
const successMessage = ref('');
const token = ref('');
const isCardAnimated = ref(false);

// Compute password strength
const passwordStrength = computed(() => {
  if (!password.value) {
    return { score: 0, message: '', color: '#ddd' };
  }
  
  let score = 0;
  let message = 'Very weak';
  let color = '#dc3545'; // red

  // Check length
  if (password.value.length >= 8) score++;
  if (password.value.length >= 12) score++;

  // Check for numbers
  if (/\d/.test(password.value)) score++;

  // Check for special characters
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password.value)) score++;
  
  // Check for uppercase and lowercase
  if (/[A-Z]/.test(password.value) && /[a-z]/.test(password.value)) score++;

  // Define messages and colors based on score
  if (score === 1) {
    message = 'Weak';
    color = '#dc3545'; // red
  } else if (score === 2) {
    message = 'Fair';
    color = '#ffc107'; // yellow
  } else if (score === 3) {
    message = 'Good';
    color = '#17a2b8'; // teal
  } else if (score >= 4) {
    message = 'Strong';
    color = '#28a745'; // green
  }

  return { score, message, color };
});

// Computed property to check if form is valid
const isFormValid = computed(() => {
  return (
    password.value.length >= 8 && 
    password.value === confirmPassword.value && 
    passwordStrength.value.score >= 2 // At least "Fair" strength
  );
});

// Clear error state
const clearError = () => {
  errorMessage.value = '';
};

// Handle form submission
const handleResetPassword = async () => {
  if (!isFormValid.value) {
    errorMessage.value = 'Please make sure your passwords match and are sufficiently strong.';
    return;
  }
  
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    const response = await axios.post('/api/auth/password-reset-confirm/', {
      token: token.value,
      password: password.value
    });
    
    // Display success message
    resetSuccess.value = true;
    successMessage.value = response.data.message || 'Your password has been reset successfully';
    
  } catch (error) {
    console.error('Password reset error:', error);
    
    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.error || 'An error occurred. Please try again.';
      
      // Check if token was rejected
      if (error.response.status === 400 && error.response.data.error && 
          error.response.data.error.toLowerCase().includes('token')) {
        tokenError.value = error.response.data.error;
      }
    } else {
      errorMessage.value = 'Network error. Please check your connection and try again.';
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  // Get token from URL
  token.value = route.query.token;
  
  if (!token.value) {
    tokenError.value = 'No reset token provided. Please use the link from your email.';
    return;
  }
  
  // Add animation class to card after a short delay
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

.password-wrapper {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 10.8px; /* 90% of 12px */
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: var(--secondary-color);
  z-index: 10;
  font-size: var(--fs-sm);
}

.toggle-password:hover {
  color: var(--primary-color);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 13.5px; /* 90% of 15px */
  flex-wrap: wrap;
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

/* Alert styling */
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
  background-color: rgba(40, 167, 69, 0.09);
  color: var(--success-color);
  border: 0.9px solid rgba(40, 167, 69, 0.18);
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

/* Password strength indicator styling */
.password-strength {
  margin-top: 8.1px; /* 90% of 9px */
  font-size: var(--fs-xs);
}

.strength-meter {
  height: 4.5px;
  background-color: #e9ecef;
  border-radius: 2.7px;
  margin-bottom: 4.5px;
}

.strength-bar {
  height: 100%;
  border-radius: 2.7px;
  transition: width 0.27s ease, background-color 0.27s ease;
}

.strength-text {
  display: block;
  font-size: var(--fs-xs);
  font-weight: 500;
}

.password-match {
  margin-top: 5.4px; /* 90% of 6px */
  font-size: var(--fs-xs);
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
  
  .form-options {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .auth-link {
    margin-top: 4.5px; /* 90% of 5px */
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