<template>
  <div class="auth-container">
    <div class="auth-wrapper">
      <div class="auth-card" :class="{ 'animate-in': isCardAnimated }">
        <h2 class="auth-heading">Sign In to Your Account</h2>
        
        <!-- Alert for displaying errors -->
        <div v-if="authError" class="auth-alert error">
          <i class="fas fa-exclamation-circle"></i>
          <span>{{ authError }}</span>
          <button class="alert-close" @click="clearError" aria-label="Close alert">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form @submit.prevent="handleSignIn">
          <div class="form-group">
            <label for="signin_email" class="form-label">Email</label>
            <input 
              type="email" 
              class="custom-form-control" 
              id="signin_email" 
              v-model="signinForm.email"
              placeholder="your.email@example.com" 
              :disabled="isLoading"
              required
            >
          </div>
          
          <div class="form-group">
            <label for="signin_password" class="form-label">Password</label>
            <div class="password-wrapper">
              <input 
                :type="showPassword ? 'text' : 'password'" 
                class="custom-form-control" 
                id="signin_password" 
                v-model="signinForm.password"
                placeholder="Enter your password" 
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
          </div>
          
          <div class="form-options">
            <div class="remember-me">
              <input 
                class="form-checkbox" 
                type="checkbox" 
                id="remember_me" 
                v-model="signinForm.remember"
                :class="{ 'checked': signinForm.remember }"
              >
              <label class="form-link-label" for="remember_me">
                Remember me
              </label>
            </div>
            <router-link to="/forgot-password" class="auth-link">Forgot password?</router-link>
          </div>
          
          <button type="submit" class="sign-btn" :disabled="isLoading">
            <span v-if="isLoading"><i class="fas fa-spinner fa-spin"></i> Signing in...</span>
            <span v-else>Sign In</span>
          </button>
        </form>
        
        <div class="auth-divider">
          <div class="auth-divider-line"></div>
          <div class="auth-divider-text">OR</div>
          <div class="auth-divider-line"></div>
        </div>
        
        <div class="auth-redirect">
          Don't have an account? 
          <router-link to="/signup" class="auth-link">Create one now</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const showPassword = ref(false);
const isCardAnimated = ref(false);

// Sign In form data
const signinForm = ref({
  email: '',
  password: '',
  remember: false
});

// Computed properties from the auth store
const isLoading = ref(false);
const authError = computed(() => authStore.getError);

// Clear error state
const clearError = () => {
  authStore.clearError();
};

// Handle form submission
const handleSignIn = async () => {
  const credentials = {
    email: signinForm.value.email,
    password: signinForm.value.password
  };
  isLoading.value = true;
  const result = await authStore.login(credentials);
  
  if (result.success) {
    // Save "remember me" preference if needed
    if (signinForm.value.remember) {
      // Remember me logic
    }
    
    // Redirect based on user type
    switch(authStore.userType) {
      case 'admin':
        await router.push('/admin');
        break;
      case 'teacher':
        await router.push('/teacher');
        break;
      case 'student':
        await router.push('/student');
        break;
      default:
        console.error('Unknown user type:', authStore.userType);
        authStore.error = 'Your account type is not recognized';
        authStore.logout();
    }
  }else{
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
  background-color: #f8f9fa !important;
  font-size: var(--fs-sm);
  font-family: var(--font-body);
  transition: all 0.27s ease; /* 90% of 0.3s */
  height: auto;
}

.custom-form-control:focus,
.custom-form-control.focus-active {
  outline: none;
  border-color: var(--primary-color);
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

.remember-me {
  display: flex;
  align-items: center;
  margin-bottom: 4.5px; /* 90% of 5px */
}

.form-checkbox {
  margin-right: 5.4px; /* 90% of 6px */
  cursor: pointer;
  position: relative;
  appearance: none;
  width: 14.4px; /* 90% of 16px */
  height: 14.4px; /* 90% of 16px */
  border: 0.9px solid var(--border-color); /* 90% of 1px */
  border-radius: 2.7px; /* 90% of 3px */
  outline: none;
  transition: all 0.18s ease; /* 90% of 0.2s */
  vertical-align: middle;
  background-color: white;
}

.form-checkbox.checked,
.form-checkbox:checked {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.form-checkbox.checked::after,
.form-checkbox:checked::after {
  content: '✓';
  position: absolute;
  color: white;
  font-size: 10.8px; /* 90% of 12px */
  top: 0;
  left: 2.7px; /* 90% of 3px */
}

.form-checkbox:focus {
  outline: none;
  box-shadow: 0 0 0 1.8px rgba(8, 121, 144, 0.135); /* 90% of 2px and 0.15 */
}

.form-link-label {
  font-size: var(--fs-xs);
  color: var(--secondary-color);
  cursor: pointer;
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