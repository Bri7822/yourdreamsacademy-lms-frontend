<template>
  <div class="user-management">
    <div class="header-section">
      <h3 class="section-title text-start">User Management</h3>
      <div class="section-description mb-4">
        Manage all users, including students, teachers, and administrators.
      </div>

      <div class="controls">
        <div class="search-filter">
          <div class="input-group">
            <span class="input-icon">
              <i class="fas fa-search"></i>
            </span>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search users..."
              class="search-input"
              @input="debouncedSearch"
            >
          </div>

          <select v-model="filterType" class="filter-select" @change="filterUsers">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>

          <select v-model="filterStatus" class="filter-select" @change="filterUsers">
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <select v-model="sortOption" class="filter-select" @change="sortUsers">
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="date_asc">Date Joined (Oldest)</option>
            <option value="date_desc">Date Joined (Recent)</option>
          </select>
        </div>

        <button
          @click="toggleUserForm"
          class="add-user-btn btn-click-animation"
          :class="{ 'active': showUserForm }"
        >
          <i class="fas fa-plus"></i>
          {{ showUserForm ? 'Close' : 'Add User' }}
        </button>
      </div>
    </div>

    <Transition name="slide-fade">
      <div v-if="showUserForm" class="user-form-container">
        <form @submit.prevent="handleSubmit" class="user-form">
          <div class="form-header">
            <h4>{{ isEditing ? 'Edit User' : 'Add New User' }}</h4>
            <p v-if="isEditing">Update user information below.</p>
            <p v-else>Create a new user account.</p>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name</label>
              <input
                id="firstName"
                v-model="formData.first_name"
                required
                :class="{ 'error': formErrors.first_name }"
              >
              <span class="error-message" v-if="formErrors.first_name">
                {{ formErrors.first_name }}
              </span>
            </div>
            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input
                id="lastName"
                v-model="formData.last_name"
                required
                :class="{ 'error': formErrors.last_name }"
              >
              <span class="error-message" v-if="formErrors.last_name">
                {{ formErrors.last_name }}
              </span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                required
                :class="{ 'error': formErrors.email }"
              >
              <span class="error-message" v-if="formErrors.email">
                {{ formErrors.email }}
              </span>
            </div>
            <div class="form-group">
              <label for="userType">User Type</label>
              <select
                id="userType"
                v-model="formData.user_type"
                required
                :class="{ 'error': formErrors.user_type }"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
              <span class="error-message" v-if="formErrors.user_type">
                {{ formErrors.user_type }}
              </span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="password">
                {{ isEditing ? 'Password (leave blank to keep current)' : 'Password' }}
              </label>
              <div class="password-field">
                <input
                  id="password"
                  v-model="formData.password"
                  :type="showPassword ? 'text' : 'password'"
                  :required="!isEditing"
                  :class="{ 'error': formErrors.password }"
                >
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="password-toggle"
                >
                  <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
              <span class="error-message" v-if="formErrors.password">
                {{ formErrors.password }}
              </span>
            </div>
            <div class="form-group">
              <label>Status</label>
              <div class="status-toggle">
                <label :class="{ 'active': formData.is_active }">
                  <input
                    type="checkbox"
                    v-model="formData.is_active"
                    hidden
                  >
                  <span class="toggle-switch"></span>
                  {{ formData.is_active ? 'Active' : 'Inactive' }}
                </label>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button
              type="button"
              @click="cancelEdit"
              class="cancel-btn btn-click-animation"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="submit-btn btn-click-animation"
              :disabled="formSubmitting"
            >
              <i class="fas fa-spinner fa-spin" v-if="formSubmitting"></i>
              {{ isEditing ? 'Update User' : 'Create User' }}
            </button>
          </div>
        </form>
      </div>
    </Transition>

    <div class="user-list-container">
      <div class="bulk-actions" v-if="selectedUsers.length > 0">
        <select v-model="bulkAction" class="bulk-select">
          <option value="">Bulk Actions</option>
          <option value="activate">Activate</option>
          <option value="deactivate">Deactivate</option>
          <option value="delete">Delete</option>
        </select>
        <button
          @click="applyBulkAction"
          class="apply-bulk-btn btn-click-animation"
          :disabled="!bulkAction"
        >
          Apply
        </button>
        <span class="selected-count">{{ selectedUsers.length }} users selected</span>
      </div>

      <div v-if="users.length === 0 && !loading" class="no-users">
        <i class="fas fa-users"></i>
        <p>No users found. Adjust your search filters or add a new user.</p>
      </div>

      <!-- Responsive table container -->
      <div class="table-responsive">
        <table class="user-table">
          <thead>
            <tr>
              <th class="select-column">
                <label class="user-checkbox">
                  <input
                    type="checkbox"
                    v-model="selectAll"
                    @change="toggleSelectAll"
                  >
                  <span class="checkmark"></span>
                </label>
              </th>
              <th class="user-column">
                User
              </th>
              <th class="role-column">
                Email
              </th>
              <th class="role-column">
                Role
              </th>
              <th class="status-column">
                Status
              </th>
              <th class="date-column">
                Joined
              </th>
              <th class="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in displayedUsers"
              :key="user.id"
              :class="{
                'inactive': !user.is_active,
                'selected': selectedUsers.includes(user.id)
              }"
            >
              <td class="select-column">
                <label class="user-checkbox">
                  <input
                    type="checkbox"
                    v-model="selectedUsers"
                    :value="user.id"
                    @click.stop
                  >
                  <span class="checkmark"></span>
                </label>
              </td>
              <td class="user-column">
                <div class="user-info">
                  <div class="avatar">
                    {{ getUserInitials(user) }}
                  </div>
                  <div class="details">
                    <h3 class="user-name">{{ user.first_name }} {{ user.last_name }}</h3>
                  </div>
                </div>
              </td>
              <td class="user-column">
                <div class="user-info">
                  <div class="details">
                    <p class="user-email">{{ user.email }}</p>
                  </div>
                </div>
              </td>
              <td class="role-column">
                <span class="user-role" :class="user.profile.user_type">
                  {{ user.profile.user_type }}
                </span>
              </td>
              <td class="status-column">
                <span class="user-status" :class="{ 'active': user.is_active }">
                  {{ user.is_active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="date-column date-col">
                {{ formatDate(user.date_joined) }}
              </td>
              <td class="actions-column">
                <div class="user-actions">
                  <button
                    @click="editUser(user)"
                    class="action-btn edit-btn"
                    title="Edit user"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button
                    @click="toggleUserStatus(user)"
                    class="action-btn status-btn"
                    :title="user.is_active ? 'Deactivate user' : 'Activate user'"
                  >
                    <i :class="user.is_active ? 'fas fa-toggle-on' : 'fas fa-toggle-off'"></i>
                  </button>
                  <button
                    @click="confirmDeleteUser(user)"
                    class="action-btn delete-btn"
                    title="Delete user"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" v-if="totalPages > 1">
        <button
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="page-btn"
        >
          <i class="fas fa-chevron-left"></i>
        </button>

        <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>

        <button
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>

      <div v-if="loading" class="loading-overlay">
        <div class="loader">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Loading users...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../../stores/auth';
import { useToast } from "vue-toastification";
import { debounce } from 'lodash';

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast();

// State variables
const users = ref([])
const loading = ref(false)
const formSubmitting = ref(false)
const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')
const showUserForm = ref(false)
const isEditing = ref(false)
const selectedUsers = ref([])
const bulkAction = ref('')
const showPassword = ref(false)
const userToDelete = ref(null)
const formErrors = ref({})
const selectAll = ref(false)
const sortField = ref('date')
const sortDirection = ref('desc')
const sortOption = ref('date_desc') // Default sort option

// Pagination
const itemsPerPage = 10
const currentPage = ref(1)
const totalUsers = ref(0)

// Form data
const formData = ref({
  id: null,
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  user_type: 'student',
  is_active: true
})

// Fetch users only if authenticated
onMounted(async () => {
  if (authStore.isAuthenticated) {
    await fetchUsers();
  } else {
    router.push('/login');
  }
});

// Watch for filter changes to reset pagination
watch([searchQuery, filterType, filterStatus], () => {
  currentPage.value = 1
})

// Computed properties
const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage))

const filteredUsers = computed(() => {
  return users.value.filter(user => {
    const matchesSearch = !searchQuery.value || [user.first_name, user.last_name, user.email]
      .some(field => field.toLowerCase().includes(searchQuery.value.toLowerCase()))

    const matchesType = !filterType.value ||
      user.profile.user_type === filterType.value

    const matchesStatus = filterStatus.value === '' ?
      true : user.is_active.toString() === filterStatus.value

    return matchesSearch && matchesType && matchesStatus
  })
})

const sortedUsers = computed(() => {
  return [...filteredUsers.value].sort((a, b) => {
    let comparison = 0;

    switch (sortField.value) {
      case 'name':
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        comparison = nameA.localeCompare(nameB);
        break;
      case 'role':
        comparison = a.profile.user_type.localeCompare(b.profile.user_type);
        break;
      case 'status':
        comparison = (a.is_active === b.is_active) ? 0 : a.is_active ? -1 : 1;
        break;
      case 'date':
        const dateA = new Date(a.date_joined || 0);
        const dateB = new Date(b.date_joined || 0);
        comparison = dateA - dateB;
        break;
    }

    return sortDirection.value === 'asc' ? comparison : -comparison;
  });
});

const displayedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return sortedUsers.value.slice(start, end)
})

// Methods
const getUserInitials = (user) => {
  if (!user.first_name || !user.last_name) return '??'
  return `${user.first_name[0]}${user.last_name[0]}`
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const debouncedSearch = debounce(() => {
  filterUsers()
}, 300)

const filterUsers = () => {
  currentPage.value = 1
}

const sortUsers = () => {
  // Handle sort options from the dropdown
  const [field, direction] = sortOption.value.split('_');
  sortField.value = field;
  sortDirection.value = direction;
}

const sortBy = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortField.value = field;
    sortDirection.value = 'asc';
  }

  // Update the sortOption to match the current field and direction
  sortOption.value = `${sortField.value}_${sortDirection.value}`;
}

const toggleUserForm = () => {
  showUserForm.value = !showUserForm.value
  if (!showUserForm.value) {
    resetForm()
  }
}

const resetForm = () => {
  formData.value = {
    id: null,
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    user_type: 'student',
    is_active: true
  }
  formErrors.value = {}
  isEditing.value = false
}

const editUser = (user) => {
  formData.value = {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    password: '', // Don't populate password for security
    user_type: user.profile.user_type,
    is_active: user.is_active
  }
  isEditing.value = true
  showUserForm.value = true
  formErrors.value = {}

  // Scroll to form
  setTimeout(() => {
    document.querySelector('.user-form-container').scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }, 100)
}

const cancelEdit = () => {
  resetForm()
  showUserForm.value = false
}

const validateForm = () => {
  const errors = {}

  if (!formData.value.first_name.trim()) {
    errors.first_name = 'First name is required'
  }

  if (!formData.value.last_name.trim()) {
    errors.last_name = 'Last name is required'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!formData.value.email.trim() || !emailRegex.test(formData.value.email)) {
    errors.email = 'Valid email is required'
  }

  if (!isEditing.value && !formData.value.password.trim()) {
    errors.password = 'Password is required for new users'
  } else if (formData.value.password && formData.value.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  }

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

const handleSubmit = async () => {
  if (!validateForm()) return;

  formSubmitting.value = true;

  try {
    const userData = {
      first_name: formData.value.first_name,
      last_name: formData.value.last_name,
      email: formData.value.email,
      is_active: formData.value.is_active,
      password: formData.value.password || undefined,
      profile: {
        user_type: formData.value.user_type
      }
    };

    const response = isEditing.value
      ? await axios.put(`/api/admin/users/${formData.value.id}/`, userData)
      : await axios.post('/api/admin/users/', userData);

    toast.success(`User ${isEditing.value ? 'updated' : 'created'} successfully`);
    await fetchUsers();
    cancelEdit();
  } catch (error) {
    console.error('Error saving user:', error);

    if (error.response) {
      if (error.response.status === 400) {
        // Handle validation errors
        formErrors.value = flattenValidationErrors(error.response.data);
        toast.error('Please fix the form errors');
      } else {
        // Handle other errors
        toast.error(error.response.data.detail || 'An error occurred');
      }
    } else {
      toast.error('Network error occurred. Please check your connection.');
    }
  } finally {
    formSubmitting.value = false;
  }
};

const flattenValidationErrors = (errors) => {
  const flattened = {};
  for (const [key, value] of Object.entries(errors)) {
    if (Array.isArray(value)) {
      flattened[key] = value.join(' ');
    } else if (typeof value === 'object') {
      // Handle nested errors (like profile.user_type)
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        flattened[`${key}_${nestedKey}`] = Array.isArray(nestedValue)
          ? nestedValue.join(' ')
          : nestedValue;
      }
    }
  }
  return flattened;
};

const toggleUserStatus = async (user) => {
  try {
    await axios.patch(`/api/admin/users/${user.id}/`,
      { is_active: !user.is_active },
      { headers: { Authorization: `Bearer ${authStore.accessToken}` } }
    )

    await fetchUsers()
    toast.success(`User ${!user.is_active ? 'activated' : 'deactivated'} successfully`)
  } catch (error) {
    console.error('Error updating user status:', error)
    toast.error('Failed to update user status')
  }
}

const confirmDeleteUser = (user) => {
  if (confirm(`Are you sure you want to permanently delete ${user.first_name} ${user.last_name}? This action cannot be undone.`)) {
    deleteUser(user.id)
  }
}

const deleteUser = async (userId) => {
  try {
    await axios.delete(`/api/admin/users/${userId}/`, {
      headers: { Authorization: `Bearer ${authStore.accessToken}` }
    })

    await fetchUsers()
    toast.success('User deleted successfully')
  } catch (error) {
    console.error('Error deleting user:', error)
    toast.error('Failed to delete user')
  }
}

const applyBulkAction = async () => {
  if (!bulkAction.value || selectedUsers.value.length === 0) return

  if (bulkAction.value === 'delete' && !confirm(`Are you sure you want to delete ${selectedUsers.value.length} users?`)) {
    return
  }

  try {
    loading.value = true
    await axios.post('/api/admin/users/bulk_actions/', {
      action: bulkAction.value,
      user_ids: selectedUsers.value
    }, {
      headers: { Authorization: `Bearer ${authStore.accessToken}` }
    })

    await fetchUsers()
    selectedUsers.value = []
    bulkAction.value = ''

    toast.success(`Bulk action '${bulkAction.value}' completed successfully`)
  } catch (error) {
    console.error('Bulk action failed:', error)
    toast.error('Bulk action failed. Please try again.')
  } finally {
    loading.value = false
  }
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedUsers.value = displayedUsers.value.map(user => user.id);
  } else {
    selectedUsers.value = [];
  }
}

watch(selectedUsers, (newVal) => {
  selectAll.value = newVal.length === displayedUsers.value.length && displayedUsers.value.length > 0;
}, { deep: true });

const fetchUsers = async () => {
  try {
    loading.value = true;
    const response = await axios.get('/api/admin/users/');

    // Ensure we're getting an array
    if (Array.isArray(response.data)) {
      users.value = response.data;
    } else {
      console.error('Unexpected response format:', response.data);
      users.value = [];
    }

    totalUsers.value = users.value.length;
  } catch (error) {
    console.error('Error fetching users:', error);
    toast.error('Failed to load users');
    users.value = [];
  } finally {
    loading.value = false;
  }
};

const changePage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page

  // Scroll to top of user list
  document.querySelector('.table-responsive').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  })
}
</script>

<style scoped>
.user-management {
  /* padding: 1rem; */
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 2rem;
}

.section-title {
    font-family: var(--font-heading);
    font-size: var(--fs-lg) !important;
    color: var(--text-color);
    margin: 0 0 14.4px 0;
    font-weight: 600;
    position: relative;
    padding-bottom: 9px;
}


.section-description {
  color: var(--text-secondary, #6c757d);
  margin-bottom: 1.5rem;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .controls {
    flex-direction: row;
    align-items: flex-start;
  }
}

.search-filter {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

@media (min-width: 768px) {
  .search-filter {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
  }
}

.input-group {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.input-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #adb5bd;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 2rem;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  font-size: 0.9rem;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid var(--primary-color, #dee2e6);
  border-radius: 4px;
  background: white;
  font-size: 0.9rem;
}

.add-user-btn {
  background: var(--primary-color, #087990);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  white-space: nowrap;
}

.add-user-btn:hover {
  background: #065e6f;
}

.add-user-btn.active {
  background: #dc3545;
}

.add-user-btn.active:hover {
  background: #bb2d3b;
}

/* Form styles */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.user-form-container {
  margin-bottom: 2rem;
  background: var(--card-bg, white);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid var(--border-color, #dee2e6);
}

.form-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color, #dee2e6);
  background: #f8f9fa;
}

.form-header h4 {
  font-size: 1.2rem;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.form-header p {
  color: #6c757d;
  font-size: 0.9rem;
}

.user-form {
  padding: 1.5rem;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .form-row {
    flex-direction: row;
  }
}

@media (max-width: 768px){
  .submit-btn.btn-click-animation {
  align-items: center !important;
  }
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--text-color, #333);
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  padding: 0.5rem;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  width: 100%;
  font-size: 0.95rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color, #087990);
  box-shadow: 0 0 0 2px rgba(8, 121, 144, 0.2);
}

.form-group input.error,
.form-group select.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
}

.user-management {
  /* padding: 1rem; */
  max-width: 100%;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 2rem;
}

.section-description {
  color: var(--text-secondary, #6c757d);
  margin-bottom: 1.5rem;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .controls {
    flex-direction: row;
    align-items: flex-start;
  }
}

.search-filter {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

@media (min-width: 768px) {
  .search-filter {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
  }
}

.input-group {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.input-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #adb5bd;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.5rem 0.5rem 2rem;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  font-size: 0.9rem;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  background: white;
  font-size: 0.9rem;
}

.add-user-btn {
  background: var(--primary-color, #087990);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  white-space: nowrap;
}

.add-user-btn:hover {
  background: #065e6f;
}

.add-user-btn.active {
  background: #dc3545;
}

.add-user-btn.active:hover {
  background: #bb2d3b;
}

/* Form styles */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.user-form-container {
  margin-bottom: 2rem;
  background: var(--card-bg, white);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid var(--border-color, #dee2e6);
}

.form-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color, #dee2e6);
  background: #f8f9fa;
}

.form-header h4 {
  font-size: 1.2rem;
  margin-bottom: 0.25rem;
  font-weight: 600;
}

.form-header p {
  color: #6c757d;
  font-size: 0.9rem;
}

.user-form {
  padding: 1.5rem;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .form-row {
    flex-direction: row;
  }
}

.form-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--text-color, #333);
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  padding: 0.5rem;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  width: 100%;
  font-size: 0.95rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color, #087990);
  box-shadow: 0 0 0 2px rgba(8, 121, 144, 0.2);
}

.form-group input.error,
.form-group select.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.8rem;
}

.password-field {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
}

.status-toggle label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  background: #ddd;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  left: 2px;
  top: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.status-toggle .active .toggle-switch {
  background: #28a745;
}

.status-toggle .active .toggle-switch::after {
  transform: translateX(24px);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
}

.submit-btn {
  background: var(--primary-color, #087990);
  color: white;
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  background: #065e6f;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.cancel-btn {
  background: #6c757d;
  color: white;
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.cancel-btn:hover {
  background: #5a6268;
}

/* User list container */
.user-list-container {
  position: relative;
  background: var(--card-bg, white);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color, #dee2e6);
  padding: 1.5rem;
  min-height: 300px;
}

/* Bulk actions */
.bulk-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.bulk-select {
  padding: 0.5rem;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  min-width: 150px;
}

.apply-bulk-btn {
  background: var(--primary-color, #087990);
  color: white;
  border: none;
  padding: 0.4rem 1rem;
  border-radius: 4px;
  cursor: pointer;
}

.apply-bulk-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.selected-count {
  margin-left: auto;
  font-size: 0.9rem;
  color: #6c757d;
  font-weight: 500;
}

/* No users message */
.no-users {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 0;
  color: #6c757d;
}

.no-users i {
  font-size: 3rem;
  opacity: 0.5;
}

.no-users p {
  font-size: 1rem;
}

/* Table styles */
.table-responsive {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-bottom: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, #dee2e6);
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.user-table th {
  /* text-align: left; */
  padding: 1rem .6rem;
  background: #f8f9fa;
  font-weight: 600;
  color: #495057;
  border-bottom: 2px solid #e9ecef;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s;
}

.user-table th:hover {
  background-color: #e9ecef;
}

.user-table td {
  /* padding: 0.2rem .3rem; */
  border-bottom: 1px solid #e9ecef;
  vertical-align: middle;
}

.user-table tr:last-child td {
  border-bottom: none;
}

.user-table tr:hover {
  background-color: #f8f9fa;
}

.user-table tr.inactive {
  opacity: 0.7 !important;
  background-color: #f8f9fa !important;
}

.user-table tr.selected {
  background-color: rgba(8, 121, 144, 0.1);
}

.user-table tbody tr {
  animation: fadeInUp 0.5s ease forwards;
  opacity: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.user-table tbody tr:nth-child(1) { animation-delay: 0.05s; }
.user-table tbody tr:nth-child(2) { animation-delay: 0.1s; }
.user-table tbody tr:nth-child(3) { animation-delay: 0.15s; }
.user-table tbody tr:nth-child(4) { animation-delay: 0.2s; }
.user-table tbody tr:nth-child(5) { animation-delay: 0.25s; }
.user-table tbody tr:nth-child(6) { animation-delay: 0.3s; }
.user-table tbody tr:nth-child(7) { animation-delay: 0.35s; }
.user-table tbody tr:nth-child(8) { animation-delay: 0.4s; }
.user-table tbody tr:nth-child(9) { animation-delay: 0.45s; }
.user-table tbody tr:nth-child(10) { animation-delay: 0.5s; }

/* Column specific styles */
.select-column {
  width: 40px;
  text-align: center;
}

.user-column {
  min-width: 170px;
}

.role-column, .status-column {
  min-width: 110px;
}

.date-column {
  min-width: 140px;
}

.date-col {
  font-size: .75rem;
}

.price-col {
  font-size: .75rem;
}

.actions-column {
  min-width: 80px;
  text-align: right;
}

/* User info in table */
.user-info {
  display: flex;
  align-items: center;
  gap: .3rem;
}

.avatar {
  width: 20px;
  height: 20px;
  background: var(--primary-color, #087990);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.6rem;
  flex-shrink: 0;
}

.details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: .7rem;
  font-weight: 600;
  margin-bottom: 0.1rem;
  color: var(--text-color, #333);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.7rem;
  margin-top:1rem;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* User role and status badges */
.user-role {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
  text-transform: capitalize;
  display: inline-block;
}

.user-role.admin {
  background: #e2f0fc;
  color: #0c63e4;
}

.user-role.teacher {
  background: #e2f8e7;
  color: #28a745;
}

.user-role.student {
  background: #fff3e0;
  color: #fd7e14;
}

.user-status {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  background-color: #e9ecef;
  color: #495057;
  display: inline-block;
}

.user-status.active {
   background: #d1e7dd;
   color: #146c43;
}

.user-status:not(.active) {
  background: #f8d7da;
  color: #b02a37;
}

/* User actions in table */
.user-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  padding: 0.3rem;
  border-radius: 4px;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size:.8rem;
}

.edit-btn {
  color: #6c757d;
}

.edit-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.status-btn {
  color: #6c757d;
}

.status-btn:hover {
  background: #e9ecef;
  color: #28a745;
}

.delete-btn {
  color: #6c757d;
}

.delete-btn:hover {
  background: #e9ecef;
  color: #dc3545;
}

/* Checkbox styles */
.user-checkbox {
  position: relative;
  display: inline-block;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.user-checkbox input {
  opacity: 0;
  position: absolute;
  width: 0;
  height: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: #eee;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.user-checkbox:hover .checkmark {
  background-color: #ddd;
}

.user-checkbox input:checked ~ .checkmark {
  background-color: var(--primary-color, #087990);
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.user-checkbox input:checked ~ .checkmark:after {
  display: block;
  left: 7px;
  top: 3px;
  width: 6px;
  height: 12px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 1.5rem;
  gap: 1rem;
}

.page-btn {
  background: white;
  border: 1px solid var(--border-color, #dee2e6);
  border-radius: 4px;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #ced4da;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9rem;
  color: #6c757d;
}

/* Loading overlay */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
  z-index: 10;
}

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loader i {
  font-size: 2rem;
  color: var(--primary-color, #087990);
}

/* Table row animations */
.table-row-move,
.table-row-enter-active,
.table-row-leave-active {
  transition: all 0.5s ease;
}

.table-row-enter-from,
.table-row-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.table-row-leave-active {
  position: absolute;
}

/* Click animation for buttons */
.btn-click-animation {
  position: relative;
  overflow: hidden;
}

.btn-click-animation::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%, -50%);
  transform-origin: 50% 50%;
}

.btn-click-animation:active::after {
  animation: ripple 0.4s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  20% {
    transform: scale(25, 25);
    opacity: 0.5;
  }
  100% {
    opacity: 0;
    transform: scale(40, 40);
  }
}

/* Dark mode styles */
@media (prefers-color-scheme: dark) {
  :root {
    --text-color: #e9ecef;
    --text-secondary: #adb5bd;
    --card-bg: #1e1e1e;
    --border-color: #444;
    --primary-color: #0dcaf0;
  }

  .user-management {
    color: var(--text-color);
  }

  .search-input,
  .filter-select,
  .form-group input,
  .form-group select,
  .bulk-select {
    background: #252525;
    color: var(--text-color);
    border-color: var(--primary-color) !important;
  }

  .search-input::placeholder {
    color: #6c757d;
  }

  .form-header,
  .bulk-actions {
    background: #252525;
  }

  .user-form-container {
    background: var(--card-bg);
  }

  .user-table {
    background: #1e1e1e;
    color: #e9ecef;
  }

  .user-table th {
    background: #252525;
    color: #e9ecef;
    border-bottom-color: #333;
  }

  .user-table th:hover {
    background-color: #333;
  }

  .user-table td {
    border-bottom-color: #333;
  }

  .user-table tr:hover {
    background-color: #252525;
  }

  .user-table tr.inactive {
    background-color: #252525;
    opacity: 0.7;
  }

  .user-table tr.selected {
    background-color: rgba(13, 202, 240, 0.2);
  }

  .user-status {
    background-color: #333;
    color: #e9ecef;
  }

  .action-btn {
    color: #adb5bd;
  }

  .action-btn:hover {
    background: #333;
  }

  .page-btn {
    background: #252525;
    border-color: #444;
    color: #e9ecef;
  }

  .page-btn:hover:not(:disabled) {
    background: #333;
    border-color: #555;
  }

  .loading-overlay {
    background: rgba(0, 0, 0, 0.7);
  }

  .checkmark {
    background-color: #444;
  }

  .user-checkbox:hover .checkmark {
    background-color: #555;
  }

  .status-toggle .toggle-switch {
    background: #444;
  }

  .add-user-btn {
    background: var(--primary-color);
    color: #000;
  }

  .add-user-btn:hover {
    background: #0bb5d9;
  }

  .submit-btn {
    background: var(--primary-color);
    color: #000;
  }

  .submit-btn:hover:not(:disabled) {
    background: #0bb5d9;
  }
}

/* Animation for success/error states */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

.shake-animation {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

/* Tooltip styles */
.tooltip {
  position: relative;
}

.tooltip:hover::before {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 4px;
  font-size: 0.8rem;
  white-space: nowrap;
  z-index: 100;
  margin-bottom: 5px;
}

.tooltip:hover::after {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.8);
  margin-bottom: -5px;
}

/* Additional responsive adjustments */
@media (max-width: 576px) {
  .form-actions {
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-actions button {
    width: 100%;
  }

  .pagination {
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* Print styles */
@media print {
  .controls,
  .form-actions,
  .user-form-container,
  .bulk-actions,
  .pagination,
  .action-btn {
    display: none !important;
  }

  .user-management {
    padding: 0;
  }

  .user-table th,
  .user-table td {
    padding: 0.5rem;
  }

  .user-list-container {
    box-shadow: none;
    border: none;
    padding: 0;
  }

  .table-responsive {
    border: none;
  }
}

/* Update these styles in your existing CSS */
.bulk-select:focus,
.search-input:focus,
.filter-select:focus {
  border-color: var(--primary-color, #087990);
  outline: none;
  box-shadow: 0 0 0 2px rgba(8, 121, 144, 0.2);
}

/* For dark mode compatibility */
@media (prefers-color-scheme: dark) {
  .search-input:focus,
  .filter-select:focus
  .bulk-actions:focus {
    border-color: var(--primary-color, #0dcaf0);
    box-shadow: 0 0 0 2px rgba(13, 202, 240, 0.3);
  }
}

/* Optional: Add transition for smooth effect */
.search-input,
.filter-select {
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

/* Mobile devices (≤ 575px) */
@media (max-width: 575px) {
  .bulk-actions {
    flex-wrap: wrap;
    gap: 0.5rem;                /* reduce gap for mobile */
  }

  .bulk-actions select,
  .bulk-actions button {
    flex: 1 1 auto;             /* allow them to share the top row */
    min-width: 0;               /* prevent overflow with long text */
  }

  .bulk-actions .selected-count {
    flex: 0 0 100%;             /* force onto its own line */
    text-align: left;           /* align with left edge (optional) */
    margin-top: 0.25rem;        /* small spacing from above */
    font-size: 0.9rem;          /* optional: adjust font size */
  }
}
</style>