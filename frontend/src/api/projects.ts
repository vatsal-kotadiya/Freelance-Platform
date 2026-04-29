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
export const createProject = (data: { title: string; description: string; budget: number; images?: File[] }) => {
  const form = new FormData();
  form.append('title', data.title);
  form.append('description', data.description);
  form.append('budget', String(data.budget));
  (data.images ?? []).forEach((img) => form.append('sampleImages', img));
  return api.post('/projects', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
};
export const updateProject = (
  id: string,
  data: { title?: string; description?: string; budget?: number; keepImages?: string[]; newImages?: File[] },
) => {
  const form = new FormData();
  if (data.title !== undefined) form.append('title', data.title);
  if (data.description !== undefined) form.append('description', data.description);
  if (data.budget !== undefined) form.append('budget', String(data.budget));
  (data.keepImages ?? []).forEach((img) => form.append('keepImages', img));
  (data.newImages ?? []).forEach((img) => form.append('sampleImages', img));
  return api.put(`/projects/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
};
export const completeProject = (id: string) => api.patch(`/projects/${id}/complete`).then((r) => r.data);
