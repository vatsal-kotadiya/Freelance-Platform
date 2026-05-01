import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import * as authService from '../services/auth.service';
import prisma from '../lib/prisma';

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

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) {
      res.status(401).json({ error: 'User not found — please log in again' });
      return;
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

const forgotSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = forgotSchema.parse(req.body);
    await authService.requestPasswordReset(email);
    // Always return 200 to avoid leaking whether the email exists
    res.json({ message: 'If that email is registered, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = resetSchema.parse(req.body);
    await authService.resetPassword(token, password);
    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    if ((err as Error).message === 'Invalid or expired reset token') {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }
    next(err);
  }
}
