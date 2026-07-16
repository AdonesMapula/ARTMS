import api from './api';

const dashboardService = {
  getAdminStats: () => api.get('/dashboard/admin'),
  getSuperAdminStats: () => api.get('/dashboard/super-admin'),
  getDepartmentHeadStats: () => api.get('/dashboard/department-head'),
};

export default dashboardService;
