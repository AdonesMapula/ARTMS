import api from './api';

const authService = {
  /**
   * Login — returns { token, user } if direct login (Super Admin)
   * or { requires_otp: true, verification_id, email_hint, ... } if non-super-admin
   */
  login: async (email, password) => {
    const cleanEmail = typeof email === 'string' ? email.trim() : email;
    const cleanPassword = typeof password === 'string' ? password.trim() : password;
    const response = await api.post('/auth/login', { email: cleanEmail, password: cleanPassword });
    const data = response.data;

    // If direct login (Super Admin), persist token immediately
    if (data.token && data.user) {
      localStorage.setItem('artms_token', data.token);
      localStorage.setItem('artms_user', JSON.stringify(data.user));
    }

    return data;
  },

  /**
   * Verify login OTP for non-super-admin users
   */
  verifyLoginOtp: async (verification_id, otp) => {
    const cleanOtp = typeof otp === 'string' ? otp.trim() : otp;
    const response = await api.post('/auth/verify-login-otp', {
      verification_id,
      otp: cleanOtp,
    });
    const { token, user } = response.data;

    // Persist token and user upon successful OTP verification
    localStorage.setItem('artms_token', token);
    localStorage.setItem('artms_user', JSON.stringify(user));

    return { token, user };
  },

  /**
   * Resend login OTP
   */
  resendLoginOtp: async (verification_id) => {
    const response = await api.post('/auth/resend-login-otp', { verification_id });
    return response.data;
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
    const cleanEmail = typeof email === 'string' ? email.trim() : email;
    const response = await api.post('/auth/forgot-password', { email: cleanEmail });
    return response.data;
  },

  /**
   * Verify OTP code (password reset)
   */
  verifyOtp: async (email, otp) => {
    const cleanEmail = typeof email === 'string' ? email.trim() : email;
    const cleanOtp = typeof otp === 'string' ? otp.trim() : otp;
    const response = await api.post('/auth/verify-otp', { email: cleanEmail, otp: cleanOtp });
    return response.data;
  },

  /**
   * Reset password with OTP
   */
  resetPassword: async (email, otp, password, password_confirmation) => {
    const response = await api.post('/auth/reset-password', {
      email: typeof email === 'string' ? email.trim() : email,
      otp: typeof otp === 'string' ? otp.trim() : otp,
      password: typeof password === 'string' ? password.trim() : password,
      password_confirmation: typeof password_confirmation === 'string' ? password_confirmation.trim() : password_confirmation,
    });
    return response.data;
  },

  /**
   * Change password (authenticated)
   */
  changePassword: async (current_password, password, password_confirmation) => {
    const response = await api.post('/auth/change-password', {
      current_password: typeof current_password === 'string' ? current_password.trim() : current_password,
      password: typeof password === 'string' ? password.trim() : password,
      password_confirmation: typeof password_confirmation === 'string' ? password_confirmation.trim() : password_confirmation,
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
      coo:             '/coo/dashboard',
      department_head: '/department-head/dashboard',
      employee:        '/admin/dashboard',
    };
    return paths[role] || '/login';
  },
};

export default authService;
