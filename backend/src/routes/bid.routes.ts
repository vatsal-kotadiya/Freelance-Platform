import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { place, accept, mine, getMyBidForProject } from '../controllers/bid.controller';

const router = Router();

router.use(authMiddleware);

router.get('/projects/:projectId/my-bid', roleGuard('FREELANCER'), getMyBidForProject);
router.post('/projects/:projectId/bids', roleGuard('FREELANCER'), place);
router.patch('/bids/:bidId/accept', roleGuard('CLIENT'), accept);
router.get('/bids/mine', roleGuard('FREELANCER'), mine);

export default router;
