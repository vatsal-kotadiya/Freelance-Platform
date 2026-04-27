import api from './axios';

export interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: { id: string; name: string; role: string };
  reviewee?: { id: string; name: string; role: string };
  project?: { id: string; title: string };
}

export interface UserReviewsResult {
  reviews: Review[];
  averageRating: number | null;
  totalReviews: number;
}

export async function createReview(
  projectId: string,
  rating: number,
  comment: string
): Promise<Review> {
  const res = await api.post('/reviews', { projectId, rating, comment });
  return res.data;
}

export async function getReviewsForUser(userId: string): Promise<UserReviewsResult> {
  const res = await api.get(`/reviews/user/${userId}`);
  return res.data;
}

export async function getMyReviewForProject(projectId: string): Promise<Review | null> {
  const res = await api.get(`/reviews/project/${projectId}/mine`);
  return res.data;
}

export async function getProjectReviews(projectId: string): Promise<Review[]> {
  const res = await api.get(`/reviews/project/${projectId}`);
  return res.data;
}
