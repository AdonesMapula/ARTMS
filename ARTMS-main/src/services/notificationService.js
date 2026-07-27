import api from './api';

const notificationService = {
  /** Fetch real notifications and unread count for current user */
  getAll: () => api.get('/notifications'),

  /** Mark a single notification as read */
  markAsRead: (id) => api.post(`/notifications/${id}/read`),

  /** Mark all notifications as read */
  markAllAsRead: () => api.post('/notifications/read-all'),
};

export default notificationService;
