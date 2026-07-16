import api from './api';

const userService = {
  getAll:        (params = {}) => api.get('/users', { params }),
  getById:       (id)          => api.get(`/users/${id}`),
  create:        (data)        => api.post('/users', data),
  update:        (id, data)    => api.put(`/users/${id}`, data),
  delete:        (id)          => api.delete(`/users/${id}`),
  toggleStatus:  (id)          => api.patch(`/users/${id}/toggle-status`),
};

export default userService;
