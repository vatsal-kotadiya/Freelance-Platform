import api from './axios';

export const register = (data: { name: string; email: string; password: string; role: 'CLIENT' | 'FREELANCER' }) =>
  api.post('/auth/register', data).then((r) => r.data);

export const login = (data: { email: string; password: string }) =>
  api.post('/auth/login', data).then((r) => r.data);

export const forgotPassword = (email: string) =>
  api.post('/auth/forgot-password', { email }).then((r) => r.data);

export const resetPassword = (token: string, password: string) =>
  api.post('/auth/reset-password', { token, password }).then((r) => r.data);
