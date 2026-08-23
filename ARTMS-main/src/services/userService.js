import api from './api';

const userService = {
  getAll:          (params = {}) => api.get('/users', { params }),
  getById:         (id)          => api.get(`/users/${id}`),
  create:          (data)        => api.post('/users', data),
  update:          (id, data)    => api.put(`/users/${id}`, data),
  delete:          (id)          => api.delete(`/users/${id}`),
  toggleStatus:    (id)          => api.patch(`/users/${id}/toggle-status`),
  getArchived:     (params = {}) => api.get('/users/archived', { params }),
  restore:         (id)          => api.post(`/users/${id}/restore`),
  forceDelete:     (id)          => api.delete(`/users/${id}/force`),
  bulkArchive:     (ids)         => api.post('/users/bulk-archive', { ids }),
  bulkRestore:     (ids)         => api.post('/users/bulk-restore', { ids }),
  bulkForceDelete: (ids)         => api.post('/users/bulk-force-delete', { ids }),
};

export default userService;
