import api from './axios';
import { PaginatedResult } from './projects';

export const placeBid = (projectId: string, data: { amount: number; proposal: string }) =>
  api.post(`/projects/${projectId}/bids`, data).then((r) => r.data);

export const getProjectBids = (projectId: string, page = 1, limit = 10): Promise<PaginatedResult<any>> =>
  api.get(`/projects/${projectId}/bids`, { params: { page, limit } }).then((r) => r.data);

export const acceptBid = (bidId: string) =>
  api.patch(`/bids/${bidId}/accept`).then((r) => r.data);

export const getMyBids = (page = 1, limit = 10): Promise<PaginatedResult<any>> =>
  api.get('/bids/mine', { params: { page, limit } }).then((r) => r.data);

export const getMyBidForProject = (projectId: string): Promise<any | null> =>
  api.get(`/projects/${projectId}/my-bid`).then((r) => r.data);
