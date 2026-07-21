import api from './api';

const applicantService = {
  /** Get all applicants with filters */
  getAll: (params = {}) => api.get('/applicants', { params }),

  /** Get single applicant details */
  getById: (id) => api.get(`/applicants/${id}`),

  /** Update applicant status/details */
  update: (id, data) => api.patch(`/applicants/${id}`, data),

  /** Mark applicant as ready for interview and send email */
  readyForInterview: (id, data) => api.patch(`/applicants/${id}/ready-for-interview`, data),

  /** Hire applicant */
  hire: (id) => api.patch(`/applicants/${id}/hire`),

  /** Reject applicant */
  reject: (id, data) => api.patch(`/applicants/${id}/reject`, data),

  /** Add note to applicant */
  addNote: (id, data) => api.post(`/applicants/${id}/notes`, data),

  /** Track application by application_id (public) */
  track: (applicationId) => api.get('/applicants/track', { params: { application_id: applicationId } }),
};

export default applicantService;
