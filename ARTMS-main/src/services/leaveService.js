import api from './api';

const leaveService = {
  getAll:  (params = {}) => api.get('/leaves', { params }),
  getById: (id)          => api.get(`/leaves/${id}`),
  create:  (data)        => api.post('/leaves', data),
  update:  (id, data)    => api.put(`/leaves/${id}`, data),
  delete:  (id)          => api.delete(`/leaves/${id}`),
  approve: (id, data)    => api.patch(`/leaves/${id}/approve`, data),
};

export default leaveService;
