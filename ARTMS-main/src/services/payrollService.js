import api from './api';

const payrollService = {
  getAll: (params = {}) => api.get('/payroll', { params }),
  getById: (id) => api.get(`/payroll/${id}`),
  create: (data) => api.post('/payroll', data),
  update: (id, data) => api.put(`/payroll/${id}`, data),
  release: (id) => api.patch(`/payroll/${id}/release`),
};

export default payrollService;
