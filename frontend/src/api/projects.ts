import api from './axios';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export const listProjects = (page = 1, limit = 10, search = ''): Promise<PaginatedResult<any>> =>
  api.get('/projects', { params: { page, limit, search } }).then((r) => r.data);
export const getProjectSuggestions = (q: string): Promise<string[]> =>
  api.get('/projects/suggestions', { params: { q } }).then((r) => r.data);
export const getProject = (id: string) => api.get(`/projects/${id}`).then((r) => r.data);
export const getMyProjects = (page = 1, limit = 10, search = ''): Promise<PaginatedResult<any>> =>
  api.get('/projects/mine', { params: { page, limit, search } }).then((r) => r.data);
export const getMyProjectSuggestions = (q: string): Promise<string[]> =>
  api.get('/projects/mine/suggestions', { params: { q } }).then((r) => r.data);
export const createProject = (data: { title: string; description: string; budget: number }) =>
  api.post('/projects', data).then((r) => r.data);
export const updateProject = (id: string, data: Partial<{ title: string; description: string; budget: number }>) =>
  api.put(`/projects/${id}`, data).then((r) => r.data);
export const completeProject = (id: string) => api.patch(`/projects/${id}/complete`).then((r) => r.data);
