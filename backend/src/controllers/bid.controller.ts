import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as bidService from '../services/bid.service';

const placeBidSchema = z.object({
  amount: z.number().positive(),
  proposal: z.string().min(1),
});

export async function getMyBidForProject(req: Request, res: Response, next: NextFunction) {
  try {
    const bid = await bidService.getFreelancerBidForProject(req.params.projectId, req.user!.userId);
    res.json(bid ?? null);
  } catch (err) { next(err); }
}

export async function place(req: Request, res: Response, next: NextFunction) {
  try {
    const data = placeBidSchema.parse(req.body);
    const bid = await bidService.placeBid(req.user!.userId, req.params.projectId, data.amount, data.proposal);
    res.status(201).json(bid);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('already placed') || msg.includes('not open')) {
      res.status(400).json({ error: msg }); return;
    }
    next(err);
  }
}

export async function listForProject(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const result = await bidService.getProjectBids(req.params.projectId, req.user!.userId, page, limit);
    res.json(result);
  } catch (err) {
    if ((err as Error).message === 'Not authorized') { res.status(403).json({ error: 'Not authorized' }); return; }
    next(err);
  }
}

export async function accept(req: Request, res: Response, next: NextFunction) {
  try {
    const bid = await bidService.acceptBid(req.params.bidId, req.user!.userId);
    res.json(bid);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Not authorized') { res.status(403).json({ error: msg }); return; }
    if (msg.includes('no longer open')) { res.status(400).json({ error: msg }); return; }
    next(err);
  }
}

export async function mine(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const result = await bidService.getFreelancerBids(req.user!.userId, page, limit);
    res.json(result);
  } catch (err) { next(err); }
}
