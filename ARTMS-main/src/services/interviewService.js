import api from './api';

const interviewService = {
  getAll:       (params = {}) => api.get('/interviews', { params }),
  getById:      (id)          => api.get(`/interviews/${id}`),
  create:       (data)        => api.post('/interviews', data),
  update:       (id, data)    => api.put(`/interviews/${id}`, data),
  patch:        (id, data)    => api.patch(`/interviews/${id}`, data),
  destroy:      (id)          => api.delete(`/interviews/${id}`),
  delete:       (id)          => api.delete(`/interviews/${id}`),
  confirm:      (id)          => api.patch(`/interviews/${id}/confirm`),
  sendReminder: (id)          => api.post(`/interviews/${id}/send-reminder`),
  // Re-send invitation email for an already-scheduled interview
  sendInvitation: (id)        => api.post(`/interviews/${id}/send-reminder`),

  // ── Video session endpoints ──────────────────────────────────────────
  /** Fetch a signed LiveKit JWT + room name from the backend */
  getLivekitToken:       (id) => api.post(`/interviews/${id}/livekit-token`),
  getPublicLivekitToken: (id, email) => api.post(`/public/interviews/${id}/livekit-token`, { email }),

  /** Mark the session as done and dispatch the Grok AI report job */
  endSession:       (id) => api.post(`/interviews/${id}/end-session`),
  endPublicSession: (id) => api.post(`/public/interviews/${id}/end-session`),

  /** Fetch the AI report + full transcript for a completed interview */
  getReport:    (id)          => api.get(`/interviews/${id}/report`),

  getProcessingStatus:       (id) => api.get(`/interviews/${id}/processing-status`),
  getPublicProcessingStatus: (id) => api.get(`/public/interviews/${id}/processing-status`),
  saveBehavioralMetrics:     (id, metrics) => api.post(`/interviews/${id}/behavioral-metrics`, { metrics }),
  savePublicBehavioralMetrics: (id, metrics) => api.post(`/public/interviews/${id}/behavioral-metrics`, { metrics }),

  // ── Real-time speech transcript & live Grok AI endpoints ──────────────
  storeTranscript:       (id, text, speakerRole = 'hr', offset = 0)        => api.post(`/interviews/${id}/transcript`, { text, speaker_role: speakerRole, segment_offset: offset }),
  storePublicTranscript: (id, text, speakerRole = 'applicant', offset = 0) => api.post(`/public/interviews/${id}/transcript`, { text, speaker_role: speakerRole, segment_offset: offset }),
  transcribeAudio:       (id, formData)                             => api.post(`/interviews/${id}/transcribe-audio`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  publicTranscribeAudio: (id, formData)                             => api.post(`/public/interviews/${id}/transcribe-audio`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getTranscripts:        (id)                                       => api.get(`/interviews/${id}/transcripts`),
  saveNotes:             (id, notes)                                => api.post(`/interviews/${id}/notes`, { notes }),
  analyzeLive:           (id)                                       => api.post(`/interviews/${id}/analyze-live`),
};

export default interviewService;
