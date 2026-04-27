import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { getByProject, release } from '../controllers/payment.controller';

const router = Router();

router.use(authMiddleware);

router.get('/project/:projectId', getByProject);
router.patch('/:paymentId/release', roleGuard('CLIENT'), release);

export default router;
