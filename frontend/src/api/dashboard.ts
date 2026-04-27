import api from './axios';

export const getClientDashboard = () => api.get('/dashboard/client').then((r) => r.data);
export const getFreelancerDashboard = () => api.get('/dashboard/freelancer').then((r) => r.data);
