import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getProfile, updateProfile, addPortfolioItem, updatePortfolioItem, deletePortfolioItem } from '../controllers/profile.controller';

const router = Router();

router.use(authMiddleware);

router.get('/:userId', getProfile);
router.put('/', updateProfile);
router.post('/portfolio', addPortfolioItem);
router.put('/portfolio/:id', updatePortfolioItem);
router.delete('/portfolio/:id', deletePortfolioItem);

export default router;
