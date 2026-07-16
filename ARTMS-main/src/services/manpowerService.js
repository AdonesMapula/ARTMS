import api from './api';

const manpowerService = {
  getAll:  (params = {}) => api.get('/manpower-requests', { params }),
  getById: (id)          => api.get(`/manpower-requests/${id}`),
  create:  (data)        => api.post('/manpower-requests', data),
  update:  (id, data)    => api.put(`/manpower-requests/${id}`, data),
  delete:  (id)          => api.delete(`/manpower-requests/${id}`),
  approve: (id, data)    => api.patch(`/manpower-requests/${id}/approve`, data),
};

export default manpowerService;
