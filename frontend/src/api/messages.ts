import api from './axios';

export interface MessagesResult {
  data: any[];
  hasMore: boolean;
}

export const getMessages = (projectId: string, cursor?: string, limit = 30): Promise<MessagesResult> =>
  api.get(`/projects/${projectId}/messages`, { params: { cursor, limit } }).then((r) => r.data);

export const sendChatFile = (projectId: string, file: File): Promise<any> => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/projects/${projectId}/messages/file`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};
