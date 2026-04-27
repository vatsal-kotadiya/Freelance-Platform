import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { clientDashboard, freelancerDashboard } from '../controllers/dashboard.controller';

const router = Router();

router.use(authMiddleware);

router.get('/client', roleGuard('CLIENT'), clientDashboard);
router.get('/freelancer', roleGuard('FREELANCER'), freelancerDashboard);

export default router;
