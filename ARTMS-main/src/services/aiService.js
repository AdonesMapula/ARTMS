import api from './api';

const aiService = {
  /** Get all screened applicants with evaluation data (paginated) */
  evaluations: (params = {}) => api.get('/ai/evaluations', { params }),

  /** Run AI screening on an applicant's resume */
  screen: (applicantId) => api.post(`/ai/screen/${applicantId}`),

  /** HR saves their interpretation + decision */
  hrReview: (applicantId, data) => api.patch(`/ai/review/${applicantId}`, data),

  /** Get ranked applicants for a job posting */
  rankings: (params = {}) => api.get('/ai/rankings', { params }),
};

export default aiService;
