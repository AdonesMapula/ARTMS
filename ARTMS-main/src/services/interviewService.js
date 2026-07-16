import api from './api';

const interviewService = {
  getAll: (params = {}) => api.get('/interviews', { params }),
  getById: (id) => api.get(`/interviews/${id}`),
  create: (data) => api.post('/interviews', data),
  update: (id, data) => api.put(`/interviews/${id}`, data),
  confirm: (id) => api.patch(`/interviews/${id}/confirm`),
  sendReminder: (id) => api.post(`/interviews/${id}/send-reminder`),
};

export default interviewService;
