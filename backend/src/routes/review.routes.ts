import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { createReview, getReviewsForUser, getMyReviewForProject, getProjectReviews } from '../controllers/review.controller';

const router = Router();

router.use(authMiddleware);

router.post('/', createReview);
router.get('/user/:userId', getReviewsForUser);
router.get('/project/:projectId', getProjectReviews);
router.get('/project/:projectId/mine', getMyReviewForProject);

export default router;
