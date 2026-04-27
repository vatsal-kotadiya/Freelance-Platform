import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as profileService from '../services/profile.service';

const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  skills: z.array(z.string().min(1).max(50)).max(20).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  location: z.string().max(100).optional(),
  hourlyRate: z.number().positive().nullable().optional(),
});

const portfolioItemSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  url: z.string().url().optional().or(z.literal('')),
});

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profile = await profileService.getProfile(req.params.userId);
    res.json(profile);
  } catch (err) {
    if ((err as Error).message === 'User not found') {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateProfileSchema.parse(req.body);
    const profile = await profileService.updateProfile(req.user!.userId, data);
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function addPortfolioItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description, url } = portfolioItemSchema.parse(req.body);
    const item = await profileService.addPortfolioItem(req.user!.userId, title, description, url);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function updatePortfolioItem(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, description, url } = portfolioItemSchema.parse(req.body);
    const item = await profileService.updatePortfolioItem(req.params.id, req.user!.userId, { title, description, url });
    res.json(item);
  } catch (err) {
    if ((err as Error).message === 'Not authorized') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    if ((err as Error).message === 'Portfolio item not found') {
      res.status(404).json({ error: 'Portfolio item not found' });
      return;
    }
    next(err);
  }
}

export async function deletePortfolioItem(req: Request, res: Response, next: NextFunction) {
  try {
    await profileService.deletePortfolioItem(req.params.id, req.user!.userId);
    res.status(204).send();
  } catch (err) {
    if ((err as Error).message === 'Not authorized') {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }
    if ((err as Error).message === 'Portfolio item not found') {
      res.status(404).json({ error: 'Portfolio item not found' });
      return;
    }
    next(err);
  }
}
