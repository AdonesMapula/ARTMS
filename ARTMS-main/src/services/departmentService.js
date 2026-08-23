import api from './api';

const departmentService = {
  getAll: (params = {}) => api.get('/departments', { params }),
  getById: (id) => api.get(`/departments/${id}`),
  create: (data) => api.post('/departments', data),
  update: (id, data) => api.put(`/departments/${id}`, data),
  delete: (id) => api.delete(`/departments/${id}`),
  bulkDelete: (ids) => api.post('/departments/bulk-delete', { ids }),
};

export default departmentService;
