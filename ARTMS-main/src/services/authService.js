import api from './api';

const authService = {
  /**
   * Login — returns { token, user }
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;

    // Persist token and user info
    localStorage.setItem('artms_token', token);
    localStorage.setItem('artms_user', JSON.stringify(user));

    return { token, user };
  },

  /**
   * Logout — clears token and storage
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('artms_token');
      localStorage.removeItem('artms_user');
    }
  },

  /**
   * Get the current authenticated user from the API
   */
  me: async () => {
    const response = await api.get('/me');
    return response.data.user;
  },

  /**
   * Send OTP to email for password reset
   */
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Verify OTP code
   */
  verifyOtp: async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  /**
   * Reset password with OTP
   */
  resetPassword: async (email, otp, password, password_confirmation) => {
    const response = await api.post('/auth/reset-password', {
      email,
      otp,
      password,
      password_confirmation,
    });
    return response.data;
  },

  /**
   * Change password (authenticated)
   */
  changePassword: async (current_password, password, password_confirmation) => {
    const response = await api.post('/auth/change-password', {
      current_password,
      password,
      password_confirmation,
    });
    return response.data;
  },

  /**
   * Get stored user from localStorage (no API call)
   */
  getStoredUser: () => {
    try {
      const raw = localStorage.getItem('artms_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Check if a token exists in storage
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('artms_token');
  },

  /**
   * Get the stored role
   */
  getRole: () => {
    const user = authService.getStoredUser();
    return user?.role || null;
  },

  /**
   * Get the home path for a given role
   */
  getRolePath: (role) => {
    const paths = {
      super_admin:     '/superadmin/dashboard',
      hr_admin:        '/admin/dashboard',
      coo:             '/admin/dashboard',
      department_head: '/department-head/dashboard',
      employee:        '/admin/dashboard',
    };
    return paths[role] || '/login';
  },
};

export default authService;
