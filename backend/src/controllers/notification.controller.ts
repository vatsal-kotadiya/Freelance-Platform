import { Request, Response } from 'express';
import { getUserNotifications, markOneRead, markAllRead } from '../services/notification.service';

export async function list(req: Request, res: Response) {
  const notifications = await getUserNotifications(req.user!.userId);
  res.json(notifications);
}

export async function readOne(req: Request, res: Response) {
  const notification = await markOneRead(req.params.id, req.user!.userId);
  res.json(notification);
}

export async function readAll(req: Request, res: Response) {
  await markAllRead(req.user!.userId);
  res.json({ success: true });
}
