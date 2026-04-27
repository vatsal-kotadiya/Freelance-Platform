import { Request, Response, NextFunction } from 'express';
import * as paymentService from '../services/payment.service';

export async function getByProject(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await paymentService.getPaymentByProject(req.params.projectId, req.user!.userId);
    res.json(payment);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Not authorized') { res.status(403).json({ error: msg }); return; }
    if (msg === 'Payment not found') { res.status(404).json({ error: msg }); return; }
    next(err);
  }
}

export async function release(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await paymentService.releasePayment(req.params.paymentId, req.user!.userId);
    res.json(payment);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Not authorized') { res.status(403).json({ error: msg }); return; }
    if (msg.includes('must be completed') || msg.includes('already released')) {
      res.status(400).json({ error: msg }); return;
    }
    next(err);
  }
}
