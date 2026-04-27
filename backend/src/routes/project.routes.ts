import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { create, list, getOne, getMine, update, complete } from '../controllers/project.controller';
import { listForProject } from '../controllers/bid.controller';
import { getHistory } from '../controllers/message.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', list);
router.get('/mine', roleGuard('CLIENT'), getMine);
router.post('/', roleGuard('CLIENT'), create);
router.get('/:id', getOne);
router.put('/:id', roleGuard('CLIENT'), update);
router.patch('/:id/complete', roleGuard('CLIENT'), complete);

router.get('/:projectId/bids', roleGuard('CLIENT'), listForProject);
router.get('/:projectId/messages', getHistory);

export default router;
