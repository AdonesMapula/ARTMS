import api from './api';

const attendanceService = {
  getAll: (params = {}) => api.get('/attendance', { params }),
  getById: (id) => api.get(`/attendance/${id}`),
  create: (data) => api.post('/attendance', data),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  getSummary: (params = {}) => api.get('/attendance-summary', { params }),
};

export default attendanceService;
