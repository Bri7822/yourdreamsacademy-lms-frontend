import axios from 'axios';

// Base API URL - adjust to match your Django backend
const API_URL = '/api/admin_dashboard';

// Configure axios with authentication headers
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const userService = {
  /**
   * Get all users with optional filtering
   * @param {Object} filters - Filters to apply (userType, status, etc.)
   */
  async getUsers(filters = {}) {
    // Convert filters to query params
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await apiClient.get(`/users/?${params.toString()}`);
    return response.data;
  },

  /**
   * Get user by ID
   * @param {number} id - User ID
   */
  async getUserById(id) {
    const response = await apiClient.get(`/users/${id}/`);
    return response.data;
  },

  /**
   * Create new user
   * @param {Object} userData - User data
   */
  async createUser(userData) {
    const response = await apiClient.post('/users/', userData);
    return response.data;
  },

  /**
   * Update existing user
   * @param {Object} userData - User data with ID
   */
  async updateUser(userData) {
    const response = await apiClient.put(`/users/${userData.id}/`, userData);
    return response.data;
  },

  /**
   * Delete user
   * @param {number} id - User ID
   */
  async deleteUser(id) {
    const response = await apiClient.delete(`/users/${id}/`);
    return response.data;
  },

  /**
   * Change user password
   * @param {number} id - User ID
   * @param {Object} passwordData - Object with old_password and new_password keys
   */
  async changePassword(id, passwordData) {
    const response = await apiClient.post(`/users/${id}/change-password/`, passwordData);
    return response.data;
  },

  /**
   * Get user statistics for dashboard
   */
  async getUserStats() {
    const response = await apiClient.get('/users/stats/');
    return response.data;
  },

  /**
   * Export users as CSV
   * @param {Object} filters - Filters to apply (userType, status, etc.)
   */
  async exportUsers(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await apiClient.get(`/users/export/?${params.toString()}`, {
      responseType: 'blob', // Important for file downloads
    });

    // Create download link and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'users.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export default userService;