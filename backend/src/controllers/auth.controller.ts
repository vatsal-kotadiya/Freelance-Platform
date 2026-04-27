import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import * as authService from '../services/auth.service';

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(Role),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body);
    const result = await authService.registerUser(data.name, data.email, data.password, data.role);
    res.status(201).json(result);
  } catch (err) {
    if ((err as Error).message === 'Email already in use') {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await authService.loginUser(data.email, data.password);
    res.json(result);
  } catch (err) {
    if ((err as Error).message === 'Invalid credentials') {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    next(err);
  }
}

export function getMe(req: Request, res: Response) {
  res.json({ user: req.user });
}
