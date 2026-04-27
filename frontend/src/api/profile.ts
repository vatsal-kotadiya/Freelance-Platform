import api from './axios';

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  url?: string | null;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'CLIENT' | 'FREELANCER';
  bio?: string | null;
  skills: string[];
  avatarUrl?: string | null;
  location?: string | null;
  hourlyRate?: number | null;
  createdAt: string;
  portfolioItems: PortfolioItem[];
}

export interface UpdateProfilePayload {
  bio?: string;
  skills?: string[];
  avatarUrl?: string;
  location?: string;
  hourlyRate?: number | null;
}

export async function getProfile(userId: string): Promise<UserProfile> {
  const res = await api.get(`/profile/${userId}`);
  return res.data;
}

export async function updateProfile(data: UpdateProfilePayload): Promise<UserProfile> {
  const res = await api.put('/profile', data);
  return res.data;
}

export async function addPortfolioItem(title: string, description: string, url?: string): Promise<PortfolioItem> {
  const res = await api.post('/profile/portfolio', { title, description, url });
  return res.data;
}

export async function updatePortfolioItem(
  id: string,
  data: { title: string; description: string; url?: string }
): Promise<PortfolioItem> {
  const res = await api.put(`/profile/portfolio/${id}`, data);
  return res.data;
}

export async function deletePortfolioItem(id: string): Promise<void> {
  await api.delete(`/profile/portfolio/${id}`);
}
