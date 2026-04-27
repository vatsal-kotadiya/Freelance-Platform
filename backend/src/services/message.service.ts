import { NotificationType } from '@prisma/client';
import prisma from '../lib/prisma';
import { createNotification } from './notification.service';

export async function getProjectMessages(projectId: string, userId: string, cursor?: string, limit = 30) {
  await assertChatAccess(projectId, userId);

  let cursorDate: Date | undefined;
  if (cursor) {
    const cursorMsg = await prisma.message.findUnique({ where: { id: cursor }, select: { sentAt: true } });
    if (cursorMsg) cursorDate = cursorMsg.sentAt;
  }

  // Fetch limit+1 in desc order to detect if older messages exist
  const raw = await prisma.message.findMany({
    where: {
      projectId,
      ...(cursorDate ? { sentAt: { lt: cursorDate } } : {}),
    },
    include: { sender: { select: { id: true, name: true, role: true } } },
    orderBy: { sentAt: 'desc' },
    take: limit + 1,
  });

  const hasMore = raw.length > limit;
  const data = raw.slice(0, limit).reverse();
  return { data, hasMore };
}

export async function saveMessage(projectId: string, senderId: string, content: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { bids: { where: { status: 'ACCEPTED' } } },
  });
  if (!project) throw new Error('Project not found');

  const isClient = project.clientId === senderId;
  const isAcceptedFreelancer = project.bids.some((b) => b.freelancerId === senderId);
  if (!isClient && !isAcceptedFreelancer) throw new Error('Not authorized to access this chat');

  const message = await prisma.message.create({
    data: { content, projectId, senderId },
    include: { sender: { select: { id: true, name: true, role: true } } },
  });

  // Notify the other participant
  const recipientId = isClient ? project.bids[0]?.freelancerId : project.clientId;
  if (recipientId) {
    await createNotification(
      recipientId,
      NotificationType.NEW_MESSAGE,
      `New message from ${message.sender.name}`,
      projectId
    );
  }

  return message;
}

async function assertChatAccess(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { bids: { where: { status: 'ACCEPTED' } } },
  });
  if (!project) throw new Error('Project not found');

  const isClient = project.clientId === userId;
  const isAcceptedFreelancer = project.bids.some((b) => b.freelancerId === userId);

  if (!isClient && !isAcceptedFreelancer) {
    throw new Error('Not authorized to access this chat');
  }
}
