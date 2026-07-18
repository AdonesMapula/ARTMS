import api from './api';

const aiService = {
  /** Applicants with resumes not yet screened (pending queue) */
  pendingQueue: (params = {}) => api.get('/ai/applicants', { params }),

  /** All applicants that have been screened with evaluation data */
  evaluations: (params = {}) => api.get('/ai/evaluations', { params }),

  /** Run AI screening on an applicant's resume */
  screen: (applicantId) => api.post(`/ai/screen/${applicantId}`),

  /** HR saves their interpretation + decision */
  hrReview: (applicantId, data) => api.patch(`/ai/review/${applicantId}`, data),

  /** Get ranked applicants for a job posting */
  rankings: (params = {}) => api.get('/ai/rankings', { params }),
};

export default aiService;
