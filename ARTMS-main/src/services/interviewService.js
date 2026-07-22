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

  // ── Video session endpoints ──────────────────────────────────────────
  /** Fetch a signed LiveKit JWT + room name from the backend */
  getLivekitToken: (id)       => api.post(`/interviews/${id}/livekit-token`),

  /** Mark the session as done and dispatch the Grok AI report job */
  endSession:   (id)          => api.post(`/interviews/${id}/end-session`),

  /** Fetch the AI report + full transcript for a completed interview */
  getReport:    (id)          => api.get(`/interviews/${id}/report`),
};

export default interviewService;
