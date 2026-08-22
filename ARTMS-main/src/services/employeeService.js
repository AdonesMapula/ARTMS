import api from './api';

const employeeService = {
  getAll: (params = {}) => api.get('/employees', { params }),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
  bulkDelete: (ids) => api.post('/employees/bulk-delete', { ids }),
  terminate: (id, data) => api.patch(`/employees/${id}/terminate`, data),
  processClearance: (id) => api.patch(`/employees/${id}/clearance`),

  // Digital 201 File Document Management
  uploadDocument: (id, formData) => api.post(`/employees/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  downloadDocument: (id, docId) => api.get(`/employees/${id}/documents/${docId}/download`, {
    responseType: 'blob',
  }),
  updateDocumentStatus: (id, docId, data) => api.patch(`/employees/${id}/documents/${docId}/status`, data),

  // Edit History Timeline
  getEditHistory: (id) => api.get(`/employees/${id}/history`),

  // Hiring flow
  hireApplicant: (applicantId, data = {}) => api.post(`/applicants/${applicantId}/hire`, data),
};

export default employeeService;
