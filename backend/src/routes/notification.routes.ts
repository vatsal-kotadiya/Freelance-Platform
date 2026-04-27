import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { list, readOne, readAll } from '../controllers/notification.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', list);
router.patch('/read-all', readAll);
router.patch('/:id/read', readOne);

export default router;
