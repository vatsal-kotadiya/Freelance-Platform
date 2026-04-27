import { Request, Response, NextFunction } from 'express';
import * as messageService from '../services/message.service';

export async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const cursor = req.query.cursor as string | undefined;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 30));
    const result = await messageService.getProjectMessages(req.params.projectId, req.user!.userId, cursor, limit);
    res.json(result);
  } catch (err) {
    if ((err as Error).message.includes('Not authorized')) {
      res.status(403).json({ error: 'Not authorized' }); return;
    }
    next(err);
  }
}
