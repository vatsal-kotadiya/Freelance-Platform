import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import prisma from '../lib/prisma';
import { AuthPayload } from '../middleware/auth';

export async function registerUser(name: string, email: string, password: string, role: Role) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email already in use');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return { user, token };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials');

  const token = signToken({ userId: user.id, role: user.role });
  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, token };
}

function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });
}
