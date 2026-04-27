import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export function roleGuard(role: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthenticated' });
      return;
    }
    if (req.user.role !== role) {
      res.status(403).json({ error: 'Forbidden: insufficient role' });
      return;
    }
    next();
  };
}
