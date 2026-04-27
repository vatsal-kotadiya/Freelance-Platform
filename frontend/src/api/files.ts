import api from './axios';

export interface FileAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploader: { id: string; name: string };
}

export async function uploadFile(projectId: string, file: File): Promise<FileAttachment> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post(`/projects/${projectId}/files`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getProjectFiles(projectId: string): Promise<FileAttachment[]> {
  const res = await api.get(`/projects/${projectId}/files`);
  return res.data;
}

export async function downloadFile(fileId: string, filename: string): Promise<void> {
  const res = await api.get(`/files/${fileId}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function deleteFile(fileId: string): Promise<void> {
  await api.delete(`/files/${fileId}`);
}
