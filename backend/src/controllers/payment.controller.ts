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

export async function submitDelivery(req: Request, res: Response, next: NextFunction) {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  try {
    const payment = await paymentService.submitDelivery(
      req.params.paymentId,
      req.user!.userId,
      file,
    );
    res.json(payment);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Not authorized') { res.status(403).json({ error: msg }); return; }
    if (
      msg.includes('Invalid file type') ||
      msg.includes('Cannot upload') ||
      msg.includes('already released')
    ) { res.status(400).json({ error: msg }); return; }
    next(err);
  }
}

export async function rejectDelivery(req: Request, res: Response, next: NextFunction) {
  try {
    const { reason } = req.body;
    const payment = await paymentService.rejectDelivery(
      req.params.paymentId,
      req.user!.userId,
      reason,
    );
    res.json(payment);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Not authorized') { res.status(403).json({ error: msg }); return; }
    if (msg.includes('not in submitted state')) { res.status(400).json({ error: msg }); return; }
    next(err);
  }
}

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await paymentService.createRazorpayOrder(req.params.paymentId, req.user!.userId);
    res.json(order);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Not authorized') { res.status(403).json({ error: msg }); return; }
    if (
      msg.includes('not uploaded') ||
      msg.includes('rejected') ||
      msg.includes('already been made') ||
      msg.includes('Cannot create') ||
      msg.includes('not configured')
    ) { res.status(400).json({ error: msg }); return; }
    next(err);
  }
}

export async function verifyPayment(req: Request, res: Response, next: NextFunction) {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    res.status(400).json({ error: 'Missing payment verification fields' });
    return;
  }
  try {
    const payment = await paymentService.verifyRazorpayPayment(
      req.params.paymentId,
      req.user!.userId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );
    res.json(payment);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Not authorized') { res.status(403).json({ error: msg }); return; }
    if (msg.includes('verification failed')) { res.status(400).json({ error: msg }); return; }
    if (msg.includes('cannot be processed')) { res.status(400).json({ error: msg }); return; }
    next(err);
  }
}

export async function downloadDelivery(req: Request, res: Response, next: NextFunction) {
  try {
    const { filePath, fileName } = await paymentService.getDeliveryFile(
      req.params.paymentId,
      req.user!.userId,
    );
    res.download(filePath, fileName);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Not authorized') { res.status(403).json({ error: msg }); return; }
    if (msg.includes('only available after payment')) { res.status(403).json({ error: msg }); return; }
    if (msg.includes('not found')) { res.status(404).json({ error: msg }); return; }
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
