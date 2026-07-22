import api from './api';

const interviewService = {
  getAll:       (params = {}) => api.get('/interviews', { params }),
  getById:      (id)          => api.get(`/interviews/${id}`),
  create:       (data)        => api.post('/interviews', data),
  update:       (id, data)    => api.put(`/interviews/${id}`, data),
  patch:        (id, data)    => api.patch(`/interviews/${id}`, data),
  destroy:      (id)          => api.delete(`/interviews/${id}`),
  confirm:      (id)          => api.patch(`/interviews/${id}/confirm`),
  sendReminder: (id)          => api.post(`/interviews/${id}/send-reminder`),
  // Re-send invitation email for an already-scheduled interview
  sendInvitation: (id)        => api.post(`/interviews/${id}/send-reminder`),
};

export default interviewService;
