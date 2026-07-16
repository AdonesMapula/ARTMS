import api from './api';

const applicantService = {
  getAll: (params = {}) => api.get('/applicants', { params }),
  getById: (id) => api.get(`/applicants/${id}`),
  update: (id, data) => api.patch(`/applicants/${id}`, data),
  hire: (id) => api.patch(`/applicants/${id}/hire`),
  reject: (id, data) => api.patch(`/applicants/${id}/reject`, data),
  addNote: (id, note) => api.post(`/applicants/${id}/notes`, { note }),
  track: (applicationId) => api.post('/public/applicants/track', { application_id: applicationId }),

  /**
   * Public application submission (multipart/form-data for file upload)
   */
  submit: (formData) =>
    api.post('/public/applicants', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default applicantService;
