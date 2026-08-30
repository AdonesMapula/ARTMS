import api from './api';

const applicantService = {
  /** Submit a new job application */
  submit: (data) => api.post('/public/applicants', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),

  /** Get all applicants with filters */
  getAll: (params = {}) => api.get('/applicants', { params }),

  /** Get single applicant details */
  getById: (id) => api.get(`/applicants/${id}`),

  /** Stream/Download applicant resume */
  getResume: (id) => api.get(`/applicants/${id}/resume`, { responseType: 'blob', silent: true }),

  /** Update applicant status/details */
  update: (id, data) => api.patch(`/applicants/${id}`, data),
  updateStatus: (id, status) => api.patch(`/applicants/${id}`, { status }),

  /** Mark applicant as ready for interview and send email */
  readyForInterview: (id, data) => api.patch(`/applicants/${id}/ready-for-interview`, data),

  /** Hire applicant (supports both .hire and .hireApplicant method names) */
  hire: (id, data = {}) => api.patch(`/applicants/${id}/hire`, data),
  hireApplicant: (id, data = {}) => api.patch(`/applicants/${id}/hire`, data),

  /** Reject applicant */
  reject: (id, data) => api.patch(`/applicants/${id}/reject`, data),

  /** Delete applicant completely */
  delete: (id) => api.delete(`/applicants/${id}`),

  /** Bulk delete applicants */
  bulkDelete: (ids) => api.post('/applicants/bulk-delete', { ids }),

  /** Add note to applicant */
  addNote: (id, data) => api.post(`/applicants/${id}/notes`, data),

  /** Track application by application_id (public) */
  track: (applicationId) => api.post('/public/applicants/track', { application_id: applicationId }),
};

export default applicantService;