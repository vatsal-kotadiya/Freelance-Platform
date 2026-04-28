import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { roleGuard } from '../middleware/roleGuard';
import { deliveryUpload } from '../lib/multer';
import {
  getByProject,
  release,
  submitDelivery,
  rejectDelivery,
  createOrder,
  verifyPayment,
  downloadDelivery,
} from '../controllers/payment.controller';

const router = Router();

router.use(authMiddleware);

router.get('/project/:projectId', getByProject);
router.patch('/:paymentId/release', roleGuard('CLIENT'), release);

router.post('/:paymentId/submit-delivery', roleGuard('CLIENT'), deliveryUpload.single('file'), submitDelivery);
router.post('/:paymentId/reject-delivery', roleGuard('FREELANCER'), rejectDelivery);
router.post('/:paymentId/create-order', roleGuard('FREELANCER'), createOrder);
router.post('/:paymentId/verify', roleGuard('FREELANCER'), verifyPayment);
router.get('/:paymentId/download-delivery', downloadDelivery);

export default router;
