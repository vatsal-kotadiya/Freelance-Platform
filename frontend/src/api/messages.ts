import api from './axios';

export interface MessagesResult {
  data: any[];
  hasMore: boolean;
}

export const getMessages = (projectId: string, cursor?: string, limit = 30): Promise<MessagesResult> =>
  api.get(`/projects/${projectId}/messages`, { params: { cursor, limit } }).then((r) => r.data);
