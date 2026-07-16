import api from './api';

const jobService = {
  // Job Library
  library: {
    getAll: (params = {}) => api.get('/job-library', { params }),
    getById: (id) => api.get(`/job-library/${id}`),
    create: (data) => api.post('/job-library', data),
    update: (id, data) => api.put(`/job-library/${id}`, data),
    delete: (id) => api.delete(`/job-library/${id}`),
    approve: (id, data) => api.patch(`/job-library/${id}/approve`, data),
  },

  // Job Postings
  postings: {
    getAll: (params = {}) => api.get('/job-postings', { params }),
    getPublic: (params = {}) => api.get('/public/job-postings', { params }),
    getById: (id) => api.get(`/job-postings/${id}`),
    create: (data) => api.post('/job-postings', data),
    update: (id, data) => api.put(`/job-postings/${id}`, data),
    delete: (id) => api.delete(`/job-postings/${id}`),
    approve: (id, data) => api.patch(`/job-postings/${id}/approve`, data),
    togglePublish: (id) => api.patch(`/job-postings/${id}/toggle-publish`),
  },
};

export default jobService;
