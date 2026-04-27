import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';

export async function clientDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getClientDashboard(req.user!.userId);
    res.json(data);
  } catch (err) { next(err); }
}

export async function freelancerDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getFreelancerDashboard(req.user!.userId);
    res.json(data);
  } catch (err) { next(err); }
}
