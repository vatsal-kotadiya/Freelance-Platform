import { NotificationType, ProjectStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { createNotification } from './notification.service';

export async function createProject(clientId: string, title: string, description: string, budget: number) {
  return prisma.project.create({
    data: { title, description, budget, clientId },
    include: { client: { select: { id: true, name: true } } },
  });
}

export async function listOpenProjects(page = 1, limit = 10, search = '') {
  const where = {
    status: 'OPEN' as const,
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { bids: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { bids: true } },
      payment: true,
    },
  });
}

export async function getOpenProjectSuggestions(q: string): Promise<string[]> {
  if (!q.trim()) return [];
  const rows = await prisma.project.findMany({
    where: {
      status: 'OPEN' as const,
      title: { contains: q, mode: 'insensitive' },
    },
    select: { title: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });
  return rows.map((r) => r.title);
}

export async function getClientProjectSuggestions(clientId: string, q: string): Promise<string[]> {
  if (!q.trim()) return [];
  const rows = await prisma.project.findMany({
    where: {
      clientId,
      title: { contains: q, mode: 'insensitive' },
    },
    select: { title: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });
  return rows.map((r) => r.title);
}

export async function getClientProjects(clientId: string, page = 1, limit = 10, search = '') {
  const where = {
    clientId,
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        _count: { select: { bids: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  return { data, total, page, totalPages: Math.ceil(total / limit) };
}

export async function updateProject(id: string, clientId: string, data: Partial<{ title: string; description: string; budget: number }>) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) throw new Error('Project not found');
  if (project.clientId !== clientId) throw new Error('Not authorized');
  if (project.status !== 'OPEN') throw new Error('Can only edit open projects');

  return prisma.project.update({ where: { id }, data });
}

export async function deleteProject(id: string, clientId: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: { payment: true },
  });
  if (!project) throw new Error('Project not found');
  if (project.clientId !== clientId) throw new Error('Not authorized');
  if (project.payment?.status === 'RELEASED') {
    throw new Error('Project cannot be deleted after payment has been released');
  }
  if (project.payment?.status === 'WORK_SUBMITTED') {
    throw new Error('Project cannot be deleted while awaiting payment review');
  }

  await prisma.project.delete({ where: { id } });
}

export async function markProjectComplete(id: string, clientId: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: { bids: { where: { status: 'ACCEPTED' } } },
  });
  if (!project) throw new Error('Project not found');
  if (project.clientId !== clientId) throw new Error('Not authorized');
  if (project.status !== 'IN_PROGRESS') throw new Error('Project must be in progress to complete');

  const updated = await prisma.project.update({
    where: { id },
    data: { status: ProjectStatus.COMPLETED },
  });

  const acceptedBid = project.bids[0];
  if (acceptedBid) {
    await createNotification(
      acceptedBid.freelancerId,
      NotificationType.PROJECT_COMPLETED,
      `Project "${project.title}" has been marked as complete`,
      id
    );
  }

  return updated;
}
