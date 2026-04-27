import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as reviewService from '../services/review.service';

const createReviewSchema = z.object({
  projectId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000),
});

export async function createReview(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId, rating, comment } = createReviewSchema.parse(req.body);
    const review = await reviewService.createReview(req.user!.userId, projectId, rating, comment);
    res.status(201).json(review);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Not authorized') { res.status(403).json({ error: msg }); return; }
    if (msg === 'You have already reviewed this project') { res.status(409).json({ error: msg }); return; }
    if (msg === 'Project must be completed to leave a review') { res.status(400).json({ error: msg }); return; }
    if (msg === 'Project not found') { res.status(404).json({ error: msg }); return; }
    next(err);
  }
}

export async function getReviewsForUser(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await reviewService.getReviewsForUser(req.params.userId);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getMyReviewForProject(req: Request, res: Response, next: NextFunction) {
  try {
    const review = await reviewService.getMyReviewForProject(req.params.projectId, req.user!.userId);
    res.json(review ?? null);
  } catch (err) { next(err); }
}

export async function getProjectReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const reviews = await reviewService.getProjectReviews(req.params.projectId);
    res.json(reviews);
  } catch (err) { next(err); }
}
