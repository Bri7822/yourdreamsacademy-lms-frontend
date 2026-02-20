<template>
  <div class="settings-view">
    <div class="settings-header">
      <h2 class="settings-title">Profile Settings</h2>
      <p class="settings-subtitle">Manage your account and preferences.</p>
    </div>

    <div class="settings-container">
      <div class="settings-tabs">
        <button
          class="tab"
          :class="{ 'active': activeTab === 'profile' }"
          @click="activeTab = 'profile'"
        >
          Profile
        </button>
        <button
          class="tab"
          :class="{ 'active': activeTab === 'account' }"
          @click="activeTab = 'account'"
        >
          Account
        </button>
        <button
          class="tab"
          :class="{ 'active': activeTab === 'notifications' }"
          @click="activeTab = 'notifications'"
        >
          Notifications
        </button>
        <button
          class="tab"
          :class="{ 'active': activeTab === 'security' }"
          @click="activeTab = 'security'"
        >
          Security
        </button>
      </div>

      <div class="settings-content">
        <!-- Profile Settings -->
        <div v-if="activeTab === 'profile'" class="profile-settings">
          <form @submit.prevent="saveProfile">
            <div class="form-row">
              <div class="form-group">
                <label>First Name</label>
                <input type="text" v-model="user.first_name" required>
              </div>
              <div class="form-group">
                <label>Last Name</label>
                <input type="text" v-model="user.last_name" required>
              </div>
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" v-model="user.email" required>
            </div>
            <div class="form-group">
              <label>Bio</label>
              <textarea v-model="user.bio" placeholder="Tell us about yourself..."></textarea>
            </div>
            <div class="form-group">
              <label>Profile Picture</label>
              <div class="avatar-upload">
                <div class="avatar-preview">
                  <img :src="user.avatar || defaultAvatar" alt="Profile" />
                </div>
                <div class="upload-actions">
                  <button type="button" class="btn-upload" @click="triggerFileInput">
                    <i class="fas fa-camera"></i>
                    Upload New Photo
                  </button>
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    @change="handleFileUpload"
                    hidden
                  />
                  <small class="file-info">JPG, PNG or GIF. Max size 2MB</small>
                </div>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-save" :disabled="saving">
                <i class="fas fa-save" v-if="!saving"></i>
                <i class="fas fa-spinner fa-spin" v-else></i>
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Account Settings -->
        <div v-if="activeTab === 'account'" class="account-settings">
          <div class="account-info">
            <h3>Account Information</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Account Created:</span>
                <span class="info-value">{{ accountInfo.createdDate }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Last Login:</span>
                <span class="info-value">{{ accountInfo.lastLogin }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Account Status:</span>
                <span class="info-value active">{{ accountInfo.status }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Student ID:</span>
                <span class="info-value">{{ accountInfo.studentId }}</span>
              </div>
            </div>
          </div>

          <div class="danger-zone">
            <h3>Danger Zone</h3>
            <div class="account-actions">
              <div class="action-item">
                <div class="action-info">
                  <strong>Export Account Data</strong>
                  <p>Download a copy of all your account data and activity.</p>
                </div>
                <button class="btn-action" @click="exportData">
                  <i class="fas fa-download"></i> Export Data
                </button>
              </div>
              <div class="action-item danger">
                <div class="action-info">
                  <strong>Delete Account</strong>
                  <p>Permanently delete your account and all associated data.</p>
                </div>
                <button class="btn-action danger" @click="confirmDeleteAccount">
                  <i class="fas fa-trash"></i> Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Notification Settings -->
        <div v-if="activeTab === 'notifications'" class="notification-settings">
          <div class="notification-section">
            <h3>Notification Preferences</h3>
            <p>Choose which notifications you want to receive.</p>

            <div class="notification-options">
              <div class="option-item">
                <div class="option-info">
                  <strong>Course Updates</strong>
                  <p>Get notified when new content is added to your courses.</p>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="notificationSettings.courseUpdates">
                  <span class="slider"></span>
                </label>
              </div>

              <div class="option-item">
                <div class="option-info">
                  <strong>Assignment Deadlines</strong>
                  <p>Receive reminders about upcoming assignment deadlines.</p>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="notificationSettings.assignmentDeadlines">
                  <span class="slider"></span>
                </label>
              </div>

              <div class="option-item">
                <div class="option-info">
                  <strong>Grade Updates</strong>
                  <p>Get notified when your grades are updated.</p>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="notificationSettings.gradeUpdates">
                  <span class="slider"></span>
                </label>
              </div>

              <div class="option-item">
                <div class="option-info">
                  <strong>Announcements</strong>
                  <p>Receive important announcements from instructors.</p>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="notificationSettings.announcements">
                  <span class="slider"></span>
                </label>
              </div>

              <div class="option-item">
                <div class="option-info">
                  <strong>Marketing Emails</strong>
                  <p>Receive promotional emails about new courses and features.</p>
                </div>
                <label class="switch">
                  <input type="checkbox" v-model="notificationSettings.marketing">
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="email-section">
            <h3>Email Notifications</h3>
            <div class="email-frequency">
              <label>Email Frequency:</label>
              <select v-model="notificationSettings.emailFrequency">
                <option value="immediate">Immediate</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Digest</option>
                <option value="never">Never</option>
              </select>
            </div>

            <div class="quiet-hours">
              <h4>Quiet Hours</h4>
              <p>Set hours when you don't want to receive notifications.</p>
              <div class="time-inputs">
                <div class="time-group">
                  <label>From:</label>
                  <input type="time" v-model="notificationSettings.quietHours.from">
                </div>
                <div class="time-group">
                  <label>To:</label>
                  <input type="time" v-model="notificationSettings.quietHours.to">
                </div>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-save" @click="saveNotificationSettings">
              <i class="fas fa-save"></i>
              Save Notification Settings
            </button>
          </div>
        </div>

        <!-- Security Settings -->
        <div v-if="activeTab === 'security'" class="security-settings">
          <div class="password-section">
            <h3>Change Password</h3>
            <form @submit.prevent="changePassword">
              <div class="form-group">
                <label>Current Password</label>
                <div class="password-input">
                  <input
                    :type="showCurrentPassword ? 'text' : 'password'"
                    v-model="password.current"
                    required
                  >
                  <button
                    type="button"
                    class="password-toggle"
                    @click="showCurrentPassword = !showCurrentPassword"
                  >
                    <i :class="showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
              </div>
              <div class="form-group">
                <label>New Password</label>
                <div class="password-input">
                  <input
                    :type="showNewPassword ? 'text' : 'password'"
                    v-model="password.new"
                    required
                  >
                  <button
                    type="button"
                    class="password-toggle"
                    @click="showNewPassword = !showNewPassword"
                  >
                    <i :class="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
                <div class="password-strength" v-if="password.new">
                  <div class="strength-bar">
                    <div
                      class="strength-fill"
                      :class="passwordStrength.class"
                      :style="{ width: passwordStrength.width }"
                    ></div>
                  </div>
                  <span class="strength-text">{{ passwordStrength.text }}</span>
                </div>
              </div>
              <div class="form-group">
                <label>Confirm New Password</label>
                <div class="password-input">
                  <input
                    :type="showConfirmPassword ? 'text' : 'password'"
                    v-model="password.confirm"
                    required
                  >
                  <button
                    type="button"
                    class="password-toggle"
                    @click="showConfirmPassword = !showConfirmPassword"
                  >
                    <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
                <small v-if="password.new && password.confirm && password.new !== password.confirm"
                       class="error-text">
                  Passwords do not match
                </small>
              </div>
              <button
                type="submit"
                class="btn-save"
                :disabled="!isPasswordValid || changingPassword"
              >
                <i class="fas fa-key" v-if="!changingPassword"></i>
                <i class="fas fa-spinner fa-spin" v-else></i>
                {{ changingPassword ? 'Updating...' : 'Update Password' }}
              </button>
            </form>
          </div>

          <div class="two-factor-section">
            <h3>Two-Factor Authentication</h3>
            <div class="two-factor-status">
              <div class="status-info">
                <div class="status-indicator" :class="{ 'enabled': twoFactorEnabled }">
                  <i :class="twoFactorEnabled ? 'fas fa-shield-alt' : 'fas fa-shield'"></i>
                </div>
                <div>
                  <strong>{{ twoFactorEnabled ? 'Enabled' : 'Disabled' }}</strong>
                  <p>{{ twoFactorEnabled ? 'Your account is protected with 2FA' : 'Add an extra layer of security' }}</p>
                </div>
              </div>
              <button
                class="btn-toggle-2fa"
                :class="{ 'danger': twoFactorEnabled }"
                @click="toggle2FA"
              >
                {{ twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA' }}
              </button>
            </div>
          </div>

          <div class="sessions-section">
            <h3>Active Sessions</h3>
            <p>Manage your active sessions across different devices.</p>
            <div class="session-list">
              <div class="session-item" v-for="session in activeSessions" :key="session.id">
                <div class="session-info">
                  <div class="device-icon">
                    <i :class="getDeviceIcon(session.device)"></i>
                  </div>
                  <div class="session-details">
                    <strong>{{ session.device }}</strong>
                    <div class="session-meta">
                      <span>{{ session.location }}</span>
                      <span>•</span>
                      <span>{{ session.lastActive }}</span>
                      <span v-if="session.current" class="current-badge">Current</span>
                    </div>
                  </div>
                </div>
                <button
                  class="btn-logout"
                  v-if="!session.current"
                  @click="logoutSession(session.id)"
                >
                  <i class="fas fa-sign-out-alt"></i>
                  Log Out
                </button>
              </div>
            </div>

            <div class="session-actions">
              <button class="btn-logout-all" @click="logoutAllSessions">
                <i class="fas fa-sign-out-alt"></i>
                Log Out All Other Sessions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Account Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>Delete Account</h3>
          <button class="modal-close" @click="showDeleteModal = false">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-content">
          <div class="warning-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>This action cannot be undone. This will permanently delete your account and remove all your data from our servers.</p>
          </div>
          <div class="form-group">
            <label>Type "DELETE" to confirm:</label>
            <input type="text" v-model="deleteConfirmation" placeholder="DELETE">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showDeleteModal = false">
            Cancel
          </button>
          <button
            class="btn-delete"
            :disabled="deleteConfirmation !== 'DELETE'"
            @click="deleteAccount"
          >
            <i class="fas fa-trash"></i>
            Delete Account
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

// Component state
const activeTab = ref('profile');
const saving = ref(false);
const changingPassword = ref(false);
const showDeleteModal = ref(false);
const deleteConfirmation = ref('');

// Password visibility toggles
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// File input ref
const fileInput = ref(null);

// Default avatar
const defaultAvatar = '/src/assets/default-avatar.png';

// User data
const user = ref({
  first_name: 'Student',
  last_name: 'User',
  email: 'student@dreamacademy.com',
  bio: 'Computer Science student passionate about web development',
  avatar: null
});

// Account information
const accountInfo = ref({
  createdDate: 'January 15, 2023',
  lastLogin: 'Today at 10:30 AM',
  status: 'Active',
  studentId: 'STU2023001'
});

// Notification settings
const notificationSettings = ref({
  courseUpdates: true,
  assignmentDeadlines: true,
  gradeUpdates: false,
  announcements: true,
  marketing: false,
  emailFrequency: 'daily',
  quietHours: {
    from: '22:00',
    to: '08:00'
  }
});

// Password data
const password = ref({
  current: '',
  new: '',
  confirm: ''
});

// Two-factor authentication
const twoFactorEnabled = ref(false);

// Active sessions
const activeSessions = ref([
  {
    id: 1,
    device: 'MacBook Pro',
    location: 'New York, USA',
    lastActive: 'Now',
    current: true
  },
  {
    id: 2,
    device: 'iPhone 13',
    location: 'New York, USA',
    lastActive: '2 hours ago',
    current: false
  },
  {
    id: 3,
    device: 'Windows PC',
    location: 'Brooklyn, USA',
    lastActive: '3 days ago',
    current: false
  }
]);

// Computed properties
const passwordStrength = computed(() => {
  const pwd = password.value.new;
  if (!pwd) return { width: '0%', class: '', text: '' };

  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  const strength = {
    0: { width: '20%', class: 'very-weak', text: 'Very Weak' },
    1: { width: '20%', class: 'very-weak', text: 'Very Weak' },
    2: { width: '40%', class: 'weak', text: 'Weak' },
    3: { width: '60%', class: 'fair', text: 'Fair' },
    4: { width: '80%', class: 'good', text: 'Good' },
    5: { width: '100%', class: 'strong', text: 'Strong' }
  };

  return strength[score] || strength[0];
});

const isPasswordValid = computed(() => {
  return password.value.current &&
         password.value.new &&
         password.value.confirm &&
         password.value.new === password.value.confirm &&
         password.value.new.length >= 8;
});

// Methods
const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (file && file.size <= 2 * 1024 * 1024) { // 2MB limit
    const reader = new FileReader();
    reader.onload = (e) => {
      user.value.avatar = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    alert('Please select an image file smaller than 2MB');
  }
};

const saveProfile = async () => {
  saving.value = true;
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Profile saved:', user.value);

    // Show success message
    alert('Profile updated successfully!');
  } catch (error) {
    console.error('Error saving profile:', error);
    alert('Error updating profile. Please try again.');
  } finally {
    saving.value = false;
  }
};

const changePassword = async () => {
  changingPassword.value = true;
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Password changed');

    // Clear password fields
    password.value = { current: '', new: '', confirm: '' };

    alert('Password updated successfully!');
  } catch (error) {
    console.error('Error changing password:', error);
    alert('Error updating password. Please try again.');
  } finally {
    changingPassword.value = false;
  }
};

const saveNotificationSettings = async () => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('Notification settings saved:', notificationSettings.value);
    alert('Notification settings updated successfully!');
  } catch (error) {
    console.error('Error saving notification settings:', error);
    alert('Error updating settings. Please try again.');
  }
};

const toggle2FA = () => {
  if (twoFactorEnabled.value) {
    if (confirm('Are you sure you want to disable two-factor authentication?')) {
      twoFactorEnabled.value = false;
      alert('Two-factor authentication disabled');
    }
  } else {
    // In a real app, this would open a setup modal
    alert('Two-factor authentication setup would open here');
    twoFactorEnabled.value = true;
  }
};

const getDeviceIcon = (device) => {
  if (device.toLowerCase().includes('iphone') || device.toLowerCase().includes('mobile')) {
    return 'fas fa-mobile-alt';
  } else if (device.toLowerCase().includes('mac')) {
    return 'fab fa-apple';
  } else if (device.toLowerCase().includes('windows')) {
    return 'fab fa-windows';
  } else {
    return 'fas fa-laptop';
  }
};

const logoutSession = (sessionId) => {
  if (confirm('Are you sure you want to log out this session?')) {
    const index = activeSessions.value.findIndex(s => s.id === sessionId);
    if (index > -1) {
      activeSessions.value.splice(index, 1);
      alert('Session logged out successfully');
    }
  }
};

const logoutAllSessions = () => {
  if (confirm('Are you sure you want to log out all other sessions?')) {
    activeSessions.value = activeSessions.value.filter(s => s.current);
    alert('All other sessions logged out successfully');
  }
};

const confirmDeleteAccount = () => {
  showDeleteModal.value = true;
  deleteConfirmation.value = '';
};

const deleteAccount = async () => {
  if (deleteConfirmation.value !== 'DELETE') return;

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real app, this would delete the account and log out
    alert('Account deletion would be processed here');
    showDeleteModal.value = false;
  } catch (error) {
    console.error('Error deleting account:', error);
    alert('Error deleting account. Please try again.');
  }
};

const exportData = async () => {
  try {
    // Simulate data export
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Data export would be processed and emailed to you');
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Error exporting data. Please try again.');
  }
};

// Initialize component
onMounted(() => {
  if (authStore.user) {
    user.value = { ...user.value, ...authStore.user };
  }
});
</script>

<style scoped>
.settings-view {
  margin: 0 auto;
}

.settings-header {
  margin-bottom: 2rem;
}

.settings-title {
  font-family: var(--font-heading);
  font-size: var(--fs-xl);
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.settings-subtitle {
  color: var(--secondary-color);
  font-size: var(--fs-base);
  margin: 0;
}

.settings-container {
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 4px var(--shadow-color);
  overflow: hidden;
}

.settings-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--gray-bg);
}

.tab {
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: var(--fs-sm);
  font-weight: 500;
  cursor: pointer;
  color: var(--secondary-color);
  transition: all 0.2s ease;
}

.tab:hover {
  background-color: rgba(8, 121, 144, 0.05);
  color: var(--primary-color);
}

.tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  background-color: var(--card-bg);
}

.settings-content {
  padding: 2rem;
}

/* Form Styles */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text-color);
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: var(--fs-sm);
  font-family: var(--font-body);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(8, 121, 144, 0.1);
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--gray-bg);
  border: 3px solid var(--border-color);
  flex-shrink: 0;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-upload {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: var(--fs-sm);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

.btn-upload:hover {
  background-color: #065e6f;
}

.file-info {
  color: var(--secondary-color);
  font-size: var(--fs-xs);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.btn-save {
  padding: 0.75rem 1.5rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: var(--fs-sm);
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

.btn-save:hover:not(:disabled) {
  background-color: #065e6f;
}

.btn-save:disabled {
  background-color: var(--secondary-color);
  cursor: not-allowed;
}

/* Account Settings */
.account-settings h3 {
  font-size: var(--fs-lg);
  color: var(--text-color);
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.account-info {
  margin-bottom: 3rem;
}

.info-grid {
  display: grid;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: var(--gray-bg);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.info-label {
  font-weight: 600;
  color: var(--secondary-color);
}

.info-value {
  color: var(--text-color);
  font-weight: 500;
}

.info-value.active {
  color: #28a745;
  background-color: rgba(40, 167, 69, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: var(--fs-xs);
}

.danger-zone {
  border-top: 1px solid var(--border-color);
  padding-top: 2rem;
}

.danger-zone h3 {
  color: var(--error-color);
  margin-bottom: 1rem;
}

.account-actions {
  display: grid;
  gap: 1rem;
}

.action-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--card-bg);
}

.action-item.danger {
  border-color: rgba(220, 53, 69, 0.2);
  background-color: rgba(220, 53, 69, 0.02);
}

.action-info strong {
  display: block;
  font-size: var(--fs-base);
  margin-bottom: 0.25rem;
}

.action-info p {
  margin: 0;
  color: var(--secondary-color);
  font-size: var(--fs-sm);
}

.btn-action {
  padding: 0.5rem 1rem;
  border: 1px solid var(--primary-color);
  background-color: transparent;
  color: var(--primary-color);
  border-radius: 6px;
  font-size: var(--fs-sm);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-action:hover {
  background-color: var(--primary-color);
  color: white;
}

.btn-action.danger {
  border-color: var(--error-color);
  color: var(--error-color);
}

.btn-action.danger:hover {
  background-color: var(--error-color);
  color: white;
}

/* Notification Settings */
.notification-section,
.email-section {
  margin-bottom: 2rem;
}

.notification-section h3,
.email-section h3 {
  font-size: var(--fs-lg);
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.notification-section p,
.email-section p {
  color: var(--secondary-color);
  margin: 0 0 1.5rem 0;
}

.notification-options {
  display: grid;
  gap: 1rem;
}

.option-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  background-color: var(--gray-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.option-info {
  flex: 1;
  margin-right: 1rem;
}

.option-info strong {
  display: block;
  font-size: var(--fs-base);
  margin-bottom: 0.25rem;
  color: var(--text-color);
}

.option-info p {
  margin: 0;
  color: var(--secondary-color);
  font-size: var(--fs-sm);
}

.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background-color: var(--primary-color);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.email-frequency {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.email-frequency label {
  font-weight: 600;
  color: var(--text-color);
}

.email-frequency select {
  width: auto;
  min-width: 150px;
}

.quiet-hours {
  background-color: var(--gray-bg);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.quiet-hours h4 {
  margin: 0 0 0.5rem 0;
  font-size: var(--fs-base);
  font-weight: 600;
  color: var(--text-color);
}

.quiet-hours p {
  margin: 0 0 1rem 0;
  color: var(--secondary-color);
  font-size: var(--fs-sm);
}

.time-inputs {
  display: flex;
  gap: 1rem;
}

.time-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-group label {
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--text-color);
}

.time-group input {
  width: 120px;
}

/* Security Settings */
.password-section,
.two-factor-section,
.sessions-section {
  margin-bottom: 3rem;
}

.password-section h3,
.two-factor-section h3,
.sessions-section h3 {
  font-size: var(--fs-lg);
  color: var(--text-color);
  margin: 0 0 1rem 0;
  font-weight: 600;
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--secondary-color);
  cursor: pointer;
  font-size: var(--fs-sm);
  padding: 0.25rem;
}

.password-toggle:hover {
  color: var(--primary-color);
}

.password-strength {
  margin-top: 0.5rem;
}

.strength-bar {
  height: 4px;
  background-color: #e9ecef;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.strength-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 2px;
}

.strength-fill.very-weak {
  background-color: #dc3545;
}

.strength-fill.weak {
  background-color: #fd7e14;
}

.strength-fill.fair {
  background-color: #ffc107;
}

.strength-fill.good {
  background-color: #20c997;
}

.strength-fill.strong {
  background-color: #28a745;
}

.strength-text {
  font-size: var(--fs-xs);
  color: var(--secondary-color);
  font-weight: 500;
}

.error-text {
  color: var(--error-color);
  font-size: var(--fs-xs);
  margin-top: 0.25rem;
  display: block;
}

.two-factor-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background-color: var(--gray-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.status-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.status-indicator {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  color: var(--secondary-color);
  font-size: 1.2rem;
}

.status-indicator.enabled {
  background-color: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.status-info strong {
  display: block;
  font-size: var(--fs-base);
  margin-bottom: 0.25rem;
}

.status-info p {
  margin: 0;
  color: var(--secondary-color);
  font-size: var(--fs-sm);
}

.btn-toggle-2fa {
  padding: 0.5rem 1rem;
  border: 1px solid var(--primary-color);
  background-color: transparent;
  color: var(--primary-color);
  border-radius: 6px;
  font-size: var(--fs-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.btn-toggle-2fa:hover {
  background-color: var(--primary-color);
  color: white;
}

.btn-toggle-2fa.danger {
  border-color: var(--error-color);
  color: var(--error-color);
}

.btn-toggle-2fa.danger:hover {
  background-color: var(--error-color);
  color: white;
}

.sessions-section p {
  color: var(--secondary-color);
  margin: 0 0 1.5rem 0;
}

.session-list {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: var(--gray-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.session-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.device-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(8, 121, 144, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  font-size: 1.1rem;
}

.session-details strong {
  display: block;
  font-size: var(--fs-base);
  margin-bottom: 0.25rem;
}

.session-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--fs-sm);
  color: var(--secondary-color);
}

.current-badge {
  background-color: rgba(40, 167, 69, 0.1);
  color: #28a745;
  padding: 0.125rem 0.5rem;
  border-radius: 10px;
  font-size: var(--fs-xs);
  font-weight: 600;
}

.btn-logout {
  padding: 0.4rem 0.8rem;
  background-color: rgba(220, 53, 69, 0.1);
  color: var(--error-color);
  border: 1px solid rgba(220, 53, 69, 0.2);
  border-radius: 6px;
  font-size: var(--fs-xs);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background-color: var(--error-color);
  color: white;
}

.session-actions {
  text-align: center;
}

.btn-logout-all {
  padding: 0.75rem 1.5rem;
  background-color: rgba(220, 53, 69, 0.1);
  color: var(--error-color);
  border: 1px solid rgba(220, 53, 69, 0.2);
  border-radius: 6px;
  font-size: var(--fs-sm);
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-logout-all:hover {
  background-color: var(--error-color);
  color: white;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal {
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  font-size: var(--fs-lg);
  font-weight: 600;
  color: var(--error-color);
}

.modal-close {
  background: none;
  border: none;
  color: var(--secondary-color);
  cursor: pointer;
  font-size: var(--fs-lg);
  padding: 0.25rem;
}

.modal-close:hover {
  color: var(--text-color);
}

.modal-content {
  padding: 1.5rem;
}

.warning-message {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: rgba(220, 53, 69, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(220, 53, 69, 0.2);
}

.warning-message i {
  color: var(--error-color);
  font-size: 1.2rem;
  margin-top: 0.1rem;
}

.warning-message p {
  margin: 0;
  color: var(--error-color);
  font-size: var(--fs-sm);
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  color: var(--secondary-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: var(--fs-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background-color: var(--gray-bg);
  color: var(--text-color);
}

.btn-delete {
  padding: 0.75rem 1.5rem;
  background-color: var(--error-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: var(--fs-sm);
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

.btn-delete:hover:not(:disabled) {
  background-color: #c82333;
}

.btn-delete:disabled {
  background-color: var(--secondary-color);
  cursor: not-allowed;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive Styles */
@media (max-width: 768px) {
  .settings-content {
    padding: 1rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .avatar-upload {
    flex-direction: column;
    align-items: flex-start;
    text-align: center;
  }

  .settings-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
  }

  .tab {
    white-space: nowrap;
    min-width: max-content;
  }

  .option-item,
  .action-item,
  .session-item,
  .two-factor-status {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .time-inputs {
    flex-direction: column;
  }

  .time-group input {
    width: 100%;
  }

  .modal {
    width: 95%;
    margin: 1rem;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-delete {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 576px) {
  .settings-header {
    text-align: center;
  }

  .settings-tabs {
    border-bottom: none;
    background-color: transparent;
    gap: 0.25rem;
    padding: 0.5rem;
  }

  .tab {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: var(--fs-xs);
  }

  .tab.active {
    border-color: var(--primary-color);
    background-color: rgba(8, 121, 144, 0.1);
  }
}
</style>